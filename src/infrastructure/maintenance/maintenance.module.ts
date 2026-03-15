import { Module } from '@nestjs/common';
import { MaintenanceService } from './maintenance.service';
import { CleanupService } from './cleanup.service';
import { PrismaService } from '../database/prisma.service';
import { SharedModule } from '../shared/shared.module';
import { SubscriptionsModule } from 'src/domains/subscriptions/subscriptions.module';
import { PaymentsModule } from 'src/domains/payments/payments.module';
import { BookingsModule } from 'src/domains/bookings/bookings.module';

@Module({
  imports: [SharedModule, SubscriptionsModule, PaymentsModule, BookingsModule],
  providers: [MaintenanceService, CleanupService, PrismaService],
})
export class MaintenanceModule {}
