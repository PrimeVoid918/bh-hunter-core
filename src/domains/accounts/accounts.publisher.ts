import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  ACCOUNT_EVENTS,
  AccountsFullyVerifiedPayload,
  AccountsSetupRequiredPayload,
} from './accounts.events';

@Injectable()
export class AccountsPublisher {
  constructor(private readonly emitter: EventEmitter2) {}

  setupRequired(payload: AccountsSetupRequiredPayload) {
    this.emitter.emit(ACCOUNT_EVENTS.ACCOUNT_SETUP_REQUIRED, payload);
  }

  fullyVerified(payload: AccountsFullyVerifiedPayload) {
    this.emitter.emit(ACCOUNT_EVENTS.ACCOUNT_FULLY_VERIFIED, payload);
  }
}
