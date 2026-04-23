import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { AgreementsService } from './agreements.service';
import {
  AgreementPreviewDto,
  CreateBookingAgreementDto,
  MarkAgreementPdfDto,
} from './dto/dto';

@Controller('agreements')
export class AgreementsController {
  constructor(private readonly agreementsService: AgreementsService) {}

  @Get('preview')
  getPreview(
    @Query('roomId') roomId?: string,
    @Query('tenantId') tenantId?: string,
    @Query('occupantsCount') occupantsCount?: string,
    @Query('checkInDate') checkInDate?: string,
    @Query('checkOutDate') checkOutDate?: string,
  ) {
    const dto: AgreementPreviewDto = {
      roomId: Number(roomId),
      tenantId: Number(tenantId),
      occupantsCount: occupantsCount ? Number(occupantsCount) : 1,
      checkInDate: checkInDate!,
      checkOutDate: checkOutDate!,
    };

    return this.agreementsService.getPreview(dto);
  }

  @Post('bookings/:bookingId')
  createForBooking(
    @Param('bookingId') bookingId: string,
    @Body() body: CreateBookingAgreementDto,
  ) {
    return this.agreementsService.createForBooking(Number(bookingId), body);
  }

  @Get('bookings/:bookingId')
  getByBooking(@Param('bookingId') bookingId: string) {
    return this.agreementsService.getByBooking(Number(bookingId));
  }

  @Post('bookings/:bookingId/pdf-payload')
  generatePdfPayload(@Param('bookingId') bookingId: string) {
    return this.agreementsService.generatePdfPayload(Number(bookingId));
  }

  @Patch('bookings/:bookingId/pdf')
  markPdfGenerated(
    @Param('bookingId') bookingId: string,
    @Body() body: MarkAgreementPdfDto,
  ) {
    return this.agreementsService.markPdfGenerated(
      Number(bookingId),
      body.pdfUrl,
    );
  }
}
