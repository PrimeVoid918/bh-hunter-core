import { Module } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { BookingListener } from './listeners/bookings.listener';
import { NotificationEmitter } from 'src/infrastructure/sockets/notification/notificatoin-emiiter.service';
import { SocketGateway } from 'src/infrastructure/sockets/sockets.gateway';
import { NotificationGateway } from 'src/infrastructure/sockets/notification/notification.gateway';
import { JwtService } from '@nestjs/jwt';
import { UserUnionService } from '../auth/userUnion.service';
import { AdminsService } from '../admins/admins.service';
import { OwnersService } from '../owners/owners.service';
import { TenantsService } from '../tenants/tenants.service';
import { VerifcationService } from 'src/domains/verifications/verification.service';
import { AuthService } from '../auth/auth.service';
import { Logger } from 'src/common/logger/logger.service';
import { ImageService } from 'src/infrastructure/image/image.service';
import { DocumentService } from 'src/infrastructure/document/document.service';
import { MediaPathBuilderUtil } from 'src/infrastructure/shared/utils/media-path-builder.util';
import { FileOpsUtils } from 'src/infrastructure/shared/utils/file-ops.utls';
import { CryptoService } from '../auth/utilities/crypto.service';
import { NotificationsController } from './notifications.controller';
import { AdminsPublisher } from '../admins/events/admins.publisher';
import { VerificationListener } from './listeners/verification.listener';
import { AccountsPublisher } from '../accounts/accounts.publisher';
import { AccountsListener } from './listeners/accounts.listener';

@Module({
  imports: [],
  controllers: [NotificationsController],
  providers: [
    AccountsPublisher,
    AccountsListener,
    VerificationListener,
    NotificationsService,
    NotificationEmitter,
    BookingListener,
    SocketGateway,
    NotificationGateway,
    JwtService,
    UserUnionService,
    AdminsService,
    OwnersService,
    TenantsService,
    VerifcationService,
    AuthService,
    Logger,
    ImageService,
    DocumentService,
    MediaPathBuilderUtil,
    FileOpsUtils,
    CryptoService,
    AdminsPublisher,
    {
      provide: 'BASE_DIR',
      useValue: 'media', // or your base directory path
    },
  ],
  exports: [NotificationsService, NotificationEmitter],
})
export class NotificationsModule {}
