import { Module } from '@nestjs/common';
import { ImageService } from './image.service';
import { SharedModule } from '../shared/shared.module';
import { MediaPathBuilderUtil } from '../shared/utils/media-path-builder.util';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [SharedModule, ConfigModule],
  providers: [ImageService, MediaPathBuilderUtil],
  exports: [ImageService, MediaPathBuilderUtil],
})
export class ImageModule {}
