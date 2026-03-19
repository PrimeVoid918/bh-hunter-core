import { BaseUserSchema } from '../user/user.types';
import { z } from 'zod';

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

export const FindAllTenantsSchema = z.array(
  BaseUserSchema.extend({
    role: z.literal('TENANT'),

    guardian: z.string().nullable(),

    fullname: z.string(),

    isActive: z.boolean(),

    verificationLevel: z.enum(['UNVERIFIED', 'PROFILE_ONLY', 'FULLY_VERIFIED']),
    registrationStatus: z.enum(['PENDING', 'COMPLETED']),

    hasPermits: z.boolean(),

    createdAt: z.coerce.date(),
    updatedAt: z.coerce.date(),
  }),
);

export type FindAllTenants = z.infer<typeof FindAllTenantsSchema>;

export const FindOneTenantSchema = BaseUserSchema.extend({
  role: z.literal('TENANT'),

  guardian: z.string().nullable(),

  fullname: z.string(),

  isActive: z.boolean(),

  verificationLevel: z.enum(['UNVERIFIED', 'PROFILE_ONLY', 'FULLY_VERIFIED']),
  registrationStatus: z.enum(['PENDING', 'COMPLETED']),

  hasPermits: z.boolean(),

  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),

  verificationDocuments: z.array(VerificationDocumentSchema),
});

export type FindOneTenant = z.infer<typeof FindOneTenantSchema>;

export const CreateTenantSchema = z.object({
  username: z.string(),
  firstname: z.string().optional(),
  lastname: z.string().optional(),
  email: z.string().email(),
  password: z.string(),

  age: z.number().optional(),
  guardian: z.string().optional(),
  address: z.string().optional(),
  phone_number: z.string().optional(),
});

export type CreateTenant = z.infer<typeof CreateTenantSchema>;

export const UpdateTenantSchema = CreateTenantSchema.partial();
export type UpdateTenant = z.infer<typeof UpdateTenantSchema>;

export interface TenantState {
  list: FindAllTenants;
  selectedUser: FindOneTenant | null;
  loading: boolean;
  error: string | null;
}
