import { Injectable } from '@nestjs/common';
import { NotificationsService } from '../notifications.service';
import { NotificationEmitter } from '../../../infrastructure/sockets/notification/notificatoin-emiiter.service';
import { OnEvent } from '@nestjs/event-emitter';
import {
  VerificationApprovePayload,
  VERIFICATIONE_EVENTS,
  VerificationRejectPayload,
} from 'src/domains/admins/events/admins.events';
import { NotificationType, ResourceType } from '@prisma/client';

@Injectable()
export class VerificationListener {
  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly notificationEmitter: NotificationEmitter,
  ) {}

  @OnEvent(VERIFICATIONE_EVENTS.VERIFICATION_DOCUMENT_APPROVED)
  async handleVerificationDocumentApproved(
    payload: VerificationApprovePayload,
  ) {
    const notification = await this.notificationsService.create({
      recipientId: payload.userId,
      recipientRole: payload.data.userRole,

      type: NotificationType.VERIFICATION_DOCUMENT_APPROVED,
      title: 'Verification Document was approved.',
      message: 'Your Verification Document was approved.',

      entityId: payload.userId,
      entityType: ResourceType.VERIFICATION,

      data: {
        ...payload.data,
      },
    });
  }

  @OnEvent(VERIFICATIONE_EVENTS.VERIFICATION_DOCUMENT_REJECTED)
  async handleVerificationDocumentReject(payload: VerificationRejectPayload) {
    const notification = await this.notificationsService.create({
      recipientId: payload.userId,
      recipientRole: payload.data.userRole,

      type: NotificationType.VERIFICATION_DOCUMENT_REJECTED,
      title: 'Verification Document was rejected.',
      message: 'Your Verification Document was rejected.',

      entityId: payload.userId,
      entityType: ResourceType.VERIFICATION,

      data: {
        ...payload.data,
      },
    });
  }
}
