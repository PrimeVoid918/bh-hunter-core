import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { NotificationsService } from '../notifications.service';
import { NotificationEmitter } from '../../../infrastructure/sockets/notification/notificatoin-emiiter.service';
import {
  BOOKING_EVENTS,
  BookingApprovedPayload,
  BookingRequestedPayload,
} from 'src/domains/bookings/events/bookings.events';
import { NotificationType, ResourceType, UserRole } from '@prisma/client';

@Injectable()
export class BookingListener {
  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly notificationEmitter: NotificationEmitter,
  ) {
    // To save in Prisma
  }

  // Booking domain event → Notification mapping
  // Each handler translates a booking event into a persisted notification
  // Add new handlers here as new booking behaviors require notifications

  @OnEvent(BOOKING_EVENTS.REQUESTED)
  async handleBookingReqeusted(payload: BookingRequestedPayload) {
    const notification = await this.notificationsService.create({
      recipientRole: UserRole.OWNER,
      recipientId: payload.ownerId,

      type: NotificationType.BOOKING_REQUESTED,
      title: 'Booking Request',
      message: `${payload.tenant.firstname ?? null} ${payload.tenant.lastname ?? null} has requested a booking. Please approve or reject the request`,
      data: {
        firstname: payload.tenant.firstname ?? null,
        lastname: payload.tenant.lastname ?? null,
      },

      entityType: ResourceType.BOOKING,
      entityId: payload.bookingId,
    });

    // Best-effort real-time delivery
    this.notificationEmitter.notifyUser(payload.ownerId, notification);
  }

  @OnEvent(BOOKING_EVENTS.APPROVED)
  async handleBookingApproved(payload: BookingApprovedPayload) {
    const notification = await this.notificationsService.create({
      recipientRole: UserRole.TENANT,
      recipientId: payload.tenantId,

      type: NotificationType.BOOKING_APPROVED,
      title: 'Booking Approved',
      message:
        'Your booking has been approved. Please upload your payment proof.',

      entityType: ResourceType.BOOKING,
      entityId: payload.bookingId,
    });

    // Best-effort real-time delivery
    this.notificationEmitter.notifyUser(payload.tenantId, notification);
  }
}
