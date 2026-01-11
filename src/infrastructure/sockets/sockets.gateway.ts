import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { UserUnionService } from '../../domains/auth/userUnion.service';
import { ConfigService } from 'src/config/config.service';

export enum SocketEvents {
  RPS_RESULT = 'RPS_RESULT',
  BOOKING_UPDATE = 'BOOKING_UPDATE',
  SYSTEM_NOTIFICATION = 'SYSTEM_NOTIFICATION',
  CHAT_MESSAGE = 'CHAT_MESSAGE',
}

export interface SocketPayload<T = any> {
  type: string;
  payload: T;
  timestamp: string;
}

interface AuthenticatedSocket extends Socket {
  data: {
    user: {
      userId: number;
      username: string;
      role: string;
      type: string;
    };
  };
}

@WebSocketGateway({ cors: { origin: '*' } })
export class SocketGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  constructor(
    private readonly jwtService: JwtService,
    private readonly userUnionService: UserUnionService,
    private readonly configService: ConfigService,
  ) {}

  async handleConnection(client: Socket) {
    const token = this.extractToken(client);
    const allowAuth = this.configService.ALLOW_NO_JWT_SOCKET === 'true';

    if (!token) {
      if (allowAuth) {
        (client as any).data.user = {
          userId: 0,
          username: 'Guest',
          role: 'GUEST',
          type: 'guest',
        };
        await client.join('guest_room');
        return;
      }
      client.disconnect();
      return;
    }

    try {
      //! chill it just untyped and is in "any"
      const payload = await this.jwtService.verifyAsync(token, {
        secret: this.configService.JWT_SECRET_KEY,
      });

      const authClient = client as AuthenticatedSocket;

      authClient.data.user = payload;
      await authClient.join(`user_${payload.userId}`);
      console.log(`✅ Room joined: user_${payload.userId}`);
    } catch (err) {
      console.error('❌ Socket JWT Verification failed', err);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const user = (client as AuthenticatedSocket).data?.user;

    if (user) {
      console.log(`📡 Disconnected: ${user.username} (ID: ${user.userId})`);
      // Future: this.userService.updateOnlineStatus(user.userId, false);
    } else {
      console.log(`📡 Guest/Unauthenticated client disconnected: ${client.id}`);
    }

    // Note: Socket.io automatically removes the client from all rooms (user_1, guest_room, etc.)
    // so you don't need to call client.leave() manually.
  }

  /**
   * BROADCAST: Send to everyone connected
   */
  sendToAll(event: string, payload: any) {
    this.server.emit(event, this.wrapPayload(event, payload));
  }

  /**
   * TARGETED: Send to all devices owned by one user
   */
  sendToUser(userId: string, event: string, payload: any) {
    this.server
      .to(`user_${userId}`)
      .emit(event, this.wrapPayload(event, payload));
  }

  /**
   * MULTICAST: Send to a group (e.g., a specific Boarding House chat)
   */
  sendToRoom(roomId: string, event: string, payload: any) {
    this.server.to(roomId).emit(event, this.wrapPayload(event, payload));
  }

  // Private helper to maintain the "Standard Envelope"
  private wrapPayload(type: string, payload: any): SocketPayload {
    return {
      type,
      payload,
      timestamp: new Date().toISOString(),
    };
  }

  private extractToken(client: Socket): string | null {
    // Postman usually sends it in Headers. Mobile apps often use Auth handshake.
    const authHeader = client.handshake.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      return authHeader.split(' ')[1];
    }
    return client.handshake.auth?.token || null;
  }
}

//! to implement Acknowledgement in the future if possible
//!  async sendWithAck(userId: string, event: string, payload: any) {
//!  try {
//!    // This returns a promise that resolves when the mobile app calls the callback
//!    const response = await this.server
//!      .to(`user_${userId}`)
//!      .timeout(5000) // 5 second timeout
//!      .emitWithAck(event, this.wrapPayload(event, payload));
//!
//!    return response; // e.g. { status: 'ok' }
//!  } catch (e) {
//!    console.error(`User ${userId} failed to acknowledge ${event}`);
//!  }
//!}
