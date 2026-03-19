import { z } from 'zod';
import { BaseUserSchema } from '../user/user.types';

const BoardingHouseSchema = z.object({
  id: z.number(),
});

const SubscriptionSchema = z.object({
  id: z.number(),
  type: z.enum(['TRIAL', 'PAID']),
  startedAt: z.coerce.date(),
  expiresAt: z.coerce.date(),
  provider: z.string().nullable(),
});

const VerificationDocumentSchema = z.object({
  id: z.number(),
  userType: z.string(),
  userId: z.number(),
  fileFormat: z.string(),
  verificationType: z.string(),
  url: z.string(),
  expiresAt: z.coerce.date(),
  verificationStatus: z.string(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export const FindAllOwnersSchema = z.array(
  BaseUserSchema.extend({
    role: z.literal('OWNER'),

    fullname: z.string(),

    verificationLevel: z.enum(['UNVERIFIED', 'PROFILE_ONLY', 'FULLY_VERIFIED']),
    registrationStatus: z.enum(['PENDING', 'COMPLETED']),
    verified: z.boolean(),

    hasPermits: z.boolean(),

    createdAt: z.coerce.date(),
    updatedAt: z.coerce.date(),

    subscription: SubscriptionSchema.nullable().optional(),
  }),
);

export type FindAllOwners = z.infer<typeof FindAllOwnersSchema>;

export const FindOneOwnerSchema = BaseUserSchema.extend({
  role: z.literal('OWNER'),

  fullname: z.string(),

  verificationLevel: z.enum(['UNVERIFIED', 'PROFILE_ONLY', 'FULLY_VERIFIED']),
  registrationStatus: z.enum(['PENDING', 'COMPLETED']),
  verified: z.boolean(),

  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),

  age: z.number().nullable().optional(),
  address: z.string().nullable().optional(),
  phone_number: z.string().nullable().optional(),

  consentAcceptedAt: z.coerce.date().nullable().optional(),
  hasAcceptedLegitimacyConsent: z.boolean(),

  boardingHouses: z.array(BoardingHouseSchema),

  subscription: SubscriptionSchema.nullable().optional(),

  verificationDocuments: z.array(VerificationDocumentSchema),
});

export type FindOneOwner = z.infer<typeof FindOneOwnerSchema>;

export const CreateOwnerSchema = z.object({
  username: z.string(),
  firstname: z.string().optional(),
  lastname: z.string().optional(),
  email: z.string().email(),
  password: z.string(),

  age: z.number().optional(),
  address: z.string().optional(),
  phone_number: z.string().optional(),
});
export type CreateOwner = z.infer<typeof CreateOwnerSchema>;

export const UpdateOwnerSchema = CreateOwnerSchema.partial();
export type UpdateOwner = z.infer<typeof UpdateOwnerSchema>;

export interface OwnerState {
  list: FindAllOwners;
  selectedUser: FindOneOwner | null;
  loading: boolean;
  error: string | null;
}
