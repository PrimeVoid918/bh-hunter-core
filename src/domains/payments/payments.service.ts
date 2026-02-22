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
  Prisma,
} from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { PaymongoWebhookPayload } from './dto/types';
import { BookingEventPublisher } from '../bookings/events/bookings.publisher';

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
    private readonly bookingEventPublisher: BookingEventPublisher,
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
    const eventType = payload?.data?.attributes?.type;
    const resource = payload?.data?.attributes?.data;
    const resourceAttributes = resource?.attributes;

    if (!eventType || !resourceAttributes) {
      console.log('Webhook ignored: malformed payload');
      return { ignored: true };
    }

    // Try metadata first
    const metadata = resourceAttributes?.metadata;
    const internalPaymentId = metadata?.paymentId;

    let payment: Payment | null = null;

    if (internalPaymentId) {
      payment = await this.prisma.payment.findUnique({
        where: { id: Number(internalPaymentId) },
      });
    }

    // fallback to providerPaymentIntentId
    if (!payment && resourceAttributes?.payment_intent_id) {
      payment = await this.prisma.payment.findFirst({
        where: {
          providerPaymentIntentId: resourceAttributes.payment_intent_id,
        },
      });
    }

    // fallback to providerPaymentId
    if (!payment && resource?.id) {
      payment = await this.prisma.payment.findFirst({
        where: { providerPaymentId: resource.id },
      });
    }

    // fallback to description parsing (legacy)
    if (!payment && resourceAttributes?.description?.includes('Booking #')) {
      const bookingId = Number(resourceAttributes.description.split('#')[1]);
      payment = await this.prisma.payment.findFirst({
        where: { bookingId },
        orderBy: { createdAt: 'desc' },
      });
    }

    if (!payment) {
      console.log('Webhook ignored: payment not found', internalPaymentId);
      return { ignored: true };
    }

    // Update payment record with provider IDs if missing
    const updateData: Prisma.PaymentUpdateInput = {};
    if (
      resourceAttributes.payment_intent_id &&
      !payment.providerPaymentIntentId
    ) {
      updateData.providerPaymentIntentId = resourceAttributes.payment_intent_id;
    }
    if (resource?.id && !payment.providerPaymentId) {
      updateData.providerPaymentId = resource.id;
    }

    if (Object.keys(updateData).length > 0) {
      payment = await this.prisma.payment.update({
        where: { id: payment.id },
        data: updateData, // now type-safe
      });
    }

    if (payment.status === PaymentStatus.PAID) return { ignored: true };

    switch (eventType) {
      case 'payment.paid':
        return this.markPaymentPaid(payment);
      case 'payment.failed':
        return this.markPaymentFailedTransaction(payment);
      default:
        return { ignored: true };
    }
  }

  /** Mark failed with transaction to mirror paid flow */
  private async markPaymentFailedTransaction(payment: Payment) {
    if (payment.status === PaymentStatus.PAID) return { ignored: true };

    await this.prisma.$transaction(async (tx) => {
      await tx.payment.update({
        where: { id: payment.id },
        data: { status: PaymentStatus.FAILED },
      });

      if (payment.bookingId) {
        await tx.booking.update({
          where: { id: payment.bookingId },
          data: { status: 'AWAITING_PAYMENT' }, // revert booking to allow retry
        });
      }
    });

    return { success: true };
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
        const booking = await tx.booking.update({
          where: { id: payment.bookingId },
          data: { status: 'COMPLETED_BOOKING' },
        });

        // // 🔹 Emit completed booking event
        // this.eventEmitter.emit<BookingCompletedPayload>(
        //   BOOKING_EVENTS.COMPLETED,
        //   {
        //     bookingId: booking.id,
        //     data: {
        //       tenantId: booking.tenantId,
        //       ownerId: booking.room.ownerId, // if needed
        //       roomId: booking.roomId,
        //     },
        //   },
        // );
        this.bookingEventPublisher.completed({
          bookingId: payment.bookingId,
          tenantId: payment.userId,
          data: {
            bhId: booking.boardingHouseId,
            ownerId: payment.ownerId,
            tenantId: booking.tenantId,
            resourceType: 'BOOKING',
            roomId: booking.roomId,
          },
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
