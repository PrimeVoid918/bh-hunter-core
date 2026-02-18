import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UserUnionService } from './userUnion.service';
import { CryptoService } from './utilities/crypto.service';
import { ImageModule } from 'src/infrastructure/image/image.module';
import { TenantsModule } from 'src/domains/tenants/tenants.module';
import { JwtStrategy } from './strategy/jwt/jwt.strategy';
import { JwtModule } from '@nestjs/jwt';
import { jwtConfig } from './strategy/jwt/jwt.config';
import { AdminsModule } from 'src/domains/admins/admins.module';
import { OwnersModule } from 'src/domains/owners/owners.module';
import { AccountsPublisher } from '../accounts/accounts.publisher';

@Module({
  imports: [
    ImageModule,
    TenantsModule,
    JwtModule.registerAsync(jwtConfig),
    AdminsModule,
    OwnersModule,
  ],
  controllers: [AuthController],
  providers: [
    AccountsPublisher,
    AuthService,
    UserUnionService,
    CryptoService,
    JwtStrategy,
  ],
  exports: [UserUnionService, CryptoService],
})
export class AuthModule {}
