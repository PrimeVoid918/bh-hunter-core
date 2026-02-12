import {
  BadRequestException,
  ConflictException,
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

@Injectable()
export class TenantsService {
  constructor(
    @Inject('IDatabaseService') private readonly database: IDatabaseService,
    private readonly imageService: ImageService,
    private readonly verificationService: VerifcationService,
    private readonly logger: Logger,
  ) {}

  private get prisma() {
    return this.database.getClient();
  }

  findAll({
    username = '',
    page = 1,
    offset = 15,
    isDeleted = false,
    isActive,
    isVerified,
  }: FindTenantsDto): Promise<Partial<Tenant>[]> {
    const userToSkip = (page - 1) * offset;

    const prisma = this.prisma;

    if (isDeleted) {
      return prisma.tenant.findMany({
        skip: userToSkip,
        take: offset,
        where: { isDeleted },
        orderBy: { username: 'asc' },
        select: {
          id: true,
          username: true,
          firstname: true,
          lastname: true,
          email: true,
          role: true,
          isActive: true,
          isVerified: true,
          createdAt: true,
          updatedAt: true,
        },
      });
    }

    return this.prisma.tenant.findMany({
      skip: userToSkip,
      take: offset,
      where: {
        ...(username !== undefined &&
          username.trim() !== '' && {
            username: { contains: username, mode: 'insensitive' },
          }),
        isDeleted,
        ...(isActive !== undefined && { isActive }),
        ...(isVerified !== undefined && { isVerified }),
      },
      orderBy: { username: 'asc' },
      select: {
        id: true,
        username: true,
        firstname: true,
        lastname: true,
        email: true,
        role: true,
        isActive: true,
        isVerified: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  findOne(id: number) {
    const prisma = this.prisma;

    //! no account
    if (!id) {
      throw new BadRequestException('Id is required');
    }

    return prisma.tenant.findUnique({
      where: {
        isDeleted: false,
        id: id,
      },
    });
  }

  findByUsername(username: string) {
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

  async create(dto: CreateTenantDto) {
    try {
      const prisma = this.prisma;
      // const hashedPassword = await bcrypt.hash(dto.password, 10);

      return await prisma.tenant.create({
        data: {
          username: dto.username,
          firstname: dto.firstname,
          lastname: dto.lastname,
          email: dto.email,
          password: dto.password,
          age: dto.age,
          guardian: dto.guardian,
          address: dto.address,
          phone_number: dto.phone_number,
        },
      });
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

    const dataToUpdate = Object.fromEntries(
      Object.entries(updateTenantDto).filter(([_, v]) => v !== undefined),
    );

    try {
      // Check if tenant exists
      const existingTenant = await this.prisma.tenant.findUnique({
        where: { id },
      });
      if (!existingTenant)
        throw new NotFoundException(`Tenant with id ${id} not found`);

      // Perform update
      const updatedTenant = await this.prisma.tenant.update({
        where: { id },
        data: dataToUpdate,
      });

      return updatedTenant;
    } catch (error: any) {
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
        return await this.verificationService.create(
          tx,
          file,
          UserRole.TENANT,
          {
            type: 'TENANT',
            targetId: userId,
            mediaType: MediaType.VALID_ID,
            childId: 0, //! this needs to be fixed
          },
          {
            userId,
            type: type,
            expiresAt: expiresAt.toString(),
            fileFormat: fileFormat,
          },
          false,
        );
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
    const prisma = this.prisma;

    const verificationDocumentTenantID =
      await prisma.verificationDocument.findUnique({
        where: { id: verificationDocumentId },
        select: { userId: true, userType: true },
      });

    const searchTenant = await prisma.tenant.findUnique({
      where: { id: verificationDocumentTenantID?.userId },
    });

    if (!verificationDocumentTenantID) {
      throw new NotFoundException(
        `Verification Document ${verificationDocumentId} not found`,
      );
    }

    if (!searchTenant) {
      throw new NotFoundException(
        `User ${verificationDocumentId} Verification Document does not exist, ${searchTenant}`,
      );
    }

    return await this.verificationService.updateVerificationDocument(
      prisma,
      verificationDocumentId,
      file,
      {
        type: 'TENANT',
        //! so it was +verificationDocumentTenantID but object cant coerce with number returns NAN bug
        targetId: verificationDocumentTenantID.userId,
        mediaType: MediaType.VALID_ID,
        childId: 0, //! this needs fixing
      },
      {
        expiresAt: payload.expiresAt,
        type: payload.type,
      },
      false,
    );
  }

  async getVerificationStatus(
    tenantId: number,
    // payload: FindOneVerificationDto,
  ) {
    const requiredVerificationDocuments = [VerificationType.VALID_ID];

    const tenant = await this.prisma.verificationDocument.findMany({
      where: {
        isDeleted: false,
        userId: tenantId,
        userType: 'TENANT',
      },
    });

    const missingVerificationDocuments = requiredVerificationDocuments.filter(
      (type) => !tenant.some((p) => p.verificationType === type),
    ) as VerificationType[];

    const verified =
      tenant.length > 0 &&
      missingVerificationDocuments.length === 0 &&
      tenant.every((doc) => doc.verificationStatus === 'APPROVED');

    await this.prisma.tenant.update({
      where: { id: tenantId },
      data: {
        isVerified: verified,
      },
    });

    return {
      verified,
      missingVerificationDocuments,
      verificationDocuments: tenant.map((p) => ({
        id: p.id,
        verificationType: p.verificationType,
        verificationStatus: p.verificationStatus,
        expiresAt: p.expiresAt,
        fileFormat: p.fileFormat,
      })),
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
      // Get Verification Document to find the filePath/url
      const verificationDocuments = await tx.verificationDocument.findFirst({
        where: { id: verificationDocumentId },
      });
      if (!verificationDocuments) {
        throw new NotFoundException(
          `Verification Document ${verificationDocumentId} not found`,
        );
      }

      // Delete verificaiton document file + db record atomically as possible
      await this.verificationService.deleteVerificationDocument(
        tx,
        verificationDocumentId,
        verificationDocuments.url,
        false,
      );

      return { success: true };
    });
  }

  async remove(id: number) {
    const prisma = this.prisma;

    const entity = await prisma.owner.findUnique({ where: { id } });
    if (!entity) throw new NotFoundException(`Owner with id ${id} not found`);
    if (entity.isDeleted)
      throw new NotFoundException(`Owner with id ${id} is already deleted`);

    const deletedOwner = await prisma.owner.update({
      where: { id },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
      },
    });

    const { password, ...safeOwner } = deletedOwner;
    return safeOwner;
  }
}
