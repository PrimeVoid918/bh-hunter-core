import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { SocketGateway } from 'src/infrastructure/sockets/sockets.gateway';

@Injectable()
export class BookingListener {
  constructor(
    private socketGateway: SocketGateway,
    // private notificationsService: , // To save in Prisma
  ) {}

  // @OnEvent('booking.created')
  // async handleBookingCreated(payload: any) {
  // 1. Save to DB for "syncing" support
  // await this.notificationsService.create(payload);

  // 2. Send via WebSockets if user is online
  // this.socketGateway.sendToUser(payload.ownerId, 'new_notification', {
  // message: payload.message,
  // });
  // }

  
}
