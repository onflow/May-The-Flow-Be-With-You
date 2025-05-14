import { useAuth } from '../hooks/useAuth';
import { Header } from '../components/Header';
import { ZenBalance } from '../components/ZenBalance';
import { MintControls } from '../components/MintControls';
import { UploadForm } from '../components/UploadForm';
import { EggPreview } from '../components/EggPreview';
import { Leaderboard } from '../components/Leaderboard';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export const Home = () => {
  const { loggedIn } = useAuth();
  
  return (
    <div className="min-h-screen bg-egg-light flex flex-col">
      <Header />
      
      <ToastContainer 
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
      
      <main className="flex-grow container mx-auto px-4 py-8">
        {!loggedIn ? (
          <div className="max-w-2xl mx-auto text-center py-16">
            <h1 className="text-4xl font-bold text-egg-purple mb-4">
              Welcome to EggWisdom
            </h1>
            <p className="text-gray-600 mb-8">
              Connect your Flow wallet to get started with minting, uploading, and earning Zen tokens!
            </p>
            <img 
              src="https://via.placeholder.com/600x300?text=EggWisdom+Hero" 
              alt="EggWisdom" 
              className="rounded-xl shadow-lg mx-auto"
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <ZenBalance />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <MintControls />
                <EggPreview />
              </div>
              
              <UploadForm />
            </div>
            
            <div className="space-y-6">
              <Leaderboard />
            </div>
          </div>
        )}
      </main>
      
      <footer className="bg-white py-6 border-t border-gray-200">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-600 text-sm mb-4 md:mb-0">
              &copy; {new Date().getFullYear()} EggWisdom - A CryptoKitties-inspired game on Flow
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-egg-purple hover:underline text-sm">
                Terms of Service
              </a>
              <a href="#" className="text-egg-purple hover:underline text-sm">
                Privacy Policy
              </a>
              <a href="#" className="text-egg-purple hover:underline text-sm">
                Contact
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}; 