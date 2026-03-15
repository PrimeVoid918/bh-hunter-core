import { Module, Global } from '@nestjs/common';
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
import { SubscriptionsService } from 'src/domains/subscriptions/subscriptions.service';
import { AccountsModule } from 'src/domains/accounts/accounts.module';
import { AuthModule } from 'src/domains/auth/auth.module';
import { TenantsModule } from 'src/domains/tenants/tenants.module';
import { OwnersModule } from 'src/domains/owners/owners.module';
import { AdminsModule } from 'src/domains/admins/admins.module';
import { ImageModule } from '../image/image.module';
import { VerificationModule } from 'src/domains/verifications/verification.module';
import { DocumentModule } from '../document/document.module';
import { SubscriptionsModule } from 'src/domains/subscriptions/subscriptions.module';

@Global()
@Module({
  imports: [
    JwtModule.register({}),
    AccountsModule,
    AuthModule,
    TenantsModule,
    OwnersModule,
    AdminsModule,
    ImageModule,
    VerificationModule,
    DocumentModule,
    AdminsModule,
    SubscriptionsModule,
  ],
  providers: [
    GameGateway,
    RpsService,
    SocketGateway,
    { provide: APP_GUARD, useClass: WsAuthGuard },
  ],
  exports: [GameGateway, RpsService, SocketGateway],
})
export class SocketModule {}
