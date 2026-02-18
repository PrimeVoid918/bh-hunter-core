import { IsBoolean, IsEnum, IsInt, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { NotificationType, ResourceType } from '@prisma/client';

export class QueryNotificationsDto {
  @IsBoolean()
  @IsOptional()
  @Type(() => Boolean)
  isRead?: boolean;

  @IsEnum(ResourceType)
  @IsOptional()
  resourceType?: ResourceType;

  @IsEnum(NotificationType)
  @IsOptional()
  type?: NotificationType;

  @IsInt()
  @IsOptional()
  @Type(() => Number)
  page?: number;

  @IsInt()
  @IsOptional()
  @Type(() => Number)
  limit?: number;
}
