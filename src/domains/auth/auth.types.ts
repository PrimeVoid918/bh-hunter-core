import { UserRole, VerificationType } from '@prisma/client';

export const REQUIRED_DOCUMENTS: Record<UserRole, VerificationType[]> = {
  TENANT: [VerificationType.VALID_ID],
  OWNER: [
    VerificationType.DTI,
    VerificationType.BIR,
    VerificationType.FIRE_CERTIFICATE,
    VerificationType.SANITARY_PERMIT,
    VerificationType.SEC,
  ],
  ADMIN: [],
};

export type JwtPayload = {
  userId: string;
  username: string;
  role: string;
  type: string;
};

export type AuthenticatedRequest = Request & {
  user: JwtPayload;
};
