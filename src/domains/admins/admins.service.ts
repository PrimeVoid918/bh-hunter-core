import {
  BadRequestException,
  ConflictException,
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateAdminDto } from './dto/create-admin.dto';
import { UpdateAdminDto } from './dto/update-admin.dto';
import { IDatabaseService } from 'src/infrastructure/database/database.interface';
import { FindAdminsDto } from './dto/find-admins.dto';
import {
  Admin,
  ResourceType,
  UserRole,
  VerificationStatus,
} from '@prisma/client';
import { TenantsService } from '../tenants/tenants.service';
import { CreateTenantDto } from '../tenants/dto/create-tenant.dto';
import { OwnersService } from '../owners/owners.service';
import { CreateOwnerDto } from '../owners/dto/create-owner.dto';
import { AdminsPublisher } from './events/admins.publisher';

@Injectable()
export class AdminsService {
  constructor(
    @Inject('IDatabaseService') private readonly database: IDatabaseService,
    @Inject(forwardRef(() => TenantsService))
    private readonly tenantsService: TenantsService,
    @Inject(forwardRef(() => OwnersService))
    private readonly ownersService: OwnersService,
    private readonly adminsPublisher: AdminsPublisher,
  ) {}

  private get prisma() {
    return this.database.getClient();
  }

  findAll({
    username = '',
    page = 1,
    offset = 15,
  }: FindAdminsDto): Promise<Admin[]> {
    const userToSkip = (page - 1) * offset;

    const prisma = this.prisma;
    return prisma.admin.findMany({
      skip: userToSkip,
      take: offset,
      where: {
        username: {
          contains: username,
          mode: 'insensitive',
        },
      },
      orderBy: {
        username: 'asc',
      },
    });
  }

  findOne(id: number) {
    const prisma = this.prisma;
    return prisma.admin.findUnique({
      where: {
        isDeleted: false,
        id: id,
      },
    });
  }

  findUserByUsername(username: string) {
    const prisma = this.prisma;
    return prisma.admin.findUnique({
      where: {
        username: username,
      },
    });
  }

  findUserById(userId: number) {
    const prisma = this.prisma;
    return prisma.admin.findUnique({
      where: {
        id: userId,
      },
    });
  }

  create(dto: CreateAdminDto) {
    const prisma = this.prisma;

    return prisma.admin.create({
      data: {
        username: dto.username,
        firstname: dto.firstname,
        lastname: dto.lastname,
        email: dto.email,
        password: dto.password,
        age: dto.age,
        address: dto.address,
        phone_number: dto.phone_number,
      },
    });
  }

  createOwner(id: number | undefined, dto: CreateOwnerDto) {
    //TODO: Use id here for admin audit
    return this.ownersService.create(dto);
  }
  createTenant(id: number | undefined, dto: CreateTenantDto) {
    //TODO: Use id here for admin audit
    return this.tenantsService.create(dto);
  }

  update(id: number, updateAdminDto: UpdateAdminDto) {
    const prisma = this.prisma;

    return prisma.admin.update({
      where: {
        id: id,
      },
      data: {
        username: updateAdminDto.username,
        firstname: updateAdminDto.firstname,
        lastname: updateAdminDto.lastname,
        email: updateAdminDto.email,
        password: updateAdminDto.password,
        age: updateAdminDto.age,
        address: updateAdminDto.address,
        phone_number: updateAdminDto.phone_number,
        isDeleted: updateAdminDto.isDeleted,
      },
    });
  }

  async removeOwner(adminId: number, ownerId: number) {
    //TODO: Use id here for admin audit
    return await this.ownersService.remove(ownerId);
  }
  async removeTenant(adminId: number, tennatId: number) {
    //TODO: Use id here for admin audit
    return await this.tenantsService.remove(tennatId);
  }

  async remove(id: number) {
    const prisma = this.prisma;
    const entity = await prisma.admin.findUnique({ where: { id } });
    if (!entity || entity.isDeleted) throw new NotFoundException('Not found');

    return this.prisma.admin.update({
      where: { id },
      data: { isDeleted: true },
    });
  }

