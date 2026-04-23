import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  InternalServerErrorException,
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
  CurrencyType,
  BookingChargeType,
  PurchaseType,
  BookingChargeStatus,
  BookingExtensionStatus,
} from '@prisma/client';

import {
  CreateBookingDto,
  PatchTenantBookDto,
  PatchApprovePayloadDTO,
  PatchBookingRejectionPayloadDTO,
  FindAllBookingFilterDto,
  CancelBookingDto,
  RejectExtensionDto,
  ApproveExtensionDto,
  RequestExtensionDto,
} from './dto/dtos';
import { ImageService } from 'src/infrastructure/image/image.service';
import { ResourceType } from 'src/infrastructure/file-upload/types/resources-types';
import { UserUnionService } from '../auth/userUnion.service';
import { BookingEventPublisher } from './events/bookings.publisher';
import { PaymentsService } from '../payments/payments.service';
import { RefundPolicy } from './refund.policy';
import { Logger } from 'src/common/logger/logger.service';

/**
 * TODO: to do, owner cannot accept or do anything on the bookings if they ran out of subs
 */

@Injectable()
export class BookingsService {
  constructor(
    @Inject('IDatabaseService') private readonly database: IDatabaseService,
    private readonly userUnionService: UserUnionService,
    private readonly paymentsService: PaymentsService,
    private readonly imageService: ImageService,
    private readonly bookingEventPublisher: BookingEventPublisher,
    private readonly refundPolicy: RefundPolicy,
    private readonly logger: Logger,
  ) {}

  private get prisma() {
    return this.database.getClient();
  }

