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
