import { Inject, Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import {
  BookingChargeStatus,
  BookingChargeType,
  BookingStatus,
  NotificationType,
  ResourceType,
  UserRole,
} from '@prisma/client';
import { BookingsService } from 'src/domains/bookings/bookings.service';
import { NotificationsService } from 'src/domains/notifications/notifications.service';
import { IDatabaseService } from 'src/infrastructure/database/database.interface';

@Injectable()
export class MaintenanceService {
  private readonly logger = new Logger(MaintenanceService.name);

  constructor(
    private readonly bookingsService: BookingsService,
    private readonly notificationsService: NotificationsService,
    @Inject('IDatabaseService') private readonly database: IDatabaseService,
  ) {}

  private get prisma() {
    return this.database.getClient();
  }

  @Cron(CronExpression.EVERY_5_MINUTES)
  async handleExpiredBookings() {
    this.logger.log('Checking expired unpaid bookings...');

    const count = await this.bookingsService.cancelExpiredBookings();

    this.logger.log(`Cancelled ${count} expired bookings`);
  }

  @Cron(CronExpression.EVERY_10_MINUTES)
  async handleEndedBookings() {
    this.logger.log('Checking completed bookings past checkout...');

    const count = await this.bookingsService.releaseEndedBookingSlots();

    this.logger.log(`Released slots for ${count} ended bookings`);
  }

  @Cron(CronExpression.EVERY_30_MINUTES)
  async handleDueSoonChargeNotifications() {
    this.logger.log('Checking booking charges due soon...');

    const now = new Date();
    const next24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    const dueSoonCharges = await this.prisma.bookingCharge.findMany({
      where: {
        status: BookingChargeStatus.PENDING,
        dueDate: {
          gt: now,
          lte: next24Hours,
        },
        booking: {
          status: {
            in: [
              BookingStatus.AWAITING_PAYMENT,
              BookingStatus.COMPLETED_BOOKING,
            ],
          },
          isDeleted: false,
        },
      },
      include: {
        booking: {
          select: {
            id: true,
            tenantId: true,
            boardingHouseId: true,
            roomId: true,
            room: {
              select: {
                boardingHouse: {
                  select: { ownerId: true },
                },
              },
            },
          },
        },
      },
      orderBy: {
        dueDate: 'asc',
      },
    });

    let createdCount = 0;

    for (const charge of dueSoonCharges) {
      const title = this.buildChargeDueSoonTitle(charge.type);
      const message = this.buildChargeDueSoonMessage(
        charge.type,
        charge.dueDate,
      );

      const tenantCreated = await this.createDueSoonNotificationIfMissing({
        recipientRole: UserRole.TENANT,
        recipientId: charge.booking.tenantId,
        bookingId: charge.booking.id,
        chargeId: charge.id,
        title,
        message,
        data: {
          bookingId: charge.booking.id,
          bookingChargeId: charge.id,
          bookingChargeType: charge.type,
          dueDate: charge.dueDate?.toISOString() ?? null,
          bhId: charge.booking.boardingHouseId,
          roomId: charge.booking.roomId,
          kind: 'BOOKING_CHARGE_DUE_SOON',
        },
      });

      if (tenantCreated) createdCount += 1;

      const ownerCreated = await this.createDueSoonNotificationIfMissing({
        recipientRole: UserRole.OWNER,
        recipientId: charge.booking.room.boardingHouse.ownerId,
        bookingId: charge.booking.id,
        chargeId: charge.id,
        title: `Tenant ${title}`,
        message: `A tenant has a pending ${this.humanizeChargeType(
          charge.type,
        ).toLowerCase()} due soon.`,
        data: {
          bookingId: charge.booking.id,
          bookingChargeId: charge.id,
          bookingChargeType: charge.type,
          dueDate: charge.dueDate?.toISOString() ?? null,
          bhId: charge.booking.boardingHouseId,
          roomId: charge.booking.roomId,
          kind: 'BOOKING_CHARGE_DUE_SOON',
        },
      });

      if (ownerCreated) createdCount += 1;
    }

    this.logger.log(
      `Created ${createdCount} due-soon booking charge notifications`,
    );
  }

  private async createDueSoonNotificationIfMissing(params: {
    recipientRole: UserRole;
    recipientId: number;
    bookingId: number;
    chargeId: number;
    title: string;
    message: string;
    data: Record<string, any>;
  }) {
    const {
      recipientRole,
      recipientId,
      bookingId,
      chargeId,
      title,
      message,
      data,
    } = params;

    const recentWindow = new Date(Date.now() - 12 * 60 * 60 * 1000);

    const existing = await this.prisma.notification.findFirst({
      where: {
        recipientRole,
        recipientId,
        type: NotificationType.SYSTEM,
        entityType: ResourceType.BOOKING,
        entityId: bookingId,
        title,
        createdAt: {
          gte: recentWindow,
        },
        isDeleted: false,
      },
    });

    if (existing) {
      return false;
    }

    await this.notificationsService.create({
      recipientRole,
      recipientId,
      type: NotificationType.SYSTEM,
      title,
      message,
      entityType: ResourceType.BOOKING,
      entityId: bookingId,
      data: {
        ...data,
        bookingChargeId: chargeId,
      },
    });

    return true;
  }

  private buildChargeDueSoonTitle(type: BookingChargeType) {
    return `${this.humanizeChargeType(type)} Due Soon`;
  }

  private buildChargeDueSoonMessage(
    type: BookingChargeType,
    dueDate?: Date | null,
  ) {
    const readableDueDate = dueDate ? dueDate.toISOString() : 'soon';

    return `${this.humanizeChargeType(
      type,
    )} is due soon. Please settle it before ${readableDueDate}.`;
  }

  private humanizeChargeType(type: BookingChargeType) {
    switch (type) {
      case BookingChargeType.RESERVATION_FEE:
        return 'Reservation Fee';
      case BookingChargeType.ADVANCE_PAYMENT:
        return 'Advance Payment';
      case BookingChargeType.DEPOSIT:
        return 'Security Deposit';
      case BookingChargeType.EXTENSION_PAYMENT:
        return 'Extension Payment';
      default:
        return 'Booking Charge';
    }
  }
}