  async createBooking(roomId: number, booking: CreateBookingDto) {
    const occupants = booking.occupantsCount ?? 1;

    if (occupants <= 0) {
      throw new BadRequestException('Invalid occupants count');
    }

    const now = new Date();

    if (booking.startDate <= now) {
      throw new BadRequestException('Check-in date must be in the future');
    }

    const existingActiveBooking = await this.prisma.booking.findFirst({
      where: {
        tenantId: booking.tenantId,
        status: BookingStatus.COMPLETED_BOOKING,
        checkInDate: { lte: now },
        checkOutDate: { gte: now },
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

    if (room.currentCapacity + occupants > room.maxCapacity) {
      throw new BadRequestException(
        `Room capacity exceeded. Available slots: ${
          room.maxCapacity - room.currentCapacity
        }`,
      );
    }

    const totalAmount = new Prisma.Decimal(room.price).mul(occupants);

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
        totalAmount,
        currency: CurrencyType.PHP,
        tenantMessage: booking.note ?? null,
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

  async findActive(id: number) {
    if (!id) {
      throw new NotFoundException('No Tenant Id found');
    }

    const now = new Date();

    const [active, upcoming] = await Promise.all([
      this.prisma.booking.findFirst({
        where: {
          tenantId: id,
          status: BookingStatus.COMPLETED_BOOKING,
          checkInDate: { lte: now },
          checkOutDate: { gte: now },
          isDeleted: false,
        },
        include: {
          room: {
            include: {
              boardingHouse: true,
            },
          },
          boardingHouse: true,
        },
        orderBy: {
          checkInDate: 'asc',
        },
      }),

      this.prisma.booking.findFirst({
        where: {
          tenantId: id,
          status: BookingStatus.COMPLETED_BOOKING,
          checkInDate: { gt: now },
          isDeleted: false,
        },
        include: {
          room: {
            include: {
              boardingHouse: true,
            },
          },
          boardingHouse: true,
        },
        orderBy: {
          checkInDate: 'asc',
        },
      }),
    ]);

    return {
      active,
      upcoming,
    };
  }

  async getBookingStatus(bookId: number) {
    if (!bookId) {
      throw new NotFoundException('Book ID is missing');
    }

    const booking = await this.prisma.booking.findUnique({
      where: { id: bookId },
      include: {
        charges: {
          include: {
            payment: true,
          },
          orderBy: { sequence: 'asc' },
        },
      },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    const nextPendingCharge =
      booking.charges.find((c) => c.isRequired && c.status === 'PENDING') ??
      null;

    const paidCharges = booking.charges.filter((c) => c.status === 'PAID');

    return {
      bookingId: booking.id,
      bookingStatus: booking.status,
      confirmedAt: booking.confirmedAt,
      nextPendingCharge: nextPendingCharge
        ? {
            id: nextPendingCharge.id,
            type: nextPendingCharge.type,
            amount: nextPendingCharge.amount,
            dueDate: nextPendingCharge.dueDate,
            paymentStatus: nextPendingCharge.payment?.status ?? null,
          }
        : null,
      charges: booking.charges.map((charge) => ({
        id: charge.id,
        type: charge.type,
        status: charge.status,
        amount: charge.amount,
        dueDate: charge.dueDate,
        paidAt: charge.paidAt,
        paymentStatus: charge.payment?.status ?? null,
      })),
      totals: {
        totalCharges: booking.charges.length,
        paidCharges: paidCharges.length,
        remainingCharges: booking.charges.filter((c) => c.status === 'PENDING')
          .length,
      },
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

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    const paidPayments = await this.getPaidChargePaymentsForBooking(bookId);

    if (!paidPayments.length) {
      return {
        refundStatus: RefundStatus.NONE,
        refundable: false,
        percentage: 0,
        refundAmount: '0',
        originalAmount: '0',
        currency: booking.currency,
        reason: 'No paid booking charges found',
        checkInDate: booking.checkInDate,
        now: new Date(),
      };
    }

    const now = new Date();
    const policy = this.refundPolicy.calculate(
      booking.checkInDate,
      now,
      booking.createdAt,
    );

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

    const originalAmount = paidPayments.reduce(
      (sum, payment) => sum.add(payment.amount),
      new Prisma.Decimal(0),
    );

    const refundAmount = originalAmount.mul(percentage);

    return {
      refundStatus,
      refundable: percentage > 0,
      percentage,
      refundAmount: refundAmount.toString(),
      originalAmount: originalAmount.toString(),
      currency: paidPayments[0]?.currency ?? booking.currency,
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
    const {
      ownerId,
      message,
      reservationFee,
      advancePayment,
      securityDeposit,
    } = payload;

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

    const chargesToCreate = this.buildInitialBookingCharges({
      bookingId: bookId,
      reservationFee,
      advancePayment,
      securityDeposit,
      checkInDate: booking.checkInDate,
    });

    const now = new Date();

    const updatedBooking = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.booking.update({
        where: { id: bookId },
        data: {
          status: BookingStatus.AWAITING_PAYMENT,
          ownerMessage: message ?? booking.ownerMessage,
          approvedAt: now,
          updatedAt: now,
        },
      });

      await tx.bookingCharge.createMany({
        data: chargesToCreate,
      });

      return updated;
    });

    const firstCharge = await this.prisma.bookingCharge.findFirst({
      where: {
        bookingId: bookId,
        status: 'PENDING',
      },
      orderBy: { sequence: 'asc' },
    });

    if (!firstCharge) {
      throw new InternalServerErrorException(
        'Booking was approved but no initial charge was created',
      );
    }

    let payment: { paymentId: number; clientSecret: string } | null = null;

    try {
      payment = await this.paymentsService.createBookingChargePayment({
        bookingId: bookId,
        bookingChargeId: firstCharge.id,
        tenantId: booking.tenantId,
        ownerId,
        amount: firstCharge.amount,
        purchaseType:
          firstCharge.type === BookingChargeType.RESERVATION_FEE
            ? PurchaseType.RESERVATION_FEE
            : firstCharge.type === BookingChargeType.ADVANCE_PAYMENT
              ? PurchaseType.ADVANCE_PAYMENT
              : firstCharge.type === BookingChargeType.DEPOSIT
                ? PurchaseType.DEPOSIT
                : PurchaseType.ROOM_BOOKING,
      });
    } catch (err) {
      this.logger.error(
        `Failed to create payment for booking ${bookId}`,
        err instanceof Error ? err.stack : String(err),
      );

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
      firstCharge: {
        id: firstCharge.id,
        type: firstCharge.type,
        amount: firstCharge.amount,
        dueDate: firstCharge.dueDate,
        sequence: firstCharge.sequence,
      },
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

    // Catch-up protection:
    // if already refunded/cancelled but slot somehow was not released yet, release it once
    if (
      (booking.status === BookingStatus.REFUNDED_PAYMENT ||
        booking.status === BookingStatus.CANCELLED_BOOKING) &&
      booking.occupancyReleased
    ) {
      return booking;
    }

    const shouldReleaseOccupancy =
      booking.status === BookingStatus.COMPLETED_BOOKING &&
      !booking.occupancyReleased;

    let finalBooking = await this.prisma.booking.update({
      where: { id: bookId },
      data: {
        status: BookingStatus.CANCELLED_BOOKING,
        ownerMessage: role === 'OWNER' ? payload.reason : booking.ownerMessage,
        tenantMessage:
          role === 'TENANT' ? payload.reason : booking.tenantMessage,
        updatedAt: new Date(),
      },
    });

    const paidPayments = await this.getPaidChargePaymentsForBooking(bookId);

    if (paidPayments.length && new Date() < booking.checkInDate) {
      const policy = this.refundPolicy.calculate(
        booking.checkInDate,
        new Date(),
        booking.createdAt,
      );

      const percentage = policy.percentage;

      if (percentage > 0) {
        for (const payment of paidPayments) {
          const refundAmount = payment.amount.mul(percentage);

          if (refundAmount.gt(0)) {
            await this.paymentsService.refundPayment({
              paymentId: payment.id,
              amount: refundAmount,
              reason: payload.reason ?? 'Booking cancelled before check-in',
              paymongoReason: 'requested_by_customer',
            });

            if (payment.bookingChargeId && percentage === 1) {
              await this.prisma.bookingCharge.update({
                where: { id: payment.bookingChargeId },
                data: {
                  status: BookingChargeStatus.REFUNDED,
                },
              });
            }
          }
        }

        finalBooking = await this.prisma.booking.update({
          where: { id: bookId },
          data: { status: BookingStatus.REFUNDED_PAYMENT },
        });
      }
    }

    // Release occupied slot if this booking had already consumed one
    if (shouldReleaseOccupancy) {
      await this.prisma.$transaction(async (tx) => {
        const room = await tx.room.findUnique({
          where: { id: booking.roomId },
        });

        if (!room) return;

        const nextCapacity = Math.max(
          room.currentCapacity - (booking.occupantsCount || 1),
          0,
        );

        const nextAvailability = nextCapacity < room.maxCapacity;

        await tx.room.update({
          where: { id: room.id },
          data: {
            currentCapacity: nextCapacity,
            availabilityStatus: nextAvailability,
          },
        });

        await tx.roomAvailabilityLog.create({
          data: {
            roomId: room.id,
            status: nextAvailability,
            reason: `Auto-release after cancellation/refund of booking ${booking.reference}`,
          },
        });

        await tx.booking.update({
          where: { id: booking.id },
          data: {
            occupancyReleased: true,
            occupancyReleasedAt: new Date(),
          },
        });
      });

      finalBooking = await this.prisma.booking.findUniqueOrThrow({
        where: { id: bookId },
      });
    }

    this.bookingEventPublisher.cancelled({
      bookingId: bookId,
      ownerId: booking.room.boardingHouse.ownerId,
      tenantId: booking.tenantId,
      reason: payload.reason,
      data: {
        tenantId: booking.tenantId,
        ownerId: booking.room.boardingHouse.ownerId,
        bhId: booking.boardingHouseId,
        roomId: booking.roomId,
        resourceType: PrismaResourceType.BOOKING,
      },
    });

    return finalBooking;
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

  async expireOverdueReservationCharges() {
    const now = new Date();

    const bookings = await this.prisma.booking.findMany({
      where: {
        status: BookingStatus.AWAITING_PAYMENT,
        isDeleted: false,
        charges: {
          some: {
            type: BookingChargeType.RESERVATION_FEE,
            status: BookingChargeStatus.PENDING,
            expiresAt: { lte: now },
          },
        },
      },
      include: {
        charges: true,
      },
    });

    for (const booking of bookings) {
      await this.prisma.$transaction(async (tx) => {
        const expiredChargeIds = booking.charges
          .filter(
            (c) =>
              c.type === BookingChargeType.RESERVATION_FEE &&
              c.status === BookingChargeStatus.PENDING &&
              c.expiresAt &&
              c.expiresAt <= now,
          )
          .map((c) => c.id);

        if (!expiredChargeIds.length) return;

        await tx.bookingCharge.updateMany({
          where: { id: { in: expiredChargeIds } },
          data: { status: BookingChargeStatus.EXPIRED },
        });

        await tx.payment.updateMany({
          where: {
            bookingChargeId: { in: expiredChargeIds },
            status: {
              in: [PaymentStatus.PENDING, PaymentStatus.REQUIRES_ACTION],
            },
          },
          data: {
            status: PaymentStatus.EXPIRED,
          },
        });

        await tx.booking.update({
          where: { id: booking.id },
          data: {
            status: BookingStatus.CANCELLED_BOOKING,
            tenantMessage:
              'Booking automatically cancelled because reservation fee was not paid on time.',
          },
        });
      });
    }

    return bookings.length;
  }
  async expireOverdueExtensionCharges() {
    const now = new Date();

    const overdueExtensionCharges = await this.prisma.bookingCharge.findMany({
      where: {
        type: BookingChargeType.EXTENSION_PAYMENT,
        status: BookingChargeStatus.PENDING,
        dueDate: { lte: now },
        booking: {
          status: BookingStatus.COMPLETED_BOOKING,
          occupancyReleased: false,
          isDeleted: false,
        },
      },
      include: {
        booking: true,
        bookingExtensionRequest: true,
      },
      orderBy: {
        bookingId: 'asc',
      },
    });

    if (!overdueExtensionCharges.length) return 0;

    let processedCount = 0;

    for (const charge of overdueExtensionCharges) {
      try {
        await this.prisma.$transaction(async (tx) => {
          const freshCharge = await tx.bookingCharge.findUnique({
            where: { id: charge.id },
            include: {
              bookingExtensionRequest: true,
            },
          });

          if (!freshCharge) return;
          if (freshCharge.status !== BookingChargeStatus.PENDING) return;

          await tx.bookingCharge.update({
            where: { id: freshCharge.id },
            data: {
              status: BookingChargeStatus.EXPIRED,
            },
          });

          await this.expirePendingPaymentsForCharges(tx, [freshCharge.id]);

          const extensionRequestId =
            freshCharge.bookingExtensionRequest?.id ??
            (freshCharge.metadata as { extensionRequestId?: number } | null)
              ?.extensionRequestId ??
            null;

          if (extensionRequestId) {
            await tx.bookingExtensionRequest.update({
              where: { id: extensionRequestId },
              data: {
                status: BookingExtensionStatus.CANCELLED,
                updatedAt: now,
              },
            });
          }
        });

        processedCount += 1;
        this.logger.log(
          `Expired extension charge ${charge.id} for booking ${charge.bookingId}`,
        );
      } catch (error) {
        this.logger.error(
          `Failed expiring extension charge ${charge.id}`,
          error instanceof Error ? error.stack : String(error),
        );
      }
    }

    return processedCount;
  }
  async expireOverduePreCheckInCharges() {
    const now = new Date();

    const overdueCharges = await this.prisma.bookingCharge.findMany({
      where: {
        type: {
          in: [BookingChargeType.ADVANCE_PAYMENT, BookingChargeType.DEPOSIT],
        },
        status: BookingChargeStatus.PENDING,
        dueDate: { lte: now },
        booking: {
          status: BookingStatus.AWAITING_PAYMENT,
          isDeleted: false,
        },
      },
      include: {
        booking: true,
      },
      orderBy: {
        bookingId: 'asc',
      },
    });

    if (!overdueCharges.length) return 0;

    const grouped = new Map<number, typeof overdueCharges>();

    for (const charge of overdueCharges) {
      if (!grouped.has(charge.bookingId)) {
        grouped.set(charge.bookingId, []);
      }
      grouped.get(charge.bookingId)!.push(charge);
    }

    let processedCount = 0;

    for (const [bookingId, charges] of grouped.entries()) {
      try {
        await this.prisma.$transaction(async (tx) => {
          const booking = await tx.booking.findUnique({
            where: { id: bookingId },
          });

          if (!booking) return;
          if (booking.status !== BookingStatus.AWAITING_PAYMENT) return;

          const pendingRequiredCharges = await tx.bookingCharge.findMany({
            where: {
              bookingId,
              isRequired: true,
              status: BookingChargeStatus.PENDING,
            },
            select: { id: true },
          });

          const pendingChargeIds = pendingRequiredCharges.map((c) => c.id);

          if (!pendingChargeIds.length) return;

          await tx.bookingCharge.updateMany({
            where: {
              id: { in: pendingChargeIds },
            },
            data: {
              status: BookingChargeStatus.EXPIRED,
            },
          });

          await this.expirePendingPaymentsForCharges(tx, pendingChargeIds);

          await tx.booking.update({
            where: { id: bookingId },
            data: {
              status: BookingStatus.CANCELLED_BOOKING,
              tenantMessage:
                booking.tenantMessage ??
                'Booking automatically cancelled because required pre-check-in charges were not paid on time.',
              updatedAt: now,
            },
          });
        });

        processedCount += 1;
        this.logger.log(
          `Cancelled booking ${bookingId} because pre-check-in charges expired`,
        );
      } catch (error) {
        this.logger.error(
          `Failed expiring pre-check-in charges for booking ${bookingId}`,
          error instanceof Error ? error.stack : String(error),
        );
      }
    }

    return processedCount;
  }

  async releaseEndedBookingSlots() {
    const now = new Date();

    const expiredBookings = await this.prisma.booking.findMany({
      where: {
        status: BookingStatus.COMPLETED_BOOKING,
        checkOutDate: { lte: now },
        occupancyReleased: false,
        isDeleted: false,
      },
      include: {
        room: true,
        boardingHouse: true,
      },
    });

    if (!expiredBookings.length) return 0;

    let processedCount = 0;

    for (const booking of expiredBookings) {
      try {
        await this.prisma.$transaction(async (tx) => {
          const room = await tx.room.findUnique({
            where: { id: booking.roomId },
          });

          if (!room) return;

          const nextCapacity = Math.max(
            room.currentCapacity - (booking.occupantsCount || 1),
            0,
          );

          const nextAvailability = nextCapacity < room.maxCapacity;

          await tx.room.update({
            where: { id: room.id },
            data: {
              currentCapacity: nextCapacity,
              availabilityStatus: nextAvailability,
            },
          });

          await tx.roomAvailabilityLog.create({
            data: {
              roomId: room.id,
              status: nextAvailability,
              reason: `Auto-release after booking ${booking.reference} checkout`,
            },
          });

          await tx.booking.update({
            where: { id: booking.id },
            data: {
              occupancyReleased: true,
              occupancyReleasedAt: now,
            },
          });
        });

        this.bookingEventPublisher.ended({
          bookingId: booking.id,
          tenantId: booking.tenantId,
          ownerId: +booking.boardingHouse.ownerId,
          data: {
            resourceType: 'BOOKING',
            ownerId: +booking.boardingHouse.ownerId,
            tenantId: booking.tenantId,
            roomId: booking.roomId,
            bhId: booking.boardingHouseId,
          },
        });

        processedCount += 1;

        this.logger.log(
          `Released occupancy for booking ${booking.reference} (room ${booking.roomId})`,
        );
      } catch (error) {
        this.logger.error(
          `Failed releasing booking ${booking.reference}`,
          error instanceof Error ? error.stack : String(error),
        );
      }
    }

    return processedCount;
  }

  // public async confirmBookingPayment(bookingId: number) {
  //   const booking = await this.prisma.booking.findUnique({
  //     where: { id: bookingId },
  //     include: { room: true },
  //   });

  //   if (!booking) throw new NotFoundException('Booking not found');

  //   // Increment room currentCapacity
  //   await this.prisma.room.update({
  //     where: { id: booking.roomId },
  //     data: {
  //       currentCapacity: { increment: booking.occupantsCount },
  //     },
  //   });

  //   // Update booking status
  //   return this.prisma.booking.update({
  //     where: { id: bookingId },
  //     data: { status: BookingStatus.COMPLETED_BOOKING },
  //   });
  // }

  private async expirePendingPaymentsForCharges(
    tx: Prisma.TransactionClient,
    chargeIds: number[],
  ) {
    if (!chargeIds.length) return;

    await tx.payment.updateMany({
      where: {
        bookingChargeId: { in: chargeIds },
        status: {
          in: [PaymentStatus.PENDING, PaymentStatus.REQUIRES_ACTION],
        },
      },
      data: {
        status: PaymentStatus.EXPIRED,
      },
    });
  }

  private buildInitialBookingCharges(params: {
    bookingId: number;
    reservationFee: number;
    advancePayment: number;
    securityDeposit?: number;
    checkInDate: Date;
  }) {
    const {
      bookingId,
      reservationFee,
      advancePayment,
      securityDeposit,
      checkInDate,
    } = params;

    const now = new Date();
    const reservationDueDate = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    if (
      reservationFee < 0 ||
      advancePayment < 0 ||
      (securityDeposit ?? 0) < 0
    ) {
      throw new BadRequestException('Booking charges cannot be negative');
    }

    // Reservation fee is credited against the advance payment
    if (reservationFee > advancePayment && advancePayment > 0) {
      throw new BadRequestException(
        'Reservation fee cannot be greater than the advance payment because it is deducted from it.',
      );
    }

    const deductibleReservation = Math.min(reservationFee, advancePayment);
    const adjustedAdvancePayment = Math.max(
      advancePayment - deductibleReservation,
      0,
    );

    const charges: Prisma.BookingChargeCreateManyInput[] = [];

    if (reservationFee > 0) {
      charges.push({
        bookingId,
        type: BookingChargeType.RESERVATION_FEE,
        amount: new Prisma.Decimal(reservationFee),
        currency: CurrencyType.PHP,
        sequence: 1,
        isRequired: true,
        dueDate: reservationDueDate,
        expiresAt: reservationDueDate,
        description: 'Reservation fee to secure the approved booking slot',
      });
    }

    if (adjustedAdvancePayment > 0) {
      charges.push({
        bookingId,
        type: BookingChargeType.ADVANCE_PAYMENT,
        amount: new Prisma.Decimal(adjustedAdvancePayment),
        currency: CurrencyType.PHP,
        sequence: 2,
        isRequired: true,
        dueDate: checkInDate,
        description:
          'Advance payment for the approved stay period after reservation fee credit',
      });
    }

    if ((securityDeposit ?? 0) > 0) {
      charges.push({
        bookingId,
        type: BookingChargeType.DEPOSIT,
        amount: new Prisma.Decimal(securityDeposit!),
        currency: CurrencyType.PHP,
        sequence: 3,
        isRequired: true,
        dueDate: checkInDate,
        description: 'Security deposit required before occupancy',
      });
    }

    if (!charges.length) {
      throw new BadRequestException(
        'At least one booking charge must be greater than zero',
      );
    }

    return charges;
  }

  async requestExtension(bookId: number, payload: RequestExtensionDto) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookId },
      include: {
        room: {
          select: {
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

    if (booking.tenantId !== payload.tenantId) {
      throw new ForbiddenException(
        'You are not authorized to request an extension for this booking',
      );
    }

    if (booking.status !== BookingStatus.COMPLETED_BOOKING) {
      throw new BadRequestException(
        'Only confirmed bookings can request an extension',
      );
    }

    if (booking.occupancyReleased) {
      throw new BadRequestException(
        'Cannot extend a booking that has already been checked out',
      );
    }

    const requestedCheckOutDate = new Date(payload.requestedCheckOutDate);

    if (isNaN(requestedCheckOutDate.getTime())) {
      throw new BadRequestException('Invalid requested checkout date');
    }

    if (requestedCheckOutDate <= booking.checkOutDate) {
      throw new BadRequestException(
        'Requested checkout date must be later than the current checkout date',
      );
    }

    const existingOpenRequest =
      await this.prisma.bookingExtensionRequest.findFirst({
        where: {
          bookingId: bookId,
          status: {
            in: [
              BookingExtensionStatus.PENDING,
              BookingExtensionStatus.APPROVED_AWAITING_PAYMENT,
            ],
          },
        },
      });

    if (existingOpenRequest) {
      throw new BadRequestException(
        'There is already an open extension request for this booking',
      );
    }

    return this.prisma.bookingExtensionRequest.create({
      data: {
        bookingId: booking.id,
        tenantId: booking.tenantId,
        ownerId: booking.room.boardingHouse.ownerId,
        currentCheckOutDate: booking.checkOutDate,
        requestedCheckOutDate,
        status: BookingExtensionStatus.PENDING,
        reason: payload.reason ?? null,
      },
    });
  }

  async approveExtension(
    bookId: number,
    extensionId: number,
    payload: ApproveExtensionDto,
  ) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookId },
      include: {
        room: {
          select: {
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

    if (booking.room.boardingHouse.ownerId !== payload.ownerId) {
      throw new ForbiddenException(
        'You are not authorized to approve this extension request',
      );
    }

    if (booking.status !== BookingStatus.COMPLETED_BOOKING) {
      throw new BadRequestException('Only confirmed bookings can be extended');
    }

    if (booking.occupancyReleased) {
      throw new BadRequestException(
        'Cannot extend a booking that has already been checked out',
      );
    }

    const extension = await this.prisma.bookingExtensionRequest.findUnique({
      where: { id: extensionId },
    });

    if (!extension || extension.bookingId !== bookId) {
      throw new NotFoundException('Extension request not found');
    }

    if (extension.status !== BookingExtensionStatus.PENDING) {
      throw new BadRequestException(
        'Only pending extension requests can be approved',
      );
    }

    if (payload.extensionAmount <= 0) {
      throw new BadRequestException(
        'Extension payment amount must be greater than zero',
      );
    }

    const result = await this.prisma.$transaction(async (tx) => {
      const latestCharge = await tx.bookingCharge.findFirst({
        where: { bookingId: bookId },
        orderBy: { sequence: 'desc' },
        select: { sequence: true },
      });

      const nextSequence = (latestCharge?.sequence ?? 0) + 1;

      const extensionCharge = await tx.bookingCharge.create({
        data: {
          bookingId: bookId,
          type: BookingChargeType.EXTENSION_PAYMENT,
          status: BookingChargeStatus.PENDING,
          amount: new Prisma.Decimal(payload.extensionAmount),
          currency: CurrencyType.PHP,
          sequence: nextSequence,
          isRequired: true,
          dueDate: extension.currentCheckOutDate,
          description: 'Extension payment approved by owner',
          metadata: {
            extensionRequestId: extension.id,
            currentCheckOutDate: extension.currentCheckOutDate.toISOString(),
            requestedCheckOutDate:
              extension.requestedCheckOutDate.toISOString(),
          },
        },
      });

      const updatedExtension = await tx.bookingExtensionRequest.update({
        where: { id: extension.id },
        data: {
          status: BookingExtensionStatus.APPROVED_AWAITING_PAYMENT,
          ownerMessage: payload.message ?? null,
          extensionChargeId: extensionCharge.id,
          approvedAt: new Date(),
        },
      });

      return {
        extensionRequest: updatedExtension,
        extensionCharge,
      };
    });

    return result;
  }

  async rejectExtension(
    bookId: number,
    extensionId: number,
    payload: RejectExtensionDto,
  ) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookId },
      include: {
        room: {
          select: {
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

    if (booking.room.boardingHouse.ownerId !== payload.ownerId) {
      throw new ForbiddenException(
        'You are not authorized to reject this extension request',
      );
    }

    const extension = await this.prisma.bookingExtensionRequest.findUnique({
      where: { id: extensionId },
    });

    if (!extension || extension.bookingId !== bookId) {
      throw new NotFoundException('Extension request not found');
    }

    if (extension.status !== BookingExtensionStatus.PENDING) {
      throw new BadRequestException(
        'Only pending extension requests can be rejected',
      );
    }

    return this.prisma.bookingExtensionRequest.update({
      where: { id: extension.id },
      data: {
        status: BookingExtensionStatus.REJECTED,
        ownerMessage: payload.reason ?? null,
      },
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

  private mapChargeTypeToPurchaseType(type: BookingChargeType): PurchaseType {
    switch (type) {
      case BookingChargeType.RESERVATION_FEE:
        return PurchaseType.RESERVATION_FEE;
      case BookingChargeType.ADVANCE_PAYMENT:
        return PurchaseType.ADVANCE_PAYMENT;
      case BookingChargeType.DEPOSIT:
        return PurchaseType.DEPOSIT;
      case BookingChargeType.EXTENSION_PAYMENT:
        return PurchaseType.EXTENSION_PAYMENT;
      default:
        return PurchaseType.ROOM_BOOKING;
    }
  }

  private async getPaidChargePaymentsForBooking(bookId: number) {
    return this.prisma.payment.findMany({
      where: {
        bookingId: bookId,
        bookingChargeId: { not: null },
        status: PaymentStatus.PAID,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });
  }

  private async getNextPendingCharge(bookingId: number) {
    return this.prisma.bookingCharge.findFirst({
      where: {
        bookingId,
        isRequired: true,
        status: BookingChargeStatus.PENDING,
      },
      orderBy: { sequence: 'asc' },
    });
  }

  //* debug for new booking implemenation

  //* debug for new booking implemenation
}
// PENDING_REQUEST
// AWAITING_PAYMENT
// PAYMENT_APPROVAL
// CANCELLED_BOOKING
// REJECTED_BOOKING
// COMPLETED_BOOKING
