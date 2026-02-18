import { Module } from '@nestjs/common';
import { OwnersService } from './owners.service';
import { OwnersController } from './owners.controller';
import { VerificationModule } from 'src/domains/verifications/verification.module';
import { VerifcationService } from 'src/domains/verifications/verification.service';
import { DocumentModule } from 'src/infrastructure/document/document.module';
import { DocumentService } from 'src/infrastructure/document/document.service';
import { MediaPathBuilderUtil } from 'src/infrastructure/shared/utils/media-path-builder.util';
import { FileOpsUtils } from 'src/infrastructure/shared/utils/file-ops.utls';
import { Logger } from 'src/common/logger/logger.service';
import { AuthService } from '../auth/auth.service';
import { UserUnionService } from '../auth/userUnion.service';
import { CryptoService } from '../auth/utilities/crypto.service';
import { JwtService } from '@nestjs/jwt';
import { TenantsService } from '../tenants/tenants.service';
import { AdminsService } from '../admins/admins.service';
import { ImageService } from 'src/infrastructure/image/image.service';
import { AdminsPublisher } from '../admins/events/admins.publisher';
import { AccountsPublisher } from '../accounts/accounts.publisher';

@Module({
  imports: [VerificationModule, DocumentModule],
  controllers: [OwnersController],
  providers: [
    AccountsPublisher,
    AdminsPublisher,
    OwnersService,
    VerifcationService,
    DocumentService,
    MediaPathBuilderUtil,
    FileOpsUtils,
    {
      provide: 'BASE_DIR',
      useValue: 'media', // or your base directory path
    },
    Logger,
    AuthService,
    UserUnionService,
    CryptoService,
    JwtService,
    TenantsService,
    AdminsService,
    ImageService,
  ],
  exports: [OwnersService],
})
export class OwnersModule {}
