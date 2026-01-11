import { Module } from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { BookingsController } from './bookings.controller';
import { UserUnionService } from '../auth/userUnion.service';
import { ImageService } from 'src/infrastructure/image/image.service';
import { TenantsService } from '../tenants/tenants.service';
import { OwnersService } from '../owners/owners.service';
import { AdminsService } from '../admins/admins.service';
import { FileOpsUtils } from 'src/infrastructure/shared/utils/file-ops.utls';
import { MediaPathBuilderUtil } from 'src/infrastructure/shared/utils/media-path-builder.util';
import { VerifcationService } from 'src/domains/verifications/verification.service';
import { Logger } from 'src/common/logger/logger.service';
import { DocumentService } from 'src/infrastructure/document/document.service';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Module({
  controllers: [BookingsController],
  providers: [
    BookingsService,
    UserUnionService,
    ImageService,
    TenantsService,
    OwnersService,
    AdminsService,
    FileOpsUtils,
    MediaPathBuilderUtil,
    VerifcationService,
    Logger,
    {
      provide: 'BASE_DIR',
      useValue: 'media', // or your base directory path
    },
    DocumentService,
    EventEmitter2,
  ],
})
export class BookingsModule {}
