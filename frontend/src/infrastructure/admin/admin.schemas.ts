import { z } from 'zod';

// Schema for creating a tenant (admin-side)
export const AdminCreateTenantSchema = z.object({
  username: z.string().min(3, 'Username is required'),
  firstname: z.string().min(1, 'First name is required'),
  lastname: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  phone_number: z.string().min(7, 'Phone number is required'),
  address: z.string().optional(),
  guardian: z.string().nullable().optional(),
  age: z.number().min(0).optional(),
  role: z.literal('TENANT').optional(), // can be defaulted server-side
});

export type AdminCreateTenant = z.infer<typeof AdminCreateTenantSchema>;

export const refundRequestSchema = z.object({
  id: z.number(),
  paymentId: z.number(),
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED', 'COMPLETED']),
  reason: z.string().optional(),

  requestedById: z.number(),
  requestedByType: z.enum(['TENANT', 'OWNER']),

  adminId: z.number().nullable().optional(),
  adminNotes: z.string().nullable().optional(),

  createdAt: z.string(),
  updatedAt: z.string(),

  payment: z
    .object({
      id: z.number(),
      amount: z.number(),
      currency: z.string(),
      status: z.string(),
      purchaseType: z.string(),
      userId: z.number(),
    })
    .optional(),
});

export const refundRequestsSchema = z.array(refundRequestSchema);
