import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from 'src/infrastructure/database/prisma.service';
import { BookingStatus } from '@prisma/client';

@Injectable()
export class BookingCron {
  private readonly logger = new Logger(BookingCron.name);

  constructor(private readonly prisma: PrismaService) {}

  @Cron(CronExpression.EVERY_10_MINUTES)
  async releaseEndedBookingSlots() {
    const now = new Date();

    const expiredBookings = await this.prisma.booking.findMany({
      where: {
        status: BookingStatus.COMPLETED_BOOKING,
        checkOutDate: { lte: now },
        occupancyReleased: false,
        isDeleted: false,
      },
      include: {
        room: true,
      },
    });

    if (!expiredBookings.length) return;

    for (const booking of expiredBookings) {
      try {
        await this.prisma.$transaction(async (tx) => {
          const room = await tx.room.findUnique({
            where: { id: booking.roomId },
          });

          if (!room) return;

          const nextCapacity = Math.max(
            room.currentCapacity - (booking.occupantsCount || 1),
            0,
          );

          const nextAvailability = nextCapacity < room.maxCapacity;

          await tx.room.update({
            where: { id: room.id },
            data: {
              currentCapacity: nextCapacity,
              availabilityStatus: nextAvailability,
            },
          });

          await tx.roomAvailabilityLog.create({
            data: {
              roomId: room.id,
              status: nextAvailability,
              reason: `Auto-release after booking ${booking.reference} checkout`,
            },
          });

          await tx.booking.update({
            where: { id: booking.id },
            data: {
              occupancyReleased: true,
              occupancyReleasedAt: now,
            },
          });
        });

        this.logger.log(
          `Released occupancy for booking ${booking.reference} (room ${booking.roomId})`,
        );
      } catch (error) {
        this.logger.error(
          `Failed releasing booking ${booking.reference}`,
          error instanceof Error ? error.stack : String(error),
        );
      }
    }
  }
}
