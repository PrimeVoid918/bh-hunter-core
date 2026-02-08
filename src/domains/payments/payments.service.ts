import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { IDatabaseService } from 'src/infrastructure/database/database.interface';
import { PaymentProviderAdapter } from './strategies/paymongo/paymongo.interface';
import {
  CurrencyType,
  PaymentStatus,
  PaymentProvider,
  PurchaseType,
  ResourceType,
  PayoutStatus,
} from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { PaymongoWebhookPayload } from './dto/types';

interface CreateBookingPaymentInput {
  bookingId: number;
  tenantId: number;
  amount: Decimal;
  currency?: CurrencyType;
}

interface ConfirmPaymentInput {
  providerPaymentId: string;
  status: PaymentStatus;
  metadata?: Record<string, any>;
}

@Injectable()
export class PaymentsService {
  constructor(
    @Inject('IDatabaseService') private readonly database: IDatabaseService,
    @Inject('PAYMENT_PROVIDER')
    private readonly provider: PaymentProviderAdapter,
  ) {}

  private get prisma() {
    return this.database.getClient();
  }

  /** Create payment for a booking */
  async createBookingPayment(input: CreateBookingPaymentInput) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: input.bookingId },
      include: { tenant: true, room: { include: { boardingHouse: true } } },
    });

    if (!booking) throw new NotFoundException('Booking not found');
    if (booking.status !== 'AWAITING_PAYMENT')
      throw new BadRequestException('Booking is not awaiting payment');

    const payment = await this.prisma.payment.create({
      data: {
        userId: booking.tenantId,
        userType: ResourceType.TENANT,
        ownerId: booking.room.boardingHouse.ownerId,
        amount: input.amount,
        currency: input.currency ?? CurrencyType.PHP,
        purchaseType: PurchaseType.ROOM_BOOKING,
        status: PaymentStatus.PENDING,
        bookingId: booking.id,
        provider: PaymentProvider.PAYMONGO,
      },
    });

    // create external payment intent
    const intent = await this.provider.createPaymentLink(payment);

    // update payment with provider references
    await this.prisma.payment.update({
      where: { id: payment.id },
      data: {
        providerIntentId: intent.id,
        status: PaymentStatus.REQUIRES_ACTION,
      },
    });

    return { paymentId: payment.id, checkoutUrl: intent.checkoutUrl };
  }

  /** Handle webhook from PayMongo to confirm payment */
  async confirmPayment(input: ConfirmPaymentInput) {
    const payment = await this.prisma.payment.findUnique({
      where: { providerPaymentId: input.providerPaymentId },
    });

    if (!payment) throw new NotFoundException('Payment not found');

    const updated = await this.prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: input.status,
        metadata: input.metadata ?? payment.metadata ?? {},
      },
    });

    // if PAID, update Booking status
    if (input.status === PaymentStatus.PAID && payment.bookingId) {
      await this.prisma.booking.update({
        where: { id: payment.bookingId },
        data: { status: 'COMPLETED_BOOKING' },
      });
    }

    return updated;
  }

  /** Create a payout for the owner */
  async createPayout(paymentId: number) {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
      include: { payouts: true },
    });

    if (!payment) throw new NotFoundException('Payment not found');
    if (payment.status !== PaymentStatus.PAID)
      throw new BadRequestException('Payment is not completed');

    if (!payment.ownerId) throw new BadRequestException('Payment has no owner');

    const existingPayout = payment.payouts.find(
      (p) => p.status === PayoutStatus.PENDING,
    );
    if (existingPayout) return existingPayout; // avoid double payout

    const payout = await this.prisma.payout.create({
      data: {
        ownerId: payment.ownerId,
        amount: payment.amount,
        currency: payment.currency,
        status: PayoutStatus.PENDING,
        paymentId: payment.id,
      },
    });

    // here you could integrate GCASH API to trigger actual transfer
    // after successful transfer, mark as PAID
    return payout;
  }

  /** Refund a payment (only via PayMongo) */
  async refundPayment(paymentId: number, reason?: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
    });
    if (!payment) throw new NotFoundException('Payment not found');

    // call provider refund
    await this.provider.refundPayment(payment, reason);

    return await this.prisma.payment.update({
      where: { id: paymentId },
      data: { status: PaymentStatus.REFUNDED },
    });
  }

  /*
  ==============
  Booking Section
  ==============
  */
  async getBookingPayment(bookingId: number) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
    });

    if (!booking) throw new NotFoundException('Booking not found');

    const payment = await this.prisma.payment.findFirst({
      where: { bookingId },
      orderBy: { createdAt: 'desc' },
    });

    if (!payment) {
      throw new NotFoundException('No payment found for booking');
    }

    return {
      paymentId: payment.id,
      status: payment.status,
      providerIntentId: payment.providerIntentId,
      canRetry: !this.isPayableStatus(payment.status),
    };
  }

  async retryBookingPayment(bookingId: number) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        room: {
          include: {
            boardingHouse: true,
          },
        },
      },
    });

    if (!booking) throw new NotFoundException('Booking not found');

    if (booking.status !== 'AWAITING_PAYMENT') {
      throw new BadRequestException('Booking is not awaiting payment');
    }

    const latestPayment = await this.prisma.payment.findFirst({
      where: { bookingId },
      orderBy: { createdAt: 'desc' },
    });

    if (!latestPayment) {
      throw new NotFoundException('No previous payment found');
    }

    if (this.isPayableStatus(latestPayment.status)) {
      throw new BadRequestException(
        'Payment is still payable, no retry needed',
      );
    }

    // CREATE NEW PAYMENT RECORD
    const newPayment = await this.prisma.payment.create({
      data: {
        userId: booking.tenantId,
        userType: ResourceType.TENANT,
        ownerId: booking.room.boardingHouse.ownerId,
        amount: latestPayment.amount,
        currency: latestPayment.currency,
        purchaseType: PurchaseType.ROOM_BOOKING,
        status: PaymentStatus.PENDING,
        bookingId: booking.id,
        provider: latestPayment.provider,
      },
    });

    const intent = await this.provider.createPaymentLink(newPayment);

    await this.prisma.payment.update({
      where: { id: newPayment.id },
      data: {
        providerIntentId: intent.id,
        status: PaymentStatus.REQUIRES_ACTION,
      },
    });

    return {
      paymentId: newPayment.id,
      checkoutUrl: intent.checkoutUrl,
    };
  }

  private isPayableStatus(status: PaymentStatus) {
    const payableStatuses: PaymentStatus[] = [
      PaymentStatus.PENDING,
      PaymentStatus.REQUIRES_ACTION,
    ];

    return payableStatuses.includes(status);
  }

  /*
  ==============
  Paymonogo Webhook Section
  ==============
  */
  async handlePaymongoWebhook(payload: PaymongoWebhookPayload) {
    const eventType = payload.data.attributes.event_type;

    const paymentIntentAttr = payload.data.attributes.payment_intent;

    const paymentIntentId =
      typeof paymentIntentAttr === 'string'
        ? paymentIntentAttr
        : paymentIntentAttr.id;

    if (!paymentIntentId) {
      throw new BadRequestException('Missing payment intent id');
    }

    const payment = await this.prisma.payment.findFirst({
      where: { providerIntentId: paymentIntentId },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found for webhook');
    }

    switch (eventType) {
      case 'payment_intent.succeeded':
        return this.confirmPayment({
          providerPaymentId: paymentIntentId,
          status: PaymentStatus.PAID,
        });

      case 'payment_intent.payment_failed':
        return this.confirmPayment({
          providerPaymentId: paymentIntentId,
          status: PaymentStatus.FAILED,
        });

      default:
        return { ignored: true };
    }
  }
}
