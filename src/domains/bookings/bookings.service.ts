import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { IDatabaseService } from 'src/infrastructure/database/database.interface';
import {
  BookingStatus,
  MediaType,
  ResourceType as PrismaResourceType,
  Prisma,
  PaymentStatus,
  RefundStatus,
} from '@prisma/client';

import {
  CreateBookingDto,
  PatchTenantBookDto,
  PatchApprovePayloadDTO,
  PatchBookingRejectionPayloadDTO,
  FindAllBookingFilterDto,
  CancelBookingDto,
} from './dto/dtos';
import { ImageService } from 'src/infrastructure/image/image.service';
import { ResourceType } from 'src/infrastructure/file-upload/types/resources-types';
import { UserUnionService } from '../auth/userUnion.service';
import { BookingEventPublisher } from './events/bookings.publisher';
import { PaymentsService } from '../payments/payments.service';
import { RefundPolicy } from './refund.policy';

@Injectable()
export class BookingsService {
  constructor(
    @Inject('IDatabaseService') private readonly database: IDatabaseService,
    private readonly userUnionService: UserUnionService,
    private readonly paymentsService: PaymentsService,
    private readonly imageService: ImageService,
    private readonly bookingEventPublisher: BookingEventPublisher,
    private readonly refundPolicy: RefundPolicy,
  ) {}

  private get prisma() {
    return this.database.getClient();
  }

