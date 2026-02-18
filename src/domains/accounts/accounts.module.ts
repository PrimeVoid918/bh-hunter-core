import { Module } from '@nestjs/common';
import { AccountsPublisher } from './accounts.publisher';

@Module({
  providers: [AccountsPublisher],
})
export class AccountsModule {}
