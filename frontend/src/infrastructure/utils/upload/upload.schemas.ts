import { z } from "zod";

/**
 * Transport-level schema for multipart uploads
 * (React Native FormData compatible)
 */
export const UploadFileSchema = z.object({
  uri: z.string().url().or(z.string()),
  name: z.string().min(1),
  type: z.string().min(1), // MIME only
});

export type UploadFile = z.infer<typeof UploadFileSchema>;
