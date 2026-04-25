/*
  id           Int
  username     String
  firstname    String
  lastname     String
  email        String
  password     String
  role         UserRole
  isActive     Boolean
  isVerified   Boolean
  createdAt    DateTime
  updatedAt    DateTime
  age          Int
  address      String
  phone_number String
*/

import { BaseUser } from '../user/user.types';

export interface Admin extends BaseUser {
  role: 'ADMIN';
}

export interface AdminState {
  selectedUser: Admin | null;
  filter: string;
  loading: boolean;
  error: string | null;
}

export interface AdminState {
  users: User[]; // list of all users visible to admin
  selectedUser: User | null; // currently selected user (for edit/view)
  loading: boolean;
  error: string | null;
  filter: string; // search/filter term
}

import { z } from 'zod';

export const transactionStatusSchema = z.enum([
  'PENDING',
  'REQUIRES_ACTION',
  'PAID',
  'FAILED',
  'CANCELLED',
  'REFUNDED',
  'EXPIRED',
]);

export const purchaseTypeSchema = z.enum([
  'ROOM_BOOKING',
  'RESERVATION_FEE',
  'ADVANCE_PAYMENT',
  'DEPOSIT',
  'EXTENSION_PAYMENT',
  'SUBSCRIPTION',
]);

export const currencyTypeSchema = z.enum(['PHP', 'USD', 'EUR', 'JPY']);

export const payoutStatusSchema = z.enum(['PENDING', 'PAID_OUT', 'FAILED']);

export const adminTransactionBookingSchema = z.object({
  id: z.number(),
  reference: z.string(),
  status: z.string(),
});

export const adminTransactionSubscriptionSchema = z.object({
  id: z.number(),
  status: z.string(),
  type: z.string(),
});

export const adminTransactionPayoutSchema = z.object({
  id: z.number(),
  ownerId: z.number(),
  amount: z.union([z.string(), z.number()]),
  currency: currencyTypeSchema,
  status: payoutStatusSchema,
  paymentId: z.number(),
  createdAt: z.string(),
  paidAt: z.string().nullable().optional(),
});

export const adminTransactionMetaDataSchema = z.object({
  id: z.number(),
  provider: z.string(),

  providerPaymentLinkId: z.string().nullable().optional(),
  providerPaymentIntentId: z.string().nullable().optional(),
  providerPaymentId: z.string().nullable().optional(),
  providerSourceId: z.string().nullable().optional(),

  amount: z.union([z.string(), z.number()]),
  currency: currencyTypeSchema,
  status: transactionStatusSchema,
  purchaseType: purchaseTypeSchema,

  userId: z.number(),
  userType: z.string(),
  ownerId: z.number(),

  bookingId: z.number().nullable().optional(),
  booking: adminTransactionBookingSchema.nullable().optional(),

  subscriptionId: z.number().nullable().optional(),
  subscription: adminTransactionSubscriptionSchema.nullable().optional(),

  metadata: z.record(z.string(), z.any()).nullable().optional(),

  createdAt: z.string(),
  updatedAt: z.string(),

  payouts: z.array(adminTransactionPayoutSchema),
});

export const adminTransactionsSchema = z.array(adminTransactionMetaDataSchema);

export const adminTransactionStatsSchema = z.object({
  total: z.number(),
  paid: z.number(),
  pending: z.number(),
  failed: z.number(),
  refunded: z.number(),
});

export type AdminTransactionMetaData = z.infer<
  typeof adminTransactionMetaDataSchema
>;
export type AdminTransactionStats = z.infer<typeof adminTransactionStatsSchema>;

export type AdminSuspendUserRole = 'TENANT' | 'OWNER';

export interface AdminSuspendUserPayload {
  reason?: string;
}

export interface AdminSuspendedUser {
  id: number;
  username: string;
  firstname?: string | null;
  lastname?: string | null;
  email: string;
  role: AdminSuspendUserRole;
  isActive: boolean;
  isSuspended: boolean;
  suspendedAt?: string | null;
  updatedAt?: string;
}

export interface AdminSuspendUserResponse {
  action:
    | 'TENANT_SUSPENDED'
    | 'TENANT_UNSUSPENDED'
    | 'TENANT_ALREADY_SUSPENDED'
    | 'TENANT_ALREADY_ACTIVE'
    | 'OWNER_SUSPENDED'
    | 'OWNER_UNSUSPENDED'
    | 'OWNER_ALREADY_SUSPENDED'
    | 'OWNER_ALREADY_ACTIVE';
  userType: AdminSuspendUserRole;
  userId: number;
  reason?: string | null;
  isActive?: boolean;
  isSuspended?: boolean;
  suspendedAt?: string | null;
  user?: AdminSuspendedUser;
}