  async updatePermit(
    id: number,
    payload: {
      adminId: number;
      verificationStatus: VerificationStatus;
      rejectReason?: string;
    },
  ) {
    const prisma = this.prisma;

    if (!id || isNaN(id)) {
      throw new BadRequestException('Invalid permit ID');
    }

    if (!payload || !payload.adminId || isNaN(payload.adminId)) {
      throw new BadRequestException('Invalid admin ID');
    }

    // --- check permit exists ---
    const existingPermit = await prisma.verificationDocument.findUnique({
      where: { id },
    });

    if (!existingPermit) {
      throw new NotFoundException(`Permit with ID ${id} not found`);
    }

    // --- allow update only when pending ---
    if (existingPermit.verificationStatus !== VerificationStatus.PENDING) {
      throw new ConflictException(
        `This permit can no longer be updated because it is already ${existingPermit.verificationStatus}.`,
      );
    }

    // const result = await prisma.verificationDocument.update({
    //   where: { id },
    //   data: {
    //     verificationStatus: payload.verificationStatus,
    //     rejectionReason: payload.rejectReason,
    //     approvedAt: new Date(),
    //     verifiedById: payload.adminId,
    //   },
    // });

    const result = await prisma.verificationDocument.update({
      where: { id },
      data: {
        verificationStatus: payload.verificationStatus,
        rejectionReason:
          payload.verificationStatus === VerificationStatus.REJECTED
            ? payload.rejectReason
            : null,
        approvedAt:
          payload.verificationStatus === VerificationStatus.APPROVED
            ? new Date()
            : null,
        verifiedById: payload.adminId,
      },
    });

    const verificationState = await this.refreshUserVerificationState(
      existingPermit.userId,
      existingPermit.userType,
    );

    //
    if (payload.verificationStatus == 'APPROVED') {
      this.adminsPublisher.approve({
        adminId: payload.adminId,
        verificationDocumentId: id,
        userId: existingPermit.userId,
        data: {
          verificationDocumentId: id,
          ownerId: existingPermit.ownerId ?? null,
          tenantId: existingPermit.tenantId ?? null,
          resourceType: ResourceType.VERIFICATION,
          userRole: existingPermit.userType,
        },
      });
    }

    if (payload.verificationStatus == 'REJECTED') {
      this.adminsPublisher.reject({
        adminId: payload.adminId,
        verificationDocumentId: id,
        userId: existingPermit.userId,
        data: {
          verificationDocumentId: id,
          ownerId: existingPermit.ownerId ?? null,
          tenantId: existingPermit.tenantId ?? null,
          resourceType: ResourceType.VERIFICATION,
          userRole: existingPermit.userType,
        },
      });
    }

    return {
      permitStatus: result.verificationStatus,
      verificationState,
    };
  }

