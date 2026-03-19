import z from 'zod';

export interface SubscriptionPlan {
  id: string;
  title: string;
  durationMonths: number;
  pricePerMonth: number;
  totalPrice: number;
  savingsPercent: number;
}

export interface Subscription {
  id: number;
  ownerId: number;
  type: 'TRIAL' | 'PAID';
  status: 'ACTIVE' | 'EXPIRED';
  startedAt: string;
  expiresAt: string;
  provider?: string;
  providerReferenceId?: string;
  createdAt: string;
}

export const SubscriptionSchema = z.object({
  id: z.number(),
  type: z.enum(['TRIAL', 'PAID']),
  startedAt: z.coerce.date(),
  expiresAt: z.coerce.date(),
  provider: z.string().nullable(),
});
