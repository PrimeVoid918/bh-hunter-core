import { Module } from '@nestjs/common';
import { DocumentService } from './document.service';
import { FileOpsUtils } from '../shared/utils/file-ops.utls';
import { MediaPathBuilderUtil } from '../shared/utils/media-path-builder.util';

@Module({
  imports: [],
  providers: [
    DocumentService,
    FileOpsUtils,
    MediaPathBuilderUtil,
    {
      provide: 'BASE_DIR',
      useValue: 'media', // or your base directory path
    },
  ],
  exports: ['BASE_DIR', DocumentService, FileOpsUtils, MediaPathBuilderUtil],
})
export class DocumentModule {}
