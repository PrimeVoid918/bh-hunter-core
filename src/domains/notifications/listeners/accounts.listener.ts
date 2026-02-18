import { Injectable } from '@nestjs/common';
import { NotificationsService } from '../notifications.service';
import { NotificationEmitter } from '../../../infrastructure/sockets/notification/notificatoin-emiiter.service';
import { OnEvent } from '@nestjs/event-emitter';
import {
  ACCOUNT_EVENTS,
  AccountsFullyVerifiedPayload,
  AccountsSetupRequiredPayload,
} from 'src/domains/accounts/accounts.events';
import { NotificationType, ResourceType } from '@prisma/client';

@Injectable()
export class AccountsListener {
  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly notificationEmitter: NotificationEmitter,
  ) {}

  @OnEvent(ACCOUNT_EVENTS.ACCOUNT_SETUP_REQUIRED)
  async handleAccountSetupRequired(payload: AccountsSetupRequiredPayload) {
    const notification = await this.notificationsService.create({
      recipientId: payload.id,
      recipientRole: payload.userRole,

      type: NotificationType.ACCOUNT_SETUP_REQUIRED,
      title: 'Complete your account setup',
      message:
        'Complete your profile and submit the required documents to unlock full access.',

      entityId: payload.id,
      entityType: ResourceType.OWNER,

      data: {
        ...payload.data,
      },
    });
  }

  @OnEvent(ACCOUNT_EVENTS.ACCOUNT_FULLY_VERIFIED)
  async handleAccountFullyVerified(payload: AccountsFullyVerifiedPayload) {
    const notification = await this.notificationsService.create({
      recipientId: payload.id,
      recipientRole: payload.userRole,

      type: NotificationType.ACCOUNT_FULLY_VERIFIED,
      title: 'Your account is fully verified',
      message: 'You now have full access to all platform features.',

      entityId: payload.id,
      entityType: payload.resourceType,

      data: {
        ...payload.data,
      },
    });
  }
}
