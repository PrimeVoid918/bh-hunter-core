import { AppController } from './app.controller';
import { DatabaseModule } from './infrastructure/database/database.module';
import { TenantsModule } from './domains/tenants/tenants.module';
import { ServeStaticModule } from '@nestjs/serve-static';

import { APP_INTERCEPTOR } from '@nestjs/core';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';

import { join } from 'path';
import { AuthModule } from './domains/auth/auth.module';
import { OwnersModule } from './domains/owners/owners.module';
import { ImageModule } from './infrastructure/image/image.module';
import { AdminsModule } from './domains/admins/admins.module';
import { BoardingHousesModule } from './domains/boarding-houses/boarding-houses.module';
import { DocumentModule } from './infrastructure/document/document.module';
import { LoggingMiddleware } from './forNowMiddleware';
import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { BookingsModule } from './domains/bookings/bookings.module';
import { LocationModule } from './domains/location/location.module';
import { RoomsModule } from './domains/rooms/rooms.module';
import { SharedModule } from './infrastructure/shared/shared.module';
import { ConfigModule } from './config/config.module';
import { ConfigService } from './config/config.service';
import { MaintenanceModule } from './infrastructure/maintenance/maintenance.module';
import { ScheduleModule } from '@nestjs/schedule';
import { Logger } from './common/logger/logger.service';
import { MapsModule } from './domains/maps/maps.module';
import { SocketModule } from './infrastructure/sockets/sockets.module';
import { ReviewsModule } from './domains/reviews/reviews.module';
import { PaymentsModule } from './domains/payments/payments.module';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { NotificationsModule } from './domains/notifications/notifications.module';
import { AccountsModule } from './domains/accounts/accounts.module';

@Module({
  imports: [
    ConfigModule,
    ServeStaticModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => [
        {
          rootPath: join(__dirname, '..', configService.mediaPaths.public),
          serveRoot: configService.mediaPaths.public,
        },
      ],
    }),
    EventEmitterModule.forRoot({
      wildcard: false,
      verboseMemoryLeak: true, // optional: logs when listeners are not fired
    }),
    ScheduleModule.forRoot(),
    MaintenanceModule,
    TenantsModule,
    DatabaseModule,
    AuthModule,
    OwnersModule,
    ImageModule,
    AdminsModule,
    BoardingHousesModule,
    DocumentModule,
    BookingsModule,
    LocationModule,
    RoomsModule,
    SharedModule,
    MapsModule,
    SocketModule,
    ReviewsModule,
    PaymentsModule,
    NotificationsModule,
    AccountsModule,
  ],
  controllers: [AppController],
  providers: [
    Logger,
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseInterceptor,
    },
  ],
  exports: [Logger],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggingMiddleware).forRoutes('*'); // apply to all routes
  }
}
