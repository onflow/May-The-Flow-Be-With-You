import { useState, useEffect, useRef } from 'react';
import './App.css';
import MazeMap from './components/MazeMap';
import InfoPanel from './components/InfoPanel';
import { FaPlay, FaPause, FaVolumeUp, FaVolumeMute, FaBook, FaChevronLeft, FaExpand } from 'react-icons/fa';
import audioFile from './assets/warning-light-266857.mp3';
import ModalCarousel from './components/ModalCarousel';

interface FrameData {
  id: number;
  title: string;
  description: string;
  status: 'unlocked';
  xLink: string;
  websiteLink: string;
}

function App() {
  const [selectedFrame, setSelectedFrame] = useState<number | null>(null);
  const [frameData, setFrameData] = useState<FrameData[]>([]);
  const [isPlaying, setIsPlaying] = useState(true);
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isControlsCollapsed, setIsControlsCollapsed] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);

  // Check localStorage for modal state on component mount
  useEffect(() => {
    const hasSeenModal = localStorage.getItem('hasSeenModal');
    if (!hasSeenModal) {
      setIsModalOpen(true);
    }
  }, []);

  const handleModalClose = () => {
    setIsModalOpen(false);
    localStorage.setItem('hasSeenModal', 'true');
  };

  const toggleRules = () => {
    setIsModalOpen(prev => !prev);
  };

  // Initialize frame data and audio
  useEffect(() => {
    const initialFrameData: FrameData[] = [
      {
        id: 1,
        title: "Increment Finance",
        description: "One-stop DeFi platform on Flow blockchain for mass-adoption.",
        status: 'unlocked',
        xLink: "https://x.com/incrementfi",
        websiteLink: "https://app.increment.fi/"
      },
      {
        id: 2,
        title: "DefiLlama",
        description: "Open and transparent DeFi analytics platform, aggregating data across multiple chains and dApps.",
        status: 'unlocked',
        xLink: "https://x.com/DefiLlama",
        websiteLink: "https://defillama.com/"
      },
      {
        id: 3,
        title: "Trado.one",
        description: "One-Stop Trading Platform with Spot and Perp on Flow Blockchain",
        status: 'unlocked',
        xLink: "https://x.com/trado_one",
        websiteLink: "https://www.trado.one/"
      },
      {
        id: 4,
        title: "Fixes.World",
        description: "Autonomous Programmable Token Universe: launch, distribute and trade.",
        status: 'unlocked',
        xLink: "https://x.com/frame4",
        websiteLink: "https://x.com/fixesWorld"
      },
      {
        id: 5,
        title: "Pumpflow",
        description: "Launch and Verify Meme Tokens in seconds on Flow",
        status: 'unlocked',
        xLink: "",
        websiteLink: "https://pumpflow.xyz/"
      },
      {
        id: 6,
        title: "More.markets",
        description: "Connecting the world to decentralized lending Markets",
        status: 'unlocked',
        xLink: "https://x.com/MORE_Protocol",
        websiteLink: "https://www.more.markets/"
      },
      {
        id: 7,
        title: "Sturdy.finance",
        description: "Isolated lending with shared liquidity, Powered by the Sturdy Subnet",
        status: 'unlocked',
        xLink: "https://x.com/SturdyFinance",
        websiteLink: "https://sturdy.finance/"
      },
      {
        id: 8,
        title: "Izumi.finance",
        description: "A multi-chain DeFi protocol providing one-stop DEX-as-a-Service (DaaS).",
        status: 'unlocked',
        xLink: "https://x.com/frame8",
        websiteLink: "https://izumi.finance/"
      },
      {
        id: 9,
        title: "Junobot",
        description: "Junobot shares quotes from The Penumbra Podcast, built using Gimmickbots.",
        status: 'unlocked',
        xLink: "https://x.com/",
        websiteLink: "https://junobot.io/"
      },
      {
        id: 10,
        title: "Rally",
        description: "Your wallet, made social. Welcome to the new internet built for us to rally together",
        status: 'unlocked',
        xLink: "https://x.com/",
        websiteLink: "https://frame10.com"
      },
      {
        id: 11,
        title: "Hype.meme",
        description: "Hype.meme: trade memes. live now on the App Store.",
        status: 'unlocked',
        xLink: "https://x.com/",
        websiteLink: "https://hype.meme/"
      },
      {
        id: 12,
        title: "Layerzero",
        description: "Build Anything. Build Omnichain.",
        status: 'unlocked',
        xLink: "https://x.com/layerzero_core",
        websiteLink: "https://layerzero.network/"
      },
      {
        id: 13,
        title: "Relay.link",
        description: "Instant, low-cost swapping, bridging, and cross-chain execution across 73+ chains.",
        status: 'unlocked',
        xLink: "https://x.com/",
        websiteLink: "https://relay.link/bridge"
      },
      {
        id: 14,
        title: "Stargate",
        description: "A fully composable liquidity transport protocol that lives at the heart of omnichain DeFi.",
        status: 'unlocked',
        xLink: "https://x.com/StargateFinance",
        websiteLink: "https://stargate.finance/"
      },
      {
        id: 15,
        title: "Debridge",
        description: "DeFi's internet of liquidity, enabling real-time movement of assets and information across the DeFi landscape",
        status: 'unlocked',
        xLink: "https://x.com/frame15",
        websiteLink: "https://x.com/deBridgeFinance"
      }
    ];
    
    setFrameData(initialFrameData);

    // Initialize audio with Web Audio API
    audioRef.current = new Audio(audioFile);
    audioRef.current.loop = true;
    audioRef.current.volume = volume;
    audioRef.current.load();

    const setupAudioContext = () => {
      if (!audioContextRef.current && audioRef.current) {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        audioContextRef.current = new AudioContext();
        gainNodeRef.current = audioContextRef.current.createGain();
        gainNodeRef.current.gain.value = volume * 2;
        
        const source = audioContextRef.current.createMediaElementSource(audioRef.current);
        source.connect(gainNodeRef.current);
        gainNodeRef.current.connect(audioContextRef.current.destination);
      }
    };

    setupAudioContext();

    // Start playing audio by default
    if (audioRef.current) {
      audioRef.current.play().catch(error => {
        console.error('Error playing audio:', error);
        setIsPlaying(false);
      });
    }

    const handleFirstInteraction = () => {
      if (audioContextRef.current?.state === 'suspended') {
        audioContextRef.current.resume();
      }
      document.removeEventListener('click', handleFirstInteraction);
    };
    document.addEventListener('click', handleFirstInteraction);

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
      document.removeEventListener('click', handleFirstInteraction);
    };
  }, []);

  useEffect(() => {
    if (isMuted) {
      if (gainNodeRef.current) gainNodeRef.current.gain.value = 0;
      if (audioRef.current) audioRef.current.volume = 0;
    } else {
      if (gainNodeRef.current) gainNodeRef.current.gain.value = volume * 2;
      if (audioRef.current) audioRef.current.volume = volume;
    }
  }, [volume, isMuted]);

  const togglePlayPause = async () => {
    if (!audioRef.current) return;

    try {
      if (isPlaying) {
        await audioRef.current.pause();
        setIsPlaying(false);
      } else {
        if (audioContextRef.current?.state === 'suspended') {
          await audioContextRef.current.resume();
        }
        await audioRef.current.play();
        setIsPlaying(true);
      }
    } catch (error) {
      console.error('Error with audio playback:', error);
      setIsPlaying(false);
    }
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  const handleFrameClick = (frameId: number) => {
    setSelectedFrame(frameId);
  };

  const getSelectedFrameData = () => {
    if (selectedFrame === null || !frameData.length) return null;
    return frameData.find(frame => frame.id === selectedFrame) || null;
  };

  const toggleControls = () => {
    setIsControlsCollapsed(prev => !prev);
  };

  return (
    <div className="app-container">
      {isControlsCollapsed ? (
        <button 
          className="expand-button" 
          onClick={toggleControls}
          aria-label="Expand controls"
        >
          <FaExpand size={16} />
        </button>
      ) : (
        <div className="audio-controls">
          <button 
            className="audio-button" 
            onClick={togglePlayPause}
            aria-label={isPlaying ? 'Pause audio' : 'Play audio'}
          >
            {isPlaying ? <FaPause size={20} /> : <FaPlay size={20} />}
          </button>
          
          <button 
            className="audio-button" 
            onClick={toggleMute}
            aria-label={isMuted ? 'Unmute audio' : 'Mute audio'}
          >
            {isMuted ? <FaVolumeMute size={20} /> : <FaVolumeUp size={20} />}
          </button>
          
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={volume}
            onChange={(e) => setVolume(parseFloat(e.target.value))}
            className="volume-slider"
            disabled={isMuted}
          />

          <button 
            className="rules-button" 
            onClick={toggleRules}
            aria-label="View Rules"
          >
            <FaBook size={20} />
          </button>

          <button 
            className="audio-button" 
            onClick={toggleControls}
            aria-label="Collapse controls"
          >
            <FaChevronLeft size={20} />
          </button>
        </div>
      )}
      
      <div className="maze-section">
        <MazeMap onFrameClick={handleFrameClick} />
      </div>

      <div className="info-section">
        <InfoPanel 
          selectedFrame={selectedFrame} 
          frameData={getSelectedFrameData()}
        />
      </div>

      <ModalCarousel 
        isOpen={isModalOpen} 
        onClose={handleModalClose} 
      />
    </div>
  );
}

export default App;