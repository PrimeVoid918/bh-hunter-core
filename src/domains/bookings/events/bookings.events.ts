
//event names (constants)
export const BOOKING_EVENTS = {
  REQUESTED: 'booking.requested',
  APPROVED: 'booking.approved',
  REJECTED: 'booking.rejected',
  CANCELLED: 'booking.cancelled',
  COMPLETED: 'booking.completed',
} as const;

//payload types
export type BookingRequestedPayload = {
  bookingId: number;
  tenantId: number;
  ownerId: number;
  roomId: number;
  tenant: {
    firstname: string | null;
    lastname: string | null;
  };
  boardingHouseId: number;
};

export type BookingApprovedPayload = {
  bookingId: number;
  tenantId: number;
  ownerId: number;
};

export type BookingRejectedPayload = {
  bookingId: number;
  tenantId: number;
  reason?: string;
};

export type BookingCancelledPayload = {
  bookingId: number;
  tenantId: number;
  reason?: string;
};
