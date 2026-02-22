import {
  Inject,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import axios, { AxiosError, AxiosResponse } from 'axios';
import { Payment, PaymentStatus } from '@prisma/client';
import { ConfigService } from 'src/config/config.service';
import { IDatabaseService } from 'src/infrastructure/database/database.interface';

// ====== PayMongo Response Types ======
interface PaymongoPaymentIntentAttributes {
  amount: number;
  currency: string;
  payment_method_allowed: string[];
  payment_method_options: { card: { request_three_d_secure: string } };
  description: string;
  metadata: Record<string, any>;
}

interface PaymongoPaymentIntentData {
  id: string;
  type: string;
  attributes: PaymongoPaymentIntentAttributes;
}

interface PaymongoPaymentIntentResponse {
  data: PaymongoPaymentIntentData;
}

interface PaymongoPaymentLinkAttributes {
  payment_intent: string;
  type: string;
  amount: number;
  url?: string;
}

interface PaymongoPaymentLinkData {
  id: string;
  type: string;
  attributes: PaymongoPaymentLinkAttributes;
}

interface PaymongoPaymentLinkResponse {
  data: PaymongoPaymentLinkData;
}

interface PaymongoWebhookPayloadAttributes {
  event_type: string;
  payment_intent: string;
}

interface PaymongoWebhookPayloadData {
  id: string;
  type: string;
  attributes: PaymongoWebhookPayloadAttributes;
}

interface PaymongoWebhookPayload {
  data: PaymongoWebhookPayloadData;
}

type PaymentMetadata = {
  type?: 'booking' | 'subscription';
  [key: string]: any;
};

interface PaymongoPaymentLinkAttributes {
  payment_intent: string;
  type: string;
  amount: number;
  url?: string;
  checkout_url: string;
}

interface PaymongoPaymentLinkData {
  id: string;
  type: string;
  attributes: PaymongoPaymentLinkAttributes;
}

interface PaymongoPaymentLinkResponse {
  data: PaymongoPaymentLinkData;
}

// ====== Service ======
@Injectable()
export class PaymongoService {
  private readonly apiBase;
  private readonly secretKey;
  constructor(
    private readonly configService: ConfigService,
    @Inject('IDatabaseService') private readonly database: IDatabaseService,
  ) {
    this.apiBase = this.configService.PAYMONGO_BASE_API;
    this.secretKey = this.configService.PAYMONGO_SECRET_KEY;
  }

  private get prisma() {
    return this.database.getClient();
  }

  private get authHeader() {
    if (!this.secretKey) {
      throw new InternalServerErrorException(
        'PayMongo secret key not configured',
      );
    }
    return {
      Authorization: `Basic ${Buffer.from(this.secretKey + ':').toString(
        'base64',
      )}`,
      'Content-Type': 'application/json',
    };
  }

  async createPaymentLink(payment: Payment) {
    const sessionPayload = {
      data: {
        attributes: {
          payment_method_types: [
            'gcash',
            'paymaya',
            'card',
            'grab_pay',
            'qrph',
          ], // More options for tenants!
          line_items: [
            {
              amount: Math.round(Number(payment.amount) * 100),
              currency: payment.currency,
              name: `Booking #${payment.bookingId}`,
              quantity: 1,
            },
          ],
          description: `Booking payment for room`,
          success_url: 'bhhunter://payment-success',
          cancel_url: 'bhhunter://payment-cancel',
          metadata: {
            paymentId: String(payment.id),
            bookingId: String(payment.bookingId),
          },
          // Optional: Redirect them back to your app/site after success
        },
      },
    };

    const res = await axios.post(
      `${this.apiBase}/checkout_sessions`,
      sessionPayload,
      { headers: this.authHeader },
    );

    const sessionData = res.data.data;

    // This is the "Magic" URL you need
    const checkoutUrl = sessionData.attributes.checkout_url;

    return {
      id: sessionData.id, // cs_test_...
      checkoutUrl, // https://checkout.paymongo.com/cs_test_...
    };
  }

  async refundPayment(payment: Payment, reason?: string): Promise<any> {
    if (!this.apiBase || !this.secretKey) {
      throw new InternalServerErrorException(
        'PayMongo API base not configured',
      );
    }
    try {
      if (!payment.providerPaymentId) {
        throw new InternalServerErrorException('Payment has no provider ID');
      }
      if (!payment.providerPaymentIntentId) {
        throw new InternalServerErrorException(
          'Payment has no provider payment intent ID',
        );
      }

      const refundRes: AxiosResponse<any> = await axios.post(
        `${this.apiBase}/refunds`,
        {
          data: {
            attributes: {
              payment_intent: payment.providerPaymentIntentId,
              amount: Number(payment.amount) * 100,
              reason: reason ?? 'Customer request',
            },
          },
        },
        { headers: this.authHeader },
      );

      return refundRes.data;
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        const axiosErr = err as AxiosError;
        console.error(
          'PayMongo refundPayment error:',
          axiosErr.response?.data ?? axiosErr.message,
        );
      } else {
        console.error('PayMongo refundPayment unknown error:', err);
      }
      throw new InternalServerErrorException('Failed to refund payment');
    }
  }

  /**
   * Create a Payment Intent (checkout session) for in-app RN payment
   */
  async retrievePaymentIntent(intentId: string): Promise<any> {
    try {
      const res = await axios.get(
        `${this.apiBase}/payment_intents/${intentId}`,
        { headers: this.authHeader },
      );

      return res.data.data;
    } catch (err) {
      if (axios.isAxiosError(err)) {
        console.error(
          'PayMongo retrievePaymentIntent error:',
          err.response?.data ?? err.message,
        );
      } else {
        console.error('Unknown retrievePaymentIntent error:', err);
      }

      throw new InternalServerErrorException(
        'Failed to retrieve payment intent',
      );
    }
  }

  /**
   * Create a Payment Intent (checkout session) for in-app RN payment
   */
  async createPaymentIntent(
    payment: Payment,
  ): Promise<{ id: string; clientSecret: string }> {
    try {
      const payload = {
        data: {
          attributes: {
            amount: Number(payment.amount) * 100, // PayMongo expects cents
            currency: payment.currency,
            payment_method_allowed: ['card'], // only cards for now
            payment_method_options: { card: { request_three_d_secure: 'any' } },
            description: `Booking #${payment.bookingId}`,
            metadata: {
              paymentId: String(payment.id),
              bookingId: String(payment.bookingId),
              type: 'booking',
            },
          },
        },
      };

      const res = await axios.post(`${this.apiBase}/payment_intents`, payload, {
        headers: this.authHeader,
      });

      return {
        id: res.data.data.id,
        clientSecret: res.data.data.attributes.client_secret,
      };
    } catch (err) {
      if (axios.isAxiosError(err)) {
        console.error(
          'PayMongo createPaymentIntent error:',
          err.response?.data ?? err.message,
        );
      } else {
        console.error('Unknown error creating payment intent:', err);
      }
      throw new InternalServerErrorException('Failed to create payment intent');
    }
  }

  // async handlePaymongoWebhook(payload: PaymongoWebhookPayload) {
  //   const eventType = payload?.data?.attributes?.event_type;
  //   const intent =
  //     typeof payload.data.attributes.payment_intent === 'string'
  //       ? payload.data.attributes.payment_intent
  //       : payload.data.attributes.payment_intent?.id;

  //   if (!intent) {
  //     throw new BadRequestException('Missing payment intent id');
  //   }

  //   const payment = await this.prisma.payment.findFirst({
  //     where: { providerIntentId: intent },
  //   });

  //   if (!payment) {
  //     return { ignored: true };
  //   }

  //   // Idempotency guard
  //   if (payment.status === PaymentStatus.PAID) {
  //     return { ignored: true };
  //   }

  //   switch (eventType) {
  //     case 'payment_intent.succeeded':
  //       return this.markPaymentPaid(payment);

  //     case 'payment_intent.payment_failed':
  //       return this.markPaymentFailed(payment);

  //     default:
  //       return { ignored: true };
  //   }
  // }

  private async markPaymentPaid(payment: Payment) {
    if (
      ![PaymentStatus.PENDING, PaymentStatus.REQUIRES_ACTION].includes(
        payment.status as 'PENDING' | 'REQUIRES_ACTION',
      )
    ) {
      return { ignored: true };
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.payment.update({
        where: { id: payment.id },
        data: { status: PaymentStatus.PAID },
      });

      if (payment.bookingId) {
        await tx.booking.update({
          where: { id: payment.bookingId },
          data: { status: 'COMPLETED_BOOKING' },
        });
      }
    });

    return { success: true };
  }

  private async markPaymentFailed(payment: Payment) {
    if (payment.status === PaymentStatus.PAID) {
      return { ignored: true };
    }

    await this.prisma.payment.update({
      where: { id: payment.id },
      data: { status: PaymentStatus.FAILED },
    });

    return { success: true };
  }
}
