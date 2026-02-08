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
  ParseIntPipe,
} from '@nestjs/common';
import { OwnersService } from './owners.service';
import { CreateOwnerDto } from './dto/create-owner.dto';
import { UpdateOwnerDto } from './dto/update-owner.dto';
import { FindOwnersDto } from './dto/find-owners.dto';
import { CreateOwnerDoc, GetOwnerDoc, UpdateOwnerDoc } from './owners.swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { createMulterConfig } from 'src/infrastructure/shared/utils/multer-config.util';
import { UploadedFile } from '@nestjs/common';
import { CreateVerifcationDto } from 'src/domains/verifications/dto/create-verifcation.dto';
import { UpdateVerifcationDto } from 'src/domains/verifications/dto/update-verifcation.dto';

@Controller('owners')
export class OwnersController {
  constructor(private readonly ownersService: OwnersService) {}

  //  POST /owners/payout-method
  //  GET  /owners/payout-method

  // if (!owner.hasPayoutMethod) {
  //   throw new BadRequestException(
  //     'Owner has no payout method configured'
  //   );
  // }

  @Get()
  @GetOwnerDoc()
  findAll(@Query() findAllOwnersDto: FindOwnersDto) {
    const results = this.ownersService.findAll(findAllOwnersDto);

    return results;
  }

  @Post()
  @CreateOwnerDoc()
  create(@Body() createOwnerDto: CreateOwnerDto) {
    return this.ownersService.create(createOwnerDto);
  }

  @Post('permits')
  @UseInterceptors(FileInterceptor('file', createMulterConfig('pdf')))
  createPermit(
    @Body() payload: CreateVerifcationDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.ownersService.createVerificationDocument(payload, file);
  }

  @Get('permits')
  findAllPermits() {
    return this.ownersService.findAllVerificationDocument();
  }

  //* put static routes first, parameterized routes later
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: string) {
    const results = this.ownersService.findOne(+id);
    return results;
  }

  @Get(':id/permits')
  findOnePermits(@Param('id', ParseIntPipe) id: string) {
    return this.ownersService.findOneVerificationDocument(+id);
  }
  @Get(':id/permits-verification-status')
  findPermitStatus(@Param('id', ParseIntPipe) id: string) {
    return this.ownersService.getVerificationStatus(+id);
  }
  @Delete(':ownerId/permits/:permitId')
  async deletePermit(
    @Param('ownerId', ParseIntPipe) ownerId: number,
    @Param('permitId', ParseIntPipe) permitId: number,
  ) {
    return this.ownersService.removeVerificationDocument(+ownerId, +permitId);
  }

  @Patch('permits/:permitId')
  @UseInterceptors(FileInterceptor('file', createMulterConfig('pdf')))
  patchPermit(
    @Param('permitId', ParseIntPipe) permitId: number,
    @Body() payload: UpdateVerifcationDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.ownersService.patchVerificationDocument(
      +permitId,
      payload,
      file,
    );
  }

  @Patch(':id')
  @UpdateOwnerDoc()
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateOwnerDto: UpdateOwnerDto,
  ) {
    const results = this.ownersService.update(+id, updateOwnerDto);
    return results;
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    const results = this.ownersService.remove(+id);
    return results;
  }
}
