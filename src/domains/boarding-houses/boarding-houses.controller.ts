import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseInterceptors,
  UploadedFiles,
  BadRequestException,
} from '@nestjs/common';
import { BoardingHousesService } from './boarding-houses.service';
import { CreateBoardingHouseDto } from './dto/create-boarding-house.dto';
import { UpdateBoardingHouseDto } from './dto/update-boarding-house.dto';
import {
  CreateBoardingHouseDoc,
  GetBoardingHousesDoc,
} from './boarding-houses.swagger';
import { FindBoardingHouseDto } from './dto/find-boarding-house.dto';
import { AnyFilesInterceptor } from '@nestjs/platform-express';
import { createMulterConfig } from 'src/infrastructure/shared/utils/multer-config.util';
import { OccupancyType } from '@prisma/client';
// import type { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';

@Controller('boarding-houses')
export class BoardingHousesController {
  // private readonly imageUploadOptions: MulterOptions =
  //   createMulterConfig('image');

  constructor(private readonly boardingHousesService: BoardingHousesService) {}

  @Get()
  @GetBoardingHousesDoc()
  findAll(@Query() filter: FindBoardingHouseDto) {
    // TODO: add query params for pagination
    return this.boardingHousesService.findAll(filter);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.boardingHousesService.findOne(+id);
  }

  @Post()
  @CreateBoardingHouseDoc()
  @UseInterceptors(AnyFilesInterceptor(createMulterConfig('image')))
  create(
    @Body() payload: Record<string, string>,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    console.log('payload:', payload);
    console.log('files:', files);
    // 1️⃣ Group all files by fieldname
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

    // 2️⃣ Parse the text-based payload data
    const parsedRooms = JSON.parse(
      payload.rooms ?? '[]',
    ) as CreateBoardingHouseDto['rooms'];
    const parsedLocation = JSON.parse(
      payload.location,
    ) as CreateBoardingHouseDto['location'];
    const parsedAmenities = JSON.parse(
      payload.amenities ?? '[]',
    ) as CreateBoardingHouseDto['amenities'];

    const createBoardingHouseDto: CreateBoardingHouseDto = {
      ...payload,
      ownerId: Number(payload.ownerId),
      availabilityStatus: payload.availabilityStatus === 'true',
      name: payload.name,
      address: payload.address,
      description: payload.description ?? '',
      amenities: parsedAmenities,
      occupancyType: payload.occupancyType
        ? OccupancyType[payload.occupancyType as keyof typeof OccupancyType]
        : OccupancyType.MIXED,
      location: parsedLocation,
      rooms: parsedRooms ?? [],
    };

    // 3️⃣ Attach room galleries & thumbnails before sending to service
    const allFileKeys = Object.keys(fileMap);

    createBoardingHouseDto.rooms = (createBoardingHouseDto.rooms ?? []).map(
      (room, index) => {
        // ✅ 1. Collect all roomGallery files for this room index
        const galleryFiles = allFileKeys
          .filter((key) => key.startsWith(`roomGallery${index}_`))
          .map((key) => fileMap[key])
          .flat();

        // ✅ 2. Collect roomThumbnail files for this room index
        const thumbnailFiles = allFileKeys
          .filter((key) => key.startsWith(`roomThumbnail${index}_`))
          .map((key) => fileMap[key])
          .flat();

        // ✅ 3. Return the updated room with gallery & thumbnail
        return {
          ...room,
          gallery: galleryFiles,
          thumbnail: thumbnailFiles,
        };
      },
    );

    // 4️⃣ Extract the standard boarding house image fields
    const imageFiles = {
      thumbnail: fileMap.thumbnail ?? [],
      gallery: fileMap.gallery ?? [],
      main: fileMap.main ?? [],
      banner: fileMap.banner ?? [],
    };

    // 5️⃣ Call the service — now each room already has its gallery
    return this.boardingHousesService.create(
      createBoardingHouseDto,
      createBoardingHouseDto.location,
      imageFiles,
    );
  }

  @Post(':id/gallery')
  @UseInterceptors(AnyFilesInterceptor(createMulterConfig('image')))
  galleryCreate(
    @Param('id') id: string,
    @UploadedFiles()
    files: Express.Multer.File[],
  ) {
    // group files manually by fieldname
    const fileMap = files.reduce(
      (acc, file) => {
        acc[file.fieldname] = acc[file.fieldname] || [];
        acc[file.fieldname].push(file);
        return acc;
      },
      {} as Record<string, Express.Multer.File[]>,
    );
    const imageFiles = {
      thumbnail: fileMap.thumbnail ?? [],
      gallery: fileMap.gallery ?? [],
      main: fileMap.main ?? [],
      banner: fileMap.banner ?? [],
    };
    return this.boardingHousesService.galleryCreate(+id, imageFiles);
  }

  @Patch(':id')
  @UseInterceptors(AnyFilesInterceptor(createMulterConfig('image')))
  update(
    @Param('id') id: string,
    @Body() updateBoardingHouseDto: UpdateBoardingHouseDto,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    const fileMap: Record<string, Express.Multer.File[]> = (files ?? []).reduce(
      (acc, file) => {
        if (!file.buffer || file.size === 0) {
          throw new BadRequestException(
            `Empty file received: ${file.originalname}`,
          );
        }

        (acc[file.fieldname] ||= []).push(file);
        return acc;
      },
      {} as Record<string, Express.Multer.File[]>,
    );

    return this.boardingHousesService.update(+id, updateBoardingHouseDto, {
      files: fileMap,
      removeGalleryIds: updateBoardingHouseDto.removeGalleryIds ?? [],
      removeThumbnailId: updateBoardingHouseDto.removeThumbnailId ?? undefined,
    });
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.boardingHousesService.remove(+id);
  }

  // @Delete(':id/gallery')
  // removeGallery(@Param('id') id: string) {
  //   return this.boardingHousesService.removeGallery(+id);
  // }
}
