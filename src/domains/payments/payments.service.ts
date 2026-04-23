import {
  BadRequestException,
  ForbiddenException,
  forwardRef,
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
  BookingStatus,
  SubscriptionStatus,
  BookingChargeStatus,
  BookingChargeType,
} from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { BookingEventPublisher } from '../bookings/events/bookings.publisher';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { PaymongoReasons } from './dto/payments.types';
import { AgreementsService } from '../agreements/agreements.service';

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

    @Inject(forwardRef(() => SubscriptionsService))
    private readonly subscriptionsService: SubscriptionsService,
    private readonly agreementsService: AgreementsService,
  ) {}

  private get prisma() {
    return this.database.getClient();
  }

  //! depricated funtion or legacy code
  /** Create payment for a booking */
  // async createBookingPayment(input: CreateBookingPaymentInput) {
  //   const booking = await this.prisma.booking.findUnique({
  //     where: { id: input.bookingId },
  //     include: {
  //       tenant: true,
  //       room: { include: { boardingHouse: true } },
  //     },
  //   });

  //   if (!booking) throw new NotFoundException('Booking not found');

  //   if (
  //     booking.status !== BookingStatus.AWAITING_PAYMENT &&
  //     booking.status !== BookingStatus.PAYMENT_FAILED
  //   ) {
  //     throw new BadRequestException(
  //       `Booking cannot be paid in status: ${booking.status}`,
  //     );
  //   }

  //   if (booking.status === BookingStatus.PAYMENT_FAILED) {
  //     await this.prisma.booking.update({
  //       where: { id: booking.id },
  //       data: { status: BookingStatus.AWAITING_PAYMENT },
  //     });
  //   }

  //   // If this is a retry after a failed payment, reopen payment flow
  //   if (booking.status === BookingStatus.PAYMENT_FAILED) {
  //     await this.prisma.booking.update({
  //       where: { id: booking.id },
  //       data: {
  //         status: BookingStatus.AWAITING_PAYMENT,
  //       },
  //     });
  //   }

  //   // Optional cleanup:
  //   // mark previous unfinished payment attempts as expired so history stays cleaner
  //   await this.prisma.payment.updateMany({
  //     where: {
  //       bookingId: booking.id,
  //       purchaseType: PurchaseType.ROOM_BOOKING,
  //       status: {
  //         in: [PaymentStatus.PENDING, PaymentStatus.REQUIRES_ACTION],
  //       },
  //     },
  //     data: {
  //       status: PaymentStatus.EXPIRED,
  //     },
  //   });

  //   // Create fresh payment record for this retry
  //   const payment = await this.prisma.payment.create({
  //     data: {
  //       userId: booking.tenantId,
  //       userType: ResourceType.TENANT,
  //       ownerId: booking.room.boardingHouse.ownerId,
  //       amount: input.amount,
  //       currency: input.currency ?? CurrencyType.PHP,
  //       purchaseType: PurchaseType.ROOM_BOOKING,
  //       status: PaymentStatus.PENDING,
  //       bookingId: booking.id,
  //       provider: PaymentProvider.PAYMONGO,
  //     },
  //   });

  //   const intent = await this.provider.createPaymentIntent(payment);

  //   // Update payment with provider info
  //   await this.prisma.payment.update({
  //     where: { id: payment.id },
  //     data: {
  //       providerPaymentIntentId: intent.id,
  //       status: PaymentStatus.REQUIRES_ACTION,
  //     },
  //   });

  //   return {
  //     paymentId: payment.id,
  //     clientSecret: intent.clientSecret!,
  //   };
  // }
  //! depricated funtion or legacy code

  //! depricated funtion or legacy code
  // async createBookingPaymentForFrontend(bookingId: number) {
  //   const booking = await this.prisma.booking.findUnique({
  //     where: { id: bookingId },
  //     include: { room: { include: { boardingHouse: true } } },
  //   });

  //   if (!booking) throw new NotFoundException('Booking not found');

  //   if (
  //     booking.status !== BookingStatus.AWAITING_PAYMENT &&
  //     booking.status !== BookingStatus.PAYMENT_FAILED
  //   ) {
  //     throw new BadRequestException(
  //       `Booking cannot be paid in status: ${booking.status}`,
  //     );
  //   }

  //   // Reopen payment if this is a retry
  //   if (booking.status === BookingStatus.PAYMENT_FAILED) {
  //     await this.prisma.booking.update({
  //       where: { id: booking.id },
  //       data: {
  //         status: BookingStatus.AWAITING_PAYMENT,
  //       },
  //     });
  //   }

  //   // Expire unfinished previous attempts so history stays cleaner
  //   await this.prisma.payment.updateMany({
  //     where: {
  //       bookingId: booking.id,
  //       purchaseType: PurchaseType.ROOM_BOOKING,
  //       status: {
  //         in: [PaymentStatus.PENDING, PaymentStatus.REQUIRES_ACTION],
  //       },
  //     },
  //     data: {
  //       status: PaymentStatus.EXPIRED,
  //     },
  //   });

  //   const payment = await this.prisma.payment.create({
  //     data: {
  //       userId: booking.tenantId,
  //       userType: ResourceType.TENANT,
  //       ownerId: booking.room.boardingHouse.ownerId,
  //       amount: booking.room.price,
  //       currency: CurrencyType.PHP,
  //       purchaseType: PurchaseType.ROOM_BOOKING,
  //       status: PaymentStatus.PENDING,
  //       bookingId: booking.id,
  //       provider: PaymentProvider.PAYMONGO,
  //     },
  //   });

  //   const link = await this.provider.createPaymentLink(payment);

  //   await this.prisma.payment.update({
  //     where: { id: payment.id },
  //     data: {
  //       providerPaymentLinkId: link.id,
  //       providerPaymentIntentId: link.paymentIntentId,
  //       status: PaymentStatus.REQUIRES_ACTION,
  //     },
  //   });

  //   return {
  //     paymentId: payment.id,
  //     checkoutUrl: link.checkoutUrl,
  //   };
  // }
  //! depricated funtion or legacy code

  async createSubscriptionPayment(input: { ownerId: number; planId: string }) {
    const { ownerId, planId } = input;

    // ✅ Validate owner
    const owner = await this.prisma.owner.findUnique({
      where: { id: ownerId },
    });
    if (!owner) throw new NotFoundException('Owner not found');
    if (owner.verificationLevel !== 'FULLY_VERIFIED') {
      throw new ForbiddenException(
        'Owner must be fully verified before subscribing.',
      );
    }

    // ✅ Validate plan
    const plan = this.subscriptionsService.getPlanById(planId);
    if (!plan) throw new BadRequestException('Invalid subscription plan');

    // ✅ Check if active subscription exists
    const existingActiveSubscription = await this.prisma.subscription.findFirst(
      {
        where: {
          ownerId,
          status: SubscriptionStatus.ACTIVE,
          expiresAt: { gt: new Date() },
        },
      },
    );
    if (existingActiveSubscription) {
      throw new BadRequestException(
        'Owner already has an active subscription.',
      );
    }

    // ✅ Expire old pending subscription payments
    await this.prisma.payment.updateMany({
      where: {
        ownerId,
        purchaseType: PurchaseType.SUBSCRIPTION,
        status: { in: [PaymentStatus.PENDING, PaymentStatus.REQUIRES_ACTION] },
      },
      data: { status: PaymentStatus.EXPIRED },
    });

    // ✅ Create subscription row first (inactive)
    const subscription = await this.prisma.subscription.create({
      data: {
        ownerId,
        type: 'PAID',
        status: SubscriptionStatus.INACTIVE,
        startedAt: new Date(),
        expiresAt: new Date(
          new Date().setFullYear(new Date().getFullYear() + 1),
        ),
      },
    });

    // ✅ Create the payment row in DB first
    const payment = await this.prisma.payment.create({
      data: {
        userId: ownerId,
        userType: ResourceType.OWNER,
        ownerId,
        amount: new Prisma.Decimal(plan.totalPrice),
        currency: CurrencyType.PHP,
        purchaseType: PurchaseType.SUBSCRIPTION,
        provider: PaymentProvider.PAYMONGO,
        subscriptionId: subscription.id,
        metadata: { type: 'subscription', planId: plan.id },
        status: PaymentStatus.PENDING,
      },
    });

    // ✅ Call PayMongo to create payment link with the DB object
    let link;
    try {
      link = await this.provider.createPaymentLink(payment);
    } catch (error) {
      console.error('Failed to create PayMongo payment link:', error);
      // Optional: delete subscription/payment to avoid orphan rows
      await this.prisma.payment.delete({ where: { id: payment.id } });
      await this.prisma.subscription.delete({ where: { id: subscription.id } });
      throw new InternalServerErrorException(
        'Failed to initialize payment session.',
      );
    }

    // ✅ Update payment with provider info
    await this.prisma.payment.update({
      where: { id: payment.id },
      data: {
        providerPaymentLinkId: link.id,
        providerPaymentIntentId: link.paymentIntentId,
        status: PaymentStatus.REQUIRES_ACTION,
      },
    });

    return {
      subscriptionId: subscription.id,
      paymentId: payment.id,
      checkoutUrl: link.checkoutUrl,
    };
  }

  /** Handle webhook from PayMongo to confirm payment */
  async confirmPayment(input: ConfirmPaymentInput) {
    const payment = await this.prisma.payment.findFirst({
      where: { providerPaymentIntentId: input.providerPaymentId },
    });

    if (!payment) throw new NotFoundException('Payment not found');

    if (payment.status === PaymentStatus.PAID) return payment;

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

    return payout;
  }

  async createBookingChargeCheckout(bookingId: number) {
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

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    const nextCharge = await this.getNextPendingCharge(bookingId);

    if (!nextCharge) {
      throw new BadRequestException('No pending booking charge found');
    }

    let payment = await this.prisma.payment.findFirst({
      where: { bookingChargeId: nextCharge.id },
      orderBy: { createdAt: 'desc' },
    });

    if (!payment) {
      payment = await this.prisma.payment.create({
        data: {
          bookingId,
          bookingChargeId: nextCharge.id,
          amount: nextCharge.amount,
          currency: CurrencyType.PHP,
          status: PaymentStatus.PENDING,
          purchaseType: this.mapChargeTypeToPurchaseType(nextCharge.type),
          userId: booking.tenantId,
          userType: ResourceType.TENANT,
          ownerId: booking.room.boardingHouse.ownerId,
          provider: PaymentProvider.PAYMONGO,
          metadata: {
            bookingChargeId: nextCharge.id,
            bookingId,
            purchaseType: this.mapChargeTypeToPurchaseType(nextCharge.type),
          },
        },
      });
    } else {
      if (payment.status === PaymentStatus.PAID) {
        throw new BadRequestException('This booking charge is already paid');
      }

      payment = await this.prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: PaymentStatus.PENDING,
          providerPaymentIntentId: null,
          providerPaymentLinkId: null,
          providerPaymentId: null,
          providerSourceId: null,
        },
      });
    }

    const link = await this.provider.createPaymentLink(payment);

    await this.prisma.payment.update({
      where: { id: payment.id },
      data: {
        providerPaymentLinkId: link.id,
        providerPaymentIntentId: link.paymentIntentId ?? null,
        status: PaymentStatus.REQUIRES_ACTION,
      },
    });

    return {
      paymentId: payment.id,
      bookingChargeId: nextCharge.id,
      chargeType: nextCharge.type,
      amount: nextCharge.amount,
      checkoutUrl: link.checkoutUrl,
    };
  }

  async createBookingChargePayment(params: {
    bookingId: number;
    bookingChargeId: number;
    tenantId: number;
    ownerId: number;
    amount: Prisma.Decimal;
    purchaseType: PurchaseType;
  }) {
    const {
      bookingId,
      bookingChargeId,
      tenantId,
      ownerId,
      amount,
      purchaseType,
    } = params;

    const charge = await this.prisma.bookingCharge.findUnique({
      where: { id: bookingChargeId },
    });

    if (!charge) {
      throw new NotFoundException('Booking charge not found');
    }

    if (charge.status === BookingChargeStatus.PAID) {
      throw new BadRequestException('This booking charge is already paid');
    }

    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    if (
      booking.status !== BookingStatus.AWAITING_PAYMENT &&
      booking.status !== BookingStatus.PAYMENT_FAILED &&
      booking.status !== BookingStatus.COMPLETED_BOOKING
    ) {
      throw new BadRequestException(
        `Booking cannot accept charge payment in status: ${booking.status}`,
      );
    }

    if (booking.status === BookingStatus.PAYMENT_FAILED) {
      await this.prisma.booking.update({
        where: { id: booking.id },
        data: { status: BookingStatus.AWAITING_PAYMENT },
      });
    }

    let payment = await this.prisma.payment.findFirst({
      where: { bookingChargeId },
      orderBy: { createdAt: 'desc' },
    });

    if (!payment) {
      payment = await this.prisma.payment.create({
        data: {
          bookingId,
          bookingChargeId,
          amount,
          currency: CurrencyType.PHP,
          status: PaymentStatus.PENDING,
          purchaseType,
          userId: tenantId,
          userType: ResourceType.TENANT,
          ownerId,
          provider: PaymentProvider.PAYMONGO,
          metadata: {
            bookingChargeId,
            bookingId,
            purchaseType,
          },
        },
      });
    } else {
      if (payment.status === PaymentStatus.PAID) {
        throw new BadRequestException(
          'Payment already completed for this charge',
        );
      }

      payment = await this.prisma.payment.update({
        where: { id: payment.id },
        data: {
          amount,
          purchaseType,
          status: PaymentStatus.PENDING,
          providerPaymentIntentId: null,
          providerPaymentLinkId: null,
          providerPaymentId: null,
          providerSourceId: null,
          metadata: {
            ...(payment.metadata as Record<string, any> | null),
            bookingChargeId,
            bookingId,
            purchaseType,
          },
        },
      });
    }

    const providerResult = await this.provider.createPaymentIntent(payment);

    await this.prisma.payment.update({
      where: { id: payment.id },
      data: {
        providerPaymentIntentId:
          providerResult.paymentIntentId ?? providerResult.id ?? null,
        status: PaymentStatus.REQUIRES_ACTION,
      },
    });

    return {
      paymentId: payment.id,
      clientSecret: providerResult.clientSecret!,
    };
  }

  /** Refund a payment (only via PayMpongo) */
  async refundPayment({
    paymentId,
    amount,
    reason,
    paymongoReason,
  }: {
    paymentId: number;
    amount?: Decimal;
    reason?: string;
    paymongoReason?: PaymongoReasons;
  }) {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
    });

    if (!payment) throw new NotFoundException('Payment not found');

    if (payment.status !== PaymentStatus.PAID) {
      throw new BadRequestException('Only paid payments can be refunded');
    }

    const refundAmount = amount ?? payment.amount;

    await this.provider.refundPayment({
      payment: payment,
      refundAmount: refundAmount,
      reason: paymongoReason,
    });

    //* use this to display `Refunded ₱450 of ₱900`
    return await this.prisma.payment.update({
      where: { id: paymentId },
      data: {
        status: PaymentStatus.REFUNDED,
        metadata: {
          ...((payment.metadata as object) ?? {}),
          refundedAmount: refundAmount.toString(),
          refundReason: reason,
          refundedAt: new Date().toISOString(),
        },
      },
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
      include: {
        room: {
          include: {
            boardingHouse: true,
          },
        },
      },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    const nextCharge = await this.getNextPendingCharge(bookingId);

    if (!nextCharge) {
      return {
        bookingId,
        completed: true,
        bookingStatus: booking.status,
        message: 'All required booking charges are already paid',
      };
    }

    const existingPayment = await this.prisma.payment.findFirst({
      where: { bookingChargeId: nextCharge.id },
      orderBy: { createdAt: 'desc' },
    });

    if (
      existingPayment &&
      this.isPayableStatus(existingPayment.status) &&
      existingPayment.providerPaymentIntentId
    ) {
      return {
        paymentId: existingPayment.id,
        bookingChargeId: nextCharge.id,
        chargeType: nextCharge.type,
        amount: nextCharge.amount,
        status: existingPayment.status,
        providerPaymentIntentId: existingPayment.providerPaymentIntentId,
        canRetry: false,
      };
    }

    const recreated = await this.createBookingChargePayment({
      bookingId,
      bookingChargeId: nextCharge.id,
      tenantId: booking.tenantId,
      ownerId: booking.room.boardingHouse.ownerId,
      amount: nextCharge.amount,
      purchaseType: this.mapChargeTypeToPurchaseType(nextCharge.type),
    });

    return {
      ...recreated,
      bookingChargeId: nextCharge.id,
      chargeType: nextCharge.type,
      amount: nextCharge.amount,
      canRetry: false,
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

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    const nextCharge = await this.getNextPendingCharge(bookingId);

    if (!nextCharge) {
      throw new BadRequestException('No pending booking charge to retry');
    }

    return this.createBookingChargePayment({
      bookingId,
      bookingChargeId: nextCharge.id,
      tenantId: booking.tenantId,
      ownerId: booking.room.boardingHouse.ownerId,
      amount: nextCharge.amount,
      purchaseType: this.mapChargeTypeToPurchaseType(nextCharge.type),
    });
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
  async handlePaymongoWebhook(payload: any) {
    console.log('payload:', JSON.stringify(payload, null, 2));

    const eventType = payload?.data?.attributes?.type;
    const paymentAttributes = payload?.data?.attributes?.data?.attributes;

    if (!eventType || !paymentAttributes) {
      console.log('Webhook ignored: malformed payload');
      return { ignored: true };
    }

    let payment: Payment | null = null;

    if (paymentAttributes?.metadata?.paymentId) {
      payment = await this.prisma.payment.findUnique({
        where: { id: Number(paymentAttributes.metadata.paymentId) },
      });
    }

    if (!payment && paymentAttributes?.payment_intent_id) {
      payment = await this.prisma.payment.findFirst({
        where: {
          providerPaymentIntentId: paymentAttributes.payment_intent_id,
        },
      });
    }

    if (!payment) {
      console.log(
        'Webhook ignored: payment not found for metadata or intent',
        paymentAttributes.metadata,
        paymentAttributes.payment_intent_id,
      );
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

  // public async markPaymentPaid(payment: Payment) {
  private async markPaymentPaid(payment: Payment) {
    if (payment.status === PaymentStatus.PAID) return { ignored: true };

    if (!payment.providerPaymentId && payment.providerPaymentIntentId) {
      const paymentIntent = await this.provider.retrievePaymentIntent(
        payment.providerPaymentIntentId,
      );

      const providerPaymentId = paymentIntent.attributes.payments?.[0]?.id;

      if (!providerPaymentId) {
        throw new InternalServerErrorException(
          'PayMongo payment object missing',
        );
      }

      await this.prisma.payment.update({
        where: { id: payment.id },
        data: { providerPaymentId },
      });

      payment.providerPaymentId = providerPaymentId;
    }

    const completedBookingEvent = await this.prisma.$transaction(async (tx) => {
      await tx.payment.update({
        where: { id: payment.id },
        data: { status: PaymentStatus.PAID },
      });

      if (payment.purchaseType === PurchaseType.SUBSCRIPTION) {
        if (!payment.ownerId) {
          throw new Error('Subscription payment missing ownerId');
        }

        const metadata = payment.metadata as { planId?: string } | null;

        if (!metadata?.planId) {
          throw new Error('Subscription payment missing planId');
        }

        const plan = this.subscriptionsService.getPlanById(metadata.planId);

        if (!plan) {
          throw new Error('Invalid subscription plan in payment metadata');
        }

        const now = new Date();
        const expiresAt = new Date(now);
        expiresAt.setMonth(now.getMonth() + plan.durationMonths);

        await tx.subscription.updateMany({
          where: {
            ownerId: payment.ownerId,
            status: SubscriptionStatus.ACTIVE,
          },
          data: { status: SubscriptionStatus.EXPIRED },
        });

        if (payment.subscriptionId) {
          await tx.subscription.update({
            where: { id: payment.subscriptionId },
            data: {
              status: SubscriptionStatus.ACTIVE,
              startedAt: now,
              expiresAt,
              provider: payment.provider,
              providerReferenceId: payment.providerPaymentIntentId,
            },
          });
        } else {
          await tx.subscription.create({
            data: {
              ownerId: payment.ownerId,
              type: 'PAID',
              status: SubscriptionStatus.ACTIVE,
              startedAt: now,
              expiresAt,
              provider: payment.provider,
              providerReferenceId: payment.providerPaymentIntentId,
            },
          });
        }

        return null;
      }

      if (payment.bookingChargeId) {
        const charge = await tx.bookingCharge.findUnique({
          where: { id: payment.bookingChargeId },
        });

        if (!charge) {
          throw new Error('Booking charge not found for payment');
        }

        if (charge.type === BookingChargeType.EXTENSION_PAYMENT) {
          const metadata = charge.metadata as {
            extensionRequestId?: number;
            requestedCheckOutDate?: string;
          } | null;

          if (!payment.bookingId) {
            throw new Error('Extension payment missing bookingId');
          }

          if (
            !metadata?.extensionRequestId ||
            !metadata?.requestedCheckOutDate
          ) {
            throw new Error('Extension charge metadata is incomplete');
          }

          await tx.booking.update({
            where: { id: payment.bookingId },
            data: {
              checkOutDate: new Date(metadata.requestedCheckOutDate),
            },
          });

          await tx.bookingExtensionRequest.update({
            where: { id: metadata.extensionRequestId },
            data: {
              status: 'PAID',
              paidAt: new Date(),
            },
          });

          await tx.bookingCharge.update({
            where: { id: charge.id },
            data: {
              status: BookingChargeStatus.PAID,
              paidAt: new Date(),
            },
          });

          return null;
        }

        await tx.bookingCharge.update({
          where: { id: charge.id },
          data: {
            status: BookingChargeStatus.PAID,
            paidAt: new Date(),
          },
        });

        if (!payment.bookingId) {
          return null;
        }

        const booking = await tx.booking.findUnique({
          where: { id: payment.bookingId },
          select: {
            id: true,
            status: true,
            roomId: true,
            occupantsCount: true,
            tenantId: true,
            boardingHouseId: true,
          },
        });

        if (!booking) {
          throw new Error('Booking not found');
        }

        const remainingRequiredCharges = await tx.bookingCharge.count({
          where: {
            bookingId: booking.id,
            isRequired: true,
            status: {
              in: [BookingChargeStatus.PENDING],
            },
          },
        });

        if (
          remainingRequiredCharges === 0 &&
          booking.status !== BookingStatus.COMPLETED_BOOKING
        ) {
          await tx.booking.update({
            where: { id: booking.id },
            data: {
              status: BookingStatus.COMPLETED_BOOKING,
              confirmedAt: new Date(),
            },
          });

          await tx.room.update({
            where: { id: booking.roomId },
            data: {
              currentCapacity: {
                increment: booking.occupantsCount,
              },
            },
          });

          return {
            bookingId: booking.id,
            tenantId: booking.tenantId,
            ownerId: payment.ownerId,
            roomId: booking.roomId,
            boardingHouseId: booking.boardingHouseId,
          };
        }

        if (booking.status === BookingStatus.PAYMENT_FAILED) {
          await tx.booking.update({
            where: { id: booking.id },
            data: {
              status: BookingStatus.AWAITING_PAYMENT,
            },
          });
        }

        return null;
      }

      if (payment.purchaseType === PurchaseType.ROOM_BOOKING) {
        if (!payment.bookingId) {
          throw new Error('Booking payment missing bookingId');
        }

        const booking = await tx.booking.findUnique({
          where: { id: payment.bookingId },
          select: {
            id: true,
            roomId: true,
            occupantsCount: true,
            tenantId: true,
            boardingHouseId: true,
            status: true,
          },
        });

        if (!booking) {
          throw new Error('Booking not found');
        }

        if (booking.status !== BookingStatus.COMPLETED_BOOKING) {
          await tx.booking.update({
            where: { id: booking.id },
            data: {
              status: BookingStatus.COMPLETED_BOOKING,
              confirmedAt: new Date(),
            },
          });

          await tx.room.update({
            where: { id: booking.roomId },
            data: {
              currentCapacity: { increment: booking.occupantsCount },
            },
          });

          return {
            bookingId: booking.id,
            tenantId: booking.tenantId,
            ownerId: payment.ownerId,
            roomId: booking.roomId,
            boardingHouseId: booking.boardingHouseId,
          };
        }
      }

      return null;
    });

    if (completedBookingEvent) {
      this.bookingEventPublisher.completed({
        bookingId: completedBookingEvent.bookingId,
        tenantId: completedBookingEvent.tenantId,
        ownerId: completedBookingEvent.ownerId,
        data: {
          bhId: completedBookingEvent.boardingHouseId,
          ownerId: completedBookingEvent.ownerId,
          tenantId: completedBookingEvent.tenantId,
          resourceType: ResourceType.BOOKING,
          roomId: completedBookingEvent.roomId,
        },
      });
    }

    return { success: true };
  }

  private async markPaymentFailed(payment: Payment) {
    if (payment.status === PaymentStatus.PAID) return { ignored: true };

    await this.prisma.payment.update({
      where: { id: payment.id },
      data: { status: PaymentStatus.FAILED },
    });

    if (payment.bookingId) {
      await this.prisma.booking.update({
        where: { id: payment.bookingId },
        data: { status: BookingStatus.PAYMENT_FAILED },
      });
    }

    return { success: true };
  }

  private mapChargeTypeToPurchaseType(type: BookingChargeType): PurchaseType {
    switch (type) {
      case BookingChargeType.RESERVATION_FEE:
        return PurchaseType.RESERVATION_FEE;
      case BookingChargeType.ADVANCE_PAYMENT:
        return PurchaseType.ADVANCE_PAYMENT;
      case BookingChargeType.DEPOSIT:
        return PurchaseType.DEPOSIT;
      case BookingChargeType.EXTENSION_PAYMENT:
        return PurchaseType.EXTENSION_PAYMENT;
      default:
        return PurchaseType.ROOM_BOOKING;
    }
  }

  private async getNextPendingCharge(bookingId: number) {
    return this.prisma.bookingCharge.findFirst({
      where: {
        bookingId,
        isRequired: true,
        status: BookingChargeStatus.PENDING,
      },
      orderBy: { sequence: 'asc' },
    });
  }

  //* for debuuggin purposes used for new booking implementation
  async debugPayNextCharge(bookingId: number) {
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

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    const nextCharge = await this.getNextPendingCharge(bookingId);

    if (!nextCharge) {
      throw new BadRequestException('No pending booking charge found');
    }

    let payment = await this.prisma.payment.findFirst({
      where: { bookingChargeId: nextCharge.id },
      orderBy: { createdAt: 'desc' },
    });

    if (!payment) {
      const created = await this.createBookingChargePayment({
        bookingId,
        bookingChargeId: nextCharge.id,
        tenantId: booking.tenantId,
        ownerId: booking.room.boardingHouse.ownerId,
        amount: nextCharge.amount,
        purchaseType: this.mapChargeTypeToPurchaseType(nextCharge.type),
      });

      payment = await this.prisma.payment.findUnique({
        where: { id: created.paymentId },
      });
    }

    if (!payment) {
      throw new InternalServerErrorException(
        'Failed to prepare payment for debug settlement',
      );
    }

    if (!payment.providerPaymentId) {
      payment = await this.prisma.payment.update({
        where: { id: payment.id },
        data: {
          providerPaymentId: `debug_paid_${payment.id}_${Date.now()}`,
        },
      });
    }

    await this.markPaymentPaid(payment);

    return {
      message: 'Next booking charge marked paid in debug mode',
      bookingId,
      bookingChargeId: nextCharge.id,
      chargeType: nextCharge.type,
      amount: nextCharge.amount,
    };
  }
}
