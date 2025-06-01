import { useUserData } from '../hooks/useUserData';

export const ZenBalance = () => {
  const { userData, isLoading } = useUserData();
  
  return (
    <div className="bg-white rounded-lg shadow-md p-4 flex items-center justify-between">
      <div>
        <h3 className="text-lg font-medium text-egg-dark">Your Zen Balance</h3>
        <p className="text-gray-500 text-sm">Earn Zen by minting and uploading images</p>
      </div>
      
      <div className="flex items-center">
        <div className="h-10 w-10 rounded-full bg-egg-teal flex items-center justify-center mr-2">
          <span className="text-egg-dark font-bold">Ƶ</span>
        </div>
        
        <div className="text-right">
          {isLoading ? (
            <div className="h-6 w-16 bg-gray-200 animate-pulse rounded"></div>
          ) : (
            <span className="text-xl font-bold text-egg-dark">
              {userData?.zenBalance?.toFixed(2) || '0.00'}
            </span>
          )}
          <p className="text-xs text-gray-500">ZEN</p>
        </div>
      </div>
    </div>
  );
}; 