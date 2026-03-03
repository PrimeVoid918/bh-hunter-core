export interface SubscriptionPlanConfig {
  id: string;
  title: string;
  durationMonths: number;
  pricePerMonth: number;
  totalPrice: number;
  savingsPercent: number;
}

const BASE_PRICE = 499;

export const SUBSCRIPTION_PLANS: SubscriptionPlanConfig[] = [
  {
    id: 'plan_1m',
    title: 'Monthly Plan',
    durationMonths: 1,
    pricePerMonth: BASE_PRICE,
    totalPrice: BASE_PRICE,
    savingsPercent: 0,
  },
  {
    id: 'plan_6m',
    title: '6-Month Plan',
    durationMonths: 6,
    pricePerMonth: 425,
    totalPrice: 2550,
    savingsPercent: 15,
  },
  {
    id: 'plan_12m',
    title: '12-Month Plan',
    durationMonths: 12,
    pricePerMonth: 350,
    totalPrice: 4200,
    savingsPercent: 30,
  },
];
