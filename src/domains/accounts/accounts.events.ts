import { NotificationType, ResourceType, UserRole } from '@prisma/client';

export const ACCOUNT_EVENTS = {
  ACCOUNT_SETUP_REQUIRED: 'account.setup-required',
  ACCOUNT_FULLY_VERIFIED: 'account.fully-verified',
} as const;

export interface AccountEventsDataPayload {}

export type AccountsSetupRequiredPayload = {
  id: number;
  userRole: UserRole;
  data?: AccountEventsDataPayload;
  resourceType: ResourceType;
};

export type AccountsFullyVerifiedPayload = {
  id: number;
  userRole: UserRole;
  data?: AccountEventsDataPayload;
  resourceType: ResourceType;
};
