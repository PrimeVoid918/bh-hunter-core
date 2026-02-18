import { Module } from '@nestjs/common';
import { AdminsService } from './admins.service';
import { AdminsController } from './admins.controller';
import { TenantsModule } from '../tenants/tenants.module';
import { OwnersModule } from '../owners/owners.module';
import { AdminsPublisher } from './events/admins.publisher';

@Module({
  imports: [TenantsModule, OwnersModule],
  controllers: [AdminsController],
  providers: [AdminsService, AdminsPublisher],
  exports: [AdminsService],
})
export class AdminsModule {}
