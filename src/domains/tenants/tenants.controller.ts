import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Patch,
  Query,
  UseInterceptors,
  UploadedFile,
  ParseIntPipe,
} from '@nestjs/common';
import { TenantsService } from './tenants.service';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { CreateTenantDoc, GetTenantDoc } from './tenants.swagger';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { FindTenantsDto } from './dto/find-tenants.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { createMulterConfig } from 'src/infrastructure/shared/utils/multer-config.util';
import { CreateVerifcationDto } from '../verifications/dto/create-verifcation.dto';
import { UpdateVerifcationDto } from '../verifications/dto/update-verifcation.dto';
import { FindOneVerificationDto } from '../verifications/dto/findOne-verification.dto';
@Controller('tenants')
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  // ─────────────────────────────
  // STATIC ROUTES FIRST
  // ─────────────────────────────

  @Get('valid-id')
  findAllPermits() {
    return this.tenantsService.findAllVerificationDocument();
  }

  @Post('valid-id')
  @UseInterceptors(FileInterceptor('file', createMulterConfig('image')))
  createValidId(
    @Body() payload: CreateVerifcationDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.tenantsService.createVerificationDocument(payload, file);
  }

  @Patch('valid-id/:id')
  @UseInterceptors(FileInterceptor('file', createMulterConfig('image')))
  patchValidId(
    @Param('id', ParseIntPipe) id: number,
    @Body() payload: UpdateVerifcationDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.tenantsService.patchVerificationDocument(id, payload, file);
  }

  // ─────────────────────────────
  // NESTED DYNAMIC ROUTES
  // ─────────────────────────────

  @Get(':id/valid-id')
  findOneValidId(@Param('id', ParseIntPipe) id: number) {
    return this.tenantsService.findOneVerificationDocument(id);
  }

  @Get(':id/valid-id-verification-status')
  findPermitStatus(@Param('id', ParseIntPipe) id: number) {
    return this.tenantsService.getVerificationStatus(+id);
  }

  @Delete(':tenantId/valid-id/:id')
  deletePermit(
    @Param('tenantId', ParseIntPipe) tenantId: number,
    @Param('id', ParseIntPipe) permitId: number,
  ) {
    return this.tenantsService.removeVerificationDocument(tenantId, permitId);
  }

  // ─────────────────────────────
  // GENERIC CRUD LAST
  // ─────────────────────────────

  @Get()
  findAll(@Query() findAllTenantsDto: FindTenantsDto) {
    const { isDeleted, ...restQuery } = findAllTenantsDto;
    return this.tenantsService.findAll({
      ...restQuery,
      isDeleted,
    });
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.tenantsService.findOne(id);
  }

  @Post()
  create(@Body() createTenantDto: CreateTenantDto) {
    return this.tenantsService.create(createTenantDto);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateTenantDto: UpdateTenantDto,
  ) {
    return this.tenantsService.update(id, updateTenantDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.tenantsService.remove(id);
  }
}
