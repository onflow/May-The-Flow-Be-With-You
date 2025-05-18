import { useUserData } from '../hooks/useUserData';
import type { EggWisdomNFT } from '../types';
import { PetButton } from './PetButton';

export const EggPreview = () => {
  const { userData, isLoading, hasEggs } = useUserData();
  
  // Get the first EggWisdom NFT if it exists
  const firstEgg: EggWisdomNFT | undefined = hasEggs ? userData?.eggs[0] : undefined;
  
  return (
    <div className="card">
      <h2 className="text-xl font-bold mb-4">Your EggWisdom</h2>
      
      {isLoading ? (
        <div className="flex flex-col items-center justify-center p-10 animate-pulse">
          <div className="w-48 h-48 bg-gray-200 rounded-lg"></div>
          <div className="mt-4 w-32 h-6 bg-gray-200 rounded"></div>
        </div>
      ) : hasEggs ? (
        <div className="flex flex-col items-center p-4">
          {firstEgg?.metadata.image ? (
            <img 
              src={firstEgg.metadata.image} 
              alt="EggWisdom NFT" 
              className="w-48 h-48 object-contain rounded-lg shadow-md mb-4"
            />
          ) : (
            <div className="w-48 h-48 bg-gray-100 rounded-lg flex items-center justify-center">
              <p className="text-gray-400">No image available</p>
            </div>
          )}
          
          <h3 className="text-lg font-semibold mb-2">{firstEgg?.metadata.name || 'My EggWisdom'}</h3>
          
          <p className="text-gray-600 text-center mb-4">
            {firstEgg?.metadata.description || 'A wise egg waiting to share its wisdom.'}
          </p>
          
          <div className="w-full max-w-xs">
            <div className="bg-gray-100 p-3 rounded-lg mb-4">
              <h4 className="font-medium text-egg-purple mb-1">Players</h4>
              <p className="text-sm text-gray-700">
                {firstEgg?.metadata.players?.join(', ') || 'None'}
              </p>
            </div>
            
            <div className="bg-gray-100 p-3 rounded-lg mb-4">
              <h4 className="font-medium text-egg-pink mb-1">Cats</h4>
              <p className="text-sm text-gray-700">
                {firstEgg?.metadata.cats?.join(', ') || 'None'}
              </p>
            </div>
            
            <div className="text-center mt-2">
              <p className="text-sm text-gray-500">
                Pet count: <span className="font-medium">{firstEgg?.metadata.petCount || 0}</span>
              </p>
            </div>
            
            <PetButton eggId={firstEgg?.id} />
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center p-10 bg-gray-50 rounded-lg">
          <img 
            src="https://via.placeholder.com/150?text=No+Egg" 
            alt="No EggWisdom" 
            className="w-24 h-24 opacity-50 mb-4"
          />
          <p className="text-gray-500 text-center">
            You don't have any EggWisdom NFTs yet.
            <br />
            Mint one to get started!
          </p>
        </div>
      )}
    </div>
  );
}; 