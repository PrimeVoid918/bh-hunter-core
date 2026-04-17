export type TenantAccessCapabilities = {
  canBookRoom: boolean;
  canMakeReview: boolean;
  canSendMessage: boolean;
};

export type OwnerAccessCapabilities = {
  canCreateListing: boolean;
  canManageRooms: boolean;
  canReceiveBookings: boolean;
  canAppearOnMap: boolean;
};

export type OwnerAccessEvaluationInput = {
  verificationLevel: string;
  subscriptionActive: boolean;
};

export interface OwnerPolicyContext {
  verificationLevel: 'UNVERIFIED' | 'PROFILE_ONLY' | 'FULLY_VERIFIED';
  registrationStatus: 'PENDING' | 'COMPLETED';

  hasAcceptedLegitimacyConsent: boolean;

  subscriptionStatus?: 'ACTIVE' | 'EXPIRED' | 'CANCELLED' | 'INACTIVE';
  trialActive?: boolean;

  isActive: boolean;
  isDeleted: boolean;
}
