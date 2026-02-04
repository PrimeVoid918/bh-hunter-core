import { IsEnum, IsNumber } from 'class-validator';

import { FileFormat, UserRole, VerificationType } from '@prisma/client';
import { Transform } from 'class-transformer';

export class FindOneVerificationDto {
  @IsNumber()
  userId!: number;

  @IsEnum(UserRole)
  userType!: UserRole;

  @IsEnum(FileFormat)
  fileFormat!: FileFormat;

  @IsEnum(VerificationType)
  @Transform(
    ({ value }) => (value as string).replace(/"/g, '') as VerificationType,
  )
  verificationType!: VerificationType;
}
