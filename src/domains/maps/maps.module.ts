import { Module } from '@nestjs/common';
import { MapsService } from './maps.service';
import { MapsController } from './maps.controller';
import { ImageService } from 'src/infrastructure/image/image.service';
import { FileOpsUtils } from 'src/infrastructure/shared/utils/file-ops.utls';
import { MediaPathBuilderUtil } from 'src/infrastructure/shared/utils/media-path-builder.util';

@Module({
  controllers: [MapsController],
  providers: [
    MapsService,
    ImageService,
    FileOpsUtils,
    MediaPathBuilderUtil,
    {
      provide: 'BASE_DIR',
      useValue: 'media', // or your base directory path
    },
  ],
})
export class MapsModule {}
