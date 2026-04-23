import { forwardRef, Module } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { ConfigModule } from '@nestjs/config';
import { PaymongoService } from './strategies/paymongo/paymongo.service';
import { BookingEventPublisher } from '../bookings/events/bookings.publisher';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { AgreementsService } from '../agreements/agreements.service';

@Module({
  imports: [ConfigModule, forwardRef(() => SubscriptionsModule)],
  controllers: [PaymentsController],
  providers: [
    PaymentsService,
    BookingEventPublisher,
    {
      provide: 'PAYMENT_PROVIDER',
      useClass: PaymongoService,
    },
    AgreementsService,
  ],
  exports: [PaymentsService, PaymentsService, BookingEventPublisher],
})
export class PaymentsModule {}
