import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { BookingsService } from 'src/domains/bookings/bookings.service';

@Injectable()
export class MaintenanceService {
  private readonly logger = new Logger(MaintenanceService.name);

  constructor(private readonly bookingsService: BookingsService) {}

  @Cron(CronExpression.EVERY_5_MINUTES)
  async handleExpiredBookings() {
    this.logger.log('Checking expired unpaid bookings...');

    const count = await this.bookingsService.cancelExpiredBookings();

    this.logger.log(`Cancelled ${count} expired bookings`);
  }
}
