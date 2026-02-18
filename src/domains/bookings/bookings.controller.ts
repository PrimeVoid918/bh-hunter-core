import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Query,
} from '@nestjs/common';
import { BookingsService } from './bookings.service';
import {
  CreateBookingDto,
  PatchTenantBookDto,
  PatchApprovePayloadDTO,
  PatchBookingRejectionPayloadDTO,
  FindAllBookingFilterDto,
} from './dto/dtos';
import { ApiTags } from '@nestjs/swagger';
import { PaymentsService } from '../payments/payments.service';

@ApiTags('bookings')
@Controller('bookings')
export class BookingsController {
  constructor(
    private readonly bookingsService: BookingsService,
    private readonly paymentsService: PaymentsService,
  ) {}

  @Post(':id/paymongo')
  createPaymongoPayment(@Param('id') id: string) {
    return this.paymentsService.createBookingPaymentForFrontend(+id);
  }

  @Get(':id/payment')
  getBookingPayment(@Param('id') id: string) {
    return this.paymentsService.getBookingPayment(+id);
  }

  @Post(':id/payment/retry')
  retryBookingPayment(@Param('id') id: string) {
    return this.paymentsService.retryBookingPayment(+id);
  }

  /*
  =====================
  OWNER ACTIONS
  =====================
  */

  @Patch(':id/owners/approve')
  patchApproveBookingRequest(
    @Param('id') id: string,
    @Body() approvePayload: PatchApprovePayloadDTO,
  ) {
    return this.bookingsService.patchApproveBooking(+id, approvePayload);
  }

  @Patch(':id/owners/reject')
  patchRejectBookingRequest(
    @Param('id') id: string,
    @Body() payload: PatchBookingRejectionPayloadDTO,
  ) {
    return this.bookingsService.patchRejectBooking(+id, payload);
  }

  /*
  =====================
  TENANT ACTIONS
  =====================
  */

  @Patch(':id')
  patchBooking(@Param('id') id: string, @Body() payload: PatchTenantBookDto) {
    return this.bookingsService.patchBooking(+id, payload);
  }

  @Post(':id/cancel')
  createCancelResponse(@Param('id') id: string, @Body() payload: any) {
    return this.bookingsService.cancelBooking(+id, payload);
  }

  /*
  =====================
  GENERIC GET
  =====================
  */

  @Post(':roomId')
  async createBooking(
    @Param('roomId') roomId: string,
    @Body() payload: CreateBookingDto,
  ) {
    return this.bookingsService.createBooking(+roomId, payload);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.bookingsService.findOne(+id);
  }

  @Get()
  findAll(@Query() filter: FindAllBookingFilterDto) {
    return this.bookingsService.findAll(filter);
  }
}
