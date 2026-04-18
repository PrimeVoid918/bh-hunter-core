import {
  IsOptional,
  IsString,
  IsEmail,
  IsNumber,
  IsBoolean,
  IsDateString,
} from 'class-validator';

export class UpdateTenantDto {
  @IsOptional()
  @IsString()
  username?: string;

  @IsOptional()
  @IsString()
  firstname?: string;

  @IsOptional()
  @IsString()
  lastname?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  password?: string;

  @IsOptional()
  @IsNumber()
  age?: number;

  @IsOptional()
  @IsString()
  guardian?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  phone_number?: string;

  @IsOptional()
  @IsBoolean()
  isDeleted?: boolean;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsBoolean()
  isVerified?: boolean;

  // ✅ Fields you were missing
  @IsOptional()
  @IsBoolean()
  hasAcceptedPolicies?: boolean;

  @IsOptional()
  @IsDateString()
  policiesAcceptedAt?: string;
}