  async createBooking(roomId: number, booking: CreateBookingDto) {
    const occupants = booking.occupantsCount ?? 1;

    if (occupants <= 0) {
      throw new BadRequestException('Invalid occupants count');
    }

    const existingActiveBooking = await this.prisma.booking.findFirst({
      where: {
        tenantId: booking.tenantId,
        status: BookingStatus.COMPLETED_BOOKING,
        isDeleted: false,
      },
      select: { id: true },
    });

    if (existingActiveBooking) {
      throw new BadRequestException(
        'You already have an active booking. You cannot request another room.',
      );
    }

    const room = await this.prisma.room.findUnique({
      where: { id: roomId },
      select: {
        id: true,
        boardingHouseId: true,
        boardingHouse: true,
        price: true,
        maxCapacity: true,
        currentCapacity: true,
      },
    });

    if (!room) {
      throw new NotFoundException(`Room ${roomId} not found`);
    }

    // Capacity validation
    if (room.currentCapacity + occupants > room.maxCapacity) {
      throw new BadRequestException(
        `Room capacity exceeded. Available slots: ${
          room.maxCapacity - room.currentCapacity
        }`,
      );
    }

    const bookingResult = await this.prisma.booking.create({
      data: {
        room: { connect: { id: roomId } },
        tenant: { connect: { id: booking.tenantId } },
        boardingHouse: { connect: { id: room.boardingHouseId } },

        occupantsCount: occupants,

        checkInDate: booking.startDate,
        checkOutDate: booking.endDate,

        reference: `BK-${Date.now()}`,
        dateBooked: new Date(),

        status: BookingStatus.PENDING_REQUEST,
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

    this.bookingEventPublisher.requested({
      bookingId: bookingResult.id,
      tenantId: bookingResult.tenantId,
      tenant: {
        firstname: bookingResult.tenant.firstname,
        lastname: bookingResult.tenant.lastname,
      },
      data: {
        ownerId: room.boardingHouse.ownerId,
        tenantId: bookingResult.tenantId,
        roomId: room.id,
        bhId: room.boardingHouseId,
        resourceType: PrismaResourceType.BOOKING,
      },
      ownerId: room.boardingHouse.ownerId,
      roomId: roomId,
      boardingHouseId: room.boardingHouseId,
    });

    return bookingResult;
  }

  async findAll(filter: FindAllBookingFilterDto) {
    if (
      filter.fromCheckIn &&
      filter.toCheckIn &&
      filter.fromCheckIn > filter.toCheckIn
    ) {
      throw new BadRequestException('fromCheckIn must be before toCheckIn');
    }

    const {
      tenantId,
      bookingType,
      bookId,
      boardingHouseId,
      status,
      fromCheckIn,
      toCheckIn,
      page = 1,
      limit = 10,
      roomId,
    } = filter;

    const toSkip = (Number(page) - 1) * Number(limit);

    const where: any = {};

    if (tenantId !== undefined) where.tenantId = +tenantId;
    if (bookId !== undefined) where.id = +bookId;
    if (status !== undefined) where.status = status;

    if (roomId !== undefined) where.room = { id: +roomId };

    // Boarding house filter
    if (boardingHouseId !== undefined) {
      where.room = { ...(where.room ?? {}), boardingHouseId: +boardingHouseId };
    }

    // Check-in date filter
    if (fromCheckIn && toCheckIn) {
      where.checkInDate = { gte: fromCheckIn, lte: toCheckIn };
    }

    where.isDeleted = false;

    // Fetch bookings
    const bookings = await this.prisma.booking.findMany({
      skip: toSkip,
      take: Number(limit),
      where,
      orderBy: { checkInDate: 'asc' },
      include: {
        tenant: { select: { id: true, firstname: true, lastname: true } },
        room: {
          select: {
            id: true,
            roomNumber: true,
            availabilityStatus: true,
            price: true,
            boardingHouse: {
              select: { id: true, name: true, ownerId: true, address: true },
            },
          },
        },
      },
    });

    if (!bookings.length) return [];

    // Collect room and boarding house IDs for images
    const roomIds = [...new Set(bookings.map((b) => b.roomId))];
    const boardingHouseIds = [
      ...new Set(bookings.map((b) => b.room.boardingHouse.id)),
    ];

    // Fetch images in batches
    const roomImages = await this.prisma.image.findMany({
      where: { entityType: ResourceType.ROOM, entityId: { in: roomIds } },
    });

    const bhImages = await this.prisma.image.findMany({
      where: {
        entityType: ResourceType.BOARDING_HOUSE,
        entityId: { in: boardingHouseIds },
      },
    });

    // Map images by entity
    const imagesByRoom = new Map<number, typeof roomImages>();
    for (const img of roomImages) {
      if (!imagesByRoom.has(img.entityId)) imagesByRoom.set(img.entityId, []);
      imagesByRoom.get(img.entityId)!.push(img);
    }

    const imagesByBoardingHouse = new Map<number, typeof bhImages>();
    for (const img of bhImages) {
      if (!imagesByBoardingHouse.has(img.entityId))
        imagesByBoardingHouse.set(img.entityId, []);
      imagesByBoardingHouse.get(img.entityId)!.push(img);
    }

    // Build normalized response
    return Promise.all(
      bookings.map(async (booking) => {
        const roomImgs = imagesByRoom.get(booking.roomId) ?? [];
        const bhImgs =
          imagesByBoardingHouse.get(booking.room.boardingHouse.id) ?? [];

        const { thumbnail: roomThumbnail } =
          await this.imageService.getImageMetaData(
            roomImgs,
            (url, isPublic) => this.imageService.getMediaPath(url, isPublic),
            ResourceType.ROOM,
            booking.roomId,
            [MediaType.THUMBNAIL],
          );

        const { thumbnail: bhThumbnail } =
          await this.imageService.getImageMetaData(
            bhImgs,
            (url, isPublic) => this.imageService.getMediaPath(url, isPublic),
            ResourceType.BOARDING_HOUSE,
            booking.room.boardingHouse.id,
            [MediaType.THUMBNAIL],
          );

        // Top-level normalized object
        const result: any = {
          ...booking,
          room: {
            ...booking.room,
            thumbnail: roomThumbnail,
          },
        };

        // Only include boardingHouse if query requested it or room filter didn't exclude it
        if (boardingHouseId !== undefined || roomId === undefined) {
          result.boardingHouse = {
            ...booking.room.boardingHouse,
            thumbnail: bhThumbnail,
          };
        }

        return result;
      }),
    );
  }

  async findOne(bookId: number) {
    if (!bookId) {
      throw new BadRequestException('Booking ID is required');
    }

    const booking = await this.prisma.booking.findFirst({
      where: {
        id: bookId,
        isDeleted: false,
      },
      include: {
        // owner: true,
        tenant: {
          select: {
            id: true,
            firstname: true,
            lastname: true,
          },
        },
        boardingHouse: true,
        room: true,
      },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    const roomId = booking.room.id;
    const boardingHouseId = booking.boardingHouse.id;

    // Fetch images in parallel
    const [roomImages, bhImages] = await Promise.all([
      this.prisma.image.findMany({
        where: {
          entityType: ResourceType.ROOM,
          entityId: roomId,
          isDeleted: false,
        },
      }),
      this.prisma.image.findMany({
        where: {
          entityType: ResourceType.BOARDING_HOUSE,
          entityId: boardingHouseId,
          isDeleted: false,
        },
      }),
    ]);

    const { thumbnail: roomThumbnail } =
      await this.imageService.getImageMetaData(
        roomImages,
        (url, isPublic) => this.imageService.getMediaPath(url, isPublic),
        ResourceType.ROOM,
        roomId,
        [MediaType.THUMBNAIL],
      );

    const { thumbnail: bhThumbnail } = await this.imageService.getImageMetaData(
      bhImages,
      (url, isPublic) => this.imageService.getMediaPath(url, isPublic),
      ResourceType.BOARDING_HOUSE,
      boardingHouseId,
      [MediaType.THUMBNAIL],
    );

    return {
      ...booking,
      room: {
        ...booking.room,
        thumbnail: roomThumbnail,
      },
      boardingHouse: {
        ...booking.boardingHouse,
        thumbnail: bhThumbnail,
      },
    };
  }

  async getBookingStatus(bookId: number) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookId },
      include: {
        payments: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    const payment = booking.payments?.[0] ?? null;

    let refundInfo: {
      eligible: boolean;
      percentage: number;
      refundAmount: number;
      totalAmount: number;
      hoursBeforeCheckIn: number;
    } | null = null;

    if (payment && payment.status === PaymentStatus.PAID) {
      const now = new Date();
      const checkInDate = booking.checkInDate;

      const hoursBeforeCheckIn =
        (checkInDate.getTime() - now.getTime()) / (1000 * 60 * 60);

      const policy = this.refundPolicy.calculate(checkInDate);

      const percentage = policy.percentage;
      const totalAmount = Number(payment.amount);
      const refundAmount = Number(payment.amount) * percentage;

      refundInfo = {
        eligible: percentage > 0,
        percentage,
        refundAmount,
        totalAmount,
        hoursBeforeCheckIn,
      };
    }

    return {
      bookingId: booking.id,
      bookingStatus: booking.status,
      paymentStatus: payment?.status ?? null,
      refund: refundInfo,
    };
  }

  async previewRefund(bookId: number) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookId },
      include: {
        room: {
          include: {
            boardingHouse: { select: { ownerId: true } },
          },
        },
      },
    });

    if (!booking) throw new NotFoundException('Booking not found');

    const payment = await this.prisma.payment.findFirst({
      where: {
        bookingId: bookId,
        status: PaymentStatus.PAID,
      },
      orderBy: { createdAt: 'desc' },
    });

    // No payment → nothing to refund
    if (!payment) {
      return {
        refundStatus: RefundStatus.NONE,
        refundable: false,
        percentage: 0,
        refundAmount: '0',
        reason: 'No payment found',
      };
    }

    const now = new Date();

    if (now >= booking.checkInDate) {
      return {
        refundStatus: RefundStatus.NOT_REFUNDABLE,
        refundable: false,
        percentage: 0,
        refundAmount: '0',
        reason: 'Past check-in date',
      };
    }

    // const percentage = this.calculateRefundPercentage(booking.checkInDate);
    // const psercentage = this.re(booking.checkInDate, new Date());
    const policy = this.refundPolicy.calculate(booking.checkInDate, new Date());
    const percentage = policy.percentage;

    let refundStatus: RefundStatus;

    if (percentage === 1) {
      refundStatus = RefundStatus.FULL;
    } else if (percentage >= 0.5) {
      refundStatus = RefundStatus.PARTIAL;
    } else if (percentage > 0) {
      refundStatus = RefundStatus.ELIGIBLE;
    } else {
      refundStatus = RefundStatus.NOT_REFUNDABLE;
    }

    const refundAmount = payment.amount.mul(percentage);

    return {
      refundStatus,
      refundable: percentage > 0,
      percentage,
      refundAmount: refundAmount.toString(),
      originalAmount: payment.amount.toString(),
      currency: payment.currency,
      checkInDate: booking.checkInDate,
      now,
    };
  }

