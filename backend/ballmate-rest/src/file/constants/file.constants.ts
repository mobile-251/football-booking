export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export const ALLOWED_MIME_TYPES = [
    'image/jpeg',
    'image/png',
    'image/webp',
] as const;

export const ALLOWED_IMAGE_TYPES = ['venue'] as const;

export type AllowedMimeType = (typeof ALLOWED_MIME_TYPES)[number];
export type AllowedImageType = (typeof ALLOWED_IMAGE_TYPES)[number];
