import { z } from 'zod';

/** --- KPI METRICS --- */
export const MetricsKPISchema = z.object({
  totalRevenue: z.number(),
  totalBookings: z.number(),
  conversionRate: z.number(), // 0-1
  averageRating: z.number(), // 0-5
  activeSubscriptions: z.number(),
});

export type MetricsKPI = z.infer<typeof MetricsKPISchema>;

/** --- FUNNEL METRICS --- */
export const MetricsFunnelSchema = z.object({
  awaitingPayment: z.number(),
  completed: z.number(),
  failed: z.number(),
  dropOffRate: z.number(), // 0-1
});

export type MetricsFunnel = z.infer<typeof MetricsFunnelSchema>;

/** --- STATUS DISTRIBUTION --- */
export const MetricsStatusDistributionSchema = z.object({
  status: z.string(),
  count: z.number(),
  percentage: z.number(), // 0-1
});

export type MetricsStatusDistribution = z.infer<
  typeof MetricsStatusDistributionSchema
>;

/** --- REVENUE MIX --- */
export const MetricsRevenueMixSchema = z.object({
  bookingPercentage: z.number(), // 0-1
  subscriptionPercentage: z.number(), // 0-1
});

export type MetricsRevenueMix = z.infer<typeof MetricsRevenueMixSchema>;

/** --- TIME SERIES ENTRY --- */
export const MetricsTimeseriesItemSchema = z.object({
  date: z.string(), // ISO yyyy-mm-dd
  revenue: z.number(),
  bookings: z.number(),
  subscriptions: z.number(),
  avgRevenuePerBooking: z.number(),
});

export type MetricsTimeseriesItem = z.infer<typeof MetricsTimeseriesItemSchema>;

/** --- OWNER PERFORMANCE ITEM --- */
export const MetricsOwnerPerformanceItemSchema = z.object({
  ownerId: z.number(),
  ownerName: z.string(),
  totalPayments: z.number(),
  paidPayments: z.number(),
  revenue: z.number(),
});

export type MetricsOwnerPerformanceItem = z.infer<
  typeof MetricsOwnerPerformanceItemSchema
>;

/** --- TOP OWNER ITEM --- */
export const MetricsTopOwnerItemSchema = z.object({
  ownerId: z.number(),
  ownerName: z.string(),
  revenue: z.number(),
});

export type MetricsTopOwnerItem = z.infer<typeof MetricsTopOwnerItemSchema>;

/** --- INSIGHTS BLOCK --- */
export const MetricsInsightsBlockSchema = z.object({
  conversionRate: z.number(),
  revenueMix: MetricsRevenueMixSchema,
  healthScore: z.number(), // 0-100
  avgRevenuePerBooking: z.number(),
});

export type MetricsInsightsBlock = z.infer<typeof MetricsInsightsBlockSchema>;

/** --- INSIGHTS METRICS (FULL RESPONSE) --- */
export const InsightsMetricsSchema = z.object({
  timeframe: z.string(), // 'week' | 'month' | 'custom'

  kpis: MetricsKPISchema,
  funnel: MetricsFunnelSchema,

  charts: z.object({
    revenueTrend: z.array(MetricsTimeseriesItemSchema),
    bookingTrend: z.array(MetricsTimeseriesItemSchema),
    revenueMix: MetricsRevenueMixSchema,
    bookingStatus: z.array(MetricsStatusDistributionSchema),
  }),

  tables: z.object({
    topOwners: z.array(MetricsTopOwnerItemSchema),
    ownerPerformance: z.array(MetricsOwnerPerformanceItemSchema),
  }),

  insights: MetricsInsightsBlockSchema,
});

export type InsightsMetrics = z.infer<typeof InsightsMetricsSchema>;
