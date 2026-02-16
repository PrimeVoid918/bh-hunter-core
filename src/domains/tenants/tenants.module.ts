import { Module } from '@nestjs/common';
import { TenantsService } from './tenants.service';
import { TenantsController } from './tenants.controller';
import { ImageModule } from 'src/infrastructure/image/image.module';
import { VerifcationModule } from '../verifications/verification.module';
import { VerifcationService } from '../verifications/verification.service';
import { DocumentService } from 'src/infrastructure/document/document.service';
import { MediaPathBuilderUtil } from 'src/infrastructure/shared/utils/media-path-builder.util';
import { FileOpsUtils } from 'src/infrastructure/shared/utils/file-ops.utls';
import { Logger } from 'src/common/logger/logger.service';
import { AuthService } from '../auth/auth.service';
import { UserUnionService } from '../auth/userUnion.service';
import { CryptoService } from '../auth/utilities/crypto.service';
import { JwtService } from '@nestjs/jwt';
import { AdminsService } from '../admins/admins.service';
import { OwnersService } from '../owners/owners.service';

@Module({
  imports: [VerifcationModule, ImageModule],
  controllers: [TenantsController],
  providers: [
    TenantsService,
    VerifcationService,
    DocumentService,
    MediaPathBuilderUtil,
    FileOpsUtils,
    { provide: 'BASE_DIR', useValue: 'media' },
    Logger,
    AuthService,
    UserUnionService,
    CryptoService,
    JwtService,
    AdminsService,
    OwnersService,
  ],
  exports: [TenantsService],
})
export class TenantsModule {}
