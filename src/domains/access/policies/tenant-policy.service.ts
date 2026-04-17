import { Injectable } from '@nestjs/common';

export interface TenantPolicyContext {
  verificationLevel: string;
  registrationStatus: string;
}

@Injectable()
export class TenantPolicy {
  canBookRoom(ctx: TenantPolicyContext): boolean {
    return ctx.verificationLevel === 'FULLY_VERIFIED';
  }

  canMakeReview(ctx: TenantPolicyContext): boolean {
    return ctx.verificationLevel === 'FULLY_VERIFIED';
  }

  canSendMessage(ctx: TenantPolicyContext): boolean {
    return ctx.verificationLevel === 'FULLY_VERIFIED';
  }

  getAccessStatus(tenantId: number, ctx: TenantPolicyContext) {
    const verified = ctx.verificationLevel === 'FULLY_VERIFIED';

    return {
      tenantId,
      isVerified: verified,
      verificationLevel: ctx.verificationLevel,
      canBookRoom: this.canBookRoom(ctx),
      canMakeReview: this.canMakeReview(ctx),
      canSendMessage: this.canSendMessage(ctx),
    };
  }
}
