import {
  BadRequestException,
  Inject,
  Injectable,
  InternalServerErrorException,
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
  Payment,
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
    // Fetch booking
    const booking = await this.prisma.booking.findUnique({
      where: { id: input.bookingId },
      include: {
        tenant: true,
        room: { include: { boardingHouse: true } },
      },
    });
    if (!booking) throw new NotFoundException('Booking not found');
    if (booking.status !== 'AWAITING_PAYMENT')
      throw new BadRequestException('Booking is not awaiting payment');

    // Create payment record
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

    // ✅ CHANGED: Use Payment Intent (checkout session) instead of payment link
    const intent = await this.provider.createPaymentIntent(payment);

    // Update payment with provider info
    await this.prisma.payment.update({
      where: { id: payment.id },
      data: {
        providerPaymentIntentId: intent.id,
        status: PaymentStatus.REQUIRES_ACTION,
      },
    });

    // Return client secret for RN app to confirm payment in-app
    return {
      paymentId: payment.id,
      clientSecret: intent.clientSecret!,
    };
  }

  async createBookingPaymentForFrontend(bookingId: number) {
    // Fetch booking
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: { room: { include: { boardingHouse: true } } },
    });

    if (!booking) throw new NotFoundException('Booking not found');
    if (booking.status !== 'AWAITING_PAYMENT')
      throw new BadRequestException('Booking is not awaiting payment');

    // Check if a payment already exists
    let latestPayment = await this.prisma.payment.findFirst({
      where: { bookingId },
      orderBy: { createdAt: 'desc' },
    });

    // If no payment yet, create one
    if (!latestPayment) {
      latestPayment = await this.prisma.payment.create({
        data: {
          userId: booking.tenantId,
          userType: ResourceType.TENANT,
          ownerId: booking.room.boardingHouse.ownerId,
          amount: booking.room.price,
          currency: CurrencyType.PHP,
          purchaseType: PurchaseType.ROOM_BOOKING,
          status: PaymentStatus.PENDING,
          bookingId: booking.id,
          provider: PaymentProvider.PAYMONGO,
        },
      });
    }

    // Create the PayMongo payment link
    const link = await this.provider.createPaymentLink(latestPayment);

    // Update payment with provider link ID
    await this.prisma.payment.update({
      where: { id: latestPayment.id },
      data: {
        providerPaymentLinkId: link.id,
        status: PaymentStatus.REQUIRES_ACTION,
      },
    });

    return {
      paymentId: latestPayment.id,
      checkoutUrl: link.checkoutUrl,
    };
  }

  /** Handle webhook from PayMongo to confirm payment */
  async confirmPayment(input: ConfirmPaymentInput) {
    const payment = await this.prisma.payment.findFirst({
      where: { providerPaymentIntentId: input.providerPaymentId },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    if (payment.status === PaymentStatus.PAID) {
      return payment;
    }

    return this.prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: input.status,
        metadata: input.metadata ?? payment.metadata ?? {},
      },
    });
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

    if (!payment.providerPaymentIntentId) {
      throw new InternalServerErrorException(
        'Payment does not have a provider payment intent yet',
      );
    }

    return {
      paymentId: payment.id,
      status: payment.status,
      providerPaymentIntentId: payment.providerPaymentIntentId, // now TS knows it's string
      canRetry: !this.isPayableStatus(payment.status),
    };

    // return {
    //   paymentId: payment.id,
    //   status: payment.status,
    //   providerPaymentIntentId: payment.providerPaymentIntentId,
    //   canRetry: !this.isPayableStatus(payment.status),
    // };
  }

  async retryBookingPayment(bookingId: number) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: { room: { include: { boardingHouse: true } } },
    });
    if (!booking) throw new NotFoundException('Booking not found');
    if (booking.status !== 'AWAITING_PAYMENT')
      throw new BadRequestException('Booking is not awaiting payment');

    const latestPayment = await this.prisma.payment.findFirst({
      where: { bookingId },
      orderBy: { createdAt: 'desc' },
    });
    if (!latestPayment)
      throw new NotFoundException('No previous payment found');

    if (this.isPayableStatus(latestPayment.status))
      throw new BadRequestException(
        'Payment is still payable, no retry needed',
      );

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

    const intent = await this.provider.createPaymentIntent(newPayment);

    await this.prisma.payment.update({
      where: { id: newPayment.id },
      data: {
        providerPaymentIntentId: intent.id,
        status: PaymentStatus.REQUIRES_ACTION,
      },
    });

    return {
      paymentId: newPayment.id,
      clientSecret: intent.clientSecret,
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
    // console.log(JSON.stringify(payload, null, 2));

    const eventType = payload?.data?.attributes?.event_type;

    const intent =
      typeof payload.data.attributes.payment_intent === 'string'
        ? payload.data.attributes.payment_intent
        : payload.data.attributes.payment_intent?.id;

    const link =
      typeof payload.data.attributes.payment_link === 'string'
        ? payload.data.attributes.payment_link
        : payload.data.attributes.payment_link?.id;

    if (!intent && !link) {
      throw new BadRequestException('Missing payment identifiers');
    }

    // 1️⃣ Try find by intent first
    let payment = intent
      ? await this.prisma.payment.findFirst({
          where: { providerPaymentIntentId: intent },
        })
      : null;

    // 2️⃣ Fallback → find by link
    if (!payment && link) {
      payment = await this.prisma.payment.findFirst({
        where: { providerPaymentLinkId: link },
      });
    }

    if (!payment) {
      return { ignored: true };
    }

    // 3️⃣ If found via link, save intent now
    if (intent && !payment.providerPaymentIntentId) {
      payment = await this.prisma.payment.update({
        where: { id: payment.id },
        data: { providerPaymentIntentId: intent },
      });
    }

    // Idempotency guard
    if (payment.status === PaymentStatus.PAID) {
      return { ignored: true };
    }

    switch (eventType) {
      case 'payment.paid':
        return this.markPaymentPaid(payment);

      case 'payment.failed':
        return this.markPaymentFailed(payment);

      default:
        return { ignored: true };
    }
  }

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
