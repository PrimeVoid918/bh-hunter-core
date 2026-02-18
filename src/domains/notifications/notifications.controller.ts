import {
  Controller,
  Get,
  Patch,
  Param,
  Query,
  Req,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { QueryNotificationsDto } from './dto/query-notifications.dto';
import { UserRole } from '@prisma/client';

@ApiTags('notifications')
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  /**
   * GET /notifications
   */
  @Get()
  async findAll(
    @Query('userId', ParseIntPipe) userId: number,
    @Query('role') role: UserRole,
    @Query() query: QueryNotificationsDto,
  ) {
    return this.notificationsService.findAll(userId, role, query);
  }

  /**
   * PATCH /notifications/:id/read
   * Mark a notification as read
   */
  @Patch(':id/read')
  async markAsRead(
    @Param('id', ParseIntPipe) id: number,
    @Query('userId', ParseIntPipe) userId: number,
    @Query('role') role: UserRole,
  ) {
    return this.notificationsService.markAsRead({
      notificationId: id,
      recipientId: userId,
      recipientRole: role,
    });
  }

  /**
   * PATCH /notifications/:id/read-all
   * Bulk Read
   */
  // @Patch('read-all')
  // async markAllAsRead(@Req() req: any) {
  //   return this.notificationsService.markAllAsRead(userId, role);
  // }
}
