import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { IDatabaseService } from 'src/infrastructure/database/database.interface';
import { Booking, BookingStatus, MediaType } from '@prisma/client';

import {
  CreateBookingDto,
  PatchTenantBookDto,
  PatchApprovePayloadDTO,
  PatchBookingRejectionPayloadDTO,
  CreatePaymentProofDTO,
  PatchVerifyPaymentDto,
  FindAllBookingFilterDto,
  CancelBookingDto,
} from './dto/dtos';
import { ImageService } from 'src/infrastructure/image/image.service';
import { ResourceType } from 'src/infrastructure/file-upload/types/resources-types';
import { UserUnionService } from '../auth/userUnion.service';
import { BookingEventPublisher } from './events/bookings.publisher';
import { PaymentsService } from '../payments/payments.service';

@Injectable()
export class BookingsService {
  constructor(
    @Inject('IDatabaseService') private readonly database: IDatabaseService,
    private readonly userUnionService: UserUnionService,
    private readonly paymentService: PaymentsService,
    private readonly imageService: ImageService,
    private readonly bookingEventPublisher: BookingEventPublisher,
  ) {}

  private get prisma() {
    return this.database.getClient();
  }

  async createBooking(roomId: number, booking: CreateBookingDto) {
    const room = await this.prisma.room.findUnique({
      where: { id: roomId },
      select: {
        boardingHouseId: true,
        boardingHouse: true,
        price: true,
        id: true,
      },
    });

    if (!room) throw new Error(`Room ${roomId} not found`);

    const bookingResult = await this.prisma.booking.create({
      data: {
        room: { connect: { id: roomId } },
        tenant: { connect: { id: booking.tenantId } },
        boardingHouse: { connect: { id: room.boardingHouseId } },
        checkInDate: booking.startDate,
        checkOutDate: booking.endDate,
        reference: `BK-${Date.now()}`,
        dateBooked: new Date(),
      },
      include: {
        tenant: {
          select: {
            firstname: true,
            lastname: true,
          },
        },
      },
    });

    await this.prisma.booking.update({
      where: { id: bookingResult.id },
      data: { status: BookingStatus.AWAITING_PAYMENT },
    });

    this.bookingEventPublisher.requested({
      bookingId: bookingResult.id,
      tenantId: bookingResult.tenantId,
      tenant: {
        firstname: bookingResult.tenant.firstname,
        lastname: bookingResult.tenant.lastname,
      },
      ownerId: room.boardingHouse.ownerId,
      roomId: roomId,
      boardingHouseId: room.boardingHouseId,
    });

    let payment: {
      paymentId: number;
      checkoutUrl: string;
    } | null = null;
    try {
      payment = await this.paymentService.createBookingPayment({
        bookingId: bookingResult.id,
        tenantId: bookingResult.tenantId,
        amount: room.price,
      });
    } catch (err) {
      console.error(
        'Failed to create payment for booking',
        bookingResult.id,
        err,
      );

      await this.prisma.booking.update({
        where: { id: bookingResult.id },
        data: { status: BookingStatus.PAYMENT_FAILED },
      });

      // now propagate error so the endpoint returns 500
      throw err;
    }

    return {
      ...bookingResult,
      paymentCheckoutUrl: payment?.checkoutUrl,
    };
  }

  findAll(filter: FindAllBookingFilterDto): Promise<Booking[]> {
    const {
      tenantId,
      boardingHouseId,
      status,
      fromCheckIn,
      toCheckIn,
      page = 1,
      limit = 10,
    } = filter;

    const toSkip = (Number(page) - 1) * Number(limit);

    const where: any = {};

    if (tenantId !== undefined) where.tenantId = +tenantId;
    if (boardingHouseId !== undefined) where.boardingHouseId = +boardingHouseId;
    if (status !== undefined) where.status = status;
    if (fromCheckIn && toCheckIn)
      where.checkInDate = { gte: fromCheckIn, lte: toCheckIn };

    console.log('where: ', where);

    return this.prisma.booking.findMany({
      skip: toSkip,
      take: Number(limit),
      where,
      orderBy: { checkInDate: 'asc' },
      include: {
        tenant: {
          select: {
            id: true,
            firstname: true,
            lastname: true,
            age: true,
            email: true,
            phone_number: true,
          },
        },
        room: {
          select: {
            roomNumber: true,
          },
        },
      },
    });
  }

  async findOne(bookId: number) {
    const booking = await this.prisma.booking.findUnique({
      where: {
        id: bookId,
      },
      include: {
        tenant: true,
      },
    });

    if (!booking) throw new NotFoundException('Booking not found');

    const { tenant, ...bookingWithoutTenant } = booking;

    return {
      tenant,
      ...bookingWithoutTenant,
    };
  }

