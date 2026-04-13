import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Query,
  ParseIntPipe,
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

  @Get(':id/status')
  getBookingStatus(
    @Param('id', ParseIntPipe) id: number,
    @Query('mock') mock?: string,
  ) {
    // return this.bookingsService.getBookingStatus(id);
    return this.refund_test({ test_val: mock?.toUpperCase() });
  }

  @Get(':id/payment')
  getBookingPayment(@Param('id') id: string) {
    return this.paymentsService.getBookingPayment(+id);
  }

  @Get(':id/refund-preview')
  previewRefund(
    @Param('id', ParseIntPipe) id: number,
    @Query('mock') mock: string,
  ) {
    // return this.bookingsService.previewRefund(id);

    if (mock === 'full') {
      return {
        refundStatus: 'FULL',
        refundable: true,
        percentage: 1,
        refundAmount: '12000',
        originalAmount: '12000',
        currency: 'PHP',
      };
    }

    if (mock === 'partial') {
      return {
        refundStatus: 'PARTIAL',
        refundable: true,
        percentage: 0.5,
        refundAmount: '6000',
        originalAmount: '12000',
        currency: 'PHP',
      };
    }

    if (mock === 'none') {
      return {
        refundStatus: 'NOT_REFUNDABLE',
        refundable: false,
        percentage: 0,
        refundAmount: '0',
        originalAmount: '12000',
        currency: 'PHP',
      };
    }

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

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.bookingsService.findOne(+id);
  }

  @Get()
  findAll(@Query() filter: FindAllBookingFilterDto) {
    return this.bookingsService.findAll(filter);
  }

  private refund_test({
    test_val,
  }: {
    test_val:
      | 'FULL'
      | 'PARTIAL'
      | 'NOT_REFUNDABLE'
      | 'COMPLETED_BOOKING'
      | 'AWAITING_PAYMENT';
  }) {
    switch (test_val) {
      case 'PARTIAL':
        return {
          refundStatus: 'PARTIAL',
          refundable: true,
          percentage: 0.5,
          refundAmount: '6000',
          originalAmount: '12000',
          currency: 'PHP',
          checkInDate: '2026-04-14T10:00:00.000Z',
          now: '2026-04-13T10:00:00.000Z',
        };
      case 'FULL':
        return {
          refundStatus: 'FULL',
          refundable: true,
          percentage: 1,
          refundAmount: '12000',
          originalAmount: '12000',
          currency: 'PHP',
          checkInDate: '2026-04-20T10:00:00.000Z',
          now: '2026-04-12T10:00:00.000Z',
        };
      case 'NOT_REFUNDABLE':
        return {
          refundStatus: 'NOT_REFUNDABLE',
          refundable: false,
          percentage: 0,
          refundAmount: '0',
          originalAmount: '12000',
          currency: 'PHP',
          checkInDate: '2026-04-12T09:00:00.000Z',
          now: '2026-04-12T10:00:00.000Z',
        };
      case 'COMPLETED_BOOKING':
        return {
          bookingId: 1,
          bookingStatus: 'COMPLETED_BOOKING',
          paymentStatus: 'PAID',
          refund: {
            eligible: true,
            percentage: 0.5,
            refundAmount: 6000,
            totalAmount: 12000,
            hoursBeforeCheckIn: 36,
          },
        };
      case 'AWAITING_PAYMENT':
        return {
          bookingId: 1,
          bookingStatus: 'AWAITING_PAYMENT',
          paymentStatus: 'PENDING',
          refund: null,
        };
      default:
        return {
          bookingId: 1,
          bookingStatus: 'PENDING_REQUEST',
          paymentStatus: null,
          refund: null,
        };
    }
  }
}
