import { Controller, Get, Query } from '@nestjs/common';
import { MetricsService } from './metrics.service';

@Controller('metrics')
export class MetricsController {
  constructor(private readonly metricsService: MetricsService) {}

  @Get('bookings')
  getBookingsMetrics(
    @Query('timeframe') timeframe?: 'week' | 'month',
    @Query('userId') userId?: string,
    @Query('role') role?: 'OWNER' | 'TENANT',
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.metricsService.getBookingsMetrics(
      timeframe,
      userId ? Number(userId) : undefined,
      role,
      from ? new Date(from) : undefined,
      to ? new Date(to) : undefined,
    );
  }

  @Get('payments')
  getPaymentsMetrics(
    @Query('timeframe') timeframe?: 'week' | 'month',
    @Query('userId') userId?: string,
    @Query('role') role?: 'OWNER' | 'TENANT',
  ) {
    return this.metricsService.getPaymentsMetrics(
      timeframe,
      userId ? Number(userId) : undefined,
      role,
    );
  }

  @Get('subscriptions')
  getSubscriptionsMetrics(
    @Query('timeframe') timeframe?: 'week' | 'month',
    @Query('userId') userId?: string,
    @Query('role') role?: 'OWNER' | 'TENANT',
  ) {
    return this.metricsService.getSubscriptionsMetrics(
      timeframe,
      userId ? Number(userId) : undefined,
      role,
    );
  }

  @Get('users')
  getUsersMetrics() {
    return this.metricsService.getUsersMetrics();
  }

  @Get('properties')
  getPropertiesMetrics(
    @Query('userId') userId?: string,
    @Query('role') role?: 'OWNER' | 'TENANT',
  ) {
    return this.metricsService.getPropertiesMetrics(
      userId ? Number(userId) : undefined,
      role,
    );
  }

  @Get('reviews')
  getReviewsMetrics(
    @Query('userId') userId?: string,
    @Query('role') role?: 'OWNER' | 'TENANT',
  ) {
    return this.metricsService.getReviewsMetrics(
      userId ? Number(userId) : undefined,
      role,
    );
  }

  @Get('overview')
  getOverviewMetrics(
    @Query('timeframe') timeframe?: 'week' | 'month',
    @Query('userId') userId?: string,
    @Query('role') role?: 'OWNER' | 'TENANT',
  ) {
    return this.metricsService.getOverviewMetrics(
      timeframe,
      userId ? Number(userId) : undefined,
      role,
    );
  }

  @Get('reports/financial')
  getFinancialReports(
    @Query('timeframe') timeframe?: 'week' | 'month',
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.metricsService.getFinancialReports(
      timeframe,
      from ? new Date(from) : undefined,
      to ? new Date(to) : undefined,
    );
  }

  @Get('reports/owners')
  getOwnersReports(
    @Query('timeframe') timeframe?: 'week' | 'month',
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('sortBy')
    sortBy?:
      | 'totalBoardingHouses'
      | 'totalRooms'
      | 'totalBookings'
      | 'totalRevenue',
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
  ) {
    return this.metricsService.getOwnersReports({
      timeframe,
      from: from ? new Date(from) : undefined,
      to: to ? new Date(to) : undefined,
      page: page ? Number(page) : undefined,
      pageSize: pageSize ? Number(pageSize) : undefined,
      sortBy,
      sortOrder,
    });
  }

  @Get('reports/insights')
  getInsightsReports(
    @Query('timeframe') timeframe?: 'week' | 'month',
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.metricsService.getInsights(
      timeframe,
      from ? new Date(from) : undefined,
      to ? new Date(to) : undefined,
    );
  }
}
