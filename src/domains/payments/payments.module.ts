import { Module } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { ConfigModule } from '@nestjs/config';
import { PaymongoService } from './strategies/paymongo/paymongo.service';

@Module({
  imports: [ConfigModule],
  controllers: [PaymentsController],
  providers: [PaymentsService, PaymongoService],
  exports: [PaymentsService],
})
export class PaymentsModule {}
