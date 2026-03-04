import { z } from 'zod';

/** Shared UserRole enum */
export const UserRoleSchema = z.enum(['TENANT', 'OWNER', 'ADMIN', 'GUEST']);
export type UserRole = z.infer<typeof UserRoleSchema>;
export const VerificationLevelSchema = z.enum([
  'UNVERIFIED',
  'PROFILE_ONLY',
  'FULLY_VERIFIED',
]);
export const RegistrationStatusSchema = z.enum(['PENDING', 'COMPLETED']);

/** BaseUser (decoupled, minimal shape) */
export const BaseUserSchema = z.object({
  id: z.number().int().positive().optional(),
  username: z.string().min(1).optional(),
  firstname: z.string().optional(),
  lastname: z.string().optional(),
  email: z.string().email().optional(),
  role: z.enum(['ADMIN', 'OWNER', 'TENANT']).optional(),
  isActive: z.boolean().optional(),
  registrationStatus: RegistrationStatusSchema.optional(),
  verificationLevel: VerificationLevelSchema.optional(),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
  age: z.number().int().optional(),
  address: z.string().optional(),
  phone_number: z.string().optional(),
  hasAcceptedLegitimacyConsent: z.boolean().optional(),
  consentAcceptedAt: z.string().datetime().optional(),
  boardingHouses: z.array(z.object({ id: z.number() })).optional(),
});

export type BaseUser = z.infer<typeof BaseUserSchema>;

export const roleToSliceMap = {
  TENANT: 'tenants',
  OWNER: 'owners',
  ADMIN: 'admins',
  GUEST: 'GUEST',
} as const;
