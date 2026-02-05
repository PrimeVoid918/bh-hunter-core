import { Inject, Injectable } from '@nestjs/common';
import { IDatabaseService } from 'src/infrastructure/database/database.interface';
import { LocationDto } from './dto/location.dto';

@Injectable()
export class LocationService {
  constructor(
    @Inject('IDatabaseService') private readonly database: IDatabaseService,
  ) {}

  private get prisma() {
    return this.database.getClient();
  }

  async findAll() {
    const prisma = this.prisma;
    return await prisma.location.findMany();
  }

  async findOne(id: number) {
    const result = await this.prisma.$queryRaw<
      Array<{
        id: number;
        coordinates: { type: string; coordinates: [number, number] };
        city: string | null;
        province: string | null;
        country: string | null;
        isDeleted: boolean;
        deletedAt: Date | null;
      }>
    >`
    SELECT 
      id, 
      ST_AsGeoJSON(coordinates)::json AS coordinates, 
      city, 
      province, 
      country, 
      "isDeleted", 
      "deletedAt"
    FROM "Location"
    WHERE id = ${id};
  `;

    return this.mapLocation(result[0]);
  }

  async findNearby(lat: number, lng: number, radiusInMeters: number = 1000) {
    const result = await this.prisma.$queryRawUnsafe(`
    SELECT *, ST_Distance(coordinates, ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)) as distance
    FROM "Location"
    WHERE ST_DWithin(coordinates, ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326), ${radiusInMeters})
    ORDER BY distance ASC
  `);

    return result;
  }

  /**
   * @for findNearby
   * SELECT *, 
   * ST_Distance(coordinates::geography, ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography) as distance_meters
   * FROM "Location"
   * WHERE ST_DWithin(coordinates::geography, ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography, ${radiusInMeters})
   * ORDER BY distance_meters ASC
   *  
   */

  async create(locationData: LocationDto): Promise<number> {
    if (typeof locationData === 'string') {
      locationData = JSON.parse(locationData);
    }

    const { coordinates, city, province, country } = locationData;
    console.log('Location data received:', JSON.stringify(locationData));
    console.log('Coordinates before check:', coordinates);

    if (!coordinates || !Array.isArray(coordinates)) {
      console.error('Coordinates is missing or not an array', coordinates);
      throw new Error('Coordinates is missing or not an array');
    }

    const longitude = coordinates[0];
    const latitude = coordinates[1];

    const result = await this.prisma.$queryRaw<
      { id: number }[]
    >`INSERT INTO "Location" (coordinates, city, province, country)
    VALUES (
      ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326),
      ${city},
      ${province},
      ${country}
    )
    RETURNING id`;

    return result[0].id;
  }

  private mapLocation(raw: {
    id: number;
    coordinates: { type: string; coordinates: [number, number] };
    city: string | null;
    province: string | null;
    country: string | null;
    isDeleted: boolean;
    deletedAt: Date | null;
  }) {
    return {
      id: raw.id,
      type: raw.coordinates.type,
      coordinates: raw.coordinates.coordinates,
      city: raw.city,
      province: raw.province,
      country: raw.country,
      isDeleted: raw.isDeleted,
      deletedAt: raw.deletedAt,
    };
  }
}
