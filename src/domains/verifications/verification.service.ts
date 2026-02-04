import { Injectable, NotFoundException } from '@nestjs/common';
import { DocumentService } from '../../infrastructure/document/document.service';
import { DBClient } from '../../infrastructure/image/types/types';
import {
  MediaPathBuilderUtil,
  ResourceTarget,
} from '../../infrastructure/shared/utils/media-path-builder.util';
import { FileOpsUtils } from '../../infrastructure/shared/utils/file-ops.utls';
import { CreateVerifcationDto } from './dto/create-verifcation.dto';
import { Logger } from 'src/common/logger/logger.service';
import { UserRole } from '@prisma/client';

@Injectable()
export class VerifcationService {
  constructor(
    private readonly documentService: DocumentService,
    private readonly mediaPathBuilderUtil: MediaPathBuilderUtil,
    private readonly fileOpsUtils: FileOpsUtils,
    private readonly logger: Logger,
  ) {}

  async create(
    prisma: DBClient,
    file: Express.Multer.File,
    targetRole: UserRole,
    target: ResourceTarget,
    payload: CreateVerifcationDto,
    isPublic?: boolean,
  ): Promise<number> {
    const { relPath, absPath } = this.mediaPathBuilderUtil.buildStoragePath(
      isPublic ?? true,
      target,
    );
    const filename = this.fileOpsUtils.generateFilename(file);

    const fullRelPath = `${relPath}/${filename}`;
    const fullAbsPath = `${absPath}/${filename}`;

    //* Start DB insert first inside the current transaction
    const record = await prisma.verificationDocument.create({
      data: {
        userId: +payload.userId,
        url: fullRelPath,
        userType: targetRole,
        verificationType: payload.type,
        fileFormat: payload.fileFormat,
        expiresAt: payload.expiresAt,
      },
    });

    try {
      //* Attempt file write
      await this.documentService.writeFileToDisk(file, {
        relPath: fullRelPath,
        absPath: fullAbsPath,
      });
    } catch (error) {
      //* File write failed - delete the DB record manually to avoid orphan
      await prisma.verificationDocument.delete({ where: { id: record.id } });

      //* Re-throw the error so transaction fails as well
      throw error;
    }

    return record.id;
  }

  //TODO update VerificationDocument
  async updateVerificationDocument(
    tx: DBClient,
    verificationDocumentId: number,
    file: Express.Multer.File | undefined,
    target: ResourceTarget,
    payload: Partial<CreateVerifcationDto>, // reuse your DTO, make fields optional
    isPublic?: boolean,
  ) {
    const verificationDocument = await tx.verificationDocument.findUnique({
      where: { id: verificationDocumentId },
    });
    if (!verificationDocument) {
      throw new NotFoundException(
        `Verification Document ${verificationDocumentId} not found`,
      );
    }

    let updatedUrl = verificationDocument.url;

    if (file) {
      // Step 1: Build storage path for new file
      const { relPath, absPath } = this.mediaPathBuilderUtil.buildStoragePath(
        isPublic ?? true,
        target,
      );
      const filename = this.fileOpsUtils.generateFilename(file);
      const fullRelPath = `${relPath}/${filename}`;
      const fullAbsPath = `${absPath}/${filename}`;

      await this.documentService.writeFileToDisk(file, {
        relPath: fullRelPath,
        absPath: fullAbsPath,
      });

      try {
        const oldAbsPath = this.mediaPathBuilderUtil.getAbsolutePath(
          verificationDocument.url,
          isPublic ?? true,
        );
        await this.fileOpsUtils.deleteFileStrict(oldAbsPath);
      } catch (err) {
        console.warn(
          `Failed to delete old file for Verification Document ${verificationDocumentId}:`,
          err,
        );
      }

      updatedUrl = fullRelPath;
    }

    // Step 5: Update DB record
    return tx.verificationDocument.update({
      where: { id: verificationDocumentId },
      data: {
        ...payload,
        verificationStatus: 'PENDING',
        url: updatedUrl,
      },
    });
  }

  async getAllVerificationDocumentMetaData(
    prisma: DBClient,
    IsPublic: boolean,
  ) {
    const verificationDocuments = await prisma.verificationDocument.findMany({
      include: {
        owner: {
          select: {
            firstname: true,
            lastname: true,
          },
        },
      },
    });

    return Promise.all(
      verificationDocuments.map((p) => this.formatUrl(p.url, IsPublic)),
    );
  }

  async getVerificationDocumentMetaData(
    prisma: DBClient,
    id: number,
    IsPublic: boolean,
  ) {
    const verificationDocument = await prisma.verificationDocument.findUnique({
      where: { id },
      include: {
        owner: {
          select: {
            firstname: true,
            lastname: true,
          },
        },
        tenant: {
          select: {
            firstname: true,
            lastname: true,
          },
        },
      },
    });

    if (!verificationDocument) {
      throw new NotFoundException(`Verification Document ${id} not found`);
    }

    let formattedUrl: string | null = null;

    try {
      formattedUrl = await this.formatUrl(verificationDocument.url, IsPublic);
    } catch (err) {
      this.logger.error(err, undefined, {
        verificationDocumentId: id,
        rawUrl: verificationDocument.url,
      });

      // ❓ Decision point:
      // 1. If missing URL is critical → throw a 500
      // throw new InternalServerErrorException(`Permit ${id} has invalid URL`);

      // 2. If you want to degrade gracefully → return null
      formattedUrl = null;
    }

    return { ...verificationDocument, url: formattedUrl };
  }

  async deleteVerificationDocument(
    tx: DBClient,
    id: number,
    filePath: string,
    isPublic: boolean,
  ) {
    const absPath = this.mediaPathBuilderUtil.getAbsolutePath(
      filePath,
      isPublic,
    );
    console.log('delete VerificationDocument absPath:', absPath);

    try {
      await this.fileOpsUtils.deleteFileStrict(absPath);
    } catch (err) {
      // Log or handle file delete error (optional)
      console.warn(`Failed to delete file at ${absPath}:`, err);
      // Decide if you want to rethrow or continue
      throw err; // or just continue if you want
    }

    await tx.verificationDocument.delete({ where: { id } });
  }

  private async formatUrl(
    verificationDocumentUrl: string,
    IsPublic: boolean,
  ): Promise<string | null> {
    const transformedUrl = await this.fileOpsUtils.getMediaPath(
      verificationDocumentUrl,
      IsPublic,
    );

    if (!transformedUrl) {
      this.logger.warn('Skipping pdf due to null transformedUrl', {
        rawUrl: verificationDocumentUrl,
      });
      return null; // 👈 no throw
    }

    return transformedUrl;
  }
}
