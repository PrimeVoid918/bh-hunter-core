import { Inject, Injectable } from '@nestjs/common';
import { IDatabaseService } from 'src/infrastructure/database/database.interface';
import { subDays, subMonths } from 'src/infrastructure/shared/utils/subDays';
import { PrismaService } from 'src/infrastructure/database/prisma.service';
import { BookingStatus } from '@prisma/client';

@Injectable()
export class MetricsService {
  constructor(
    @Inject('IDatabaseService') private readonly database: IDatabaseService,
  ) {}

  private get prisma(): PrismaService {
    return this.database.getClient();
  }

  //* Users metrics
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

  //* Properties metrics
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

  //* Bookings metrics
  async getBookingsMetrics(
    timeframe?: 'week' | 'month',
    userId?: number,
    role?: 'OWNER' | 'TENANT',
    from?: Date,
    to?: Date,
  ) {
    const prisma = this.prisma;
    const { startDate, endDate } = this.resolveDateRange(timeframe, from, to);

    const baseWhere: any = {
      status: { not: 'CANCELLED_BOOKING' },
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    };

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

  //* Payments metrics
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

  //* Subscriptions metrics
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
    if (userId) baseWhere.ownerId = userId;

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

  //* Reviews metrics
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

  //* Overview metrics: combines multiple summaries for dashboard
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

  // Financial Report
  async getFinancialReports(
    timeframe?: 'week' | 'month',
    from?: Date,
    to?: Date,
  ) {
    // resolve date range
    const { startDate, endDate } = this.resolveDateRange(timeframe, from, to);

    // fetch payments
    const payments = await this.prisma.payment.findMany({
      where: { createdAt: { gte: startDate, lte: endDate } },
      select: {
        amount: true,
        status: true,
        purchaseType: true,
        createdAt: true,
        ownerId: true,
      },
    });

    const normalized = payments.map((p) => ({
      amount: Number(p.amount),
      status: p.status,
      type: p.purchaseType,
      date: p.createdAt,
      ownerId: p.ownerId,
    }));

    // global aggregates
    const totalRevenue = normalized
      .filter((p) => p.status === 'PAID')
      .reduce((s, p) => s + p.amount, 0);

    const totalPaid = normalized
      .filter((p) => p.status === 'PAID')
      .reduce((s, p) => s + p.amount, 0);
    const totalPending = normalized
      .filter((p) => p.status !== 'PAID')
      .reduce((s, p) => s + p.amount, 0);

    const bookingRevenue = normalized
      .filter((p) => p.type === 'ROOM_BOOKING' && p.status === 'PAID')
      .reduce((s, p) => s + p.amount, 0);

    const subscriptionRevenue = normalized
      .filter((p) => p.type === 'SUBSCRIPTION' && p.status === 'PAID')
      .reduce((s, p) => s + p.amount, 0);

    const statusBreakdown = {
      paid: totalPaid,
      pending: totalPending,
      failed: normalized
        .filter((p) => p.status === 'FAILED')
        .reduce((s, p) => s + p.amount, 0),
    };

    // time series (for charts)
    const groupByDate: Record<string, any> = {};

    for (const p of normalized) {
      const date = p.date.toISOString().split('T')[0];
      if (!groupByDate[date]) {
        groupByDate[date] = { date, revenue: 0, bookings: 0, subscriptions: 0 };
      }
      groupByDate[date].revenue += p.amount;
      if (p.type === 'ROOM_BOOKING') groupByDate[date].bookings += 1;
      if (p.type === 'SUBSCRIPTION') groupByDate[date].subscriptions += 1;
    }

    const timeseries = Object.values(groupByDate).sort((a, b) =>
      a.date.localeCompare(b.date),
    );

    // per-owner breakdown
    const ownerMap = new Map<number, any>();

    for (const p of normalized) {
      const date = p.date.toISOString().split('T')[0];

      if (!groupByDate[date]) {
        groupByDate[date] = {
          date,
          revenue: 0,
          bookings: 0,
          subscriptions: 0,
        };
      }

      if (p.status === 'PAID') {
        groupByDate[date].revenue += p.amount;

        if (p.type === 'ROOM_BOOKING') groupByDate[date].bookings += 1;
        if (p.type === 'SUBSCRIPTION') groupByDate[date].subscriptions += 1;
      }
    }

    // ensure all owners appear even with 0 payments
    const owners = await this.prisma.owner.findMany({
      select: { id: true, firstname: true, lastname: true },
    });

    const items = owners.map((o) => {
      const data = ownerMap.get(o.id) || {};
      return {
        ownerId: o.id,
        ownerName: `${o.firstname ?? ''} ${o.lastname ?? ''}`.trim(),
        totalPayments: data.totalPayments ?? 0,
        paidPayments: data.paidPayments ?? 0,
        revenue: data.revenue ?? 0,
      };
    });

    // global bookings & subscriptions count
    const totalBookings = await this.prisma.booking.count({
      where: { createdAt: { gte: startDate, lte: endDate } },
    });

    const totalSubscriptions = await this.prisma.subscription.count({
      where: { createdAt: { gte: startDate, lte: endDate } },
    });

    // final response
    return {
      timeframe: timeframe ?? 'custom',

      // main KPIs (Key Performance Indicators)
      totalRevenue,
      totalPaid,
      totalPending,
      totalBookings,
      totalSubscriptions,

      // breakdowns
      bookingRevenue,
      subscriptionRevenue,
      statusBreakdown,

      // charts
      timeseries,

      // tables
      items,
    };
  }

  //* Operation
  async getOwnersReports(options?: {
    timeframe?: 'week' | 'month';
    from?: Date;
    to?: Date;
    page?: number;
    pageSize?: number;
    sortBy?:
      | 'totalBoardingHouses'
      | 'totalRooms'
      | 'totalBookings'
      | 'totalRevenue';
    sortOrder?: 'asc' | 'desc';
  }) {
    const {
      timeframe,
      from,
      to,
      page = 1,
      pageSize = 20,
      sortBy,
      sortOrder = 'desc',
    } = options ?? {};

    const { startDate, endDate } = this.resolveDateRange(timeframe, from, to);

    // fetch all owners with related data
    const owners = await this.prisma.owner.findMany({
      where: { isDeleted: false },
      include: {
        subscriptions: {
          where: { createdAt: { gte: startDate, lte: endDate } },
        },
        boardingHouses: {
          include: {
            rooms: true,
            Booking: {
              where: { createdAt: { gte: startDate, lte: endDate } },
            },
            reviews: true,
          },
        },
        verificationDocuments: {
          where: { verificationStatus: 'APPROVED' },
        },
      },
    });

    // map owners to report items
    let items = owners.map((owner) => {
      const totalBoardingHouses = owner.boardingHouses.length;
      const totalRooms = owner.boardingHouses.reduce(
        (sum, bh) => sum + bh.rooms.length,
        0,
      );
      const totalBookings = owner.boardingHouses.reduce(
        (sum, bh) => sum + bh.Booking.length,
        0,
      );
      const activeSubscriptions = owner.subscriptions.filter(
        (s) => s.status === 'ACTIVE',
      ).length;
      const cancelledSubscriptions = owner.subscriptions.filter(
        (s) => s.status === 'CANCELLED',
      ).length;

      const totalRevenue = owner.boardingHouses.reduce(
        (sum, bh) =>
          sum +
          bh.Booking.reduce((bSum, b) => bSum + Number(b.totalAmount ?? 0), 0),
        0,
      );

      const verified = owner.verificationDocuments.length;

      return {
        ownerId: owner.id,
        ownerName: `${owner.firstname ?? ''} ${owner.lastname ?? ''}`.trim(),
        verified,
        totalBoardingHouses,
        totalRooms,
        totalBookings,
        activeSubscriptions,
        cancelledSubscriptions,
        totalRevenue,
      };
    });

    //* apply sorting if requested
    if (sortBy) {
      items.sort((a, b) => {
        if (sortOrder === 'asc') return a[sortBy]! - b[sortBy]!;
        return b[sortBy]! - a[sortBy]!;
      });
    }

    // pagination
    const startIndex = (page - 1) * pageSize;
    const pagedItems = items.slice(startIndex, startIndex + pageSize);

    const verifiedOwners = owners.filter(
      (o) => o.verificationDocuments.length > 0,
    ).length;
    const totalOwners = owners.length;
    const unverifiedOwners = totalOwners - verifiedOwners;

    return {
      totalOwners,
      verifiedOwners,
      unverifiedOwners,
      items: pagedItems,
      page,
      pageSize,
      totalPages: Math.ceil(totalOwners / pageSize),
    };
  }

  //*
  async getInsights(timeframe?: 'week' | 'month', from?: Date, to?: Date) {
    const [
      financial,
      bookingsMetrics,
      paymentsMetrics,
      subscriptionsMetrics,
      reviewsMetrics,
    ] = await Promise.all([
      this.getFinancialReports(timeframe, from, to),
      this.getBookingsMetrics(timeframe),
      this.getPaymentsMetrics(timeframe),
      this.getSubscriptionsMetrics(timeframe),
      this.getReviewsMetrics(),
    ]);

    //* TOTAL BOOKINGS
    const totalBookings = bookingsMetrics.totalBookings || 0;

    //* CONVERSION FUNNEL
    const completedBookings =
      bookingsMetrics.statusCounts.find((s) => s.status === 'COMPLETED_BOOKING')
        ?._count.status || 0;

    const awaitingPaymentBookings =
      bookingsMetrics.statusCounts.find((s) => s.status === 'AWAITING_PAYMENT')
        ?._count.status || 0;

    const failedBookings =
      bookingsMetrics.statusCounts.find((s) => s.status === 'PAYMENT_FAILED')
        ?._count.status || 0;

    //* SAFER CONVERSION
    const bookingToPaymentRate =
      awaitingPaymentBookings > 0
        ? completedBookings /
          (awaitingPaymentBookings + completedBookings + failedBookings)
        : 0;

    //* REVENUE INTELLIGENCE
    const totalRevenue = financial.totalRevenue || 0;
    const bookingRevenue = financial.bookingRevenue || 0;
    const subscriptionRevenue = financial.subscriptionRevenue || 0;

    const revenueMix = {
      bookingPercentage: totalRevenue > 0 ? bookingRevenue / totalRevenue : 0,
      subscriptionPercentage:
        totalRevenue > 0 ? subscriptionRevenue / totalRevenue : 0,
    };

    //* TOP 10 PERFORMERS
    const topOwners = [...financial.items]
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    //* BOOKING STATUS DISTRIBUTION
    const bookingStatusMap: Record<string, number> = {};
    for (const s of bookingsMetrics.statusCounts) {
      bookingStatusMap[s.status] = s._count.status;
    }

    const totalStatus = Object.values(bookingStatusMap).reduce(
      (a, b) => a + b,
      0,
    );

    const bookingStatusDistribution = Object.entries(bookingStatusMap).map(
      ([status, count]) => ({
        status,
        count,
        percentage: totalStatus > 0 ? count / totalStatus : 0,
      }),
    );

    //* TIME SERIES (FIXED: USE ONLY PAID DATA FROM FINANCIAL)
    const timeseries = financial.timeseries.map((t) => ({
      ...t,
      avgRevenuePerBooking: t.bookings > 0 ? t.revenue / t.bookings : 0,
    }));

    //* PLATFORM HEALTH
    const avgRating = reviewsMetrics.averageRating || 0;
    const activeSubs = subscriptionsMetrics.active || 0;

    const healthScore =
      (bookingToPaymentRate * 0.4 +
        revenueMix.subscriptionPercentage * 0.2 +
        (avgRating / 5) * 0.2 +
        (activeSubs > 0 ? 0.2 : 0)) *
      100;

    return {
      timeframe: timeframe ?? 'custom',

      //* KPI STRIP
      kpis: {
        totalRevenue,
        totalBookings,
        conversionRate: bookingToPaymentRate,
        averageRating: avgRating,
        activeSubscriptions: activeSubs,
      },

      //* FUNNEL
      funnel: {
        awaitingPayment: awaitingPaymentBookings,
        completed: completedBookings,
        failed: failedBookings,
        dropOffRate:
          awaitingPaymentBookings > 0
            ? failedBookings / awaitingPaymentBookings
            : 0,
      },

      //* CHARTS
      charts: {
        revenueTrend: timeseries,
        bookingTrend: timeseries,
        revenueMix,
        bookingStatus: bookingStatusDistribution,
      },

      //* TABLES
      tables: {
        topOwners,
        ownerPerformance: financial.items,
      },

      //* INSIGHTS
      insights: {
        conversionRate: bookingToPaymentRate,
        revenueMix,
        healthScore: Math.round(healthScore),
        avgRevenuePerBooking:
          totalBookings > 0 ? totalRevenue / totalBookings : 0,
      },
    };
  }

  private resolveDateRange(
    timeframe?: 'week' | 'month',
    from?: Date,
    to?: Date,
  ): { startDate: Date; endDate: Date } {
    const endDate = to ? new Date(to) : new Date();
    let startDate: Date;

    if (from) {
      startDate = new Date(from);
    } else if (timeframe === 'week') {
      startDate = subDays(endDate, 7);
    } else if (timeframe === 'month') {
      startDate = subMonths(endDate, 1);
    } else {
      startDate = new Date(0);
    }

    return { startDate, endDate };
  }
}
