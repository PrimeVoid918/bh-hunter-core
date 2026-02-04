import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  BadRequestException,
  UseInterceptors,
  UploadedFiles,
} from '@nestjs/common';
import { RoomsService } from './rooms.service';
import { CreateRoomsDto } from './dto/create-rooms.dto';
import { UpdateRoomDto } from './dto/update-room.dto';
import { CreateRoomsWithGallery } from './types';
import { AnyFilesInterceptor } from '@nestjs/platform-express';
import { createMulterConfig } from 'src/infrastructure/shared/utils/multer-config.util';

@Controller('boarding-houses/:boardingHouseId/rooms')
export class RoomsController {
  constructor(private readonly roomsService: RoomsService) {}

  @Post()
  @UseInterceptors(AnyFilesInterceptor(createMulterConfig('image')))
  async create(
    @Param('boardingHouseId') boardingHouseId: string,
    @Body() payload: Record<string, string>,
    @UploadedFiles() files: Express.Multer.File[] = [], // <--- default empty array
  ) {
    const fileMap = files.reduce(
      (acc, file) => {
        if (!file.buffer || file.size === 0) {
          throw new BadRequestException(
            `Empty file received: ${file.originalname}`,
          );
        }
        acc[file.fieldname] = acc[file.fieldname] || [];
        acc[file.fieldname].push(file);
        return acc;
      },
      {} as Record<string, Express.Multer.File[]>,
    );

    // --- 2️⃣ Parse rooms JSON ---
    const rooms = JSON.parse(payload.rooms ?? '[]') as CreateRoomsDto[];

    // --- 3️⃣ Attach gallery & thumbnail ---
    const enrichedRooms: CreateRoomsWithGallery[] = rooms.map((room, index) => {
      const galleryFiles = Object.keys(fileMap)
        .filter((key) => key.startsWith(`roomGallery${index}_`))
        .map((key) => fileMap[key])
        .flat();

      const thumbnailFiles = Object.keys(fileMap)
        .filter((key) => key.startsWith(`roomThumbnail${index}_`))
        .map((key) => fileMap[key])
        .flat();

      return {
        ...room,
        gallery: galleryFiles,
        thumbnail: thumbnailFiles,
      };
    });

    // --- 4️⃣ Validate boardingHouseId ---
    const uniqueBHIds = new Set(enrichedRooms.map((r) => r.boardingHouseId));
    if (uniqueBHIds.size > 1 || !uniqueBHIds.has(+boardingHouseId)) {
      throw new BadRequestException(
        `Mismatch between URL boardingHouseId and rooms body`,
      );
    }

    // --- 5️⃣ Call service ---
    return this.roomsService.create(enrichedRooms, +boardingHouseId);
  }

  @Get()
  findAll(@Param('boardingHouseId') boardingHouseId: string) {
    return this.roomsService.findAll(+boardingHouseId);
  }

  @Get(':id')
  findOne(
    @Param('boardingHouseId') boardingHouseId: string,
    @Param('id') roomId: string,
  ) {
    return this.roomsService.findOne(+boardingHouseId, +roomId);
  }

  @Patch(':id')
  update(@Param('id') roomId: string, @Body() data: UpdateRoomDto) {
    return this.roomsService.patch(+roomId, data);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.roomsService.remove(+id);
  }
}
