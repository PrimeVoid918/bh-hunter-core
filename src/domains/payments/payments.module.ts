import { Module } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { ConfigModule } from '@nestjs/config';
import { PaymongoService } from './strategies/paymongo/paymongo.service';
import { BookingEventPublisher } from '../bookings/events/bookings.publisher';

@Module({
  imports: [ConfigModule],
  controllers: [PaymentsController],
  providers: [
    PaymentsService,
    PaymongoService,
    BookingEventPublisher,
    {
      provide: 'PAYMENT_PROVIDER',
      useClass: PaymongoService,
    },
  ],
  exports: [PaymentsService],
})
export class PaymentsModule {}
