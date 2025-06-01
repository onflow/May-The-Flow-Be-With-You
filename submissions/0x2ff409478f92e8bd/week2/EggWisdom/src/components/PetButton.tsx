import { useState } from 'react';
import { FlowService } from '../services/flow-service';
import { useUserData } from '../hooks/useUserData';
import { toast } from 'react-toastify';

interface PetButtonProps {
  eggId?: string;
}

export const PetButton = ({ eggId }: PetButtonProps) => {
  const { refreshUserData } = useUserData();
  const [isPetting, setIsPetting] = useState(false);
  
  const handlePet = async () => {
    if (!eggId) return;
    
    setIsPetting(true);
    
    try {
      await FlowService.petEggWisdom(parseInt(eggId));
      refreshUserData();
      toast.success('Successfully petted your egg!');
    } catch (error) {
      console.error('Error petting egg:', error);
      toast.error('Failed to pet egg');
    } finally {
      setIsPetting(false);
    }
  };
  
  if (!eggId) return null;
  
  return (
    <button
      onClick={handlePet}
      disabled={isPetting}
      className="btn btn-secondary w-full mt-4"
    >
      {isPetting ? (
        <span className="flex items-center justify-center">
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Petting...
        </span>
      ) : (
        <span className="flex items-center justify-center">
          <span className="mr-2">🖐️</span> Pet Egg
        </span>
      )}
    </button>
  );
}; 