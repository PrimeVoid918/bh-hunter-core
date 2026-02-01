// src/infrastructure/socket/guards/ws-auth.guard.ts
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Socket } from 'socket.io';

@Injectable()
export class WsAuthGuard implements CanActivate {
  constructor(private configService: ConfigService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // 1. Check the "Master Toggle" from your ENV
    const allowNoAuth =
      this.configService.get<string>('ALLOW_NO_JWT_SOCKET') === 'true';

    if (allowNoAuth) return true;

    // 2. Strict Mode: Extract JWT from handshake
    const client: Socket = context.switchToWs().getClient();
    const token =
      (await client.handshake.auth?.token) ||
      client.handshake.headers?.authorization;

    if (!token) {
      console.error('🚫 Socket Connection Blocked: No JWT found');
      return false;
    }

    // You would typically verify the JWT here using your AuthService
    return true;
  }
}
