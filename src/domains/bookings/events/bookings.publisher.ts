import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  BOOKING_EVENTS,
  BookingApprovedPayload,
  BookingCancelledPayload,
  BookingCompletedPayload,
  BookingRejectedPayload,
  BookingRequestedPayload,
} from './bookings.events';

@Injectable()
export class BookingEventPublisher {
  constructor(private readonly emitter: EventEmitter2) {}

  requested(payload: BookingRequestedPayload) {
    this.emitter.emit(BOOKING_EVENTS.REQUESTED, payload);
  }

  approved(payload: BookingApprovedPayload) {
    this.emitter.emit(BOOKING_EVENTS.APPROVED, payload);
  }

  rejected(payload: BookingRejectedPayload) {
    this.emitter.emit(BOOKING_EVENTS.REJECTED, payload);
  }

  cancelled(payload: BookingCancelledPayload) {
    this.emitter.emit(BOOKING_EVENTS.CANCELLED, payload);
  }

  completed(payload: BookingCompletedPayload) {
    this.emitter.emit(BOOKING_EVENTS.COMPLETED, payload);
  }
}
