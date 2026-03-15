import { Module } from '@nestjs/common';
import { BoardingHousesService } from './boarding-houses.service';
import { BoardingHousesController } from './boarding-houses.controller';
import { LocationModule } from 'src/domains/location/location.module';
import { ImageModule } from 'src/infrastructure/image/image.module';
import { RoomsModule } from '../rooms/rooms.module';

@Module({
  imports: [LocationModule, ImageModule, RoomsModule],
  controllers: [BoardingHousesController],
  providers: [BoardingHousesService],
  exports: [BoardingHousesService],
})
export class BoardingHousesModule {}
