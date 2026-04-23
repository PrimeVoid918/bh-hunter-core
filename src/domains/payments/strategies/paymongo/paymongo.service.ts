import {
  Inject,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import axios, { AxiosError } from 'axios';
import {
  BookingChargeStatus,
  BookingChargeType,
  BookingStatus,
  CurrencyType,
  Payment,
  PaymentProvider,
  PaymentStatus,
  PayoutStatus,
  Prisma,
  PurchaseType,
  ResourceType,
  SubscriptionStatus,
} from '@prisma/client';
import { ConfigService } from 'src/config/config.service';
import { IDatabaseService } from 'src/infrastructure/database/database.interface';
import {
  PaymentProviderAdapter,
  PaymentIntentResult,
} from './paymongo.interface';
import { Decimal } from '@prisma/client/runtime/library';
import { PaymongoReasons } from '../../dto/payments.types';

@Injectable()
export class PaymongoService implements PaymentProviderAdapter {
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
      Authorization: `Basic ${Buffer.from(this.secretKey + ':').toString('base64')}`,
      'Content-Type': 'application/json',
    };
  }

  /** Create a payment link (for web/checkout) */
  async createPaymentLink(payment: Payment): Promise<PaymentIntentResult> {
    const isSubscription = payment.purchaseType === PurchaseType.SUBSCRIPTION;

    const successUrl = isSubscription
      ? 'https://bhhph.online/pricing/success'
      : 'bhhunter://payment-success';

    const cancelUrl = isSubscription
      ? 'https://bhhph.online/pricing/cancel'
      : 'bhhunter://payment-cancel';

    const payload = {
      data: {
        attributes: {
          payment_method_types: [
            'gcash',
            'paymaya',
            'card',
            'grab_pay',
            'qrph',
          ],
          line_items: [
            {
              amount: Math.round(Number(payment.amount) * 100),
              currency: payment.currency,
              name: isSubscription
                ? 'BH Hunter Owner Subscription'
                : `Booking #${payment.bookingId}`,
              quantity: 1,
            },
          ],
          description: isSubscription
            ? 'Owner subscription payment'
            : 'Booking payment for room',
          success_url: successUrl,
          cancel_url: cancelUrl,
          metadata: {
            paymentId: String(payment.id),
            ...((payment.metadata as object) ?? {}),
          },
        },
      },
    };

    try {
      const res = await axios.post(
        `${this.apiBase}/checkout_sessions`,
        payload,
        {
          headers: this.authHeader,
        },
      );
      const data = res.data.data;

      return {
        id: data.id,
        paymentIntentId:
          data.attributes.payment_intent?.id ??
          data.attributes.payment_intent_id,
        checkoutUrl: data.attributes.checkout_url,
      };
    } catch (err: any) {
      this.handleAxiosError(err, 'createPaymentLink');
    }
  }

  /** Create in-app payment intent (RN, mobile apps) */
  async createPaymentIntent(payment: Payment): Promise<PaymentIntentResult> {
    const payload = {
      data: {
        attributes: {
          amount: Number(payment.amount) * 100,
          currency: payment.currency,
          payment_method_allowed: ['card'],
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

    try {
      const res = await axios.post(`${this.apiBase}/payment_intents`, payload, {
        headers: this.authHeader,
      });
      return {
        id: res.data.data.id,
        clientSecret: res.data.data.attributes.client_secret,
        paymentIntentId: res.data.data.id,
      };
    } catch (err: any) {
      this.handleAxiosError(err, 'createPaymentIntent');
    }
  }

  /** Refund a payment */
  async refundPayment({
    payment,
    refundAmount,
    reason,
  }: {
    payment: Payment;
    refundAmount: Decimal;
    reason?: PaymongoReasons | undefined;
  }): Promise<any> {
    if (!payment.providerPaymentId) {
      throw new InternalServerErrorException(
        'Payment has no provider payment ID',
      );
    }

    console.log('REFUND REQUEST', {
      payment: payment,
      refundAmount,
      reason,
    });

    try {
      const res = await axios.post(
        `${this.apiBase}/refunds`,
        {
          data: {
            attributes: {
              payment_id: payment.providerPaymentId, // required
              amount: Math.round(Number(refundAmount) * 100), // integer in cents
              reason: reason, // valid reason
            },
          },
        },
        { headers: this.authHeader }, // 🔑 include auth header
      );

      console.log('refund data of payment: ', payment);

      return res.data;
    } catch (err: any) {
      this.handleAxiosError(err, 'refundPayment');
    }
  }

  /** Retrieve payment intent details */
  async retrievePaymentIntent(intentId: string): Promise<any> {
    try {
      const res = await axios.get(
        `${this.apiBase}/payment_intents/${intentId}`,
        {
          headers: this.authHeader,
        },
      );
      return res.data.data;
    } catch (err: any) {
      this.handleAxiosError(err, 'retrievePaymentIntent');
    }
  }

  /** Helper: unified Axios error handler */
  private handleAxiosError(err: any, context: string): never {
    if (axios.isAxiosError(err)) {
      console.error(
        `PayMongo ${context} Axios error:`,
        err.response?.data ?? err.message,
      );
    } else {
      console.error(`PayMongo ${context} unknown error:`, err);
    }
    throw new InternalServerErrorException(`PayMongo ${context} failed`);
  }

  // private mapChargeTypeToPurchaseType(type: BookingChargeType): PurchaseType {
  //   switch (type) {
  //     case BookingChargeType.RESERVATION_FEE:
  //       return PurchaseType.RESERVATION_FEE;
  //     case BookingChargeType.ADVANCE_PAYMENT:
  //       return PurchaseType.ADVANCE_PAYMENT;
  //     case BookingChargeType.DEPOSIT:
  //       return PurchaseType.DEPOSIT;
  //     case BookingChargeType.EXTENSION_PAYMENT:
  //       return PurchaseType.EXTENSION_PAYMENT;
  //     default:
  //       return PurchaseType.ROOM_BOOKING;
  //   }
  // }

  // private async getNextPendingCharge(bookingId: number) {
  //   return this.prisma.bookingCharge.findFirst({
  //     where: {
  //       bookingId,
  //       isRequired: true,
  //       status: BookingChargeStatus.PENDING,
  //     },
  //     orderBy: { sequence: 'asc' },
  //   });
  // }
}
