// shared/utils/multer-config.util.ts
import { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';
import { memoryStorage } from 'multer';
import path from 'path';
import { BadRequestException } from '@nestjs/common';

type FileType = 'image' | 'pdf';

const mimeTypes: Record<FileType, RegExp> = {
  image: /jpeg|jpg|png/,
  pdf: /pdf/,
};

// const mimeTypes: Record<FileType, RegExp> = {
//   image: /^image\/(jpeg|jpg|png)$/,
//   pdf: /^application\/pdf$/,
// };

const maxSizes: Record<FileType, number> = {
  image: 15 * 1024 * 1024, // 15MB limit
  pdf: 15 * 1024 * 1024, // 15MB limit
};

export function createMulterConfig(
  fileType: FileType,
  // customException: new (...args: any[]) => Error,
): MulterOptions {
  const regex = mimeTypes[fileType];
  const maxSize = maxSizes[fileType];

  return {
    storage: memoryStorage(),
    limits: {
      fileSize: maxSize,
    },
    fileFilter: (req, file, cb) => {
      const isMimeValid = regex.test(file.mimetype);
      const isExtValid = regex.test(
        path.extname(file.originalname).toLowerCase(),
      );

      if (isMimeValid && isExtValid) {
        cb(null, true);
      } else {
        cb(new BadRequestException(`Invalid ${fileType} file type.`), false);
        // TODO: add custom exception
        // cb(new customException()?.(regex) ?? new BadRequestException(...), false)
      }
    },
  };
}
