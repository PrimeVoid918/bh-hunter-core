import { z } from 'zod';
import { BaseUserSchema } from '../user/user.types';

const NullableDateSchema = z
  .preprocess((value) => {
    if (value === null || value === undefined || value === '') return null;
    return value;
  }, z.coerce.date().nullable())
  .optional();

const OptionalDateSchema = z
  .preprocess((value) => {
    if (value === null || value === undefined || value === '') return null;
    return value;
  }, z.coerce.date().nullable())
  .optional();

const BoardingHouseSchema = z.object({
  id: z.number(),
});

const SubscriptionSchema = z
  .object({
    id: z.number(),
    type: z.enum(['TRIAL', 'PAID']),
    status: z.string().optional(),
    startedAt: OptionalDateSchema,
    expiresAt: OptionalDateSchema,
    provider: z.string().nullable().optional(),
  })
  .passthrough();

const VerificationDocumentSchema = z
  .object({
    id: z.number(),
    userType: z.string(),
    userId: z.number(),
    fileFormat: z.string(),
    verificationType: z.string(),
    url: z.string(),
    expiresAt: OptionalDateSchema,
    verificationStatus: z.string(),
    createdAt: OptionalDateSchema,
    updatedAt: OptionalDateSchema,
  })
  .passthrough();

const OwnerCommonBaseSchema = BaseUserSchema.extend({
  role: z.literal('OWNER'),

  fullname: z.string().optional().default(''),

  verificationLevel: z.enum(['UNVERIFIED', 'PROFILE_ONLY', 'FULLY_VERIFIED']),
  registrationStatus: z.enum(['PENDING', 'COMPLETED']),

  verified: z.boolean().optional().default(false),
  hasPermits: z.boolean().optional().default(false),

  isActive: z.boolean().optional().default(true),
  isSuspended: z.boolean().optional().default(false),
  suspendedAt: NullableDateSchema,

  hasAcceptedPolicies: z.boolean().optional().default(false),
  policiesAcceptedAt: NullableDateSchema,
  policiesVersion: z.string().nullable().optional(),

  createdAt: OptionalDateSchema,
  updatedAt: OptionalDateSchema,

  age: z.number().nullable().optional(),
  address: z.string().nullable().optional(),
  phone_number: z.string().nullable().optional(),

  subscription: SubscriptionSchema.nullable().optional(),
});

const withOwnerFullname = <
  T extends {
    fullname?: string;
    firstname?: string | null;
    lastname?: string | null;
    username?: string;
  },
>(
  owner: T,
) => ({
  ...owner,
  fullname:
    owner.fullname ||
    `${owner.firstname ?? ''} ${owner.lastname ?? ''}`.trim() ||
    owner.username ||
    '',
});

export const OwnerCommonSchema =
  OwnerCommonBaseSchema.transform(withOwnerFullname);

export const FindAllOwnersSchema = z.array(OwnerCommonSchema);

export type FindAllOwners = z.infer<typeof OwnerCommonSchema>;

export const FindOneOwnerSchema = OwnerCommonBaseSchema.extend({
  boardingHouses: z.array(BoardingHouseSchema).optional().default([]),
  verificationDocuments: z
    .array(VerificationDocumentSchema)
    .optional()
    .default([]),
}).transform(withOwnerFullname);

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
  list: FindAllOwners[];
  selectedUser: FindOneOwner | null;
  loading: boolean;
  error: string | null;
}
