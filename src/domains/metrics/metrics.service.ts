import { Inject, Injectable } from '@nestjs/common';
import { IDatabaseService } from 'src/infrastructure/database/database.interface';
import { subDays } from 'src/infrastructure/shared/utils/subDays';
import { PrismaService } from 'src/infrastructure/database/prisma.service';

@Injectable()
export class MetricsService {
  constructor(
    @Inject('IDatabaseService') private readonly database: IDatabaseService,
  ) {}

  private get prisma(): PrismaService {
    return this.database.getClient();
  }

  /** Users metrics */
  async getUsersMetrics() {
    const prisma = this.prisma;

    const [
      totalTenants,
      totalOwners,
      totalAdmins,
      activeTenants,
      activeOwners,
      verifiedTenants,
      verifiedOwners,
    ] = await Promise.all([
      prisma.tenant.count({ where: { isDeleted: false } }),
      prisma.owner.count({ where: { isDeleted: false } }),
      prisma.admin.count({ where: { isDeleted: false } }),
      prisma.tenant.count({ where: { isActive: true, isDeleted: false } }),
      prisma.owner.count({ where: { isActive: true, isDeleted: false } }),
      prisma.tenant.count({
        where: { verificationLevel: 'FULLY_VERIFIED', isDeleted: false },
      }),
      prisma.owner.count({
        where: { verificationLevel: 'FULLY_VERIFIED', isDeleted: false },
      }),
    ]);

    return {
      total: totalTenants + totalOwners + totalAdmins,
      tenants: {
        total: totalTenants,
        active: activeTenants,
        verified: verifiedTenants,
      },
      owners: {
        total: totalOwners,
        active: activeOwners,
        verified: verifiedOwners,
      },
      admins: { total: totalAdmins },
    };
  }

  /** Properties metrics */
  async getPropertiesMetrics(userId?: number, role?: 'OWNER' | 'TENANT') {
    const prisma = this.prisma;

    const baseHouseWhere: any = { isDeleted: false };
    const baseRoomWhere: any = { isDeleted: false };

    if (userId && role === 'OWNER') {
      baseHouseWhere.ownerId = userId;
      baseRoomWhere.boardingHouse = { ownerId: userId };
    }

    const [
      totalHouses,
      availableHouses,
      totalRooms,
      availableRooms,
      roomTypes,
    ] = await Promise.all([
      prisma.boardingHouse.count({ where: baseHouseWhere }),
      prisma.boardingHouse.count({
        where: { ...baseHouseWhere, availabilityStatus: true },
      }),
      prisma.room.count({ where: baseRoomWhere }),
      prisma.room.count({
        where: { ...baseRoomWhere, availabilityStatus: true },
      }),
      prisma.room.groupBy({
        by: ['roomType'],
        where: baseRoomWhere,
        _count: { roomType: true },
      }),
    ]);

    return {
      totalHouses,
      totalRooms,
      boardingHouses: { total: totalHouses, available: availableHouses },
      rooms: { total: totalRooms, available: availableRooms, types: roomTypes },
    };
  }

  /** Bookings metrics */
  async getBookingsMetrics(
    timeframe?: 'week' | 'month',
    userId?: number,
    role?: 'OWNER' | 'TENANT',
  ) {
    const prisma = this.prisma;

    const baseWhere: any = {
      isDeleted: false,
    };

    // Timeframe filter
    if (timeframe === 'week') {
      baseWhere.dateBooked = { gte: subDays(new Date(), 7) };
    }

    if (timeframe === 'month') {
      baseWhere.dateBooked = { gte: subDays(new Date(), 30) };
    }

    // ✅ Correct user filter
    if (userId && role === 'OWNER') {
      baseWhere.boardingHouse = {
        ownerId: userId,
      };
    }

    if (userId && role === 'TENANT') {
      baseWhere.tenantId = userId;
    }

    const [totalBookings, statusCounts, bookingTypes] = await Promise.all([
      prisma.booking.count({ where: baseWhere }),
      prisma.booking.groupBy({
        by: ['status'],
        where: baseWhere,
        _count: { status: true },
      }),
      prisma.booking.groupBy({
        by: ['bookingType'],
        where: baseWhere,
        _count: { bookingType: true },
      }),
    ]);

    return {
      totalBookings,
      statusCounts,
      bookingTypes,
    };
  }

