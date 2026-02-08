import {
  Inject,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import axios, { AxiosError, AxiosResponse } from 'axios';
import { Payment } from '@prisma/client';
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

  async createPaymentLink(
    payment: Payment,
  ): Promise<{ id: string; checkoutUrl: string }> {
    try {
      const res = await axios.post(
        `${this.apiBase}/payment_links`,
        {
          data: {
            attributes: {
              amount: Number(payment.amount) * 100,
              currency: payment.currency,
              description: `Booking #${payment.bookingId}`,
              remarks: `Payment ${payment.id}`,
              metadata: {
                paymentId: String(payment.id),
                bookingId: String(payment.bookingId),
                type: 'booking',
              },
            },
          },
        },
        { headers: this.authHeader },
      );

      return {
        id: res.data.data.id,
        checkoutUrl: res.data.data.attributes.checkout_url,
      };
    } catch (err) {
      if (axios.isAxiosError(err)) {
        console.error(
          'PayMongo createPaymentLink error:',
          err.response?.data ?? err.message,
        );
      }
      throw new InternalServerErrorException('Failed to create payment link');
    }
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

      const refundRes: AxiosResponse<any> = await axios.post(
        `${this.apiBase}/refunds`,
        {
          data: {
            attributes: {
              payment_intent: payment.providerIntentId,
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
  async handlePaymongoWebhook(payload: any): Promise<{
    success?: boolean;
    ignored?: boolean;
    eventType?: string;
    paymentId?: number;
  }> {
    const eventType: string = payload?.data?.attributes?.event_type;

    let payment: Payment | null = null;

    // ---- BOOKING PAYMENT (PaymentIntent) ----
    if (payload?.data?.attributes?.payment_intent) {
      const providerIntentId: string = payload.data.attributes.payment_intent;

      payment = await this.prisma.payment.findFirst({
        where: { providerIntentId },
      });
    }

    // ---- SUBSCRIPTION PAYMENT (Invoice) ----
    else if (payload?.data?.attributes?.subscription) {
      const subscriptionId = Number(payload.data.attributes.subscription);

      payment = await this.prisma.payment.findFirst({
        where: { subscriptionId },
      });
    }

    if (!payment) {
      console.warn(
        'Webhook received for unknown payment/subscription',
        payload,
      );
      return { ignored: true };
    }

    // ---- FIX: CAST METADATA ----
    const metadata = (payment.metadata || {}) as PaymentMetadata;
    const type: 'booking' | 'subscription' = metadata.type || 'booking';

    switch (eventType) {
      case 'payment.paid':
      case 'payment_intent.succeeded':
        if (type === 'booking' && payment.bookingId) {
          await this.prisma.payment.update({
            where: { id: payment.id },
            data: { status: 'PAID' },
          });

          await this.prisma.booking.update({
            where: { id: payment.bookingId },
            data: { status: 'COMPLETED_BOOKING' },
          });

          console.log(`Booking payment completed: ${payment.id}`);
        } else if (type === 'subscription' && payment.subscriptionId) {
          await this.prisma.subscription.update({
            where: { id: payment.subscriptionId },
            data: { status: 'ACTIVE' },
          });

          console.log(
            `Subscription payment completed: ${payment.subscriptionId}`,
          );
        }
        break;

      case 'payment.failed':
      case 'payment_intent.payment_failed':
        if (type === 'booking' && payment.bookingId) {
          await this.prisma.payment.update({
            where: { id: payment.id },
            data: { status: 'FAILED' },
          });

          await this.prisma.booking.update({
            where: { id: payment.bookingId },
            data: { status: 'PAYMENT_FAILED' },
          });

          console.log(`Booking payment failed: ${payment.id}`);
        } else if (type === 'subscription' && payment.subscriptionId) {
          await this.prisma.subscription.update({
            where: { id: payment.subscriptionId },
            data: { status: 'PAST_DUE' },
          });

          console.log(`Subscription payment failed: ${payment.subscriptionId}`);
        }
        break;

      case 'subscription.invoice.paid':
        if (type === 'subscription' && payment.subscriptionId) {
          await this.prisma.subscription.update({
            where: { id: payment.subscriptionId },
            data: { status: 'ACTIVE' },
          });

          console.log(`Subscription invoice paid: ${payment.subscriptionId}`);
        }
        break;

      case 'subscription.invoice.payment_failed':
        if (type === 'subscription' && payment.subscriptionId) {
          await this.prisma.subscription.update({
            where: { id: payment.subscriptionId },
            data: { status: 'PAST_DUE' },
          });

          console.log(`Subscription invoice failed: ${payment.subscriptionId}`);
        }
        break;

      default:
        console.log('Webhook event ignored:', eventType);
        return { ignored: true };
    }

    return { success: true, eventType, paymentId: payment.id };
  }
}
