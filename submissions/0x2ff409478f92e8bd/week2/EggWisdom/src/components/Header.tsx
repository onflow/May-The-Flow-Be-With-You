import { useAuth } from '../hooks/useAuth';
import { formatAddress } from '../utils/imageUtils';

export const Header = () => {
  const { user, login, logout, loggedIn } = useAuth();
  
  return (
    <header className="bg-white shadow-md py-4">
      <div className="container mx-auto px-4 flex justify-between items-center">
        <div className="flex items-center">
          <h1 className="text-egg-purple font-bold text-xl md:text-2xl">
            🥚 EggWisdom
          </h1>
        </div>
        
        <div>
          {loggedIn && user?.addr ? (
            <div className="flex items-center gap-4">
              <span className="text-egg-dark font-medium hidden md:inline">
                {formatAddress(user.addr)}
              </span>
              <button 
                onClick={logout}
                className="btn btn-outline text-sm"
              >
                Disconnect
              </button>
            </div>
          ) : (
            <button 
              onClick={login}
              className="btn btn-primary"
            >
              Connect Wallet
            </button>
          )}
        </div>
      </div>
    </header>
  );
}; 