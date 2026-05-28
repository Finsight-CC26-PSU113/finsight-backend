import { Blob } from 'node:buffer';
import path from 'node:path';
import { readFile } from 'node:fs/promises';
import { successResponse, errorResponse } from '../utils/response.js';

const AI_SERVICE_URL =
  process.env.AI_SERVICE_URL || process.env.ML_SERVICE_URL || 'http://localhost:8000';
const OCR_API_PATH = '/api/scan';

const isSupportedMimeType = (mimeType = '') => {
  const normalized = mimeType.toLowerCase();
  return normalized.startsWith('image/');
};

export const scanReceipt = async (req, res, next) => {
  try {
    const image = req.file;

    if (!image) {
      return errorResponse(res, 400, 'Receipt image is required');
    }

    if (!isSupportedMimeType(image.mimetype)) {
      return errorResponse(res, 400, 'Only image files are supported');
    }

    const uploadedBuffer = image.buffer || (image.path ? await readFile(image.path) : null);
    if (!uploadedBuffer) {
      return errorResponse(res, 400, 'Receipt image buffer is missing');
    }

    const formData = new FormData();
    formData.append(
      'image',
      new Blob([uploadedBuffer], { type: image.mimetype }),
      image.originalname
    );

    const response = await fetch(`${AI_SERVICE_URL}${OCR_API_PATH}`, {
      method: 'POST',
      body: formData,
      signal: AbortSignal.timeout(20000),
    });

    const payload = await response.json().catch(() => null);

    if (!response.ok) {
      const message = payload?.detail || payload?.message || 'Failed to scan receipt';
      return errorResponse(res, response.status, message);
    }

    const scan = payload?.data?.scan || payload?.scan || payload;
    const uploadedFilePath = image.path
      ? path.posix.join('uploads', 'ocr', path.basename(image.path))
      : null;

    return successResponse(res, 200, 'Receipt scanned successfully', {
      scan,
      ...(uploadedFilePath ? { uploaded_file_path: uploadedFilePath } : {}),
    });
  } catch (err) {
    next(err);
  }
};
