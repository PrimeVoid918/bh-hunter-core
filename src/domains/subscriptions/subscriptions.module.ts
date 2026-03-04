import { Module } from '@nestjs/common';
import { SubscriptionsService } from './subscriptions.service';
import { SubscriptionsController } from './subscriptions.controller';
import { PaymentsService } from '../payments/payments.service';
import { PaymongoService } from '../payments/strategies/paymongo/paymongo.service';
import { BookingEventPublisher } from '../bookings/events/bookings.publisher';

@Module({
  controllers: [SubscriptionsController],
  providers: [
    SubscriptionsService,
    PaymentsService,
    BookingEventPublisher,
    {
      provide: 'PAYMENT_PROVIDER',
      useClass: PaymongoService,
    },
  ],
})
export class SubscriptionsModule {}
