import {
  IsBoolean,
  IsDate,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsObject,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  NotificationChannel,
  NotificationType,
  ResourceType,
  UserRole,
} from '@prisma/client';

export class CreateNotificationsDto {
  @IsEnum(UserRole)
  recipientRole!: UserRole;

  @IsInt()
  recipientId!: number;

  @IsEnum(NotificationType)
  type!: NotificationType;

  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsString()
  @IsNotEmpty()
  message!: string;

  @IsEnum(ResourceType)
  entityType!: ResourceType;

  @IsInt()
  entityId!: number;

  // -------- Optional fields --------

  @IsOptional()
  @IsObject()
  data?: Record<string, any>;

  @IsOptional()
  @IsEnum(NotificationChannel)
  channel?: NotificationChannel;

  @IsOptional()
  @IsBoolean()
  isRead?: boolean;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  readAt?: Date;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  expiresAt?: Date;

  @IsOptional()
  @IsBoolean()
  isDeleted?: boolean;
}
