import {
  BadRequestException,
  ConflictException,
  forwardRef,
  HttpException,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { IDatabaseService } from 'src/infrastructure/database/database.interface';

import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { FindTenantsDto } from './dto/find-tenants.dto';
import {
  MediaType,
  Tenant,
  UserRole,
  VerificationStatus,
  VerificationType,
} from '@prisma/client';

import { ImageService } from 'src/infrastructure/image/image.service';
import { CreateVerifcationDto } from '../verifications/dto/create-verifcation.dto';
// import { VerificationService } from '../verifications/verification.service';
import { VerifcationService } from '../verifications/verification.service';
import { Logger } from 'src/common/logger/logger.service';
import { hasNullOrUndefinedDeep } from 'src/infrastructure/shared/utils/payload-validation.utils';
import { isPrismaErrorCode } from 'src/infrastructure/shared/utils/prisma.exceptions';
import { UpdateVerifcationDto } from '../verifications/dto/update-verifcation.dto';
import { FindOneVerificationDto } from '../verifications/dto/findOne-verification.dto';
import { AuthService } from '../auth/auth.service';
import { AccountsPublisher } from '../accounts/accounts.publisher';
import { CryptoService } from '../auth/utilities/crypto.service';

@Injectable()
export class TenantsService {
  constructor(
    @Inject('IDatabaseService') private readonly database: IDatabaseService,
    private readonly imageService: ImageService,
    private readonly verificationService: VerifcationService,
    @Inject(forwardRef(() => AuthService))
    private readonly authService: AuthService,
    private readonly cryptoService: CryptoService,
    private readonly logger: Logger,
    private readonly accountsPublisher: AccountsPublisher,
  ) {}

  private get prisma() {
    return this.database.getClient();
  }

  async findAll({
    username = '',
    page = 1,
    offset = 15,
    isDeleted = false,
    isActive,
    isVerified,
  }: FindTenantsDto) {
    const prisma = this.prisma;
    const skip = (page - 1) * offset;

    // Base where clause
    const whereClause: any = {
      isDeleted,
      ...(username.trim() !== '' && {
        username: { contains: username, mode: 'insensitive' },
      }),
      ...(isActive !== undefined && { isActive }),
      ...(isVerified !== undefined && { isVerified }),
    };

    const [totalCount, tenants] = await prisma.$transaction([
      prisma.tenant.count({ where: whereClause }),
      prisma.tenant.findMany({
        skip,
        take: offset,
        where: whereClause,
        orderBy: { username: 'asc' },
        select: {
          id: true,
          firstname: true,
          lastname: true,
          username: true,
          email: true,
          role: true,
          guardian: true,
          isActive: true,
          verificationLevel: true,
          registrationStatus: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
    ]);

    // Map tenants to table-ready format
    const results = await Promise.all(
      tenants.map(async (tenant) => {
        const verificationDocs = await prisma.verificationDocument.findMany({
          where: {
            userId: tenant.id,
            userType: 'TENANT',
            verificationStatus: 'APPROVED',
            isDeleted: false,
          },
        });

        return {
          ...tenant,
          fullname: `${tenant.firstname ?? ''} ${tenant.lastname ?? ''}`.trim(),
          hasPermits: verificationDocs.length > 0,
        };
      }),
    );

    return Array.isArray(results) ? results : [results];
  }

  async findOne(id: number) {
    if (!id) throw new BadRequestException('Tenant ID is required');

    const prisma = this.prisma;
    const tenant = await prisma.tenant.findUnique({
      where: { id },
      select: {
        id: true,
        firstname: true,
        lastname: true,
        username: true,
        email: true,
        role: true,
        phone_number: true,
        address: true,
        age: true,
        guardian: true,
        isActive: true,
        verificationLevel: true,
        registrationStatus: true,
        createdAt: true,
        updatedAt: true,
        hasAcceptedLegitimacyConsent: true,
        consentAcceptedAt: true,
      },
    });

    if (!tenant) throw new NotFoundException(`Tenant with ID ${id} not found`);

    const verificationDocs = await prisma.verificationDocument.findMany({
      where: { userId: id, userType: 'TENANT', isDeleted: false },
    });

    return {
      ...tenant,
      fullname: `${tenant.firstname ?? ''} ${tenant.lastname ?? ''}`.trim(),
      hasPermits: verificationDocs.some(
        (v) => v.verificationStatus === 'APPROVED',
      ),
      verificationDocuments: verificationDocs,
    };
  }

  findUserById(userId: number) {
    const prisma = this.prisma;
    if (!userId) {
      throw new BadRequestException('Id is required');
    }
    return prisma.tenant.findUnique({
      where: {
        id: userId,
      },
    });
  }

  findUserByUsername(username: string) {
    const prisma = this.prisma;

    if (!username) {
      throw new BadRequestException('Username is required');
    }
    return prisma.tenant.findUnique({
      where: {
        username: username,
      },
    });
  }

  async create(dto: CreateTenantDto) {
    try {
      const prisma = this.prisma;
      const hashedPassword = await this.cryptoService.hashPassword(
        dto.password,
      );

      const created = await prisma.tenant.create({
        data: {
          username: dto.username,
          firstname: dto.firstname,
          lastname: dto.lastname,
          email: dto.email,
          password: hashedPassword,
          age: dto.age,
          guardian: dto.guardian,
          address: dto.address,
          phone_number: dto.phone_number,
        },
      });

      this.accountsPublisher.setupRequired({
        id: created.id,
        resourceType: 'VERIFICATION',
        userRole: 'TENANT',
      });

      return created;
    } catch (error) {
      if (isPrismaErrorCode(error, 'P2002')) {
        const meta = (error as any)?.meta;

        if (meta?.target?.includes('email')) {
          throw new ConflictException('Email is already in use');
        }

        if (meta?.target?.includes('username')) {
          throw new ConflictException('Username is already in use');
        }

        throw new ConflictException('Username or Email already exists');
      }

      throw new InternalServerErrorException('Failed to create owner');
    }
  }

  async update(id: number, updateTenantDto: UpdateTenantDto) {
    if (!id) throw new BadRequestException('Id is required');

    const allowedFields: (keyof UpdateTenantDto)[] = [
      'username',
      'firstname',
      'lastname',
      'email',
      'age',
      'guardian',
      'address',
      'phone_number',
      'hasAcceptedLegitimacyConsent',
      'isActive',
      'password',
    ];

    // Pick only allowed fields
    const dataToUpdate: any = {};
    for (const key of allowedFields) {
      if (updateTenantDto[key] !== undefined) {
        dataToUpdate[key] = updateTenantDto[key];
      }
    }

    // Handle password hashing
    if (dataToUpdate.password) {
      dataToUpdate.password = await this.cryptoService.hashPassword(
        dataToUpdate.password,
      );
    }

    // Handle consentAcceptedAt automatically
    if ('hasAcceptedLegitimacyConsent' in dataToUpdate) {
      dataToUpdate.consentAcceptedAt = dataToUpdate.hasAcceptedLegitimacyConsent
        ? new Date()
        : null;
    }

    try {
      return this.prisma.$transaction(async (tx) => {
        const existingTenant = await tx.tenant.findUnique({ where: { id } });
        if (!existingTenant) {
          throw new NotFoundException(`Tenant with id ${id} not found`);
        }

        const updatedTenant = await tx.tenant.update({
          where: { id },
          data: dataToUpdate,
        });

        // Recompute verification level if necessary
        await this.authService.recomputeVerificationLevel(
          id,
          UserRole.TENANT,
          tx,
        );

        return updatedTenant;
      });
    } catch (error: unknown) {
      if (isPrismaErrorCode(error, 'P2002')) {
        throw new ConflictException('Username or email already exists');
      }
      throw new InternalServerErrorException('Failed to update tenant');
    }
  }

  /**
   * Verification Document Section
   *
   */

  async findAllVerificationDocument() {
    const prisma = this.prisma;

    const verificationDocuments = await prisma.verificationDocument.findMany({
      where: { isDeleted: false, userType: 'TENANT' },
    });

    const results = await Promise.all(
      verificationDocuments.map(async (verificationDocument) => {
        try {
          const { userId } = verificationDocument;

          if (!userId) return null;

          const tenantData = await prisma.tenant.findUnique({
            where: { id: userId },
          });

          if (!tenantData) return null;

          const verificationDocumentData =
            await this.verificationService.getVerificationDocumentMetaData(
              prisma,
              verificationDocument.id,
              false,
            );

          const { tenantId, ownerId, tenant, ...safeData } =
            verificationDocumentData;

          return {
            ...safeData,
            user: {
              id: tenantData.id,
              firstname: tenantData.firstname,
              lastname: tenantData.lastname,
              email: tenantData.email,
            },
          };
        } catch (err) {
          this.logger.error(err, undefined, {
            verificationDocumentId: verificationDocument.id,
            rawUrl: verificationDocument.url,
          });
        }
      }),
    );

    return results.filter((p) => p !== null);
  }

  async findOneVerificationDocument(
    id: number,
    // payload: FindOneVerificationDto,
  ) {
    // console.log('hit?');

    if (!id || isNaN(id)) {
      throw new BadRequestException('Invalid document ID.');
    }

    // if (!payload) {
    //   throw new BadRequestException('No Valid ID data found on the payload');
    // }

    const prisma = this.prisma;

    try {
      // 1️⃣ Fetch the verification document
      const verificationDocument = await prisma.verificationDocument.findFirst({
        where: { isDeleted: false, id: id, userType: 'TENANT' },
      });

      if (!verificationDocument) {
        throw new NotFoundException('Verification document not found.');
      }

      const { userId } = verificationDocument;
      console.log('verificationDocument: ', verificationDocument);
      console.log('userId: ', userId);

      if (!userId) {
        throw new NotFoundException(
          'Verification iamge does not have an associated tenant.',
        );
      }

      const tenantData = await prisma.tenant.findUnique({
        where: { id: userId },
      });
      console.log('tenantData: ', tenantData);

      if (!tenantData) {
        throw new NotFoundException(
          `Tenant with ID ${userId} not found for this image document.`,
        );
      }

      // 3️⃣ Fetch the verification document metadata
      const verificationDocumentData =
        await this.verificationService.getVerificationDocumentMetaData(
          prisma,
          verificationDocument.id,
          false,
        );

      const { tenantId, ownerId, tenant, url, ...safeData } =
        verificationDocumentData;
      const normalizedUrl = url?.replace(/([^:]\/)\/+/g, '$1');

      return {
        ...safeData,
        url: normalizedUrl,
        user: {
          id: tenantData.id,
          firstname: tenantData.firstname,
          lastname: tenantData.lastname,
          email: tenantData.email,
          // any other fields you want to expose
        },
      };
    } catch (err) {
      // Prisma known errors
      if (typeof err === 'object' && err !== null && 'code' in err) {
        const prismaErr = err as { code: string };

        if (prismaErr.code === 'P2025') {
          throw new NotFoundException('Tenant or document not found.');
        }
      }

      // Re-throw HTTP exceptions directly
      if (err instanceof HttpException) {
        throw err;
      }

      // Fallback
      throw new InternalServerErrorException(
        'Failed to fetch verification document.',
      );
    }
  }

  async createVerificationDocument(
    payload: CreateVerifcationDto,
    file: Express.Multer.File,
  ) {
    if (hasNullOrUndefinedDeep(payload)) {
      throw new BadRequestException(
        'Payload contains undefined or null values',
      );
    }

    const { userId, expiresAt, type, fileFormat } = payload;
    if (!userId) {
      throw new BadRequestException(
        'Either tenantId or tenantId must be provided',
      );
    }

    // 🔹 Quick check: does the tenant exist?
    const tenantExists = await this.prisma.tenant.findUnique({
      where: { id: userId },
    });

    if (!tenantExists) {
      throw new BadRequestException(`Tenant with id ${userId} does not exist`);
    }

    // 3️⃣ Transaction + creation
    try {
      const id = await this.prisma.$transaction(async (tx) => {
        const createdId = await this.verificationService.create(
          tx,
          file,
          UserRole.TENANT,
          {
            type: 'TENANT',
            targetId: userId,
            mediaType: MediaType.VALID_ID,
            childId: 0,
          },
          {
            userId,
            type,
            expiresAt: expiresAt.toString(),
            fileFormat,
          },
          false,
        );

        await this.authService.recomputeVerificationLevel(
          userId,
          UserRole.TENANT,
          tx,
        );

        return createdId;
      });

      if (!id) {
        throw new InternalServerErrorException(
          'Failed to create verification document',
        );
      }

      return id;
    } catch (error: unknown) {
      console.error('Verification document creation failed:', error);

      if (isPrismaErrorCode(error, 'P2002')) {
        throw new ConflictException('Verification document already exists');
      }

      throw new InternalServerErrorException('An unexpected error occurred');
    }
  }

  async patchVerificationDocument(
    verificationDocumentId: number,
    payload: UpdateVerifcationDto,
    file: Express.Multer.File,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const verificationDocument = await tx.verificationDocument.findUnique({
        where: { id: verificationDocumentId },
        select: { userId: true },
      });

      if (!verificationDocument) {
        throw new NotFoundException(
          `Verification Document ${verificationDocumentId} not found`,
        );
      }

      const tenant = await tx.tenant.findUnique({
        where: { id: verificationDocument.userId },
      });

      if (!tenant) {
        throw new NotFoundException(
          `Tenant ${verificationDocument.userId} not found`,
        );
      }

      const updated = await this.verificationService.updateVerificationDocument(
        tx,
        verificationDocumentId,
        file,
        {
          type: 'TENANT',
          targetId: verificationDocument.userId,
          mediaType: MediaType.VALID_ID,
          childId: 0,
        },
        {
          expiresAt: payload.expiresAt,
          type: payload.type,
        },
        false,
      );

      await this.authService.recomputeVerificationLevel(
        verificationDocument.userId,
        UserRole.TENANT,
        tx,
      );

      return updated;
    });
  }

  async getVerificationStatus(tenantId: number) {
    await this.authService.recomputeVerificationLevel(
      tenantId,
      UserRole.TENANT,
    );

    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    const documents = await this.prisma.verificationDocument.findMany({
      where: {
        isDeleted: false,
        userId: tenantId,
        userType: UserRole.TENANT,
      },
    });

    return {
      verified: tenant.verificationLevel === 'FULLY_VERIFIED',
      registrationStatus: tenant.registrationStatus,
      verificationLevel: tenant.verificationLevel,
      verificationDocuments: documents.map((p) => ({
        id: p.id,
        verificationType: p.verificationType,
        verificationStatus: p.verificationStatus,
        expiresAt: p.expiresAt,
        fileFormat: p.fileFormat,
      })),
    };
  }

  async getTenantAccessStatus(tenantId: number) {
    const verification = await this.authService.getVerificationStatus(
      tenantId,
      'TENANT',
    );

    return {
      tenantId,
      isVerified: verification.verificationLevel === 'FULLY_VERIFIED',
      verificationLevel: verification.verificationLevel,
      canBookRoom: verification.verificationLevel === 'FULLY_VERIFIED',
      canMakeReview: verification.verificationLevel === 'FULLY_VERIFIED',
      canSendMessage: verification.verificationLevel === 'FULLY_VERIFIED',
    };
  }

  async removeVerificationDocument(
    tenantId: number,
    verificationDocumentId: number,
  ) {
    if (!verificationDocumentId || isNaN(verificationDocumentId)) {
      throw new BadRequestException('Invalid document ID.');
    }

    return this.prisma.$transaction(async (tx) => {
      const verificationDocument = await tx.verificationDocument.findFirst({
        where: { id: verificationDocumentId },
      });

      if (!verificationDocument) {
        throw new NotFoundException(
          `Verification Document ${verificationDocumentId} not found`,
        );
      }

      await this.verificationService.deleteVerificationDocument(
        tx,
        verificationDocumentId,
        verificationDocument.url,
        false,
      );

      await this.authService.recomputeVerificationLevel(
        tenantId,
        UserRole.TENANT,
        tx,
      );

      return { success: true };
    });
  }

  async remove(id: number) {
    const prisma = this.prisma;

    const entity = await prisma.tenant.findUnique({ where: { id } });

    if (!entity) throw new NotFoundException(`Tenant with id ${id} not found`);

    if (entity.isDeleted)
      throw new NotFoundException(`Tenant with id ${id} is already deleted`);

    const deletedTenant = await prisma.tenant.update({
      where: { id },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
      },
    });

    const { password, ...safeTenant } = deletedTenant;
    return safeTenant;
  }
}
