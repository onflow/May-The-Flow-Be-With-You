import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { validateImage, compressImage } from '../utils/imageUtils';

interface FileUploaderProps {
  onFileSelect: (file: File) => void;
  selectedFile: File | null;
  error?: string;
}

export const FileUploader = ({ onFileSelect, selectedFile, error }: FileUploaderProps) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    
    const file = acceptedFiles[0];
    setIsProcessing(true);
    
    try {
      // Validate the file
      const validation = validateImage(file);
      
      if (!validation.valid) {
        if (validation.error?.includes('size')) {
          // Compress the image if it's too large
          console.log('Image is too large, compressing...');
          const compressedFile = await compressImage(file);
          
          // Generate preview
          const reader = new FileReader();
          reader.onloadend = () => {
            setPreview(reader.result as string);
          };
          reader.readAsDataURL(compressedFile);
          
          onFileSelect(compressedFile);
        } else {
          throw new Error(validation.error);
        }
      } else {
        // Generate preview for valid image
        const reader = new FileReader();
        reader.onloadend = () => {
          setPreview(reader.result as string);
        };
        reader.readAsDataURL(file);
        
        onFileSelect(file);
      }
    } catch (err) {
      console.error('Error processing file:', err);
    } finally {
      setIsProcessing(false);
    }
  }, [onFileSelect]);
  
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif']
    },
    multiple: false
  });
  
  return (
    <div className="w-full">
      <div 
        {...getRootProps()} 
        className={`
          border-2 border-dashed rounded-lg p-4 transition-colors cursor-pointer
          ${isDragActive ? 'border-egg-purple bg-egg-purple/10' : 'border-gray-300 hover:border-egg-purple'}
          ${error ? 'border-red-500' : ''}
        `}
      >
        <input {...getInputProps()} />
        
        {isProcessing ? (
          <div className="h-32 flex flex-col items-center justify-center">
            <svg className="animate-spin h-10 w-10 text-egg-purple" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="mt-2 text-egg-purple font-medium">Processing image...</p>
          </div>
        ) : preview ? (
          <div className="h-32 flex items-center justify-center">
            <div className="relative">
              <img 
                src={preview} 
                alt="Preview" 
                className="max-h-32 rounded-md object-contain"
              />
              <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-30 flex items-center justify-center transition-all">
                <p className="text-white opacity-0 hover:opacity-100">Click or drop to change</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="h-32 flex flex-col items-center justify-center">
            <svg className="h-10 w-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
            </svg>
            <p className="mt-2 text-sm text-gray-500">
              {isDragActive
                ? "Drop the image here..."
                : "Drag & drop an image or click to select"}
            </p>
            <p className="mt-1 text-xs text-gray-400">
              Max file size: 1MB (larger files will be compressed)
            </p>
          </div>
        )}
      </div>
      
      {error && (
        <p className="mt-1 text-sm text-red-500">{error}</p>
      )}
    </div>
  );
}; 