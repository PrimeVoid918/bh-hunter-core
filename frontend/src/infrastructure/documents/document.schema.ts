import { z } from 'zod';
import { FileFormatSchema, MediaTypeSchema } from './documents.type';

/* ===========================
   INPUT SCHEMA (App → Backend)
   =========================== */

/**
 * Allowed document MIME types
 * (modify if backend accepts more)
 */
export const AllowedDocumentMimeTypes = ['application/pdf'] as const;

export const DocumentUploadSchema = z.object({
  url: z.string().url().or(z.string()).optional(),
  uri: z.string().url().or(z.string()),
  name: z.string().min(1, 'Document name required'),

  /**
   * Narrow + validate MIME type
   */
  type: z
    .string()
    .transform((t) => t.toLowerCase())
    .refine(
      (t) => AllowedDocumentMimeTypes.includes(t as any),
      'Unsupported document type',
    ),

  /**
   * Max 10 MB (increase if needed)
   */
  size: z
    .number()
    .max(10 * 1024 * 1024, { message: 'Document size must not exceed 10MB' })
    .optional(),

  /**
   * Document only
   */
  mediaType: z.literal('pdf').default('pdf'),
});

export type AppDocumentFile = z.infer<typeof DocumentUploadSchema>;

/* ===========================
   OUTPUT SCHEMA (Backend → App)
   =========================== */

export const DocumentResponseSchema = z.object({
  id: z.number(),
  url: z.string().url(),
  fileFormat: FileFormatSchema,

  /**
   * Backend Prisma enum → same as mediaType
   */
  mediaType: MediaTypeSchema,

  createdAt: z.string().datetime(),
  isDeleted: z.boolean(),
  deletedAt: z.string().nullable(),

  /**
   * Entity relation: OWNER, ROOM, BOARDING_HOUSE etc.
   */
  entityType: z.string(),
  entityId: z.number(),
});

export type BackendDocument = z.infer<typeof DocumentResponseSchema>;

/* ===========================
   VERIFICATION DOCUMENT SCHEMA
   =========================== */
/**
 * If linking to verification documents (DTI, BIR, etc.)
 * This aligns with your NestJS + Prisma model
 */
export const VerificationDocumentSchema = z.object({
  id: z.number(),
  userId: z.number(),
  userType: z.enum(['OWNER', 'TENANT']),
  url: z.string().url(),
  documentType: z.string(), // or enum if you have VerificationTypeEnum
  mediaType: MediaTypeSchema,
  createdAt: z.string().datetime(),
});

export type VerificationDocument = z.infer<typeof VerificationDocumentSchema>;
