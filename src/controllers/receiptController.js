import { Blob } from 'node:buffer';
import { successResponse, errorResponse } from '../utils/response.js';

const AI_SERVICE_URL =
  process.env.AI_SERVICE_URL || process.env.ML_SERVICE_URL || 'http://localhost:8000';

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

    const formData = new FormData();
    formData.append(
      'image',
      new Blob([image.buffer], { type: image.mimetype }),
      image.originalname
    );

    const response = await fetch(`${AI_SERVICE_URL}/api/scan`, {
      method: 'POST',
      body: formData,
      signal: AbortSignal.timeout(20000),
    });

    const payload = await response.json().catch(() => null);

    if (!response.ok) {
      const message = payload?.detail || payload?.message || 'Failed to scan receipt';
      return errorResponse(res, response.status, message);
    }

    return successResponse(res, 200, 'Receipt scanned successfully', {
      scan: payload,
    });
  } catch (err) {
    next(err);
  }
};
