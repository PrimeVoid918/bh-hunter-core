import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { CreateBoardingHouseDto } from './dto/create-boarding-house.dto';
import { UpdateBoardingHouseDto } from './dto/update-boarding-house.dto';
import { IDatabaseService } from 'src/infrastructure/database/database.interface';

import { BoardingHouse, MediaType, Prisma } from '@prisma/client';
import { ResourceType } from 'src/infrastructure/file-upload/types/resources-types';
import { LocationService } from 'src/domains/location/location.service';
import { LocationDto } from 'src/domains/location/dto/location.dto';
import { FindBoardingHouseDto } from './dto/find-boarding-house.dto';
import { RoomsService } from '../rooms/rooms.service';
import { ImageService } from 'src/infrastructure/image/image.service';
import { FileMap } from 'src/common/types/file.type';
import { BoardingHouseRulesService } from './boarding-house-rules.service';

// TODO: do something about owners who ran out of subs

@Injectable()
export class BoardingHousesService {
  constructor(
    @Inject('IDatabaseService') private readonly database: IDatabaseService,
    private readonly locationService: LocationService,
    private readonly roomsService: RoomsService,
    private readonly imageService: ImageService,
    private readonly boardingHouseRulesService: BoardingHouseRulesService,
  ) {}

  private get prisma() {
    return this.database.getClient();
  }

  async findAll({
    id,
    ownerId,
    name,
    address,
    availabilityStatus,
    createdAt,
    updatedAt,
    isDeleted = false,
    deletedAt,
    minPrice = 0,
    maxPrice = 0,
    sortBy = 'name',
    page = 1,
    offset = 10,
  }: FindBoardingHouseDto): Promise<BoardingHouse[]> {
    const where: Prisma.BoardingHouseWhereInput = {};

    if (id !== undefined) where.id = +id;
    if (ownerId !== undefined) where.ownerId = +ownerId;
    if (name !== undefined)
      where.name = { contains: name, mode: 'insensitive' };
    if (address !== undefined)
      where.address = { contains: address, mode: 'insensitive' };
    if (availabilityStatus !== undefined)
      where.availabilityStatus = availabilityStatus;
    if (createdAt !== undefined) where.createdAt = createdAt;
    if (updatedAt !== undefined) where.updatedAt = updatedAt;
    if (isDeleted !== undefined) where.isDeleted = isDeleted;
    if (deletedAt !== undefined) where.deletedAt = deletedAt;

    const validSortFields = ['name', 'price', 'createdAt', 'updatedAt'];
    const orderByField = validSortFields.includes(sortBy) ? sortBy : 'name';

    try {
      const result = await this.prisma.boardingHouse.findMany({
        where,
        skip: (page - 1) * offset,
        take: offset,
        orderBy: {
          [orderByField]: 'asc',
        },
        include: {
          location: true,
          rooms: {
            where: {
              isDeleted: false,
            },
          },
        },
      });

      const includeRawLocationPostGIST = await Promise.all(
        result.map(async (house) => {
          const { rooms, ...houseData } = house;

          const roomsIdArray = rooms.map((room) => room.id);
          const roomsWithImages = await Promise.all(
            roomsIdArray.map(async (roomId) => {
              const room = await this.roomsService.findOne(house.id, roomId);
              return room;
            }),
          );

          const fullLocation = await this.locationService.findOne(
            house.locationId,
          );

          let totalCapacity = 0;
          let currentCapacity = 0;
          const prices = house.rooms.map((room) => room.price.toNumber());
          const lowestPrice = prices.length ? Math.min(...prices) : 0;
          const highestPrice = prices.length ? Math.max(...prices) : 0;

          house.rooms.forEach((room) => {
            totalCapacity += room.maxCapacity;
            currentCapacity += room.currentCapacity;
          });

          const images = await this.prisma.image.findMany({
            where: {
              entityId: house.id,
              entityType: ResourceType.BOARDING_HOUSE,
            },
          });

          const activeRules = await this.prisma.boardingHouseRule.findMany({
            where: {
              boardingHouseId: house.id,
              isActive: true,
            },
            orderBy: {
              sortOrder: 'asc',
            },
          });

          const { gallery, thumbnail } =
            await this.imageService.getImageMetaData(
              images,
              (url, isPublic) => this.imageService.getMediaPath(url, isPublic),
              ResourceType.BOARDING_HOUSE,
              house.id,
              [MediaType.GALLERY, MediaType.THUMBNAIL],
            );

          return {
            ...houseData,
            rooms: roomsWithImages,
            capacity: {
              totalCapacity,
              currentCapacity,
            },
            priceRange: {
              highestPrice,
              lowestPrice,
            },
            location: fullLocation,
            thumbnail,
            gallery,
            houseRulesContent: activeRules[0]?.content ?? '',
          };
        }),
      );

      return includeRawLocationPostGIST;
    } catch (error: any) {
      throw new Error(`Error finding boarding houses: ${error}`);
    }
  }