  // TENANT: update or cancel booking (generic)
  async patchBooking(bookId: number, payload: PatchTenantBookDto) {
    const { tenantId, cancelReason, newEndDate, newStartDate } = payload;

    const booking = await this.validateBookingAccess(
      bookId,
      tenantId,
      'TENANT',
    );

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

    throw new BadRequestException('No valid update data provided');
  }

  async patchApproveBooking(bookId: number, payload: PatchApprovePayloadDTO) {
    const { ownerId, message } = payload;

    const booking = await this.validateBookingAccess(bookId, ownerId, 'OWNER');

    if (booking.status !== BookingStatus.PENDING_REQUEST) {
      throw new BadRequestException('Only pending requests can be approved');
    }

    if (
      booking.room.currentCapacity + booking.occupantsCount >
      booking.room.maxCapacity
    ) {
      throw new BadRequestException(
        'Room capacity is full. Reject this booking request instead.',
      );
    }

    const updatedBooking = await this.prisma.booking.update({
      where: { id: bookId },
      data: {
        status: BookingStatus.AWAITING_PAYMENT,
        ownerMessage: message ?? booking.ownerMessage,
        updatedAt: new Date(),
      },
    });

    let payment: { paymentId: number; clientSecret: string } | null = null;

    try {
      payment = await this.paymentsService.createBookingPayment({
        bookingId: bookId,
        tenantId: booking.tenantId,
        amount: new Prisma.Decimal(booking.room.price),
      });
    } catch (err) {
      console.error('Failed to create payment for booking', bookId, err);

      await this.prisma.booking.update({
        where: { id: bookId },
        data: { status: BookingStatus.PAYMENT_FAILED },
      });

      throw err;
    }

    this.bookingEventPublisher.approved({
      bookingId: bookId,
      tenantId: updatedBooking.tenantId,
      ownerId,
      data: {
        tenantId: updatedBooking.tenantId,
        ownerId,
        roomId: updatedBooking.roomId,
        bhId: updatedBooking.boardingHouseId,
        resourceType: PrismaResourceType.BOOKING,
      },
    });

    return {
      ...updatedBooking,
      paymentClientSecret: payment.clientSecret,
    };
  }

