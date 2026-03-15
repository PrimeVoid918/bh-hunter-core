import { Module } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { BookingListener } from './listeners/bookings.listener';
import { NotificationsController } from './notifications.controller';
import { VerificationListener } from './listeners/verification.listener';
import { AccountsListener } from './listeners/accounts.listener';
import { SocketModule } from 'src/infrastructure/sockets/sockets.module';
import { AdminsModule } from '../admins/admins.module';
import { TenantsModule } from '../tenants/tenants.module';
import { OwnersModule } from '../owners/owners.module';
import { VerificationModule } from '../verifications/verification.module';
import { AuthModule } from '../auth/auth.module';
import { AccountsModule } from '../accounts/accounts.module';
import { ImageModule } from 'src/infrastructure/image/image.module';
import { DocumentModule } from 'src/infrastructure/document/document.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { SharedModule } from 'src/infrastructure/shared/shared.module';
import { NotificationEmitter } from '../../infrastructure/sockets/notification/notificatoin-emiiter.service';
import { NotificationGateway } from 'src/infrastructure/sockets/notification/notification.gateway';

@Module({
  imports: [
    SocketModule,
    AdminsModule,
    TenantsModule,
    OwnersModule,
    VerificationModule,
    AuthModule,
    AccountsModule,
    ImageModule,
    DocumentModule,
    SubscriptionsModule,
    SharedModule,
  ],
  controllers: [NotificationsController],
  providers: [
    AccountsListener,
    VerificationListener,
    NotificationsService,
    BookingListener,
    NotificationEmitter,
    NotificationGateway,
  ],
  exports: [
    AccountsListener,
    VerificationListener,
    NotificationsService,
    BookingListener,
    NotificationEmitter,
    NotificationGateway,
  ],
})
export class NotificationsModule {}
