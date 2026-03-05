import { Query, Controller, Get } from '@nestjs/common';
import { MapsService } from './maps.service';

@Controller('maps')
export class MapsController {
  constructor(private readonly mapsService: MapsService) {}

  // @Get()     //! removed as it displays all markers without end
  // findAll() {
  //   return this.mapsService.findAll();
  // }

  // Get markers within radius
  @Get()
  findNearby(
    @Query('lat') lat: number,
    @Query('lng') lng: number,
    @Query('radius') radius: number,
  ) {
    // radius in meters
    return this.mapsService.findNearby({
      lat: +lat,
      lng: +lng,
      radius: +radius,
    });
  }

  // Markers inside bounding box (front-end map view)
  @Get('bounds')
  findInBounds(
    @Query('minLat') minLat: number,
    @Query('maxLat') maxLat: number,
    @Query('minLng') minLng: number,
    @Query('maxLng') maxLng: number,
  ) {
    return this.mapsService.findInBounds({
      minLat: +minLat,
      maxLat: +maxLat,
      minLng: +minLng,
      maxLng: +maxLng,
    });
  }
}