  // async findPaymentProof(imagId: number) {
  //   if (!imagId) throw new BadRequestException('Missing booking id');

  //   const bookingReceipt = await this.prisma.image.findUnique({
  //     where: { id: imagId },
  //   });

  //   if (!bookingReceipt) throw new NotFoundException('Booking not found');

  //   const { url: rawDBPaymentUrl, ...bookingReceiptData } = bookingReceipt;

  //   const url = await this.imageService.getMediaPath(rawDBPaymentUrl, false);

  //   return {
  //     url,
  //     ...bookingReceiptData,
  //   };
  // }

  // TENANT: update or cancel booking (generic)
  async patchBooking(bookId: number, payload: PatchTenantBookDto) {
    const { tenantId, cancelReason, newEndDate, newStartDate } = payload;

    // 1️⃣ Validate booking access
    const booking = await this.validateBookingAccess(
      bookId,
      tenantId,
      'TENANT',
    );

    // 2️⃣ Disallow operations on finished/rejected/cancelled bookings
    const blockedStatuses = new Set<BookingStatus>([
      BookingStatus.CANCELLED_BOOKING,
      BookingStatus.COMPLETED_BOOKING,
      BookingStatus.REJECTED_BOOKING,
    ]);

    if (blockedStatuses.has(booking.status)) {
      throw new BadRequestException(
        'You cannot modify or cancel a completed or rejected booking',
      );
    }

    // 3️⃣ If cancelReason exists → cancel booking
    if (cancelReason) {
      return await this.prisma.booking.update({
        where: { id: bookId },
        data: {
          status: 'CANCELLED_BOOKING',
          tenantMessage: cancelReason,
          updatedAt: new Date(),
        },
      });
    }

    // 4️⃣ If new dates exist → update them (assuming your booking model supports it)
    if (newStartDate || newEndDate) {
      if (booking.status !== BookingStatus.PENDING_REQUEST) {
        throw new BadRequestException(
          'You can only change dates for pending requests',
        );
      }

      return await this.prisma.booking.update({
        where: { id: bookId },
        data: {
          checkInDate: newStartDate ?? booking.checkInDate,
          checkOutDate: newEndDate ?? booking.checkOutDate,
          updatedAt: new Date(),
        },
      });
    }

    // 5️⃣ If neither cancelReason nor new dates exist → invalid request
    throw new BadRequestException('No valid update data provided');
  }

  async patchApproveBooking(bookId: number, payload: PatchApprovePayloadDTO) {
    const { ownerId, message } = payload;
    const booking = await this.validateBookingAccess(bookId, ownerId, 'OWNER');

    if (booking.status !== BookingStatus.PENDING_REQUEST) {
      throw new BadRequestException(
        'Only pending requests can be approved by the owner',
      );
    }

    const approveBooking = await this.prisma.booking.update({
      where: { id: bookId },
      data: {
        status: BookingStatus.AWAITING_PAYMENT, // ✅ waiting for proof
        ownerMessage: message ?? booking.ownerMessage,
        updatedAt: new Date(),
      },
    });

    //! notification partial integration
    this.bookingEventPublisher.approved({
      bookingId: bookId,
      tenantId: approveBooking.tenantId,
      ownerId: ownerId,
    });

    return approveBooking;
  }

  async patchRejectBooking(
    bookId: number,
    payload: PatchBookingRejectionPayloadDTO,
  ) {
    const { ownerId, reason } = payload;
    const booking = await this.validateBookingAccess(bookId, ownerId, 'OWNER');

    // Ensure it can still be rejected
    const blockedStatuses = new Set<BookingStatus>([
      BookingStatus.CANCELLED_BOOKING,
      BookingStatus.COMPLETED_BOOKING,
      BookingStatus.REJECTED_BOOKING,
    ]);

    if (blockedStatuses.has(booking.status)) {
      throw new BadRequestException('This booking cannot be rejected');
    }

    return await this.prisma.booking.update({
      where: { id: bookId },
      data: {
        status: 'REJECTED_BOOKING',
        ownerMessage: reason,
        updatedAt: new Date(),
      },
    });
  }

  // async createPaymentProof(
  //   bookId: number,
  //   payload: CreatePaymentProofDTO,
  //   files: Express.Multer.File[],
  // ) {
  //   const { tenantId, note } = payload;
  //   console.log('file send:', files);

  //   // 1️ Verify the booking exists and belongs to the tenant
  //   const booking = await this.validateBookingAccess(
  //     bookId,
  //     tenantId,
  //     'TENANT',
  //   );

