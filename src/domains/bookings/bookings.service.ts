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
      data: { status: BookingStatus.PENDING_REQUEST },
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

    // Room filter
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
            boardingHouse: { select: { id: true, name: true, ownerId: true } },
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
      throw new BadRequestException('no book id provided');
    }

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
      console.error('Only pending requests can be approved by the owner');
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

    let payment: { paymentId: number; clientSecret: string } | null = null;
    try {
      payment = await this.paymentService.createBookingPayment({
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
      tenantId: approveBooking.tenantId,
      ownerId: ownerId,
      data: {
        tenantId: approveBooking.tenantId,
        ownerId: ownerId,
        roomId: approveBooking.roomId,
        bhId: approveBooking.boardingHouseId,
        resourceType: PrismaResourceType.BOOKING,
      },
    });

    return {
      ...approveBooking,
      paymentClientSecret: payment?.clientSecret,
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

    this.bookingEventPublisher.cancelled({
      bookingId: bookId,
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
          // Use select for EVERYTHING inside this block
          select: {
            price: true, // The scalar field you wanted
            boardingHouse: {
              // The relation you wanted
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

    return booking; // ✅ return it so the caller can use the data directly
  }
}
// PENDING_REQUEST
// AWAITING_PAYMENT
// PAYMENT_APPROVAL
// CANCELLED_BOOKING
// REJECTED_BOOKING
// COMPLETED_BOOKING
