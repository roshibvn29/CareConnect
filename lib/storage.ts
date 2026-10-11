import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const STORAGE_DIR = process.env.KYC_STORAGE_DIR || path.join(process.cwd(), 'storage', 'kyc_documents');

// Ensure directory exists synchronously
if (!fs.existsSync(STORAGE_DIR)) {
  fs.mkdirSync(STORAGE_DIR, { recursive: true });
}

export const ALLOWED_FILE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
];

export const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

export interface SaveKycFileResult {
  fileId: string;
  originalName: string;
  mimeType: string;
  size: number;
  filePath: string;
  secureEndpointUrl: string;
}

/**
 * Saves an uploaded KYC document to the private storage directory.
 * Never stores in the public static folder!
 */
export async function saveKycDocument(
  fileBuffer: Buffer,
  originalName: string,
  mimeType: string
): Promise<SaveKycFileResult> {
  if (!ALLOWED_FILE_TYPES.includes(mimeType)) {
    throw new Error('Invalid file type. Only JPEG, PNG, WEBP, and PDF documents are allowed.');
  }

  if (fileBuffer.length > MAX_FILE_SIZE_BYTES) {
    throw new Error('File exceeds maximum allowed size of 5MB.');
  }

  // Generate secure unguessable file name
  const extension = path.extname(originalName) || (mimeType === 'application/pdf' ? '.pdf' : '.jpg');
  const fileId = `${crypto.randomUUID()}${extension}`;
  const targetPath = path.join(STORAGE_DIR, fileId);

  await fs.promises.writeFile(targetPath, fileBuffer);

  return {
    fileId,
    originalName,
    mimeType,
    size: fileBuffer.length,
    filePath: targetPath,
    secureEndpointUrl: `/api/kyc/document/${fileId}`,
  };
}

/**
 * Retrieves a KYC document file buffer. Coordinator authentication must be verified by caller!
 */
export async function getKycDocument(fileId: string): Promise<{ buffer: Buffer; mimeType: string } | null> {
  // Sanitize fileId to prevent directory traversal
  const safeFilename = path.basename(fileId);
  const filePath = path.join(STORAGE_DIR, safeFilename);

  if (!fs.existsSync(filePath)) {
    return null;
  }

  const buffer = await fs.promises.readFile(filePath);
  let mimeType = 'application/octet-stream';

  const ext = path.extname(safeFilename).toLowerCase();
  if (ext === '.pdf') mimeType = 'application/pdf';
  else if (ext === '.jpg' || ext === '.jpeg') mimeType = 'image/jpeg';
  else if (ext === '.png') mimeType = 'image/png';
  else if (ext === '.webp') mimeType = 'image/webp';

  return { buffer, mimeType };
}
