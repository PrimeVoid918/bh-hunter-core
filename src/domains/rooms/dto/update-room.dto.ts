import {
  IsBoolean,
  IsInt,
  IsNumberString,
  IsOptional,
  IsString,
} from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateRoomDto {
  @IsString()
  @IsOptional()
  roomNumber?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumberString()
  @IsOptional()
  @Type(() => Number)
  capacity?: number;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  maxCapacity?: number;

  @IsNumberString()
  @IsOptional()
  price?: number;

  @IsOptional()
  tags?: Record<string, any>;

  @IsBoolean()
  @IsOptional()
  availabilityStatus?: boolean;
}
