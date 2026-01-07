import imageCompression from 'browser-image-compression';

export interface ImageCompressionOptions {
  maxSizeMB?: number;
  maxWidthOrHeight?: number;
  useWebWorker?: boolean;
  fileType?: 'image/jpeg' | 'image/png' | 'image/webp';
}

/**
 * Compress an image file
 */
export async function compressImage(
  file: File,
  options: ImageCompressionOptions = {}
): Promise<File> {
  const defaultOptions: ImageCompressionOptions = {
    maxSizeMB: 1,
    maxWidthOrHeight: 1920,
    useWebWorker: true,
    fileType: 'image/jpeg',
    ...options,
  };

  try {
    const compressedFile = await imageCompression(file, defaultOptions);
    
    const renamedFile = new File([compressedFile], file.name, {
      type: compressedFile.type,
      lastModified: Date.now(),
    });
    
    return renamedFile;
  } catch (error) {
    console.error('Error compressing image:', error);
    throw error;
  }
}

/**
 * Compress multiple images
 */
export async function compressImages(
  files: File[],
  options?: ImageCompressionOptions
): Promise<File[]> {
  const compressionPromises = files.map(file => compressImage(file, options));
  return Promise.all(compressionPromises);
}

/**
 * Upload a file to the server
 */
export async function uploadFile(file: File, isPrivate: boolean = false, folder: string = 'Home'): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('is_private', isPrivate ? '1' : '0');
  formData.append('folder', folder);

  const response = await fetch('/api/method/upload_file', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Upload failed: ${response.statusText}`);
  }

  const result = await response.json();
  const fileUrl = result.message?.file_url;
  
  if (!fileUrl) {
    throw new Error('No file URL returned from server');
  }
  
  return fileUrl;
}

/**
 * Upload multiple files to the server
 */
export async function uploadFiles(
  files: File[],
  isPrivate: boolean = false,
  folder: string = 'Home'
): Promise<string[]> {
  const uploadPromises = files.map(file => uploadFile(file, isPrivate, folder));
  return Promise.all(uploadPromises);
}

/**
 * Validate image file size
 */
export function validateImageSize(file: File, maxSizeMB: number = 5): { valid: boolean; error?: string } {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  
  if (file.size > maxSizeBytes) {
    return {
      valid: false,
      error: `Image "${file.name}" is ${(file.size / (1024 * 1024)).toFixed(2)}MB. Maximum size is ${maxSizeMB}MB.`,
    };
  }
  
  return { valid: true };
}

/**
 * Validate if file is an image
 */
export function validateImageType(file: File): { valid: boolean; error?: string } {
  if (!file.type.startsWith('image/')) {
    return {
      valid: false,
      error: `"${file.name}" is not an image file.`,
    };
  }
  
  return { valid: true };
}

/**
 * Validate and compress images
 */
export async function validateAndCompressImages(
  files: File[],
  options?: {
    maxSizeMB?: number;
    compressionOptions?: ImageCompressionOptions;
  }
): Promise<{ validFiles: File[]; errors: string[] }> {
  const validFiles: File[] = [];
  const errors: string[] = [];
  
  for (const file of files) {
    const typeValidation = validateImageType(file);
    if (!typeValidation.valid) {
      errors.push(typeValidation.error!);
      continue;
    }
    
    const sizeValidation = validateImageSize(file, options?.maxSizeMB);
    if (!sizeValidation.valid) {
      errors.push(sizeValidation.error!);
      continue;
    }
    
    try {
      const compressedFile = await compressImage(file, options?.compressionOptions);
      validFiles.push(compressedFile);
    } catch (error) {
      errors.push(`Failed to compress "${file.name}"`);
      validFiles.push(file);
    }
  }
  
  return { validFiles, errors };
}

/**
 * Upload images with compression
 * Returns array of uploaded file URLs and their corresponding image objects for table entries
 */
export async function uploadImagesWithCompression(
  files: File[],
  options?: {
    maxSizeMB?: number;
    compressionOptions?: ImageCompressionOptions;
    isPrivate?: boolean;
    folder?: string;
  }
): Promise<Array<{ image: string }>> {
  const { validFiles } = await validateAndCompressImages(files, {
    maxSizeMB: options?.maxSizeMB,
    compressionOptions: options?.compressionOptions,
  });
  
  if (validFiles.length === 0) {
    return [];
  }
  
  // Upload all files
  const fileUrls = await uploadFiles(
    validFiles,
    options?.isPrivate ?? false,
    options?.folder ?? 'Home'
  );
  
  // Return in table format
  return fileUrls.map(url => ({ image: url }));
}
