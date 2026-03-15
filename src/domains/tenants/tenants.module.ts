import { Module } from '@nestjs/common';
import { TenantsService } from './tenants.service';
import { TenantsController } from './tenants.controller';
import { ImageModule } from 'src/infrastructure/image/image.module';
import { VerificationModule } from '../verifications/verification.module';
import { SharedModule } from 'src/infrastructure/shared/shared.module';
import { AccountsModule } from '../accounts/accounts.module';
import { AdminsModule } from '../admins/admins.module';
import { DocumentModule } from 'src/infrastructure/document/document.module';
import { AuthModule } from '../auth/auth.module';
import { OwnersModule } from '../owners/owners.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { Logger } from 'src/common/logger/logger.service';

@Module({
  imports: [
    VerificationModule,
    ImageModule,
    SharedModule,
    AccountsModule,
    AdminsModule,
    TenantsModule,
    VerificationModule,
    DocumentModule,
    AuthModule,
    OwnersModule,
    SubscriptionsModule,
  ],
  controllers: [TenantsController],
  providers: [TenantsService, Logger],
  exports: [TenantsService],
})
export class TenantsModule {}
