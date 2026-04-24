import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Query,
  ParseIntPipe,
  Header,
  Res,
} from '@nestjs/common';
import { BookingsService } from './bookings.service';
import {
  CreateBookingDto,
  PatchTenantBookDto,
  PatchApprovePayloadDTO,
  PatchBookingRejectionPayloadDTO,
  FindAllBookingFilterDto,
  RequestExtensionDto,
  ApproveExtensionDto,
  RejectExtensionDto,
} from './dto/dtos';
import { ApiTags } from '@nestjs/swagger';
import { PaymentsService } from '../payments/payments.service';
import { Response } from 'express';

@ApiTags('bookings')
@Controller('bookings')
export class BookingsController {
  constructor(
    private readonly bookingsService: BookingsService,
    private readonly paymentsService: PaymentsService,
  ) {}

  //!! old deprecated booking implementation
  // @Post(':id/paymongo')
  // createPaymongoPayment(@Param('id') id: string) {
  //   return this.paymentsService.createBookingPaymentForFrontend(+id);
  // }
  //!! old deprecated booking implementation

  @Post(':id/extensions')
  requestExtension(
    @Param('id', ParseIntPipe) id: number,
    @Body() payload: RequestExtensionDto,
  ) {
    return this.bookingsService.requestExtension(id, payload);
  }

  @Patch(':id/extensions/:extensionId/approve')
  approveExtension(
    @Param('id', ParseIntPipe) id: number,
    @Param('extensionId', ParseIntPipe) extensionId: number,
    @Body() payload: ApproveExtensionDto,
  ) {
    return this.bookingsService.approveExtension(id, extensionId, payload);
  }

  @Patch(':id/extensions/:extensionId/reject')
  rejectExtension(
    @Param('id', ParseIntPipe) id: number,
    @Param('extensionId', ParseIntPipe) extensionId: number,
    @Body() payload: RejectExtensionDto,
  ) {
    return this.bookingsService.rejectExtension(id, extensionId, payload);
  }

  //* new  booking implementation
  @Post(':id/payment/checkout')
  createBookingChargeCheckout(@Param('id', ParseIntPipe) id: number) {
    return this.paymentsService.createBookingChargeCheckout(id);
  }
  //* new  booking implementation

  @Get(':id/status')
  getBookingStatus(@Param('id', ParseIntPipe) id: number) {
    return this.bookingsService.getBookingStatus(id);
  }

  @Get(':id/billing-statements')
  getBillingStatements(@Param('id', ParseIntPipe) id: number) {
    return this.bookingsService.getBillingStatements(id);
  }

  @Get(':id/billing-statements/html')
  async getBillingStatementsHtml(
    @Param('id', ParseIntPipe) id: number,
    @Query('type') type: 'INITIAL_BOOKING' | 'EXTENSION' = 'INITIAL_BOOKING',
    @Query('chargeId') chargeId: string | undefined,
    @Res() res: Response,
  ) {
    const html = await this.bookingsService.getBillingStatementsHtml(id, {
      type,
      chargeId: chargeId ? Number(chargeId) : undefined,
    });

    return res.type('text/html').send(html);
  }

  @Get(':id/payment')
  getBookingPayment(@Param('id') id: string) {
    return this.paymentsService.getBookingPayment(+id);
  }

  @Get(':id/refund-preview')
  previewRefund(@Param('id', ParseIntPipe) id: number) {
    return this.bookingsService.previewRefund(id);
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

  @Get('tenant/:tenantId/active')
  findActive(@Param('tenantId') id: string) {
    return this.bookingsService.findActive(+id);
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
