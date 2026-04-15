import {
  BadRequestException,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { IDatabaseService } from 'src/infrastructure/database/database.interface';
import { PrismaService } from 'src/infrastructure/database/prisma.service';
import { UpdateRoomDto } from './dto/update-room.dto';
import { ImageService } from 'src/infrastructure/image/image.service';
import { MediaType } from '@prisma/client';
import { CreateRoomsWithGallery } from './types';
import { ResourceType } from 'src/infrastructure/file-upload/types/resources-types';
import { DBClient } from 'src/infrastructure/image/types/types';

// TODO: do somehing about owners who ran out of subsp

@Injectable()
export class RoomsService {
  constructor(
    @Inject('IDatabaseService')
    private readonly database: IDatabaseService,
    private readonly imageService: ImageService,
  ) {}

  private get prisma(): PrismaService {
    return this.database.getClient();
  }

  // -------------------------------------------------------
  // CREATE
  // -------------------------------------------------------
  async create(
    rooms: CreateRoomsWithGallery[],
    boardingHouseId: number,
    tx: DBClient = this.prisma,
  ): Promise<void> {
    for (const room of rooms) {
      const { gallery, thumbnail, roomType, furnishingType, ...roomData } =
        room;

      const maxCapacity = Number(roomData.maxCapacity);
      const price = Number(roomData.price);

      if (!Number.isFinite(maxCapacity) || maxCapacity <= 0) {
        throw new BadRequestException('Invalid maxCapacity value.');
      }

      if (!Number.isFinite(price) || price < 0) {
        throw new BadRequestException('Invalid price value.');
      }

      const createdRoom = await tx.room.create({
        data: {
          ...roomData,
          maxCapacity,
          price,
          roomType,
          furnishingType,
          boardingHouseId,
        },
      });

      if (gallery?.length) {
        await this.imageService.uploadImagesTransact(
          tx,
          gallery,
          {
            type: 'BOARDING_HOUSE_ROOMS',
            targetId: boardingHouseId,
            mediaType: MediaType.GALLERY,
            childId: createdRoom.id,
          },
          {
            resourceId: createdRoom.id,
            resourceType: ResourceType.ROOM,
            mediaType: MediaType.GALLERY,
          },
        );
      }

      if (thumbnail?.length) {
        await this.imageService.uploadImagesTransact(
          tx,
          thumbnail,
          {
            type: 'BOARDING_HOUSE_ROOMS',
            targetId: boardingHouseId,
            mediaType: MediaType.THUMBNAIL,
            childId: createdRoom.id,
          },
          {
            resourceId: createdRoom.id,
            resourceType: ResourceType.ROOM,
            mediaType: MediaType.THUMBNAIL,
          },
        );
      }
    }
  }

  // -------------------------------------------------------
  // FIND ALL
  // -------------------------------------------------------
  async findAll(bhId: number) {
    if (!bhId) {
      throw new BadRequestException('Boarding house ID is required');
    }

    const rooms = await this.prisma.room.findMany({
      where: {
        boardingHouseId: bhId,
        isDeleted: false,
      },
    });

    if (!rooms.length) return [];

    const roomIds = rooms.map((r) => r.id);

    const images = await this.prisma.image.findMany({
      where: {
        entityType: ResourceType.ROOM,
        entityId: { in: roomIds },
        isDeleted: false,
      },
    });

    // Build lookup map (O(n))
    const imageMap = new Map<number, typeof images>();

    for (const img of images) {
      if (!imageMap.has(img.entityId)) {
        imageMap.set(img.entityId, []);
      }
      imageMap.get(img.entityId)!.push(img);
    }

    const roomsWithImages = await Promise.all(
      rooms.map(async (room) => {
        const roomImages = imageMap.get(room.id) ?? [];

        const { gallery, thumbnail } = await this.imageService.getImageMetaData(
          roomImages,
          (url, isPublic) => this.imageService.getMediaPath(url, isPublic),
          ResourceType.ROOM,
          room.id,
          [MediaType.GALLERY, MediaType.THUMBNAIL],
        );

        return { ...room, gallery, thumbnail };
      }),
    );

    return roomsWithImages;
  }

  // -------------------------------------------------------
  // FIND ONE
  // -------------------------------------------------------
  async findOne(bhId: number, roomId: number) {
    const boardingHouse = await this.prisma.boardingHouse.findFirst({
      where: {
        id: bhId,
        isDeleted: false,
      },
    });

    if (!boardingHouse) {
      throw new NotFoundException('Boarding house not found.');
    }

    const room = await this.prisma.room.findFirst({
      where: {
        id: roomId,
        boardingHouseId: bhId,
        isDeleted: false,
      },
    });

    if (!room) {
      throw new NotFoundException('Room not found.');
    }

    const images = await this.prisma.image.findMany({
      where: {
        entityId: room.id,
        entityType: ResourceType.ROOM,
        isDeleted: false,
      },
    });

    const { gallery, thumbnail } = await this.imageService.getImageMetaData(
      images,
      (url, isPublic) => this.imageService.getMediaPath(url, isPublic),
      ResourceType.ROOM,
      room.id,
      [MediaType.GALLERY, MediaType.THUMBNAIL],
    );

    return {
      ...room,
      gallery,
      thumbnail,
    };
  }

  // -------------------------------------------------------
  // PATCH
  // -------------------------------------------------------
  async patch(roomId: number, roomData: UpdateRoomDto) {
    const dataToUpdate = Object.fromEntries(
      Object.entries(roomData).filter(([_, v]) => v !== undefined),
    );

    if (!Object.keys(dataToUpdate).length) {
      throw new BadRequestException('No fields provided to update.');
    }

    const existingRoom = await this.prisma.room.findFirst({
      where: {
        id: roomId,
        isDeleted: false,
      },
    });

    if (!existingRoom) {
      throw new NotFoundException(`Room with ID ${roomId} not found.`);
    }

    try {
      return await this.prisma.room.update({
        where: { id: roomId },
        data: dataToUpdate,
      });
    } catch {
      throw new InternalServerErrorException('Failed to update room.');
    }
  }

  // -------------------------------------------------------
  // REMOVE (SOFT DELETE)
  // -------------------------------------------------------
  async remove(id: number) {
    const existingRoom = await this.prisma.room.findFirst({
      where: { id, isDeleted: false },
    });

    if (!existingRoom) {
      throw new NotFoundException(`Room with ID ${id} not found.`);
    }

    return this.prisma.room.update({
      where: { id },
      data: { isDeleted: true },
    });
  }
}
