import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsDate,
  IsInt,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
} from 'class-validator';

export class FindBoardingHouseDto {
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  id?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  ownerId?: number;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  address?: string;

  // TODO1: make a schema for ameneties, finalize the schema if applicable
  // ameneties

  @IsOptional()
  @IsBoolean()
  availabilityStatus?: boolean;

  // TODO2: make a schema for properties, finalize the schema if applicable
  // properties

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  createdAt?: Date;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  updatedAt?: Date;

  // TODO3: consult if bookings are relevant for searching
  // bookings

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean) // This helps class-transformer convert the incoming type
  isDeleted?: boolean;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  deletedAt?: Date;

  //* for targeted filter
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  minPrice?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  maxPrice?: number;

  @IsOptional()
  @IsString()
  sortBy?: string;

  @IsInt()
  @IsPositive()
  @Type(() => Number)
  @IsOptional()
  page?: number;

  @IsInt()
  @IsPositive()
  @Type(() => Number)
  @IsOptional()
  offset?: number;

  //* suggested properties/fields
  //* hasBookings: boolean;
  //* bookingCount: number;
  //* isBookedBy: userId;
}

/*
model BoardingHouse {
*  id                 Int                  @id @default(autoincrement())
*  ownerId            Int
*  owner              Owner                @relation(fields: [ownerId], references: [id], onDelete: Cascade)
*  name               String
*  address            String?
*  description        String?
*  price              Decimal?             @db.Decimal(10, 2)
*  amenities          Json? 
*  availabilityStatus Boolean              @default(true)
*  locationId         Int                  @unique
*  location           Location             @relation(fields: [locationId], references: [id], name: "BoardingHouseToLocation")
*  properties         Json
*  createdAt          DateTime             @default(now())
*  updatedAt          DateTime             @updatedAt
*  bookings           Booking[]
*  BoardingHouseImage BoardingHouseImage[]
*  isDeleted          Boolean              @default(false)
*  deletedAt          DateTime?
}
*/
