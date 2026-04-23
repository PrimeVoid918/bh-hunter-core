import {
  IsBoolean,
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class AgreementPreviewDto {
  @IsInt()
  @Min(1)
  roomId!: number;

  @IsInt()
  @Min(1)
  tenantId!: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  occupantsCount?: number;

  @IsDateString()
  checkInDate!: string;

  @IsDateString()
  checkOutDate!: string;
}

export class CreateBookingAgreementDto {
  @IsOptional()
  @IsBoolean()
  tenantAccepted?: boolean;

  @IsOptional()
  @IsString()
  termsVersion?: string;
}

export class MarkAgreementPdfDto {
  @IsString()
  pdfUrl!: string;
}
