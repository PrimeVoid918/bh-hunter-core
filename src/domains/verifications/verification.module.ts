import { Module } from '@nestjs/common';
import { VerifcationService } from './verification.service';
import { DocumentModule } from '../../infrastructure/document/document.module';
import { SharedModule } from 'src/infrastructure/shared/shared.module';
import { Logger } from 'src/common/logger/logger.service';

@Module({
  imports: [DocumentModule, SharedModule],
  providers: [VerifcationService, Logger],
  exports: [VerifcationService],
})
export class VerificationModule {}
