/**
 * Get file type category based on mimetype
 * @param {string} mimetype - The file's mimetype
 * @returns {string} File type category (image, video, audio, document, other)
 */
export const getFileType = (mimetype) => {
  if (!mimetype) return 'other';
  
  if (mimetype.startsWith('image/')) {
    return 'image';
  } else if (mimetype.startsWith('video/')) {
    return 'video';
  } else if (mimetype.startsWith('audio/')) {
    return 'audio';
  } else if (
    mimetype === 'application/pdf' ||
    mimetype.includes('document') ||
    mimetype.includes('text/') ||
    mimetype.includes('spreadsheet') ||
    mimetype.includes('presentation')
  ) {
    return 'document';
  }
  
  return 'other';
};

/**
 * Format file size to human-readable format
 * @param {number} bytes - File size in bytes
 * @returns {string} Formatted file size (e.g., "1.5 MB")
 */
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

/**
 * Check if file is valid (type and size)
 * @param {File} file - The file to check
 * @param {number} maxSize - Maximum file size in bytes (default: 10MB)
 * @returns {Object} Object with isValid and message properties
 */
export const validateFile = (file, maxSize = 10 * 1024 * 1024) => {
  // Check file size
  if (file.size > maxSize) {
    return {
      isValid: false,
      message: `File size exceeds the limit of ${formatFileSize(maxSize)}`
    };
  }
  
  // Check file type
  const allowedTypes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'video/mp4',
    'video/quicktime',
    'video/x-msvideo',
    'video/x-ms-wmv',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain',
    'audio/mpeg',
    'audio/wav',
    'audio/ogg'
  ];
  
  if (!allowedTypes.includes(file.type)) {
    return {
      isValid: false,
      message: 'File type not supported. Please upload an image, video, document, or audio file.'
    };
  }
  
  return {
    isValid: true,
    message: 'File is valid'
  };
};

/**
 * Create a FormData object with file and other data
 * @param {File} file - The file to upload
 * @param {Object} additionalData - Additional data to include in the FormData
 * @returns {FormData} FormData object with file and additional data
 */
export const createFileFormData = (file, additionalData = {}) => {
  const formData = new FormData();
  formData.append('file', file);
  
  // Add additional data
  Object.entries(additionalData).forEach(([key, value]) => {
    formData.append(key, value);
  });
  
  return formData;
};
