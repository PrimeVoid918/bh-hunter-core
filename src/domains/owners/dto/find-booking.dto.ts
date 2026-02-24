import { PartialType } from '@nestjs/swagger';
import { CreateOwnerDto } from './create-owner.dto';
import { IsBoolean, IsDate, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class GetBookingDto extends PartialType(CreateOwnerDto) {}