  /** Payments metrics */
  async getPaymentsMetrics(
    timeframe?: 'week' | 'month',
    userId?: number,
    role?: 'OWNER' | 'TENANT',
  ) {
    const prisma = this.prisma;
    const baseWhere: any = {
      bookingId: { not: null },
      status: { not: 'CANCELLED' },
    };

    // Timeframe filter
    if (timeframe === 'week')
      baseWhere.createdAt = { gte: subDays(new Date(), 7) };
    if (timeframe === 'month')
      baseWhere.createdAt = { gte: subDays(new Date(), 30) };

    // User filter
    if (userId) {
      if (role === 'OWNER') baseWhere.ownerId = userId;
      if (role === 'TENANT') baseWhere.userId = userId;
    }

    const [totalPayments, paidPayments, revenue, paymentStatuses] =
      await Promise.all([
        prisma.payment.count({ where: baseWhere }),
        prisma.payment.count({ where: { ...baseWhere, status: 'PAID' } }),
        prisma.payment.aggregate({
          _sum: { amount: true },
          where: { ...baseWhere, status: 'PAID' },
        }),
        prisma.payment.groupBy({
          by: ['status'],
          _count: { status: true },
          where: baseWhere,
        }),
      ]);

    return {
      totalPayments,
      paidPayments,
      revenue: revenue._sum.amount || 0,
      statusCounts: paymentStatuses,
    };
  }

  /** Subscriptions metrics */
  async getSubscriptionsMetrics(
    timeframe?: 'week' | 'month',
    userId?: number,
    role?: 'OWNER' | 'TENANT',
  ) {
    const prisma = this.prisma;
    const baseWhere: any = {};

    if (timeframe === 'week')
      baseWhere.createdAt = { gte: subDays(new Date(), 7) };
    if (timeframe === 'month')
      baseWhere.createdAt = { gte: subDays(new Date(), 30) };

    // User filter
    if (userId) baseWhere.userId = userId;
    if (role) baseWhere.userType = role === 'OWNER' ? 'OWNER' : 'TENANT';

    const [totalSubscriptions, activeSubscriptions, inactiveSubscriptions] =
      await Promise.all([
        prisma.subscription.count({ where: baseWhere }),
        prisma.subscription.count({
          where: { ...baseWhere, status: 'ACTIVE' },
        }),
        prisma.subscription.count({
          where: { ...baseWhere, status: 'INACTIVE' },
        }),
      ]);

    return {
      totalSubscriptions,
      active: activeSubscriptions,
      inactive: inactiveSubscriptions,
    };
  }

  /** Reviews metrics */
  async getReviewsMetrics(userId?: number, role?: 'OWNER' | 'TENANT') {
    const prisma = this.prisma;

    const baseWhere: any = {
      isDeleted: false,
    };

    if (userId && role === 'TENANT') {
      baseWhere.tenantId = userId;
    }

    if (userId && role === 'OWNER') {
      baseWhere.boardingHouse = {
        ownerId: userId,
      };
    }

    const totalReviews = await prisma.review.count({ where: baseWhere });

    const avgRatingRaw = await prisma.review.aggregate({
      _avg: { rating: true },
      where: baseWhere,
    });

    return {
      totalReviews,
      averageRating: avgRatingRaw._avg.rating || 0,
    };
  }

  /** Overview metrics: combines multiple summaries for dashboard */
  async getOverviewMetrics(
    timeframe?: 'week' | 'month',
    userId?: number,
    role?: 'OWNER' | 'TENANT',
  ) {
    const [users, properties, bookings, payments, subscriptions, reviews] =
      await Promise.all([
        this.getUsersMetrics(),
        this.getPropertiesMetrics(userId, role),
        this.getBookingsMetrics(timeframe, userId, role),
        this.getPaymentsMetrics(timeframe, userId, role),
        this.getSubscriptionsMetrics(timeframe, userId, role),
        this.getReviewsMetrics(userId, role),
      ]);

    return {
      totalSections: 6,
      users,
      properties,
      bookings,
      payments,
      subscriptions,
      reviews,
    };
  }
}