  async findOne(id: number) {
    const prisma = this.prisma;

    try {
      const house = await prisma.boardingHouse.findUnique({
        where: { id },
        include: {
          location: true,
          rooms: {
            where: {
              isDeleted: false,
            },
          },
        },
      });

      if (!house) {
        throw new NotFoundException(`Boarding house with id ${id} not found`);
      }

      const { rooms, ...houseData } = house;

      const roomsWithImages = await Promise.all(
        rooms.map((room) => this.roomsService.findOne(house.id, room.id)),
      );

      const fullLocation = await this.locationService.findOne(house.locationId);

      const totalCapacity = rooms.reduce((acc, r) => acc + r.maxCapacity, 0);
      const currentCapacity = rooms.reduce(
        (acc, r) => acc + r.currentCapacity,
        0,
      );

      const images = await this.prisma.image.findMany({
        where: {
          entityId: house.id,
          entityType: 'BOARDING_HOUSE',
        },
      });

      const activeRules = await this.prisma.boardingHouseRule.findMany({
        where: {
          boardingHouseId: house.id,
          isActive: true,
        },
        orderBy: {
          sortOrder: 'asc',
        },
      });

      const { gallery, thumbnail } = await this.imageService.getImageMetaData(
        images,
        (url, isPublic) => this.imageService.getMediaPath(url, isPublic),
        ResourceType.BOARDING_HOUSE,
        house.id,
        [MediaType.GALLERY, MediaType.THUMBNAIL],
      );

      return {
        ...houseData,
        rooms: roomsWithImages,
        capacity: {
          totalCapacity,
          currentCapacity,
        },
        location: fullLocation,
        thumbnail,
        gallery,
        houseRulesContent: activeRules[0]?.content ?? '',
      };
    } catch (error: any) {
      throw new NotFoundException(`Boarding house with id ${id} not found`);
    }
  }

  async create(
    boardinghouseData: CreateBoardingHouseDto,
    locationData: LocationDto,
    images: FileMap,
  ) {
    const prisma = this.prisma;

    return prisma.$transaction(async (tx) => {
      console.log('boardinghouseData: ', boardinghouseData);
      const returnedLocationId = await this.locationService.create(
        locationData,
        // tx,
      );

      const createBoardingHouse = await tx.boardingHouse.create({
        data: {
          owner: { connect: { id: boardinghouseData.ownerId } },
          name: boardinghouseData.name,
          address: boardinghouseData.address,
          description: boardinghouseData.description,
          availabilityStatus: boardinghouseData.availabilityStatus,
          occupancyType: boardinghouseData.occupancyType,
          amenities: boardinghouseData.amenities ?? undefined,
          location: { connect: { id: returnedLocationId } },
        },
      });

      if (boardinghouseData.houseRulesContent?.trim()) {
        console.log('boardinghouseData: ', boardinghouseData);
        await this.boardingHouseRulesService.create(
          [
            {
              title: 'Boarding House Rules',
              content: boardinghouseData.houseRulesContent.trim(),
              isRequired: true,
              sortOrder: 0,
            },
          ],
          createBoardingHouse.id,
          tx,
        );
      }

      if (boardinghouseData.rooms?.length) {
        await this.roomsService.create(
          boardinghouseData.rooms,
          createBoardingHouse.id,
          tx,
        );
      }

      if (images.thumbnail) {
        await this.imageService.uploadImagesTransact(
          tx,
          images.thumbnail,
          {
            type: 'BOARDING_HOUSE',
            targetId: createBoardingHouse.id,
            mediaType: MediaType.THUMBNAIL,
          },
          {
            resourceId: createBoardingHouse.id,
            resourceType: ResourceType.BOARDING_HOUSE,
            mediaType: MediaType.THUMBNAIL,
          },
        );
      }

      if (images.gallery) {
        await this.imageService.uploadImagesTransact(
          tx,
          images.gallery,
          {
            type: 'BOARDING_HOUSE',
            targetId: createBoardingHouse.id,
            mediaType: MediaType.GALLERY,
          },
          {
            resourceId: createBoardingHouse.id,
            resourceType: ResourceType.BOARDING_HOUSE,
            mediaType: MediaType.GALLERY,
          },
        );
      }

      if (images.main) {
        await this.imageService.uploadImagesTransact(
          tx,
          images.main,
          {
            type: 'BOARDING_HOUSE',
            targetId: createBoardingHouse.id,
            mediaType: MediaType.MAIN,
          },
          {
            resourceId: createBoardingHouse.id,
            resourceType: ResourceType.BOARDING_HOUSE,
            mediaType: MediaType.MAIN,
          },
        );
      }

      const [location, houseRules] = await Promise.all([
        this.locationService.findOne(returnedLocationId),
        this.boardingHouseRulesService.findByBoardingHouse(
          createBoardingHouse.id,
          // tx,
        ),
      ]);

      return {
        ...createBoardingHouse,
        location,
        houseRules,
      };
    });
  }

