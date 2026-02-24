import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { NotificationsService } from '../notifications.service';
import { NotificationEmitter } from '../../../infrastructure/sockets/notification/notificatoin-emiiter.service';
import {
  BOOKING_EVENTS,
  BookingApprovedPayload,
  BookingRequestedPayload,
  BookingRejectedPayload,
  BookingCancelledPayload,
  BookingCompletedPayload,
} from 'src/domains/bookings/events/bookings.events';
import { NotificationType, ResourceType, UserRole } from '@prisma/client';

@Injectable()
export class BookingListener {
  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly notificationEmitter: NotificationEmitter,
  ) {}

  // =========================
  // BOOKING REQUESTED
  // =========================
  @OnEvent(BOOKING_EVENTS.REQUESTED)
  async handleBookingRequested(payload: BookingRequestedPayload) {
    const notification = await this.notificationsService.create({
      recipientRole: UserRole.OWNER,
      recipientId: payload.data.ownerId,

      type: NotificationType.BOOKING_REQUESTED,
      title: 'New Booking Request',
      message: 'A new booking request has been submitted.',

      entityType: ResourceType.BOOKING,
      entityId: payload.bookingId,

      data: {
        ...payload.data,
        bookingId: payload.bookingId,
      },
    });

    // Optional real-time delivery
    // this.notificationEmitter.notifyUser(payload.data.ownerId, notification);
  }

  // =========================
  // BOOKING APPROVED
  // =========================
  @OnEvent(BOOKING_EVENTS.APPROVED)
  async handleBookingApproved(payload: BookingApprovedPayload) {
    const notification = await this.notificationsService.create({
      recipientRole: UserRole.TENANT,
      recipientId: payload.data.tenantId,

      type: NotificationType.BOOKING_APPROVED,
      title: 'Booking Approved',
      message: 'Your booking has been approved.',

      entityType: ResourceType.BOOKING,
      entityId: payload.bookingId,

      data: {
        ...payload.data,
        bookingId: payload.bookingId,
      },
    });

    // this.notificationEmitter.notifyUser(payload.data.tenantId, notification);
  }

  // =========================
  // BOOKING REJECTED
  // =========================
  @OnEvent(BOOKING_EVENTS.REJECTED)
  async handleBookingRejected(payload: BookingRejectedPayload) {
    const notification = await this.notificationsService.create({
      recipientRole: UserRole.TENANT,
      recipientId: payload.data.tenantId,

      type: NotificationType.BOOKING_REJECTED,
      title: 'Booking Rejected',
      message: 'Your booking request was rejected.',

      entityType: ResourceType.BOOKING,
      entityId: payload.bookingId,

      data: {
        ...payload.data,
        bookingId: payload.bookingId,
        reason: payload.reason ?? null,
      },
    });

    // this.notificationEmitter.notifyUser(payload.data.tenantId, notification);
  }

  // =========================
  // BOOKING CANCELLED
  // =========================
  @OnEvent(BOOKING_EVENTS.CANCELLED)
  async handleBookingCancelled(payload: BookingCancelledPayload) {
    // const notification = await this.notificationsService.create({
    //   recipientRole: UserRole.TENANT,
    //   recipientId: payload.data.tenantId,

    //   type: NotificationType.BOOKING_CANCELLED,
    //   title: 'Booking Cancelled',
    //   message: 'Your booking has been cancelled.',

    //   entityType: ResourceType.BOOKING,
    //   entityId: payload.bookingId,

    //   data: {
    //     ...payload.data,
    //     bookingId: payload.bookingId,
    //     reason: payload.reason ?? null,
    //   },
    // });

    await Promise.all([
      // Notify Tenant
      this.notificationsService.create({
        recipientRole: UserRole.TENANT,
        recipientId: payload.tenantId,
        type: NotificationType.BOOKING_CANCELLED,
        title: 'Booking Cancelled',
        message: 'Your booking has been cancelled.',
        entityType: ResourceType.BOOKING,
        entityId: payload.bookingId,
        data: {
          ...payload.data,
          bookingId: payload.bookingId,
          reason: payload.reason ?? null,
        },
      }),

      // Notify Owner
      this.notificationsService.create({
        recipientRole: UserRole.OWNER,
        recipientId: payload.ownerId,
        type: NotificationType.BOOKING_CANCELLED,
        title: 'Booking Cancelled',
        message: 'A booking under your property has been cancelled.',
        entityType: ResourceType.BOOKING,
        entityId: payload.bookingId,
        data: {
          ...payload.data,
          bookingId: payload.bookingId,
          reason: payload.reason ?? null,
        },
      }),
    ]);

    // this.notificationEmitter.notifyUser(payload.data.tenantId, notification);
  }

  @OnEvent(BOOKING_EVENTS.COMPLETED)
  async handleBookingComplete(payload: BookingCompletedPayload) {
    await Promise.all([
      this.notificationsService.create({
        recipientRole: UserRole.TENANT,
        recipientId: payload.data.tenantId,

        type: NotificationType.BOOKING_COMPLETED,
        title: 'Booking Completed',
        message: 'Your booking has been successfully confirmed.',

        entityType: ResourceType.BOOKING,
        entityId: payload.bookingId,

        data: {
          ...payload.data,
          bookingId: payload.bookingId,
          reason: payload.reason ?? null,
        },
      }),

      this.notificationsService.create({
        recipientRole: UserRole.OWNER,
        recipientId: payload.data.ownerId,

        type: NotificationType.BOOKING_COMPLETED,
        title: 'Booking Completed',
        message: 'A booking has been successfully confirmed completed',

        entityType: ResourceType.BOOKING,
        entityId: payload.bookingId,

        data: {
          ...payload.data,
          bookingId: payload.bookingId,
          reason: payload.reason ?? null,
        },
      }),
    ]);

    // this.notificationEmitter.notifyUser(payload.data.tenantId, notification);
  }
}
