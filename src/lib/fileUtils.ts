import { convertFileSrc } from '@tauri-apps/api/core';

export const SUPPORTED_EXTENSIONS = new Set([
  'jpg',
  'jpeg',
  'png',
  'gif',
  'bmp',
  'webp',
  'tiff',
  'tif',
  'avif'
]);

export const convertFileToAssetUrl = (filePath: string): string => {
  return convertFileSrc(filePath);
};

export const isSupportedImageFile = (filePath: string): boolean => {
  const extension = filePath.split('.').pop()?.toLowerCase();
  return extension ? SUPPORTED_EXTENSIONS.has(extension) : false;
};