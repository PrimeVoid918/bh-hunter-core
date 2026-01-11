// src/infrastructure/socket/socket.module.ts
import { Module, Global } from '@nestjs/common';
// import { NotificationsGateway } from './sockets.module';
import { JwtModule } from '@nestjs/jwt'; // You'll likely need this for auth later
import { GameGateway } from './game.gateway';
import { RpsService } from 'src/domains/games/rps.service';
import { SocketGateway } from './sockets.gateway';
import { APP_GUARD } from '@nestjs/core';
import { WsAuthGuard } from './guards/ws-auth.guard';

@Global() // Making it global allows any domain to inject the Gateway easily
@Module({
  providers: [
    GameGateway,
    RpsService,
    SocketGateway,
    { provide: APP_GUARD, useClass: WsAuthGuard },
  ],
  exports: [GameGateway], // Export it so other modules can use 'sendNotification'
})
export class SocketModule {}
