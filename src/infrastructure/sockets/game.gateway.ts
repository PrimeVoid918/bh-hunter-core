import {
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ValidationPipe } from '@nestjs/common';
import { SocketGateway } from './sockets.gateway';
import { RpsService } from 'src/domains/games/rps.service';

// src/infrastructure/socket/game.gateway.ts
@WebSocketGateway({ cors: { origin: '*' } })
// @WebSocketGateway({ cors: { origin: '*' } })
export class GameGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  constructor(
    private socketGateway: SocketGateway,
    private rpsService: RpsService,
  ) {}

  handleConnection(client: Socket) {
    console.log(`✅ Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log('❌ DISCONNECTED:', client.id);
  }

  @SubscribeMessage('rps_move')
  handleMove(
    @MessageBody(new ValidationPipe())
    data: { move: 'rock' | 'paper' | 'scissors' },
    @ConnectedSocket() client: Socket,
  ) {
    // Use the unique Socket ID as a temporary User ID for your test
    const payload = typeof data === 'string' ? JSON.parse(data) : data;
    console.log('data being sent: ', payload);
    const userId = client.id;
    console.log('doing the game calc');

    const gameResult = this.rpsService.play(userId, payload.move);
    console.log('getting results', gameResult);

    // Echo the result back through your standardized infra
    this.socketGateway.sendToUser(userId, 'RPS_RESULT', gameResult);
  }

  afterInit(server: Server) {
    server.on('connection', (socket) => {
      socket.onAny((eventName, ...args) => {
        console.log(`🕵️ Global Intercept - Event: ${eventName}, Data:`, args);
      });
    });
  }
}

/*
{
  "event": "rps_move",
  "data": { "move": "rock" }
}
*/
