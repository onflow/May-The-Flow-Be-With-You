import { useState } from 'react';
import { FlowService } from '../services/flow-service';
import { useUserData } from '../hooks/useUserData';
import { toast } from 'react-toastify';

export const MintControls = () => {
  const { refreshUserData } = useUserData();
  const [isLoading, setIsLoading] = useState({
    eggWisdom: false,
    wisdomPhrase: false
  });
  
  const handleMintEggWisdom = async () => {
    try {
      setIsLoading(prev => ({ ...prev, eggWisdom: true }));
      await FlowService.mintEggWisdom();
      refreshUserData();
      toast.success('Successfully minted EggWisdom NFT!');
    } catch (error) {
      console.error('Error minting EggWisdom:', error);
      toast.error('Failed to mint EggWisdom NFT');
    } finally {
      setIsLoading(prev => ({ ...prev, eggWisdom: false }));
    }
  };
  
  const handleMintWisdomPhrase = async () => {
    try {
      setIsLoading(prev => ({ ...prev, wisdomPhrase: true }));
      await FlowService.mintWisdomPhrase();
      refreshUserData();
      toast.success('Successfully minted WisdomPhrase NFT!');
    } catch (error) {
      console.error('Error minting WisdomPhrase:', error);
      toast.error('Failed to mint WisdomPhrase NFT');
    } finally {
      setIsLoading(prev => ({ ...prev, wisdomPhrase: false }));
    }
  };
  
  return (
    <div className="card">
      <h2 className="text-xl font-bold mb-4">Mint NFTs</h2>
      <p className="text-gray-600 mb-6">
        Mint your own EggWisdom or WisdomPhrase NFTs to start playing
      </p>
      
      <div className="flex flex-col sm:flex-row gap-4">
        <button
          onClick={handleMintEggWisdom}
          disabled={isLoading.eggWisdom}
          className="btn btn-primary flex-1"
        >
          {isLoading.eggWisdom ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Minting...
            </span>
          ) : "Mint EggWisdom"}
        </button>
        
        <button
          onClick={handleMintWisdomPhrase}
          disabled={isLoading.wisdomPhrase}
          className="btn btn-secondary flex-1"
        >
          {isLoading.wisdomPhrase ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Minting...
            </span>
          ) : "Mint WisdomPhrase"}
        </button>
      </div>
    </div>
  );
}; 