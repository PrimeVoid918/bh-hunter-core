import { Module } from '@nestjs/common';
import { MapsService } from './maps.service';
import { MapsController } from './maps.controller';
import { ImageModule } from 'src/infrastructure/image/image.module';
import { SharedModule } from 'src/infrastructure/shared/shared.module';

@Module({
  imports: [ImageModule, SharedModule],
  controllers: [MapsController],
  providers: [MapsService],
  exports: [MapsService],
})
export class MapsModule {}
