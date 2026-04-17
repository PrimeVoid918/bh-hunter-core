import { Injectable } from '@nestjs/common';
import { OwnerPolicyContext } from '../access.types';

@Injectable()
export class OwnerPolicy {
  private isVerified(ctx: OwnerPolicyContext) {
    return ctx.verificationLevel === 'FULLY_VERIFIED';
  }

  private hasActiveSubscription(ctx: OwnerPolicyContext) {
    return ctx.subscriptionStatus === 'ACTIVE' || ctx.trialActive === true;
  }

  private isAccountValid(ctx: OwnerPolicyContext) {
    return ctx.isActive && !ctx.isDeleted;
  }

  canCreateBoardingHouse(ctx: OwnerPolicyContext): boolean {
    return (
      this.isAccountValid(ctx) &&
      this.isVerified(ctx) &&
      this.hasActiveSubscription(ctx)
    );
  }

  canManageRooms(ctx: OwnerPolicyContext): boolean {
    return this.canCreateBoardingHouse(ctx);
  }

  canApproveBookings(ctx: OwnerPolicyContext): boolean {
    return this.isAccountValid(ctx) && this.isVerified(ctx);
  }

  canReceivePayments(ctx: OwnerPolicyContext): boolean {
    return this.isVerified(ctx);
  }

  canRequestPayout(ctx: OwnerPolicyContext): boolean {
    return this.isVerified(ctx) && this.hasActiveSubscription(ctx);
  }

  canUploadVerificationDocuments(ctx: OwnerPolicyContext): boolean {
    return ctx.registrationStatus === 'COMPLETED';
  }

  getAccessStatus(ownerId: number, ctx: OwnerPolicyContext) {
    return {
      ownerId,

      isVerified: this.isVerified(ctx),
      subscriptionActive: this.hasActiveSubscription(ctx),

      canCreateBoardingHouse: this.canCreateBoardingHouse(ctx),
      canManageRooms: this.canManageRooms(ctx),
      canApproveBookings: this.canApproveBookings(ctx),
      canReceivePayments: this.canReceivePayments(ctx),
      canRequestPayout: this.canRequestPayout(ctx),

      verificationLevel: ctx.verificationLevel,
      subscriptionStatus: ctx.subscriptionStatus,
    };
  }
}