  async removePermit(
    id: number,
    payload: {
      adminId: number;
    },
  ) {
    const prisma = this.prisma;

    if (!id || isNaN(id)) {
      throw new BadRequestException('Invalid permit ID');
    }

    if (!payload || !payload.adminId || isNaN(payload.adminId)) {
      throw new BadRequestException('Invalid admin ID');
    }

    // --- check permit exists ---
    const existingPermit = await prisma.verificationDocument.findUnique({
      where: { id },
    });

    if (!existingPermit) {
      throw new NotFoundException(`Permit with ID ${id} not found`);
    }

    const result = await prisma.verificationDocument.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        isDeleted: true,
      },
    });

    const verificationState = await this.refreshUserVerificationState(
      existingPermit.userId,
      existingPermit.userType,
    );

    return {
      permitStatus: result.verificationStatus,
      verificationState,
    };
  }

  private async ensureAdminExists(adminId: number) {
    if (!adminId || Number.isNaN(adminId)) {
      throw new BadRequestException('Invalid admin ID');
    }

    const admin = await this.prisma.admin.findFirst({
      where: {
        id: adminId,
        isDeleted: false,
        isActive: true,
      },
    });

    if (!admin) {
      throw new NotFoundException('Admin not found or inactive');
    }

    return admin;
  }

  async suspendTenant(
    adminId: number,
    tenantId: number,
    payload?: {
      reason?: string;
    },
  ) {
    if (!tenantId || Number.isNaN(tenantId)) {
      throw new BadRequestException('Invalid tenant ID');
    }

    await this.ensureAdminExists(adminId);

    const tenant = await this.prisma.tenant.findFirst({
      where: {
        id: tenantId,
        isDeleted: false,
      },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    if (tenant.isSuspended) {
      return {
        action: 'TENANT_ALREADY_SUSPENDED',
        userType: 'TENANT',
        userId: tenant.id,
        isActive: tenant.isActive,
        isSuspended: tenant.isSuspended,
        suspendedAt: tenant.suspendedAt,
        reason: payload?.reason ?? null,
      };
    }

    const updated = await this.prisma.tenant.update({
      where: {
        id: tenantId,
      },
      data: {
        isActive: false,
        isSuspended: true,
        suspendedAt: new Date(),
      },
      select: {
        id: true,
        username: true,
        firstname: true,
        lastname: true,
        email: true,
        role: true,
        isActive: true,
        isSuspended: true,
        suspendedAt: true,
        updatedAt: true,
      },
    });

    return {
      action: 'TENANT_SUSPENDED',
      userType: 'TENANT',
      userId: updated.id,
      reason: payload?.reason ?? null,
      user: updated,
    };
  }

  async unsuspendTenant(
    adminId: number,
    tenantId: number,
    payload?: {
      reason?: string;
    },
  ) {
    if (!tenantId || Number.isNaN(tenantId)) {
      throw new BadRequestException('Invalid tenant ID');
    }

    await this.ensureAdminExists(adminId);

    const tenant = await this.prisma.tenant.findFirst({
      where: {
        id: tenantId,
        isDeleted: false,
      },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    if (!tenant.isSuspended && tenant.isActive) {
      return {
        action: 'TENANT_ALREADY_ACTIVE',
        userType: 'TENANT',
        userId: tenant.id,
        isActive: tenant.isActive,
        isSuspended: tenant.isSuspended,
        suspendedAt: tenant.suspendedAt,
        reason: payload?.reason ?? null,
      };
    }

    const updated = await this.prisma.tenant.update({
      where: {
        id: tenantId,
      },
      data: {
        isActive: true,
        isSuspended: false,
      },
      select: {
        id: true,
        username: true,
        firstname: true,
        lastname: true,
        email: true,
        role: true,
        isActive: true,
        isSuspended: true,
        suspendedAt: true,
        updatedAt: true,
      },
    });

    return {
      action: 'TENANT_UNSUSPENDED',
      userType: 'TENANT',
      userId: updated.id,
      reason: payload?.reason ?? null,
      user: updated,
    };
  }

  async suspendOwner(
    adminId: number,
    ownerId: number,
    payload?: {
      reason?: string;
    },
  ) {
    if (!ownerId || Number.isNaN(ownerId)) {
      throw new BadRequestException('Invalid owner ID');
    }

    await this.ensureAdminExists(adminId);

    const owner = await this.prisma.owner.findFirst({
      where: {
        id: ownerId,
        isDeleted: false,
      },
    });

    if (!owner) {
      throw new NotFoundException('Owner not found');
    }

    if (owner.isSuspended) {
      return {
        action: 'OWNER_ALREADY_SUSPENDED',
        userType: 'OWNER',
        userId: owner.id,
        isActive: owner.isActive,
        isSuspended: owner.isSuspended,
        suspendedAt: owner.suspendedAt,
        reason: payload?.reason ?? null,
      };
    }

    const updated = await this.prisma.owner.update({
      where: {
        id: ownerId,
      },
      data: {
        isActive: false,
        isSuspended: true,
        suspendedAt: new Date(),
      },
      select: {
        id: true,
        username: true,
        firstname: true,
        lastname: true,
        email: true,
        role: true,
        isActive: true,
        isSuspended: true,
        suspendedAt: true,
        updatedAt: true,
      },
    });

    return {
      action: 'OWNER_SUSPENDED',
      userType: 'OWNER',
      userId: updated.id,
      reason: payload?.reason ?? null,
      user: updated,
    };
  }

  private async refreshUserVerificationState(
    userId: number,
    userRole: UserRole,
  ) {
    if (userRole === UserRole.OWNER) {
      return this.ownersService.getVerificationStatus(userId);
    }

    if (userRole === UserRole.TENANT) {
      return this.tenantsService.getVerificationStatus(userId);
    }

    return null;
  }

  async unsuspendOwner(
    adminId: number,
    ownerId: number,
    payload?: {
      reason?: string;
    },
  ) {
    if (!ownerId || Number.isNaN(ownerId)) {
      throw new BadRequestException('Invalid owner ID');
    }

    await this.ensureAdminExists(adminId);

    const owner = await this.prisma.owner.findFirst({
      where: {
        id: ownerId,
        isDeleted: false,
      },
    });

    if (!owner) {
      throw new NotFoundException('Owner not found');
    }

    if (!owner.isSuspended && owner.isActive) {
      return {
        action: 'OWNER_ALREADY_ACTIVE',
        userType: 'OWNER',
        userId: owner.id,
        isActive: owner.isActive,
        isSuspended: owner.isSuspended,
        suspendedAt: owner.suspendedAt,
        reason: payload?.reason ?? null,
      };
    }

    const updated = await this.prisma.owner.update({
      where: {
        id: ownerId,
      },
      data: {
        isActive: true,
        isSuspended: false,
      },
      select: {
        id: true,
        username: true,
        firstname: true,
        lastname: true,
        email: true,
        role: true,
        isActive: true,
        isSuspended: true,
        suspendedAt: true,
        updatedAt: true,
      },
    });

    return {
      action: 'OWNER_UNSUSPENDED',
      userType: 'OWNER',
      userId: updated.id,
      reason: payload?.reason ?? null,
      user: updated,
    };
  }

  async approveRefundRequest(
    requestId: number,
    adminId: number,
    notes?: string,
  ) {
    if (!requestId) throw new BadRequestException('no request id provided');
    if (!adminId) throw new BadRequestException('no request id provided');

    return await this.prisma.refundRequest.update({
      where: { id: requestId },
      data: {
        status: 'APPROVED',
        adminId,
        reviewedAt: new Date(),
        adminNotes: notes,
      },
    });
  }

  async rejectRefundRequest(
    requestId: number,
    adminId: number,
    notes?: string,
  ) {
    if (!requestId) throw new BadRequestException('no request id provided');
    if (!adminId) throw new BadRequestException('no request id provided');
    return await this.prisma.refundRequest.update({
      where: { id: requestId },
      data: {
        status: 'REJECTED',
        adminId,
        reviewedAt: new Date(),
        adminNotes: notes,
      },
    });
  }
}
