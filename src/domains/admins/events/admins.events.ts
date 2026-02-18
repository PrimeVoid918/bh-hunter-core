import { ResourceType, UserRole } from '@prisma/client';

export const VERIFICATIONE_EVENTS = {
  VERIFICATION_DOCUMENT_APPROVED: 'verification-document.approved',
  VERIFICATION_DOCUMENT_REJECTED: 'verification-document.rejected',
};

export interface VerificationDocumentDataPayload {
  ownerId?: number | null;
  tenantId?: number | null;
  userRole: UserRole;
  resourceType: ResourceType;
  verificationDocumentId: number;
}

export type VerificationApprovePayload = {
  verificationDocumentId: number;
  adminId: number;
  userId: number;
  data: VerificationDocumentDataPayload;
};

export type VerificationRejectPayload = {
  verificationDocumentId: number;
  adminId: number;
  userId: number;
  data: VerificationDocumentDataPayload;
};
