import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  BadRequestException,
} from '@nestjs/common';
import { RoomsService } from './rooms.service';
import { CreateRoomsDto } from './dto/create-rooms.dto';
import { UpdateRoomDto } from './dto/update-room.dto';

@Controller('boarding-houses/:boardingHouseId/rooms')
export class RoomsController {
  constructor(private readonly roomsService: RoomsService) {}

  @Post()
  create(
    @Param('boardingHouseId') boardingHouseId: string,
    @Body() createRoomDtos: CreateRoomsDto[],
  ) {
    //* loops all through rooms to check if they belong to the same boarding house
    const uniqueBHIds = new Set(
      createRoomDtos.map((room) => room.boardingHouseId),
    );

    if (uniqueBHIds.size > 1) {
      throw new BadRequestException(
        'All rooms must belong to the same boarding house.',
      );
    }

    //* warn if id does not match the one in the URL
    if (
      createRoomDtos.length > 0 &&
      uniqueBHIds.has(+boardingHouseId) === false
    ) {
      throw new BadRequestException(
        `Mismatch between URL boardingHouseId (${boardingHouseId}) and body.`,
      );
    }
    return this.roomsService.create(createRoomDtos, +boardingHouseId);
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