  //   // 2️ Verify booking status is valid for uploading payment proof
  //   if (booking.status !== BookingStatus.AWAITING_PAYMENT) {
  //     throw new BadRequestException('This booking is not awaiting payment');
  //   }

  //   // 3️ Upload the image(s)
  //   return this.prisma.$transaction(async (tx) => {
  //     const uploadedImageIds = await this.imageService.uploadImagesTransact(
  //       tx,
  //       files,
  //       {
  //         type: 'TENANT',
  //         targetId: +tenantId,
  //         childId: bookId,
  //         mediaType: MediaType.PAYMENT,
  //       },
  //       {
  //         resourceId: +tenantId,
  //         resourceType: ResourceType.TENANT,
  //         mediaType: MediaType.PAYMENT,
  //       },
  //       {
  //         isPublic: false,
  //       },
  //     );

  //     return await tx.booking.update({
  //       where: { id: booking.id },
  //       data: {
  //         paymentProofId: uploadedImageIds[0] ?? null,
  //         tenantMessage: note ?? null,
  //         status: 'PAYMENT_APPROVAL', // ✅ now waiting for owner to verify
  //         updatedAt: new Date(),
  //       },
  //     });
  //   });
  // }

  // async verifyPayment(bookId: number, payload: PatchVerifyPaymentDto) {
  //   const { ownerId, newStatus, remarks } = payload;

  //   const booking = await this.validateBookingAccess(bookId, ownerId, 'OWNER');

  //   if (!booking) {
  //     throw new NotFoundException('Booking not found');
  //   }

  //   if (booking.status !== 'PAYMENT_APPROVAL') {
  //     throw new BadRequestException('This booking is not awaiting payment');
  //   }

  //   if (newStatus !== 'COMPLETED_BOOKING' && newStatus !== 'REJECTED_BOOKING') {
  //     throw new BadRequestException('Invalid status');
  //   }

  //   const updated = await this.prisma.booking.update({
  //     where: { id: bookId },
  //     data: {
  //       status: newStatus ?? booking.status,
  //       ownerMessage: remarks ?? booking.ownerMessage,
  //       updatedAt: new Date(),
  //     },
  //   });

  //   return updated;
  // }

  async cancelBooking(bookId: number, payload: CancelBookingDto) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookId },
      include: {
        room: {
          include: {
            boardingHouse: {
              select: { ownerId: true },
            },
          },
        },
      },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    // Ensure the user has authority to cancel
    const { userId, role } = payload;

    // If tenant cancels their own booking
    if (role === 'TENANT' && booking.tenantId !== userId) {
      throw new ForbiddenException(
        'You are not authorized to cancel this booking',
      );
    }

    // If owner cancels a tenant’s booking (e.g., due to policy, expired payment, etc.)
    if (role === 'OWNER' && booking.room.boardingHouse.ownerId !== userId) {
      throw new ForbiddenException(
        'You are not authorized to cancel this booking',
      );
    }

    // Perform the cancellation logic
    const updated = await this.prisma.booking.update({
      where: { id: bookId },
      data: {
        status: 'CANCELLED_BOOKING',
        ownerMessage: role === 'OWNER' ? payload.reason : booking.ownerMessage,
        tenantMessage:
          role === 'TENANT' ? payload.reason : booking.tenantMessage,
        updatedAt: new Date(),
      },
    });

    return updated;
  }

  async remove(id: number) {
    const prisma = this.prisma;
    const entity = await prisma.booking.findUnique({ where: { id } });
    if (!entity || entity.isDeleted) throw new NotFoundException('Not found');

    return this.prisma.booking.update({
      where: { id },
      data: { isDeleted: true },
    });
  }

  async validateBookingAccess(
    bookId: number,
    userId: number,
    role: 'TENANT' | 'OWNER',
  ) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookId },
      include: {
        room: {
          include: {
            boardingHouse: {
              select: { ownerId: true },
            },
          },
        },
      },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    if (role === 'TENANT') {
      if (booking.tenantId !== userId) {
        throw new ForbiddenException(
          'You are not authorized to access this booking',
        );
      }
    } else if (role === 'OWNER') {
      if (booking.room.boardingHouse.ownerId !== userId) {
        throw new ForbiddenException(
          'You are not authorized to manage this booking',
        );
      }
    }

    return booking; // ✅ return it so the caller can use the data directly
  }
}
// PENDING_REQUEST
// AWAITING_PAYMENT
// PAYMENT_APPROVAL
// CANCELLED_BOOKING
// REJECTED_BOOKING
// COMPLETED_BOOKING
