/**
 * Utility functions for image handling
 */

const MAX_FILE_SIZE = 1024 * 1024; // 1MB

/**
 * Validates that a file is an image and within size limits
 */
export const validateImage = (file: File): { valid: boolean; error?: string } => {
  // Check if the file is an image
  if (!file.type.match('image.*')) {
    return { valid: false, error: 'File must be an image (jpeg, png, etc.)' };
  }

  // Check if the file size is under 1MB
  if (file.size > MAX_FILE_SIZE) {
    return { 
      valid: false, 
      error: `File size must be under 1MB. Current size: ${(file.size / (1024 * 1024)).toFixed(2)}MB` 
    };
  }

  return { valid: true };
};

/**
 * Converts a file to a base64 string
 */
export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Extract just the base64 data (remove the data URL prefix)
      const base64Data = result.split(',')[1];
      resolve(base64Data);
    };
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
};

/**
 * Compresses an image file to be under 1MB using canvas
 */
export const compressImage = (file: File): Promise<File> => {
  return new Promise((resolve, reject) => {
    // Create an image element to load the file
    const img = new Image();
    const reader = new FileReader();
    
    reader.onload = (event) => {
      img.src = event.target?.result as string;
      
      img.onload = () => {
        // Create canvas for compression
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }
        
        // Start with original dimensions
        let width = img.width;
        let height = img.height;
        
        // Calculate new dimensions while maintaining aspect ratio
        const MAX_WIDTH = 1024;
        const MAX_HEIGHT = 1024;
        
        if (width > height) {
          if (width > MAX_WIDTH) {
            height = Math.round(height * MAX_WIDTH / width);
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width = Math.round(width * MAX_HEIGHT / height);
            height = MAX_HEIGHT;
          }
        }
        
        // Resize the canvas
        canvas.width = width;
        canvas.height = height;
        
        // Draw the image on the canvas
        ctx.drawImage(img, 0, 0, width, height);
        
        // Convert the canvas to a Blob with reduced quality
        let quality = 0.9;
        const compressAndCheck = () => {
          canvas.toBlob((blob) => {
            if (blob) {
              if (blob.size <= MAX_FILE_SIZE || quality <= 0.1) {
                // Create a new File from the compressed blob
                const compressedFile = new File([blob], file.name, {
                  type: 'image/jpeg',
                  lastModified: Date.now()
                });
                
                resolve(compressedFile);
              } else {
                // Further reduce quality and try again
                quality -= 0.1;
                compressAndCheck();
              }
            } else {
              reject(new Error('Failed to compress image'));
            }
          }, 'image/jpeg', quality);
        };
        
        compressAndCheck();
      };
      
      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
    
    reader.readAsDataURL(file);
  });
};

/**
 * Formats a Flow address for display
 */
export const formatAddress = (address: string): string => {
  if (!address) return '';
  
  const start = address.substring(0, 6);
  const end = address.substring(address.length - 4);
  
  return `${start}...${end}`;
}; 