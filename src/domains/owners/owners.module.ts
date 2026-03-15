import { forwardRef, Module } from '@nestjs/common';
import { OwnersService } from './owners.service';
import { OwnersController } from './owners.controller';
import { VerificationModule } from 'src/domains/verifications/verification.module';
import { DocumentModule } from 'src/infrastructure/document/document.module';
import { TenantsModule } from '../tenants/tenants.module';
import { AdminsModule } from '../admins/admins.module';
import { AuthModule } from '../auth/auth.module';
import { SharedModule } from 'src/infrastructure/shared/shared.module';
import { AccountsModule } from '../accounts/accounts.module';
import { ImageModule } from 'src/infrastructure/image/image.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { Logger } from 'src/common/logger/logger.service';

@Module({
  imports: [
    forwardRef(() => AdminsModule),
    forwardRef(() => TenantsModule),
    VerificationModule,
    DocumentModule,
    AuthModule,
    SharedModule,
    AccountsModule,
    VerificationModule,
    DocumentModule,
    ImageModule,
    SubscriptionsModule,
  ],
  controllers: [OwnersController],
  providers: [OwnersService, Logger],
  exports: [OwnersService],
})
export class OwnersModule {}
