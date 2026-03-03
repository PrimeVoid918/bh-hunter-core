import { Injectable, BadRequestException, Inject } from '@nestjs/common';
import { PrismaService } from 'src/infrastructure/database/prisma.service';
import {
  SubscriptionStatus,
  SubscriptionType,
  PaymentProvider,
} from '@prisma/client';
import { IDatabaseService } from 'src/infrastructure/database/database.interface';
import { SUBSCRIPTION_PLANS } from './subscription-plans.config';

@Injectable()
export class SubscriptionsService {
  constructor(
    @Inject('IDatabaseService') private readonly database: IDatabaseService,
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

    const owner = await this.prisma.owner.findUnique({
      where: { id: ownerId },
    });
    if (!owner) {
      throw new BadRequestException('Owner not found');
    }

    // Expire any existing active subscriptions
    await this.prisma.subscription.updateMany({
      where: {
        ownerId,
        status: SubscriptionStatus.ACTIVE,
      },
      data: {
        status: SubscriptionStatus.EXPIRED,
      },
    });

    const now = new Date();
    const expiresAt = new Date(now);
    expiresAt.setDate(now.getDate() + 30); // 30-day trial

    return this.prisma.subscription.create({
      data: {
        ownerId,
        type: SubscriptionType.TRIAL,
        status: SubscriptionStatus.ACTIVE,
        startedAt: now,
        expiresAt,
      },
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
