import { z } from 'zod';

/** Reusable ISO-8601 date-time string (with timezone offset) */
export const ISODateString = z.string().datetime({ offset: true });

export type UserRoleType = 'owners' | 'tenants' | 'admins';

/** Enums based on Prisma */
export const FileFormatSchema = z.enum([
  'PDF',
  'IMAGE',
  // "AUDIO",
  // "OTHER",
]);

export const MediaTypeSchema = z.enum([
  'PFP',
  'THUMBNAIL',
  'MAIN',
  'GALLERY',
  'BANNER',
  'FLOORPLAN',
  'DOCUMENT',
  'PAYMENT',
  'QR',
  'MAP',
  'ROOM',
  'VALID_ID',
]);

export const VerificationTypeSchema = z.enum([
  'BIR',
  'DTI',
  'SEC',
  'FIRE_CERTIFICATE',
  'SANITARY_PERMIT',
  'VALID_ID',
]);

export const VerificationStatusSchema = z.enum([
  'PENDING',
  'APPROVED',
  'REJECTED',
  'EXPIRED',
]);

export const UserRoleSchema = z.enum(['TENANT', 'OWNER', 'ADMIN']);

/** Full record for admin listing */
export const VerificationDocumentMetaDataSchema = z
  .object({
    id: z.number().int().positive(),
    userId: z.number().int().positive(),
    userType: UserRoleSchema,
    fileFormat: FileFormatSchema,
    verificationType: VerificationTypeSchema,
    url: z.string().min(1),
    expiresAt: ISODateString,
    verificationStatus: VerificationStatusSchema,
    verifiedById: z.number().int().positive().nullable().optional(),
    verifiedAt: ISODateString.nullable().optional(),
    approvedAt: ISODateString.nullable().optional(),
    rejectionReason: z.string().nullable().optional(),
    uploadedAt: ISODateString,
    createdAt: ISODateString,
    updatedAt: ISODateString,
    isDeleted: z.boolean(),
    deletedAt: ISODateString.nullable().optional(),
    ownerFullName: z.string(),
  })
  .strict();

/** Array response */
export const VerificationDocumentMetaDataArraySchema = z.array(
  VerificationDocumentMetaDataSchema,
);

/** Payload for creating a VerificationDocument */
export const CreateVerificationDocumentSchema = z
  .object({
    userId: z.number().int().positive(),
    fileFormat: FileFormatSchema,
    type: VerificationTypeSchema,
    expiresAt: ISODateString,
  })
  .strict();

/** Payload for updating a VerificationDocument */
export const UpdateVerificationDocumentSchema = z
  .object({
    expiresAt: ISODateString.optional(),
  })
  .strict();

export const VerificationDocumentStatusSchema = z.object({
  verified: z.boolean(),
  missingVerificationDocuments: z.array(VerificationTypeSchema),
  verificationDocuments: z.array(
    z.object({
      id: 4,
      verificationType: 'BIR',
      verificationStatus: 'APPROVED',
      expiresAt: '2025-08-15T01:34:00.000Z',
      fileFormat: 'PDF',
    }),
  ),
});

/** TS types */
export type FileFormat = z.infer<typeof FileFormatSchema>;
export type MediaType = z.infer<typeof MediaTypeSchema>;
export type VerificationType = z.infer<typeof VerificationTypeSchema>;
export type VerificationStatus = z.infer<typeof VerificationStatusSchema>;
export type UserRole = z.infer<typeof UserRoleSchema>;
export type VerificationDocumentMetaData = z.infer<
  typeof VerificationDocumentMetaDataSchema
>;
export type CreateVerificationDocumentDto = z.infer<
  typeof CreateVerificationDocumentSchema
>;
export type UpdateVerificationDocumentDto = z.infer<
  typeof UpdateVerificationDocumentSchema
>;
export type VerificationDocumentStatus = z.infer<
  typeof VerificationDocumentStatusSchema
>;

export const EntityTypeSchema = z.enum(['tenants', 'owners']);

export type EntityType = z.infer<typeof EntityTypeSchema>;

export const VerificationTypeMap: Record<
  VerificationType,
  { displayName: string; description: string; applicableFor: string }
> = {
  BIR: {
    displayName: 'BIR Permit',
    description:
      'Proof of tax registration and compliance with the Bureau of Internal Revenue',
    applicableFor: 'All business types',
  },
  DTI: {
    displayName: 'DTI Permit',
    description:
      'Certification of business name registration under the Department of Trade and Industry',
    applicableFor: 'Sole Proprietorship',
  },
  SEC: {
    displayName: 'SEC Permit',
    description:
      'Certificate of registration with the Securities and Exchange Commission',
    applicableFor: 'Partnerships or Corporations',
  },
  FIRE_CERTIFICATE: {
    displayName: 'Fire Safety Inspection Certificate',
    description:
      'Proof that the establishment meets fire safety standards as mandated by the Bureau of Fire Protection (BFP)',
    applicableFor: 'All business types',
  },
  SANITARY_PERMIT: {
    displayName: 'Sanitary Permit',
    description:
      'Proof that the establishment complies with local sanitation and health regulations',
    applicableFor: 'All business types',
  },
  VALID_ID: {
    displayName: 'Valid ID',
    description:
      "A clear photo of your Government ID (Passport, PhilID, Driver's License), School ID (for students), or Company ID (for workers). Please ensure the ID is current and all details are visible.",
    applicableFor: 'Students and Working Professionals',
  },
};