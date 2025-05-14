import { useState, FormEvent } from 'react';
import { FlowService } from '../services/flow-service';
import { useUserData } from '../hooks/useUserData';
import { fileToBase64 } from '../utils/imageUtils';
import { FileUploader } from './FileUploader';
import { toast } from 'react-toastify';

export const UploadForm = () => {
  const { refreshUserData } = useUserData();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | undefined>();
  const [isUploading, setIsUploading] = useState(false);
  const [formData, setFormData] = useState({
    players: '',
    cats: ''
  });
  
  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    setFileError(undefined);
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!selectedFile) {
      setFileError('Please select an image to upload');
      return;
    }
    
    if (!formData.players.trim()) {
      toast.error('Please enter at least one player name');
      return;
    }
    
    if (!formData.cats.trim()) {
      toast.error('Please enter at least one cat name');
      return;
    }
    
    setIsUploading(true);
    
    try {
      // Convert file to base64
      const base64Data = await fileToBase64(selectedFile);
      
      // Split comma-separated values into arrays
      const players = formData.players.split(',').map(p => p.trim()).filter(Boolean);
      const cats = formData.cats.split(',').map(c => c.trim()).filter(Boolean);
      
      // Upload to Flow blockchain
      await FlowService.uploadWisdomImage(base64Data, players, cats);
      
      // Refresh user data
      refreshUserData();
      
      // Reset form
      setSelectedFile(null);
      setFormData({ players: '', cats: '' });
      
      toast.success('Successfully uploaded image!');
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Failed to upload image. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };
  
  return (
    <div className="card">
      <h2 className="text-xl font-bold mb-4">Upload Wisdom Image</h2>
      <p className="text-gray-600 mb-6">
        Share your gaming moments to earn Zen when others interact with your content
      </p>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-gray-700 text-sm font-medium mb-2">
            Screenshot Image
          </label>
          <FileUploader
            onFileSelect={handleFileSelect}
            selectedFile={selectedFile}
            error={fileError}
          />
        </div>
        
        <div>
          <label htmlFor="players" className="block text-gray-700 text-sm font-medium mb-2">
            Player Usernames (comma separated)
          </label>
          <input
            type="text"
            id="players"
            name="players"
            value={formData.players}
            onChange={handleInputChange}
            placeholder="e.g. Player1, Player2, Player3"
            className="input w-full"
            disabled={isUploading}
          />
        </div>
        
        <div>
          <label htmlFor="cats" className="block text-gray-700 text-sm font-medium mb-2">
            Cat Names (comma separated)
          </label>
          <input
            type="text"
            id="cats"
            name="cats"
            value={formData.cats}
            onChange={handleInputChange}
            placeholder="e.g. Whiskers, Mittens, Shadow"
            className="input w-full"
            disabled={isUploading}
          />
        </div>
        
        <button
          type="submit"
          disabled={isUploading || !selectedFile}
          className="btn btn-primary w-full"
        >
          {isUploading ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Uploading...
            </span>
          ) : "Upload Wisdom Image"}
        </button>
      </form>
    </div>
  );
}; 