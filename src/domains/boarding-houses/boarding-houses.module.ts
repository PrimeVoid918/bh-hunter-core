import { Module } from '@nestjs/common';
import { BoardingHousesService } from './boarding-houses.service';
import { BoardingHousesController } from './boarding-houses.controller';
import { LocationModule } from 'src/domains/location/location.module';
import { ImageModule } from 'src/infrastructure/image/image.module';
import { RoomsModule } from '../rooms/rooms.module';
import { BoardingHouseRulesService } from './boarding-house-rules.service';

@Module({
  imports: [LocationModule, ImageModule, RoomsModule],
  controllers: [BoardingHousesController],
  providers: [BoardingHousesService, BoardingHouseRulesService],
  exports: [BoardingHousesService],
})
export class BoardingHousesModule {}
