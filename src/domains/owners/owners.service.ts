import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
  HttpException,
  ConflictException,
} from '@nestjs/common';
import { CreateOwnerDto } from './dto/create-owner.dto';
import { UpdateOwnerDto } from './dto/update-owner.dto';
import { IDatabaseService } from 'src/infrastructure/database/database.interface';
import { FindOwnersDto } from './dto/find-owners.dto';
import { MediaType, Owner, UserRole, VerificationType } from '@prisma/client';
import { VerifcationService } from '../verifications/verification.service';
import { CreateVerifcationDto } from 'src/domains/verifications/dto/create-verifcation.dto';
import { UpdateVerifcationDto } from 'src/domains/verifications/dto/update-verifcation.dto';
import { Logger } from 'src/common/logger/logger.service';
import { isPrismaErrorCode } from 'src/infrastructure/shared/utils/prisma.exceptions';
import { hasNullOrUndefinedDeep } from 'src/infrastructure/shared/utils/payload-validation.utils';

@Injectable()
export class OwnersService {
  constructor(
    @Inject('IDatabaseService') private readonly database: IDatabaseService,
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
  }: FindOwnersDto): Promise<Partial<Owner>[]> {
    const userToSkip = (page - 1) * offset;

    return this.prisma.owner.findMany({
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
    return prisma.owner.findUnique({
      where: {
        id: id,
      },
      select: {
        id: true,
        username: true,
        firstname: true,
        lastname: true,
        email: true,
        password: true,
        role: true,
        isActive: true,
        isVerified: true,
        createdAt: true,
        updatedAt: true,
        age: true,
        address: true,
        phone_number: true,
        isDeleted: true,
        deletedAt: true,
        consentAcceptedAt: true,
        hasAcceptedLegitimacyConsent: true,
        boardingHouses: {
          select: {
            id: true,
          },
        },
      },
    });
  }

  findUserByUsername(username: string) {
    const prisma = this.prisma;
    return prisma.owner.findUnique({
      where: {
        username: username,
      },
    });
  }

  findUserById(userId: number) {
    const prisma = this.prisma;
    return prisma.owner.findUnique({
      where: {
        id: userId,
      },
    });
  }

  async create(dto: CreateOwnerDto) {
    const existing = await this.prisma.owner.findFirst({
      where: {
        OR: [{ email: dto.email }, { username: dto.username }],
      },
    });

    if (existing?.email === dto.email) {
      throw new ConflictException('Email is already in use');
    }

    if (existing?.username === dto.username) {
      throw new ConflictException('Username is already in use');
    }

    return this.prisma.owner.create({
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
        'Either ownerId or tenantId must be provided',
      );
    }

    // 🔹 Quick check: does the owner exist?
    const ownerExists = await this.prisma.owner.findUnique({
      where: { id: userId },
    });

    if (!ownerExists) {
      throw new BadRequestException(`Owner with id ${userId} does not exist`);
    }

    // 3️⃣ Transaction + creation
    try {
      const id = await this.prisma.$transaction(async (tx) => {
        return await this.verificationService.create(
          tx,
          file,
          UserRole.OWNER,
          {
            type: 'OWNER',
            targetId: userId,
            mediaType: MediaType.DOCUMENT,
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

    const verificationDocumentOwnerID =
      await prisma.verificationDocument.findUnique({
        where: { id: verificationDocumentId },
        select: { userId: true, userType: true },
      });

    const searchOwner = await prisma.owner.findUnique({
      where: { id: verificationDocumentOwnerID?.userId },
    });

    if (!verificationDocumentOwnerID) {
      throw new NotFoundException(
        `Verification Document ${verificationDocumentId} not found`,
      );
    }

    if (!searchOwner) {
      throw new NotFoundException(
        `User ${verificationDocumentId} Verification Document does not exist, ${searchOwner}`,
      );
    }

    return await this.verificationService.updateVerificationDocument(
      prisma,
      verificationDocumentId,
      file,
      {
        type: 'OWNER',
        //! so it was +verificationDocumentOwnerID but object cant coerce with number returns NAN bug
        targetId: verificationDocumentOwnerID.userId,
        mediaType: MediaType.DOCUMENT,
      },
      {
        expiresAt: payload.expiresAt,
        type: payload.type,
      },
      false,
    );
  }

  async findAllVerificationDocument() {
    const prisma = this.prisma;

    const verificationDocuments = await prisma.verificationDocument.findMany({
      where: { userType: 'OWNER' },
      // don't include owner because ownerId is null
    });

    const results = await Promise.all(
      verificationDocuments.map(async (verificationDocument) => {
        try {
          const { userId } = verificationDocument;

          if (!userId) return null;

          // fetch the owner using userId
          const ownerData = await prisma.owner.findUnique({
            where: { id: userId }, // TypeScript will complain if userId could be null
          });

          if (!ownerData) return null; // gracefully skip if owner doesn't exist

          const verificationDocumentData =
            await this.verificationService.getVerificationDocumentMetaData(
              prisma,
              verificationDocument.id,
              false,
            );

          const { tenantId, ownerId, owner, ...safeData } =
            verificationDocumentData;

          return {
            ...safeData,
            owner: {
              id: ownerData.id,
              firstname: ownerData.firstname,
              lastname: ownerData.lastname,
              email: ownerData.email,
              // add any fields you want to expose
            },
          };
        } catch (err) {
          this.logger.error(err, undefined, {
            verificationDocumentId: verificationDocument.id,
            rawUrl: verificationDocument.url,
          });
          return null; // skip gracefully
        }
      }),
    );

    return results.filter((p) => p !== null);
  }

  async getVerificationStatus(ownerId: number) {
    const requiredVerificationDocuments = [
      VerificationType.DTI,
      VerificationType.BIR,
      VerificationType.FIRE_CERTIFICATE,
      VerificationType.SANITARY_PERMIT,
      VerificationType.SEC,
    ];

    const owner = await this.prisma.verificationDocument.findMany({
      where: {
        userId: ownerId,
        userType: 'OWNER',
      },
    });

    const missingVerificationDocuments = requiredVerificationDocuments.filter(
      (type) => !owner.some((p) => p.verificationType === type),
    ) as VerificationType[];

    const verified =
      owner.length > 0 && // must have at least one document
      missingVerificationDocuments.length === 0 && // no missing documents
      owner.every((doc) => doc.verificationStatus === 'APPROVED');

    await this.prisma.owner.update({
      where: { id: ownerId },
      data: {
        isVerified: verified,
      },
    });

    return {
      verified,
      missingVerificationDocuments, // 👈 machine-readable enums
      verificationDocuments: owner.map((p) => ({
        id: p.id,
        verificationType: p.verificationType,
        verificationStatus: p.verificationStatus,
        expiresAt: p.expiresAt,
        fileFormat: p.fileFormat,
      })),
    };
  }

  async findOneVerificationDocument(id: number) {
    if (!id || isNaN(id)) {
      throw new BadRequestException('Invalid document ID.');
    }

    const prisma = this.prisma;

    try {
      // 1️⃣ Fetch the verification document
      const verificationDocument = await prisma.verificationDocument.findFirst({
        where: { id: id, userType: 'OWNER' },
      });

      if (!verificationDocument) {
        throw new NotFoundException('Verification document not found.');
      }

      const { userId } = verificationDocument;
      console.log('verificationDocument: ', verificationDocument);
      console.log('userId: ', userId);

      if (!userId) {
        throw new NotFoundException(
          'Verification document does not have an associated owner.',
        );
      }

      // 2️⃣ Fetch the owner using userId
      const ownerData = await prisma.owner.findUnique({
        where: { id: userId },
      });
      console.log('ownerData: ', ownerData);

      if (!ownerData) {
        throw new NotFoundException(
          `Owner with ID ${userId} not found for this document.`,
        );
      }

      // 3️⃣ Fetch the verification document metadata
      const verificationDocumentData =
        await this.verificationService.getVerificationDocumentMetaData(
          prisma,
          verificationDocument.id,
          false,
        );

      const { tenantId, ownerId, owner, ...safeData } =
        verificationDocumentData;

      return {
        ...safeData,
        owner: {
          id: ownerData.id,
          firstname: ownerData.firstname,
          lastname: ownerData.lastname,
          email: ownerData.email,
          // any other fields you want to expose
        },
      };
    } catch (err) {
      // Prisma known errors
      if (typeof err === 'object' && err !== null && 'code' in err) {
        const prismaErr = err as { code: string };

        if (prismaErr.code === 'P2025') {
          throw new NotFoundException('Owner or document not found.');
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

  async removeVerificationDocument(
    ownerId: number,
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

  async update(id: number, updateOwnerDto: UpdateOwnerDto) {
    if (!id) throw new BadRequestException('Id is required');

    // Remove undefined fields to avoid Prisma overwriting required fields with undefined
    const dataToUpdate = Object.fromEntries(
      Object.entries(updateOwnerDto).filter(([_, v]) => v !== undefined),
    );

    const existingOwner = await this.prisma.owner.findUnique({ where: { id } });
    if (!existingOwner)
      throw new NotFoundException(`Owner with id ${id} not found`);

    try {
      const updatedOwner = await this.prisma.owner.update({
        where: { id },
        data: dataToUpdate,
      });

      // Optionally, remove sensitive fields
      const { password, ...safeOwner } = updatedOwner;
      return safeOwner;
    } catch (error: any) {
      if (isPrismaErrorCode(error, 'P2002')) {
        throw new ConflictException('Username or email already exists');
      }
      throw new InternalServerErrorException('Failed to update owner');
    }
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

// TODO: fixe the delete function in service which returns no record found from prisma
/* sample reply from GPT
 * async remove(id: string): Promise<void> {
 *   try {
 *     await this.prisma.product.delete({ where: { id } });
 *   } catch (err) {
 *     if (this.isPrismaNotFoundError(err)) {
 *       throw new NotFoundException(`Product with id ${id} not found`);
 *     }
 *     throw err; // let global Nest handler log or map to 500
 *   }
 * }
 *
 * private isPrismaNotFoundError(err: unknown): err is { code: string } {
 *   return (
 *     typeof err === 'object' &&
 *     err !== null &&
 *     'code' in err &&
 *     (err as any).code === 'P2025'
 *   );
 * }
 *
 */
