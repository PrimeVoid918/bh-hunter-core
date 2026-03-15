import { Module } from '@nestjs/common';
import { AccountsPublisher } from './accounts.publisher';

@Module({
  providers: [AccountsPublisher],
  exports: [AccountsPublisher], // 👈 important if other modules will inject this
})
export class AccountsModule {}