  async update(
    id: number,
    dto: UpdateBoardingHouseDto,
    images?: {
      removeGalleryIds: number[];
      removeThumbnailId: number | undefined;
      files: FileMap;
    },
  ) {
    const prisma = this.prisma;

    return prisma.$transaction(async (tx) => {
      const data: Prisma.BoardingHouseUpdateInput = {};

      //! make frontend and backend parser for key=value pair of images when transferring in path
      //! idea are in `React Native NestJS integration` chat

      const primitiveFields: (keyof UpdateBoardingHouseDto)[] = [
        'name',
        'address',
        'description',
        'amenities',
        'availabilityStatus',
        'occupancyType',
        'ownerId',
      ];

      for (const key of primitiveFields) {
        if (dto[key] !== undefined) {
          (data as any)[key] = dto[key];
        }
      }

      if (dto.location) {
        data.location = {
          update: Object.fromEntries(
            Object.entries(dto.location).filter(([, v]) => v !== undefined),
          ),
        };
      }

      const updated = await tx.boardingHouse.update({
        where: { id },
        data,
        include: { location: true },
      });

      if (dto.houseRulesContent !== undefined) {
        const content = dto.houseRulesContent.trim();

        if (content) {
          await this.boardingHouseRulesService.replace(
            [
              {
                title: 'Boarding House Rules',
                content,
                isRequired: true,
                sortOrder: 0,
              },
            ],
            id,
            tx,
          );
        } else {
          await this.boardingHouseRulesService.replace([], id, tx);
        }
      }

      if (images?.removeGalleryIds?.length) {
        for (const imageId of images.removeGalleryIds) {
          await tx.image.update({
            where: {
              id: imageId,
            },
            data: {
              isDeleted: true,
              deletedAt: new Date(),
            },
          });
        }
      }

      if (images?.removeThumbnailId) {
        await tx.image.update({
          where: {
            id: images.removeThumbnailId,
          },
          data: {
            isDeleted: true,
            deletedAt: new Date(),
          },
        });
      }

      if (images?.files.thumbnail) {
        await this.imageService.uploadImagesTransact(
          tx,
          images.files.thumbnail,
          {
            type: 'BOARDING_HOUSE',
            targetId: id,
            mediaType: MediaType.THUMBNAIL,
          },
          {
            resourceId: id,
            resourceType: ResourceType.BOARDING_HOUSE,
            mediaType: MediaType.THUMBNAIL,
          },
        );
      }

      if (images?.files.gallery) {
        await this.imageService.uploadImagesTransact(
          tx,
          images.files.gallery,
          {
            type: 'BOARDING_HOUSE',
            targetId: id,
            mediaType: MediaType.GALLERY,
          },
          {
            resourceId: id,
            resourceType: ResourceType.BOARDING_HOUSE,
            mediaType: MediaType.GALLERY,
          },
        );
      }

      const houseRules =
        await this.boardingHouseRulesService.findByBoardingHouse(id, tx);

      return {
        ...updated,
        houseRules,
        houseRulesContent: houseRules[0]?.content ?? '',
      };
    });
  }

  async remove(id: number) {
    const prisma = this.prisma;
    const entity = await prisma.boardingHouse.findUnique({ where: { id } });
    if (!entity || entity.isDeleted) throw new NotFoundException('Not found');

    return this.prisma.boardingHouse.update({
      where: { id },
      data: { isDeleted: true },
    });
  }

  // TODO: delete images
  // TODO: update images
  async removeGallery(id: number) {
    return this.prisma.$transaction(async (tx) => {
      // Get permit to find the filePath/url
      // const permit = await tx.permit.findUnique({ where: { id: id } });
      // if (!permit) {
      //   throw new Error(`Permit ${id} not found`);
      // }

      // Delete permit file + db record atomically as possible
      // await this.imageService.deletePermit(tx, id, permit.url, false);

      return { success: true };
    });
  }

  galleryCreate(id: number, images: FileMap) {
    //   return await this.imageService.uploadImages(
    //     prisma,
    //     images.gallery,
    //     {
    //       type: 'BOARDING_HOUSE',
    //       targetId: id,
    //       mediaType: MediaType.GALLERY,
    //     },
    //     {
    //       resourceId: id,
    //       resourceType: ResourceType.BOARDING_HOUSE,
    //       mediaType: MediaType.GALLERY,
    //     },
    //   );
    // }
    return 'not finished route'; //!
  }
}

/**
 * JSON
 * name: {
 * firstname: "dsadsad",
 * lastname: "dsadsa"
 * }
 * fileCoordinatr: {
 * file1: {
 *    id: 1, fileName: file1 }
 * }
 *
 * file1: "dasdasdasdasd"
 * file2: "sadsad"
 */
