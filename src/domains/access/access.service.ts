import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { AuthService } from '../auth/auth.service';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { TenantPolicy } from './policies/tenant-policy.service';
import { OwnerPolicy } from './policies/owner-policy.service';
import { IDatabaseService } from 'src/infrastructure/database/database.interface';
import { OwnerPolicyContext } from './access.types';

@Injectable()
export class AccessService {
  constructor(
    @Inject('IDatabaseService') private readonly database: IDatabaseService,
    private readonly tenantPolicy: TenantPolicy,
    private readonly ownerPolicy: OwnerPolicy,
    private readonly authService: AuthService,
  ) {}

  private get prisma() {
    return this.database.getClient();
  }

  async getTenantAccessStatus(tenantId: number) {
    const verification = await this.authService.getVerificationStatus(
      tenantId,
      'TENANT',
    );

    return this.tenantPolicy.getAccessStatus(tenantId, {
      verificationLevel: verification.verificationLevel,
      registrationStatus: verification.registrationStatus,
    });
  }

  async getOwnerAccessStatus(ownerId: number) {
    const prisma = this.database.getClient();

    const owner = await prisma.owner.findUnique({
      where: { id: ownerId },
      include: {
        subscriptions: {
          where: {
            status: 'ACTIVE',
          },
          orderBy: { expiresAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!owner) {
      throw new NotFoundException('Owner not found');
    }

    const activeSubscription = owner.subscriptions[0];

    const ctx: OwnerPolicyContext = {
      verificationLevel: owner.verificationLevel,
      registrationStatus: owner.registrationStatus,
      hasAcceptedPolicies: owner.hasAcceptedPolicies,

      subscriptionStatus: activeSubscription?.status ?? 'INACTIVE',
      trialActive:
        activeSubscription?.type === 'TRIAL' &&
        activeSubscription.expiresAt > new Date(),

      isActive: owner.isActive,
      isDeleted: owner.isDeleted,
    };

    return this.ownerPolicy.getAccessStatus(ownerId, ctx);
  }
}
