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

  try {
    const response = await fetch('/api/method/upload_file', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.statusText}`);
    }

    const result = await response.json();
    
    // Handle different response formats
    let fileUrl = result.message?.file_url || 
                  result.message?.['file_url'] ||
                  result.message ||
                  result.file_url;
    
    // If message is a string (could be the URL directly)
    if (typeof result.message === 'string' && result.message.startsWith('/')) {
      fileUrl = result.message;
    }
    
    if (!fileUrl || typeof fileUrl !== 'string') {
      throw new Error(`No valid file URL in response`);
    }
    
    return fileUrl;
  } catch (error) {
    throw error;
  }
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
 * Validate if file matches the expected type
 */
export function validateImageType(file: File, fileType: 'image' | 'pdf' = 'image'): { valid: boolean; error?: string } {
  if (fileType === 'pdf') {
    const allowedTypes = ['application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      return {
        valid: false,
        error: `"${file.name}" must be a PDF file. Got: ${file.type || 'unknown type'}.`,
      };
    }
  } else {
    // Image files
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return {
        valid: false,
        error: `"${file.name}" must be an image file (JPG, PNG, WebP). Got: ${file.type || 'unknown type'}.`,
      };
    }
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
    fileType?: 'image' | 'pdf';
  }
): Promise<{ validFiles: File[]; errors: string[] }> {
  const validFiles: File[] = [];
  const errors: string[] = [];
  const fileType = options?.fileType ?? 'image';
  
  for (const file of files) {
    const typeValidation = validateImageType(file, fileType);
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
      // Only compress images, not PDFs
      if (fileType === 'image') {
        const compressedFile = await compressImage(file, options?.compressionOptions);
        validFiles.push(compressedFile);
      } else {
        // For PDFs, just use as-is
        validFiles.push(file);
      }
    } catch {
      errors.push(`Failed to process "${file.name}"`);
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
    fileType?: 'image' | 'pdf';
  }
): Promise<Array<{ image: string }>> {
  const { validFiles } = await validateAndCompressImages(files, {
    maxSizeMB: options?.maxSizeMB,
    compressionOptions: options?.compressionOptions,
    fileType: options?.fileType,
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
