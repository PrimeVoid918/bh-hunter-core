import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  VerificationApprovePayload,
  VERIFICATIONE_EVENTS,
  VerificationRejectPayload,
} from './admins.events';

@Injectable()
export class AdminsPublisher {
  constructor(private readonly emiiter: EventEmitter2) {}

  approve(payload: VerificationApprovePayload) {
    this.emiiter.emit(
      VERIFICATIONE_EVENTS.VERIFICATION_DOCUMENT_APPROVED,
      payload,
    );
  }

  reject(payload: VerificationRejectPayload) {
    this.emiiter.emit(
      VERIFICATIONE_EVENTS.VERIFICATION_DOCUMENT_REJECTED,
      payload,
    );
  }
}
