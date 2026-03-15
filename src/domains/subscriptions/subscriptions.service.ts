import { Injectable, BadRequestException, Inject } from '@nestjs/common';
import { PrismaService } from 'src/infrastructure/database/prisma.service';
import {
  SubscriptionStatus,
  SubscriptionType,
  PaymentProvider,
} from '@prisma/client';
import { IDatabaseService } from 'src/infrastructure/database/database.interface';
import { SUBSCRIPTION_PLANS } from './subscription-plans.config';
import { PaymentsService } from '../payments/payments.service';

@Injectable()
export class SubscriptionsService {
  constructor(
    @Inject('IDatabaseService') private readonly database: IDatabaseService,
    private readonly paymentsService: PaymentsService,
  ) {}

  private get prisma() {
    return this.database.getClient();
  }

  getPlans() {
    return SUBSCRIPTION_PLANS;
  }

  getPlanById(planId: string) {
    return SUBSCRIPTION_PLANS.find((p) => p.id === planId);
  }

  // =========================
  // TRIAL CREATION
  // =========================
  async createTrial(ownerId: number) {
    if (!ownerId) {
      throw new BadRequestException('OwnerId is required');
    }

    // using transaction to make trial creation atomic
    return this.prisma.$transaction(async (tx) => {
      const owner = await tx.owner.findUnique({ where: { id: ownerId } });
      if (!owner) {
        throw new BadRequestException('Owner not found');
      }

      // check if is already active trial
      const existingTrial = await tx.subscription.findFirst({
        where: {
          ownerId,
          type: SubscriptionType.TRIAL,
          status: SubscriptionStatus.ACTIVE,
          expiresAt: { gt: new Date() },
        },
      });

      if (existingTrial) {
        return existingTrial; // return existing trial instead of creating new
      }

      // expire any other active subscriptions
      await tx.subscription.updateMany({
        where: {
          ownerId,
          status: SubscriptionStatus.ACTIVE,
        },
        data: { status: SubscriptionStatus.EXPIRED },
      });

      const now = new Date();
      const expiresAt = new Date(now);
      expiresAt.setDate(now.getDate() + 30);

      const trial = await tx.subscription.create({
        data: {
          ownerId,
          type: SubscriptionType.TRIAL,
          status: SubscriptionStatus.ACTIVE,
          startedAt: now,
          expiresAt,
        },
      });

      return trial;
    });
  }

  // =========================
  // ACTIVATE PAID SUB
  // =========================
  async activatePaid(body: {
    ownerId: number;
    durationMonths: number;
    providerReferenceId: string;
  }) {
    const { ownerId, durationMonths, providerReferenceId } = body;

    if (!ownerId || !durationMonths || !providerReferenceId) {
      throw new BadRequestException('Missing required fields');
    }

    const owner = await this.prisma.owner.findUnique({
      where: { id: ownerId },
    });
    if (!owner) {
      throw new BadRequestException('Owner not found');
    }

    // Expire existing active subscriptions
    await this.prisma.subscription.updateMany({
      where: {
        ownerId,
        status: SubscriptionStatus.ACTIVE,
      },
      data: { status: SubscriptionStatus.EXPIRED },
    });

    const now = new Date();
    const expiresAt = new Date(now);
    expiresAt.setMonth(now.getMonth() + durationMonths);

    return this.prisma.subscription.create({
      data: {
        ownerId,
        type: SubscriptionType.PAID,
        status: SubscriptionStatus.ACTIVE,
        startedAt: now,
        expiresAt,
        provider: PaymentProvider.PAYMONGO,
        providerReferenceId,
      },
    });
  }

  async cancelSubscription(ownerId: number) {
    const now = new Date();

    const subscription = await this.prisma.subscription.findFirst({
      where: {
        ownerId,
        status: SubscriptionStatus.ACTIVE,
      },
      include: {
        payments: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!subscription) {
      throw new BadRequestException('No active subscription found');
    }

    // Trial subscriptions cannot be refunded
    if (subscription.type === SubscriptionType.TRIAL) {
      return this.prisma.subscription.update({
        where: { id: subscription.id },
        data: {
          status: SubscriptionStatus.CANCELLED,
        },
      });
    }

    const payment = subscription.payments.find((p) => p.status === 'PAID');

    if (!payment) {
      throw new BadRequestException('No valid payment found for subscription');
    }

    const startedAt = subscription.startedAt;
    const expiresAt = subscription.expiresAt;

    const daysUsed =
      (now.getTime() - startedAt.getTime()) / (1000 * 60 * 60 * 24);

    if (daysUsed > 15) {
      // Refund window expired
      return this.prisma.subscription.update({
        where: { id: subscription.id },
        data: {
          status: SubscriptionStatus.CANCELLED,
        },
      });
    }

    // Calculate prorated refund
    const totalDays =
      (expiresAt.getTime() - startedAt.getTime()) / (1000 * 60 * 60 * 24);

    const remainingDays = totalDays - daysUsed;

    const refundPercentage = remainingDays / totalDays;

    const refundAmount = payment.amount.mul(refundPercentage);

    await this.paymentsService.refundPayment(
      payment.id,
      refundAmount,
      'Owner cancelled subscription within refund window',
    );

    return this.prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        status: SubscriptionStatus.CANCELLED,
        metadata: {
          refundPercentage,
        },
      },
    });
  }

  // =========================
  // FIND ALL OWNER SUBS
  // =========================
  async findAll(ownerId: number) {
    if (!ownerId) throw new BadRequestException('OwnerId is required');

    return this.prisma.subscription.findMany({
      where: { ownerId },
      orderBy: { createdAt: 'desc' },
    });
  }

  // =========================
  // FIND ACTIVE
  // =========================
  async findActive(ownerId: number) {
    if (!ownerId) throw new BadRequestException('OwnerId is required');

    const now = new Date();

    return this.prisma.subscription.findFirst({
      where: {
        ownerId,
        status: SubscriptionStatus.ACTIVE,
        expiresAt: { gt: now },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // =========================
  // EXPIRE MANUALLY
  // =========================
  async expire(id: number) {
    if (!id) throw new BadRequestException('Subscription ID is required');

    return this.prisma.subscription.update({
      where: { id },
      data: { status: SubscriptionStatus.EXPIRED },
    });
  }

  // =========================
  // REMOVE (Hard delete)
  // =========================
  async remove(id: number) {
    if (!id) throw new BadRequestException('Subscription ID is required');

    return this.prisma.subscription.delete({
      where: { id },
    });
  }
}
