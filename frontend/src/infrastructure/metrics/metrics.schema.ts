import { z } from "zod";

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