  async patchRejectBooking(
    bookId: number,
    payload: PatchBookingRejectionPayloadDTO,
  ) {
    const { ownerId, reason } = payload;

    const booking = await this.validateBookingAccess(bookId, ownerId, 'OWNER');

    // Only pending bookings can be rejected
    if (booking.status !== BookingStatus.PENDING_REQUEST) {
      throw new BadRequestException(
        'Only pending requests can be rejected by the owner',
      );
    }

    const rejectedBooking = await this.prisma.booking.update({
      where: { id: bookId },
      data: {
        status: BookingStatus.REJECTED_BOOKING, // ✅ enum, not string
        ownerMessage: reason ?? booking.ownerMessage,
        updatedAt: new Date(),
      },
    });

    this.bookingEventPublisher.rejected({
      bookingId: bookId,
      tenantId: rejectedBooking.tenantId,
      data: {
        tenantId: rejectedBooking.tenantId,
        ownerId: ownerId,
        bhId: booking.boardingHouseId,
        roomId: booking.roomId,
        resourceType: PrismaResourceType.BOOKING,
      },
    });

    return rejectedBooking;
  }

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

    if (
      booking.status === BookingStatus.REFUNDED_PAYMENT ||
      booking.status === BookingStatus.CANCELLED_BOOKING
    ) {
      return booking;
    }

    const { userId, role } = payload;

    if (role === 'TENANT' && booking.tenantId !== userId) {
      throw new ForbiddenException(
        'You are not authorized to cancel this booking',
      );
    }

