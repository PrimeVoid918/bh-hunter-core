import { forwardRef, Module } from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { BookingsController } from './bookings.controller';
import { BookingEventPublisher } from './events/bookings.publisher';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { AuthModule } from '../auth/auth.module';
import { ImageModule } from 'src/infrastructure/image/image.module';
import { TenantsModule } from '../tenants/tenants.module';
import { OwnersModule } from '../owners/owners.module';
import { AdminsModule } from '../admins/admins.module';
import { VerificationModule } from '../verifications/verification.module';
import { PaymentsModule } from '../payments/payments.module';
import { DocumentModule } from 'src/infrastructure/document/document.module';
import { SocketModule } from 'src/infrastructure/sockets/sockets.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { AccountsModule } from '../accounts/accounts.module';
import { SharedModule } from 'src/infrastructure/shared/shared.module';
import { RefundPolicy } from './refund.policy';
import { Logger } from 'src/common/logger/logger.service';
import { AgreementsModule } from '../agreements/agreements.module';
import { AgreementsService } from '../agreements/agreements.service';

@Module({
  imports: [
    forwardRef(() => SubscriptionsModule),
    AuthModule,
    ImageModule,
    TenantsModule,
    OwnersModule,
    AdminsModule,
    VerificationModule,
    PaymentsModule,
    DocumentModule,
    SocketModule,
    NotificationsModule,
    AccountsModule,
    SharedModule,
    AgreementsModule,
  ],
  controllers: [BookingsController],
  providers: [
    BookingEventPublisher,
    BookingsService,
    RefundPolicy,
    Logger,
    AgreementsService,
  ],
  exports: [BookingsService, BookingEventPublisher],
})
export class BookingsModule {}
