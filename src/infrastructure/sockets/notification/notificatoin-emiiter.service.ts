import { Injectable } from '@nestjs/common';
import { SocketGateway } from '../sockets.gateway';
import { NotificationGateway } from './notification.gateway';

@Injectable()
export class NotificationEmitter {
  constructor(
    private readonly socketGateway: SocketGateway,
    private readonly notificationGateway: NotificationGateway,
  ) {}

  notifyUser(recipientId: number, payload: any) {
    // this.socketGateway.sendToUser(
    //   recipientId.toString(),
    //   'notification:new',
    //   payload,
    // );
    this.notificationGateway.sendToUser(
      recipientId,
      'notification:new',
      payload,
    );
  }
}
