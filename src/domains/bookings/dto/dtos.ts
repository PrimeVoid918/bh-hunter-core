import {
  IsString,
  IsNumber,
  IsOptional,
  IsDate,
  IsEnum,
  ValidateIf,
  IsInt,
} from 'class-validator';

import { BookingStatus, BookingType } from '@prisma/client';
import { Type } from 'class-transformer';

/**
 * TENANT — Create Booking DTO
 * Requires tenantId (for now from body since no guard)
 */
export class CreateBookingDto {
  @IsNumber()
  tenantId!: number;

  @Type(() => Date)
  @IsDate()
  startDate!: Date; // Change the type to Date

  @Type(() => Date)
  @IsDate()
  endDate!: Date; // Change the type to Date

  @IsOptional()
  @IsString()
  note?: string;
}

/**
 * Generic filter for GET /bookings
 */
export class FindAllBookingFilterDto {
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  tenantId?: number;

  @Type(() => Number)
  @IsOptional()
  @IsInt()
  ownerId?: number;

  @Type(() => Number)
  @IsOptional()
  @IsInt()
  roomId?: number;

  @Type(() => Number)
  @IsOptional()
  @IsInt()
  bookId?: number;

  @Type(() => Number)
  @IsOptional()
  @IsInt()
  boardingHouseId?: number; // optional if you're joining Room → BoardingHouse later

  @IsOptional()
  @IsEnum(BookingStatus)
  status?: BookingStatus;

  @IsOptional()
  @IsEnum(BookingType)
  bookingType?: BookingType;

  @ValidateIf((o) => o.fromCheckIn || o.toCheckIn)
  @IsDate()
  fromCheckIn?: Date;

  @ValidateIf((o) => o.fromCheckIn || o.toCheckIn)
  @IsDate()
  toCheckIn?: Date;

  @Type(() => Number)
  @IsOptional()
  @IsNumber()
  page?: number = 1;

  @Type(() => Number)
  @IsOptional()
  @IsNumber()
  limit?: number = 10;
}

/**
 * Find One booking DTO
 */
export class FindOneBookingDto {
  @IsNumber()
  requesterId!: number; // tenant or owner who requests
}

/**
 * TENANT — Patch booking (update/cancel)
 */
export class PatchTenantBookDto {
  @IsNumber()
  tenantId!: number;

  @IsNumber()
  ownerId!: number;

  @Type(() => Date)
  @IsOptional()
  @IsDate()
  newStartDate?: Date;

  @Type(() => Date)
  @IsOptional()
  @IsDate()
  newEndDate?: Date;

  @IsOptional()
  @IsString()
  cancelReason?: string;
}

/**
 * OWNER — Approve booking request
 */
export class PatchApprovePayloadDTO {
  @IsNumber()
  ownerId!: number;

  // @IsNumber()
  // tenantId!: number;

  @IsOptional()
  @IsString()
  message?: string; // optional message to tenant
}

/**
 * OWNER — Reject booking request
 */
export class PatchBookingRejectionPayloadDTO {
  @IsNumber()
  ownerId!: number;

  // @IsNumber()
  // tenantId!: number;

  @IsString()
  reason!: string;
}

/**
 * TENANT — Upload payment proof
 */
export class CreatePaymentProofDTO {
  @IsNumber()
  tenantId!: number;

  @IsNumber()
  ownerId!: number;

  // @IsString()
  // paymentProofUrl!: string; // could be file URL or base64

  @IsOptional()
  @IsString()
  note?: string;
}

/**
 * OWNER — Verify payment
 */
export class PatchVerifyPaymentDto {
  @IsNumber()
  ownerId!: number;

  @IsNumber()
  tenantId!: number;

  @IsOptional()
  @IsString()
  remarks?: string;

  @IsOptional()
  @IsEnum(BookingStatus)
  newStatus?: BookingStatus; // e.g. VERIFIED or REJECTED
}

/**
 * BOTH — Cancel Booking (shared)
 */
export class CancelBookingDto {
  @IsNumber()
  userId!: number;

  @IsString()
  role!: 'TENANT' | 'OWNER';

  @IsOptional()
  @IsString()
  reason?: string;
}
