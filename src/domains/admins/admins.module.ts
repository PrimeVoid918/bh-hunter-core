import { forwardRef, Module } from '@nestjs/common';
import { AdminsService } from './admins.service';
import { AdminsController } from './admins.controller';
import { TenantsModule } from '../tenants/tenants.module';
import { OwnersModule } from '../owners/owners.module';
import { AdminsPublisher } from './events/admins.publisher';
import { AdminTransactionsService } from './admin-transactions.service';

@Module({
  imports: [forwardRef(() => TenantsModule), forwardRef(() => OwnersModule)],
  controllers: [AdminsController],
  providers: [AdminsService, AdminsPublisher, AdminTransactionsService],
  exports: [AdminsService, AdminsPublisher],
})
export class AdminsModule {}
