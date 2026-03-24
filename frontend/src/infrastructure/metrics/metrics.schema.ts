import { z } from 'zod';

/** --- USERS METRICS --- */
export const UsersMetricsSchema = z.object({
  total: z.number(),
  tenants: z.object({
    total: z.number(),
    active: z.number(),
    verified: z.number(),
  }),
  owners: z.object({
    total: z.number(),
    active: z.number(),
    verified: z.number(),
  }),
  admins: z.object({
    total: z.number(),
  }),
});

export type UsersMetrics = z.infer<typeof UsersMetricsSchema>;

/** --- PROPERTIES METRICS --- */
export const RoomTypeCountSchema = z.object({
  roomType: z.string(),
  _count: z.object({ roomType: z.number() }),
});

export const PropertiesMetricsSchema = z.object({
  totalHouses: z.number(),
  totalRooms: z.number(),
  boardingHouses: z.object({
    total: z.number(),
    available: z.number(),
  }),
  rooms: z.object({
    total: z.number(),
    available: z.number(),
    types: z.array(RoomTypeCountSchema),
  }),
});

export type PropertiesMetrics = z.infer<typeof PropertiesMetricsSchema>;

/** --- BOOKINGS METRICS --- */
export const BookingStatusCountSchema = z.object({
  status: z.string(),
  _count: z.object({ status: z.number() }),
});

export const BookingTypeCountSchema = z.object({
  bookingType: z.string(),
  _count: z.object({ bookingType: z.number() }),
});

export const BookingsMetricsSchema = z.object({
  totalBookings: z.number(),
  statusCounts: z.array(BookingStatusCountSchema),
  bookingTypes: z.array(BookingTypeCountSchema),
});

export type BookingsMetrics = z.infer<typeof BookingsMetricsSchema>;

/** --- PAYMENTS METRICS --- */
export const PaymentStatusCountSchema = z.object({
  status: z.string(),
  _count: z.object({ status: z.number() }),
});

export const PaymentsMetricsSchema = z.object({
  totalPayments: z.number(),
  paidPayments: z.number(),
  revenue: z.number(),
  statusCounts: z.array(PaymentStatusCountSchema),
});

export type PaymentsMetrics = z.infer<typeof PaymentsMetricsSchema>;

/** --- SUBSCRIPTIONS METRICS --- */
export const SubscriptionsMetricsSchema = z.object({
  totalSubscriptions: z.number(),
  active: z.number(),
  inactive: z.number(),
});

export type SubscriptionsMetrics = z.infer<typeof SubscriptionsMetricsSchema>;

/** --- REVIEWS METRICS --- */
export const ReviewsMetricsSchema = z.object({
  totalReviews: z.number(),
  averageRating: z.number(),
});

export type ReviewsMetrics = z.infer<typeof ReviewsMetricsSchema>;

/** --- OVERVIEW METRICS --- */
export const OverviewMetricsSchema = z.object({
  users: UsersMetricsSchema,
  properties: PropertiesMetricsSchema,
  bookings: BookingsMetricsSchema,
  payments: PaymentsMetricsSchema,
  subscriptions: SubscriptionsMetricsSchema,
  reviews: ReviewsMetricsSchema,
});

export type OverviewMetrics = z.infer<typeof OverviewMetricsSchema>;

/** --- TIME SERIES ENTRY --- */
export const FinancialReportTimeseriesItemSchema = z.object({
  date: z.string(), // ISO date string
  revenue: z.number(),
  bookings: z.number(),
  subscriptions: z.number(),
});

/** --- FINANCIAL REPORT ITEM (PER OWNER) --- */
export const FinancialReportItemSchema = z.object({
  ownerId: z.number(),
  ownerName: z.string(),
  totalPayments: z.number(), // sum of all payments for this owner
  paidPayments: z.number(),
  revenue: z.number(),
});

/** --- PAYMENT STATUS BREAKDOWN --- */
export const FinancialReportStatusBreakdownSchema = z.object({
  paid: z.number(),
  pending: z.number(),
  failed: z.number(),
});

/** --- FINANCIAL REPORT --- */
export const FinancialReportSchema = z.object({
  timeframe: z.string(), // e.g., 'week', 'month', 'custom'
  totalRevenue: z.number(),
  totalPaid: z.number(),
  totalPending: z.number(),
  totalBookings: z.number(),
  totalSubscriptions: z.number(),

  // Breakdown totals
  bookingRevenue: z.number(),
  subscriptionRevenue: z.number(),
  statusBreakdown: FinancialReportStatusBreakdownSchema,

  // For charts
  timeseries: z.array(FinancialReportTimeseriesItemSchema),

  // Table / per-owner items
  items: z.array(FinancialReportItemSchema),
});

export type FinancialReport = z.infer<typeof FinancialReportSchema>;

/** --- OWNER REPORT ITEM --- */
export const OwnerReportItemSchema = z.object({
  ownerId: z.number(),
  ownerName: z.string(),
  verified: z.number(), // approved verification documents
  totalBoardingHouses: z.number(),
  totalRooms: z.number(),
  totalBookings: z.number(),
  activeSubscriptions: z.number(),
  cancelledSubscriptions: z.number(),
  totalRevenue: z.number(),
});

/** --- OWNERS REPORT --- */
export const OwnersReportSchema = z.object({
  totalOwners: z.number(),
  verifiedOwners: z.number(),
  unverifiedOwners: z.number(),
  items: z.array(OwnerReportItemSchema),
  meta: z
    .object({
      totalItems: z.number(),
      itemCount: z.number(),
      itemsPerPage: z.number(),
      totalPages: z.number(),
      currentPage: z.number(),
    })
    .optional(),
});

export type OwnersReport = z.infer<typeof OwnersReportSchema>;
