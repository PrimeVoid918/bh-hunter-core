import { Inject, Injectable } from '@nestjs/common';
import { IDatabaseService } from 'src/infrastructure/database/database.interface';
import { MapMarker } from './maps.types';
import { ImageService } from 'src/infrastructure/image/image.service';

@Injectable()
export class MapsService {
  constructor(
    @Inject('IDatabaseService') private readonly database: IDatabaseService,
    private readonly imageService: ImageService,
  ) {}

  private get prisma() {
    return this.database.getClient();
  }

  async findAll() {
    return await this.prisma.$queryRaw<MapMarker[]>`
    SELECT
      bh.id,
      bh.name,

      -- Coordinates
      ST_Y(loc.coordinates) AS lat,
      ST_X(loc.coordinates) AS lng,

      -- Thumbnail from Image table
      (
        SELECT img.url
        FROM "Image" img
        WHERE img."entityType" = 'BOARDING_HOUSE'
          AND img."entityId" = bh.id
          AND img."type" = 'THUMBNAIL'
          AND img."isDeleted" = false
        ORDER BY img.id ASC
        LIMIT 1
      ) AS thumbnail,

      -- Minimum room price
      (
        SELECT MIN(r.price)
        FROM "Room" r
        WHERE r."boardingHouseId" = bh.id
          AND r."isDeleted" = false
      ) AS price

    FROM "BoardingHouse" bh
    JOIN "Location" loc
      ON bh."locationId" = loc.id
    WHERE bh."isDeleted" = false;
  `;
  }
  async findNearby({
    lat,
    lng,
    radius = 8000,
  }: {
    lat: number;
    lng: number;
    radius: number;
  }) {
    const results = await this.prisma.$queryRaw<any[]>`
    SELECT
      bh.id,
      bh.name,
      bh."availabilityStatus",
      bh."occupancyType",
      ST_Y(loc.coordinates) AS lat,
      ST_X(loc.coordinates) AS lng,
      (
        SELECT img.url
        FROM "Image" img
        WHERE img."entityType" = 'BOARDING_HOUSE'
          AND img."entityId" = bh.id
          AND img."type" = 'THUMBNAIL'
          AND img."isDeleted" = false
        ORDER BY img.id ASC
        LIMIT 1
      ) AS thumbnail,
      (
        SELECT MIN(r.price)
        FROM "Room" r
        WHERE r."boardingHouseId" = bh.id
          AND r."isDeleted" = false
      ) AS price,
      -- ST_Distance returns meters as a float
      ST_Distance(
        loc.coordinates::geography,
        ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography
      ) AS distance
    FROM "BoardingHouse" bh
    JOIN "Location" loc ON bh."locationId" = loc.id
    WHERE bh."isDeleted" = false
      AND ST_DWithin(
        loc.coordinates::geography,
        ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography,
        ${radius} 
      )
    ORDER BY distance ASC;
  `;

    // Use Promise.all to handle the async getMediaPath for every marker
    return Promise.all(
      results.map(async (marker) => {
        const fullThumbnailUrl = marker.thumbnail
          ? await this.imageService.getMediaPath(marker.thumbnail, true)
          : null;

        return {
          id: Number(marker.id),
          name: marker.name,
          lat: Number(marker.lat),
          lng: Number(marker.lng),
          availabilityStatus: marker.availabilityStatus,
          occupancyType: marker.occupancyType,
          price: marker.price ? Number(marker.price) : null,
          thumbnail: fullThumbnailUrl,
          // Ensure distance is explicitly mapped back
          distance: marker.distance ? Number(marker.distance) : 0,
        };
      }),
    );
  }

  async findInBounds(bounds: {
    minLat: number;
    maxLat: number;
    minLng: number;
    maxLng: number;
  }) {
    const { minLat, maxLat, minLng, maxLng } = bounds;

    return await this.prisma.$queryRaw<MapMarker[]>`
    SELECT
      bh.id,
      bh.name,

      ST_Y(loc.coordinates) AS lat,
      ST_X(loc.coordinates) AS lng,

      -- Thumbnail
      (
        SELECT img.url
        FROM "Image" img
        WHERE img."entityType" = 'BOARDING_HOUSE'
          AND img."entityId" = bh.id
          AND img."type" = 'THUMBNAIL'
          AND img."isDeleted" = false
        ORDER BY img.id ASC
        LIMIT 1
      ) AS thumbnail,

      -- Min price from rooms
      (
        SELECT MIN(r.price)
        FROM "Room" r
        WHERE r."boardingHouseId" = bh.id
          AND r."isDeleted" = false
      ) AS price

    FROM "BoardingHouse" bh
    JOIN "Location" loc ON bh."locationId" = loc.id
    WHERE bh."isDeleted" = false
      AND ST_Y(loc.coordinates) BETWEEN ${minLat} AND ${maxLat}
      AND ST_X(loc.coordinates) BETWEEN ${minLng} AND ${maxLng};
  `;
  }
}
