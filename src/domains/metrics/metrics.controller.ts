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
  ) {
    return this.metricsService.getBookingsMetrics(
      timeframe,
      userId ? Number(userId) : undefined,
      role,
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
}
