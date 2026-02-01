import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UseGuards } from '@nestjs/common';
import { WsAuthGuard } from '../guards/ws-auth.guard';

@WebSocketGateway({
  namespace: '/notifications',
  cors: { origin: '*' },
})
// @UseGuards(WsAuthGuard)
export class NotificationGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer() server!: Server;

  // userId -> socketId
  private readonly clients = new Map<number, string>();

  handleConnection(client: Socket) {
    const user = client.data.user; // set by WsAuthGuard
    if (!user?.id) return;

    this.clients.set(user.id, client.id);
  }

  handleDisconnect(client: Socket) {
    const user = client.data.user;
    if (!user?.id) return;

    this.clients.delete(user.id);
  }

  sendToUser(userId: number, event: string, payload: any) {
    const socketId = this.clients.get(userId);
    if (!socketId) return;

    this.server.to(socketId).emit(event, payload);
  }
}
