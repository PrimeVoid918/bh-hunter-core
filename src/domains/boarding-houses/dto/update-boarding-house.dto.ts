// src/boarding-houses/dto/update-boarding-house.dto.ts
import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsOptional,
  IsString,
  ValidateNested,
  IsEnum,
  IsArray,
  IsNumber,
} from 'class-validator';
import { safeParseInt, safeParseObject } from './create-boarding-house.dto';
import { LocationDto } from 'src/domains/location/dto/location.dto';
import { ToNumberArray } from 'src/common/transformers/to-number-array';

// This must match the Prisma enum values exactly!
export enum OccupancyType {
  MALE = 'MALE',
  FEMALE = 'FEMALE',
  MIXED = 'MIXED',
}

export class UpdateBoardingHouseDto {
  @IsOptional()
  @Transform(({ value }) => safeParseInt(value))
  ownerId?: number;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  amenities?: string[];

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  availabilityStatus?: boolean;

  @IsOptional()
  @IsArray()
  @ToNumberArray()
  @IsNumber(
    {},
    { each: true, message: 'Each value in removeGalleryIds must be a number' },
  )
  removeGalleryIds?: number[];

  @IsOptional()
  @IsArray()
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') return undefined;

    // Handle string (query param): "5"
    if (typeof value === 'string') {
      const num = parseInt(value.trim(), 10);
      return isNaN(num) ? undefined : num;
    }

    // Handle array: [5], ["5"], [5,6,7] → take first valid
    if (Array.isArray(value)) {
      for (const item of value) {
        const num = parseInt(String(item).trim(), 10);
        if (!isNaN(num)) return num;
      }
      return undefined; // no valid number found
    }

    // Handle direct number
    if (typeof value === 'number') return value;

    return undefined;
  })
  @IsNumber(
    {},
    { each: true, message: 'Each value in removeThumbnailId must be a number' },
  )
  removeThumbnailId?: number;

  @IsOptional()
  @Transform(({ value }) => safeParseObject<LocationDto>(value))
  @ValidateNested()
  @Type(() => LocationDto)
  location?: LocationDto;

  // ADD THIS
  @IsOptional()
  @IsEnum(OccupancyType, {
    message: `occupancyType must be one of: ${Object.values(OccupancyType).join(', ')}`,
  })
  occupancyType?: OccupancyType;
}
