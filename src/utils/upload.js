import { randomBytes } from 'node:crypto';
import path from 'node:path';

const normalizeMimeType = (mimeType = '') => mimeType.toLowerCase();

const getFileExtension = (filename = '') => {
  const ext = path.extname(filename).toLowerCase();
  return ext || '.jpg';
};

export const createShortUploadFilename = (prefix, originalname = '') => {
  const suffix = randomBytes(4).toString('hex');
  return `${prefix}-${Date.now().toString(36)}-${suffix}${getFileExtension(originalname)}`;
};

export const createMimeTypeFilter = (allowedMimeTypes, errorMessage) => (req, file, cb) => {
  const mimeType = normalizeMimeType(file.mimetype);

  if (!allowedMimeTypes.has(mimeType)) {
    cb(new Error(errorMessage));
    return;
  }

  cb(null, true);
};
