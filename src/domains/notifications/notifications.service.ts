import { Inject, Injectable } from '@nestjs/common';
import { IDatabaseService } from 'src/infrastructure/database/database.interface';
import { CreateNotificationsDto } from './dto/create-notifications.dto';
import { UserRole } from '@prisma/client';

@Injectable()
export class NotificationsService {
  constructor(
    @Inject('IDatabaseService') private readonly database: IDatabaseService,
  ) {}

  private get prisma() {
    return this.database.getClient();
  }

  async create(data: CreateNotificationsDto) {
    const {
      entityId,
      entityType,
      message,
      recipientId,
      recipientRole,
      type,
      title,
      ...optionalFields
    } = data;

    return this.prisma.notification.create({
      data: {
        entityId,
        entityType,
        message,
        recipientId,
        recipientRole,
        type,
        title,
        ...optionalFields,
      },
    });
  }

  async getForRecipient(recipientRole: UserRole, recipientId: number) {
    return this.prisma.notification.findMany({
      where: {
        recipientRole,
        recipientId,
        isDeleted: false,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async markAsRead(params: {
    notificationId: number;
    recipientRole: UserRole;
    recipientId: number;
  }) {
    const { notificationId, recipientRole, recipientId } = params;

    return this.prisma.notification.updateMany({
      where: {
        id: notificationId,
        recipientRole,
        recipientId,
        isRead: false,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });
  }
}
