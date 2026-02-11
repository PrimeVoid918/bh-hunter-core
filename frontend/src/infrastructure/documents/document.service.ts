/**
 * Web implementation of document picking utilities.
 *
 * This version replaces:
 * - react-native-document-picker
 * - expo-file-system
 *
 * It uses the browser's native `<input type="file" />` API.
 *
 * IMPORTANT:
 * On web, you must keep a reference to the original `File` object
 * if you intend to upload it via FormData.
 */

import { AppDocumentFile, DocumentUploadSchema } from './document.schema';

/**
 * Opens a native file picker dialog in the browser and returns
 * selected document(s) normalized into AppDocumentFile format.
 *
 * @param limit - Maximum number of files allowed (default: 1)
 *
 * @returns Promise<AppDocumentFile[] | null>
 * - Returns null if user cancels
 * - Returns normalized document array otherwise
 *
 * @example
 * const docs = await pickDocument(2);
 * if (!docs) return;
 *
 * console.log(docs[0].name);
 * console.log(docs[0].uri); // preview URL
 */
export async function pickDocument(
  limit: number = 1,
): Promise<AppDocumentFile[] | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input');

    input.type = 'file';
    input.accept = '.pdf,.doc,.docx';
    input.multiple = limit > 1;

    input.onchange = () => {
      if (!input.files || input.files.length === 0) {
        resolve(null);
        return;
      }

      const files = Array.from(input.files).slice(0, limit);
      const normalized: AppDocumentFile[] = [];

      for (const file of files) {
        const doc: AppDocumentFile = {
          uri: URL.createObjectURL(file), // Temporary preview URL
          name: file.name,
          type: file.type.toLowerCase(),
          size: file.size,
          mediaType: 'pdf', // Adjust if needed in UI
        };

        const parsed = DocumentUploadSchema.safeParse(doc);

        if (!parsed.success) {
          console.error(parsed.error.format());
          resolve(null);
          return;
        }

        normalized.push(parsed.data);
      }

      resolve(normalized);
    };

    input.click();
  });
}

/**
 * Convenience wrapper for selecting a single document.
 *
 * @returns Promise<AppDocumentFile | null>
 *
 * @example
 * const doc = await pickSingleDocument();
 * if (!doc) return;
 *
 * console.log(doc.name);
 */
export async function pickSingleDocument(): Promise<AppDocumentFile | null> {
  const results = await pickDocument(1);
  return results ? results[0] : null;
}

/**
 * Converts a selected document into FormData for upload.
 *
 * ⚠️ WEB REQUIREMENT:
 * You MUST pass the original `File` object obtained from
 * the file input. The `AppDocumentFile` only contains metadata
 * and a preview URL — not the actual binary file.
 *
 * @param doc - Normalized AppDocumentFile metadata
 * @param dto - Additional DTO fields to append (e.g. userId, documentType)
 * @param originalFile - The original File object from the input
 *
 * @returns FormData ready for fetch / axios
 *
 * @example
 * const input = document.querySelector('input[type="file"]');
 * const file = input.files[0];
 *
 * const doc = {
 *   uri: URL.createObjectURL(file),
 *   name: file.name,
 *   type: file.type,
 *   size: file.size,
 *   mediaType: 'pdf',
 * };
 *
 * const formData = await documentToFormData(
 *   doc,
 *   { userId: 1 },
 *   file
 * );
 *
 * await fetch('/api/upload', {
 *   method: 'POST',
 *   body: formData,
 * });
 */
export async function documentToFormData(
  doc: AppDocumentFile,
  dto: Record<string, unknown>,
  originalFile: File,
): Promise<FormData> {
  if (!originalFile) {
    throw new Error('Original File object is required when uploading on web.');
  }

  const fd = new FormData();

  // Append DTO fields
  for (const [key, value] of Object.entries(dto)) {
    fd.append(key, String(value));
  }

  // Append actual binary file
  fd.append('file', originalFile);

  return fd;
}
