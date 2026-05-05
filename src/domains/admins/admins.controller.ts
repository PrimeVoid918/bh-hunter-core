import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import { VerificationStatus } from '@prisma/client';

import { AdminsService } from './admins.service';
import { TenantsService } from '../tenants/tenants.service';
import { OwnersService } from '../owners/owners.service';

import { CreateAdminDto } from './dto/create-admin.dto';
import { UpdateAdminDto } from './dto/update-admin.dto';
import { FindAdminsDto } from './dto/find-admins.dto';

import { CreateTenantDto } from '../tenants/dto/create-tenant.dto';
import { FindTenantsDto } from '../tenants/dto/find-tenants.dto';

import { CreateOwnerDto } from '../owners/dto/create-owner.dto';
import { FindOwnersDto } from '../owners/dto/find-owners.dto';

import { CreateAdminsDoc, GetAdminsDoc } from './admins.swagger';
import { AdminTransactionsService } from './admin-transactions.service';
@Controller('admins')
export class AdminsController {
  constructor(
    private readonly adminsService: AdminsService,
    private readonly tenantsService: TenantsService,
    private readonly ownersService: OwnersService,
    private readonly adminTransactionsService: AdminTransactionsService,
  ) {}

  // =========================
  // ADMIN TRANSACTIONS
  // =========================

  @Get('transactions')
  findAllTransactions(@Query() query: any) {
    return this.adminTransactionsService.findAll(query);
  }

  @Get('transactions/stats')
  getTransactionStats() {
    return this.adminTransactionsService.getStats();
  }

  @Get('transactions/:id')
  findOneTransaction(@Param('id') id: string) {
    return this.adminTransactionsService.findOne(+id);
  }

  @Get('refund-requests')
  findRefundRequests(@Query() query: any) {
    return this.adminTransactionsService.findRefundRequests(query);
  }

  @Patch('refund-requests/:id/approve')
  approveRefund(
    @Param('id', ParseIntPipe) id: number,
    @Body()
    body: {
      adminId: number;
      notes?: string;
    },
  ) {
    return this.adminsService.approveRefundRequest(
      id,
      body.adminId,
      body.notes,
    );
  }

  @Patch('refund-requests/:id/reject')
  rejectRefund(
    @Param('id', ParseIntPipe) id: number,
    @Body()
    body: {
      adminId: number;
      notes?: string;
    },
  ) {
    return this.adminsService.rejectRefundRequest(id, body.adminId, body.notes);
  }

  // =========================
  // TENANTS
  // =========================

  @Post(':id/tenants')
  createTenant(
    @Body() createTenantDto: CreateTenantDto,
    @Param('id') id: string,
  ) {
    return this.adminsService.createTenant(+id, createTenantDto);
  }

  @Get('tenants')
  findAllTenants(@Query() query: FindTenantsDto) {
    return this.tenantsService.findAll({ ...query });
  }

  @Delete(':adminId/tenants/:tenantId')
  deleteTenant(
    @Param('adminId') adminId: string,
    @Param('tenantId') tenantId: string,
  ) {
    return this.adminsService.removeTenant(+adminId, +tenantId);
  }

  @Patch(':adminId/tenants/:tenantId/suspend')
  suspendTenant(
    @Param('adminId') adminId: string,
    @Param('tenantId') tenantId: string,
    @Body() payload: { reason?: string },
  ) {
    return this.adminsService.suspendTenant(+adminId, +tenantId, payload);
  }

  @Patch(':adminId/tenants/:tenantId/unsuspend')
  unsuspendTenant(
    @Param('adminId') adminId: string,
    @Param('tenantId') tenantId: string,
    @Body() payload: { reason?: string },
  ) {
    return this.adminsService.unsuspendTenant(+adminId, +tenantId, payload);
  }

  // =========================
  // OWNERS
  // =========================

  @Post(':id/owners')
  createOwner(@Body() createOwnerDto: CreateOwnerDto, @Param('id') id: string) {
    return this.adminsService.createOwner(+id, createOwnerDto);
  }

  @Get('owners')
  findAllOwners(@Query() query: FindOwnersDto) {
    return this.ownersService.findAll({ ...query });
  }

  @Delete(':adminId/owners/:ownerId')
  deleteOwner(
    @Param('adminId') adminId: string,
    @Param('ownerId') ownerId: string,
  ) {
    return this.adminsService.removeOwner(+adminId, +ownerId);
  }

  @Patch(':adminId/owners/:ownerId/suspend')
  suspendOwner(
    @Param('adminId') adminId: string,
    @Param('ownerId') ownerId: string,
    @Body() payload: { reason?: string },
  ) {
    return this.adminsService.suspendOwner(+adminId, +ownerId, payload);
  }

  @Patch(':adminId/owners/:ownerId/unsuspend')
  unsuspendOwner(
    @Param('adminId') adminId: string,
    @Param('ownerId') ownerId: string,
    @Body() payload: { reason?: string },
  ) {
    return this.adminsService.unsuspendOwner(+adminId, +ownerId, payload);
  }

  // =========================
  // VERIFICATION DOCUMENTS
  // =========================

  @Patch(':id/verify-document')
  updatePermit(
    @Param('id') permitId: string,
    @Body()
    payload: {
      adminId: number;
      verificationStatus: VerificationStatus;
      rejectReason?: string;
    },
  ) {
    return this.adminsService.updatePermit(+permitId, payload);
  }

  @Delete(':id/verify-document')
  removePermit(
    @Param('id') permitId: string,
    @Body()
    payload: { adminId: number },
  ) {
    return this.adminsService.removePermit(+permitId, payload);
  }

  // =========================
  // ADMINS
  // =========================

  @Get()
  @GetAdminsDoc()
  findAll(@Query() findAllAdminsDto: FindAdminsDto) {
    return this.adminsService.findAll(findAllAdminsDto);
  }

  @Post()
  @CreateAdminsDoc()
  create(@Body() createAdminDto: CreateAdminDto) {
    return this.adminsService.create(createAdminDto);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.adminsService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateAdminDto: UpdateAdminDto) {
    return this.adminsService.update(+id, updateAdminDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.adminsService.remove(+id);
  }
}
