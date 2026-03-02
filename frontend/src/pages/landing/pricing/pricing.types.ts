export interface PricingPlan {
  id: string;
  title: string;
  durationMonths: number;
  pricePerMonth: number;
  totalPrice: number;
  savingsPercent: number;
}

const BASE_PRICE = 499; // Standard monthly rate in PHP

export const sharedFeatures = [
  'Verified Owner Status',
  'Unlimited Boarding House Listings',
  'Real-time Map Visibility in Ormoc City',
  'In-app Booking Management',
  'Secure PayMongo Payment Integration',
  'Tenant Reviews & Ratings Access',
];

export const subscriptionPlans: PricingPlan[] = [
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
    pricePerMonth: 425, // ~15% discount
    totalPrice: 2550,
    savingsPercent: 15,
  },
  {
    id: 'plan_12m',
    title: '12-Month Plan',
    durationMonths: 12,
    pricePerMonth: 350, // ~30% discount
    totalPrice: 4200,
    savingsPercent: 30,
  },
];
