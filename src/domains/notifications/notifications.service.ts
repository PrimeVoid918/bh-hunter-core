import { Inject, Injectable } from '@nestjs/common';
import { IDatabaseService } from 'src/infrastructure/database/database.interface';
import { CreateNotificationsDto } from './dto/create-notifications.dto';
import { Prisma, UserRole } from '@prisma/client';
import { QueryNotificationsDto } from './dto/query-notifications.dto';

@Injectable()
export class NotificationsService {
  constructor(
    @Inject('IDatabaseService') private readonly database: IDatabaseService,
  ) {}

  private get prisma() {
    return this.database.getClient();
  }

  async findAll(
    userId: number,
    role: UserRole,
    filters: QueryNotificationsDto,
  ) {
    const where: Prisma.NotificationWhereInput = {
      recipientId: userId,
      recipientRole: role,
      isDeleted: false,
    };

    if (filters.isRead !== undefined) {
      where.isRead = filters.isRead;
    }

    if (filters.resourceType) {
      where.entityType = filters.resourceType;
    }

    if (filters.type) {
      where.type = filters.type;
    }

    return this.prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: filters.limit ?? 20,
      skip: ((filters.page ?? 1) - 1) * (filters.limit ?? 20),
    });
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

  async markAllAsRead(userId: number, role: UserRole) {
    return this.prisma.notification.updateMany({
      where: {
        recipientId: userId,
        recipientRole: role,
        isRead: false,
        isDeleted: false,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });
  }

  async remove() {}
}
