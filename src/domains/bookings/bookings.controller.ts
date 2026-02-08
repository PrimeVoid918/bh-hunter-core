import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Query,
  UseInterceptors,
  UploadedFiles,
} from '@nestjs/common';
import { BookingsService } from './bookings.service';
import {
  CreateBookingDto,
  PatchTenantBookDto,
  PatchApprovePayloadDTO,
  PatchBookingRejectionPayloadDTO,
  CreatePaymentProofDTO,
  PatchVerifyPaymentDto,
  FindAllBookingFilterDto,
} from './dto/dtos';
import { ApiTags } from '@nestjs/swagger';
import { createMulterConfig } from 'src/infrastructure/shared/utils/multer-config.util';
import { AnyFilesInterceptor } from '@nestjs/platform-express';
import { PaymentsService } from '../payments/payments.service';

@ApiTags('bookings')
@Controller('bookings')
export class BookingsController {
  constructor(
    private readonly bookingsService: BookingsService,
    private readonly paymentsService: PaymentsService,
  ) {}

  /*
  =====================
  CREATE
  =====================
  */

  @Post(':roomId')
  async createBooking(
    @Param('roomId') roomId: string,
    @Body() payload: CreateBookingDto,
  ) {
    return this.bookingsService.createBooking(+roomId, payload);
  }

  /*
  =====================
  PAYMENT RELATED (SPECIFIC FIRST)
  =====================
  */

  @Get(':id/payment')
  getBookingPayment(@Param('id') id: string) {
    return this.paymentsService.getBookingPayment(+id);
  }

  @Post(':id/payment/retry')
  retryBookingPayment(@Param('id') id: string) {
    return this.paymentsService.retryBookingPayment(+id);
  }

  // GET /api/bookings/:id/payment


  // @Get(':id/payment-proof')
  // findPaymentProof(@Param('id') id: string) {
  //   return this.bookingsService.findPaymentProof(+id);
  // }

  // @Post(':id/payment-proof')
  // @UseInterceptors(AnyFilesInterceptor(createMulterConfig('image')))
  // createPaymentProof(
  //   @Param('id') id: string,
  //   @Body() payload: Record<string, string>,
  //   @UploadedFiles() files: Express.Multer.File[],
  // ) {
  //   const createPaymentProof: CreatePaymentProofDTO = {
  //     ...payload,
  //     tenantId: +payload.tenantId,
  //     ownerId: +payload.ownerId,
  //   };

  //   return this.bookingsService.createPaymentProof(
  //     +id,
  //     createPaymentProof,
  //     files,
  //   );
  // }

  /*
  =====================
  OWNER ACTIONS
  =====================
  */

  @Patch(':id/owner/approve')
  patchApproveBookingRequest(
    @Param('id') id: string,
    @Body() approvePayload: PatchApprovePayloadDTO,
  ) {
    return this.bookingsService.patchApproveBooking(+id, approvePayload);
  }

  @Patch(':id/owner/reject')
  patchRejectBookingRequest(
    @Param('id') id: string,
    @Body() payload: PatchBookingRejectionPayloadDTO,
  ) {
    return this.bookingsService.patchRejectBooking(+id, payload);
  }

  // @Patch(':id/owner/verify-payment')
  // patchPaymentStatus(
  //   @Param('id') id: string,
  //   @Body() payload: PatchVerifyPaymentDto,
  // ) {
  //   return this.bookingsService.verifyPayment(+id, payload);
  // }

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

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.bookingsService.findOne(+id);
  }

  @Get()
  findAll(@Query() filter: FindAllBookingFilterDto) {
    return this.bookingsService.findAll(filter);
  }
}