    if (role === 'OWNER' && booking.room.boardingHouse.ownerId !== userId) {
      throw new ForbiddenException(
        'You are not authorized to cancel this booking',
      );
    }

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

    /**
     * Only check refunds if booking was completed
     */

    const payment = await this.prisma.payment.findFirst({
      where: {
        bookingId: bookId,
        status: PaymentStatus.PAID,
      },
      orderBy: { createdAt: 'desc' },
    });

    console.log('Refund payment found:', payment);

    if (!payment) {
      return updated;
    }

    /**
     * REFUND LOGIC
     */

    if (payment && payment.status === PaymentStatus.PAID) {
      if (new Date() >= booking.checkInDate) {
        return updated;
      }

      const policy = this.refundPolicy.calculate(
        booking.checkInDate,
        new Date(),
      );

      const percentage = policy.percentage;

      console.log('REFUND DEBUG', {
        now: new Date(),
        checkInDate: booking.checkInDate,
        nowTimestamp: Date.now(),
        checkInTimestamp: booking.checkInDate.getTime(),
      });

      if (percentage > 0) {
        const refundAmount = payment.amount.mul(percentage);

        await this.paymentsService.refundPayment({
          paymentId: payment.id,
          amount: refundAmount,
          reason: payload.reason ?? 'Tenant made a refund',
          paymongoReason: 'requested_by_customer',
        });

        await this.prisma.booking.update({
          where: { id: bookId },
          data: { status: BookingStatus.REFUNDED_PAYMENT },
        });
      }
    }

    this.bookingEventPublisher.cancelled({
      bookingId: bookId,
      ownerId: booking.room.boardingHouse.ownerId,
      tenantId: updated.tenantId,
      data: {
        tenantId: updated.tenantId,
        ownerId: booking.room.boardingHouse.ownerId,
        bhId: booking.boardingHouseId,
        roomId: booking.roomId,
        resourceType: PrismaResourceType.BOOKING,
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
      where: {
        id: bookId,
      },
      include: {
        room: {
          select: {
            price: true,
            maxCapacity: true,
            currentCapacity: true,
            boardingHouse: {
              select: {
                ownerId: true,
              },
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

    return booking;
  }

  async cancelExpiredBookings() {
    const expiredBookings = await this.prisma.booking.findMany({
      where: {
        status: BookingStatus.AWAITING_PAYMENT,
        createdAt: {
          lt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 24 hours
        },
        isDeleted: false,
      },
    });

    for (const booking of expiredBookings) {
      await this.cancelBooking(booking.id, {
        userId: booking.tenantId,
        role: 'TENANT',
        reason:
          'Booking automatically cancelled due to unpaid reservation (24h timeout)',
      });
    }

    return expiredBookings.length;
  }

  public async confirmBookingPayment(bookingId: number) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: { room: true },
    });

    if (!booking) throw new NotFoundException('Booking not found');

    // Increment room currentCapacity
    await this.prisma.room.update({
      where: { id: booking.roomId },
      data: {
        currentCapacity: { increment: booking.occupantsCount },
      },
    });

    // Update booking status
    return this.prisma.booking.update({
      where: { id: bookingId },
      data: { status: BookingStatus.COMPLETED_BOOKING },
    });
  }

  private buildRefundSummary(params: {
    paymentAmount: Prisma.Decimal;
    refundAmount: Prisma.Decimal;
    percentage: number;
    reason: string;
    paymongoReason: string;
  }) {
    const { paymentAmount, refundAmount, percentage, reason, paymongoReason } =
      params;

    const total = Number(paymentAmount);
    const refund = Number(refundAmount);

    return {
      totalAmount: total,
      refundAmount: refund,
      refundedPercentage: percentage,
      nonRefundableAmount: total - refund,
      reason,
      paymongoReason,
      isFullyRefunded: percentage === 1,
      isNoRefund: percentage === 0,
    };
  }
}
// PENDING_REQUEST
// AWAITING_PAYMENT
// PAYMENT_APPROVAL
// CANCELLED_BOOKING
// REJECTED_BOOKING
// COMPLETED_BOOKING
