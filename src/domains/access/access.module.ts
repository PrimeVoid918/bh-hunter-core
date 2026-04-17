import { Module } from '@nestjs/common';
import { AccessService } from './access.service';
import { AccessController } from './access.controller';
import { TenantPolicy } from './policies/tenant-policy.service';
import { OwnerPolicy } from './policies/owner-policy.service';
import { AuthModule } from '../auth/auth.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';

@Module({
  imports: [AuthModule, SubscriptionsModule],
  controllers: [AccessController],
  providers: [AccessService, TenantPolicy, OwnerPolicy],
  // exports:
})
export class AccessModule {}
