// src/infrastructure/socket/socket.module.ts
import { Module, Global } from '@nestjs/common';
// import { NotificationsGateway } from './sockets.module';
import { JwtModule } from '@nestjs/jwt'; // You'll likely need this for auth later
import { GameGateway } from './game.gateway';
import { RpsService } from 'src/domains/games/rps.service';
import { SocketGateway } from './sockets.gateway';
import { APP_GUARD } from '@nestjs/core';
import { WsAuthGuard } from './guards/ws-auth.guard';
import { UserUnionService } from 'src/domains/auth/userUnion.service';
import { TenantsService } from 'src/domains/tenants/tenants.service';
import { AdminsService } from 'src/domains/admins/admins.service';
import { OwnersService } from 'src/domains/owners/owners.service';
import { ImageService } from '../image/image.service';
import { VerifcationService } from 'src/domains/verifications/verification.service';
import { Logger } from 'src/common/logger/logger.service';
import { FileOpsUtils } from '../shared/utils/file-ops.utls';
import { MediaPathBuilderUtil } from '../shared/utils/media-path-builder.util';
import { DocumentService } from '../document/document.service';
import { AuthService } from 'src/domains/auth/auth.service';
import { CryptoService } from 'src/domains/auth/utilities/crypto.service';
import { AdminsPublisher } from 'src/domains/admins/events/admins.publisher';
import { AccountsPublisher } from 'src/domains/accounts/accounts.publisher';

@Global() // Making it global allows any domain to inject the Gateway easily
@Module({
  imports: [JwtModule.register({})],
  providers: [
    AccountsPublisher,
    GameGateway,
    UserUnionService,
    TenantsService,
    AdminsService,
    OwnersService,
    ImageService,
    VerifcationService,
    Logger,
    FileOpsUtils,
    MediaPathBuilderUtil,
    DocumentService,
    RpsService,
    SocketGateway,
    AuthService,
    CryptoService,
    AdminsPublisher,
    {
      provide: 'BASE_DIR',
      useValue: 'media', // or your base directory path
    },
    { provide: APP_GUARD, useClass: WsAuthGuard },
  ],
  exports: [GameGateway], // Export it so other modules can use 'sendNotification'
})
export class SocketModule {}
