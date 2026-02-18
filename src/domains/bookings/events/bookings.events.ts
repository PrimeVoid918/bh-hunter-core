import { ResourceType } from '@prisma/client';

//event names (constants)
export const BOOKING_EVENTS = {
  REQUESTED: 'booking.requested',
  APPROVED: 'booking.approved',
  REJECTED: 'booking.rejected',
  CANCELLED: 'booking.cancelled',
  COMPLETED: 'booking.completed',
} as const;

export interface BookingDataPayload {
  resourceType: ResourceType;
  ownerId: number;
  tenantId: number;
  roomId: number;
  bhId: number;
}

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
  data: BookingDataPayload;
};

export type BookingApprovedPayload = {
  bookingId: number;
  tenantId: number;
  ownerId: number;
  data: BookingDataPayload;
};

export type BookingRejectedPayload = {
  bookingId: number;
  tenantId: number;
  reason?: string;
  data: BookingDataPayload;
};

export type BookingCancelledPayload = {
  bookingId: number;
  tenantId: number;
  reason?: string;
  data: BookingDataPayload;
};

export type BookingCompletedPayload = {
  bookingId: number;
  tenantId: number;
  reason?: string;
  data: BookingDataPayload;
};
