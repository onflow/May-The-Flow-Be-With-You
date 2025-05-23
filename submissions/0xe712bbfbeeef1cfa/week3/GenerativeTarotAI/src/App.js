import React, { useState } from 'react';
import TarotCard from './components/TarotCard';
import HomePage from './components/HomePage';
import ModelViewer from './components/ModelViewer';
import './App.css';

// Audio Player Component
const AudioPlayer = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = React.useRef(null);

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  return (
    <div className="audio-player">
      <audio
        ref={audioRef}
        src="/cards/audio.mp3"
        loop
      />
      <button 
        onClick={togglePlay}
        className={`audio-control ${isPlaying ? 'playing' : ''}`}
      >
        {isPlaying ? '🔊' : '��'}
      </button>
    </div>
  );
};

function App() {
  const [currentView, setCurrentView] = useState('welcome'); // 'welcome', 'model', 'tarot'

  const handleStart = () => {
    setCurrentView('model');
  };

  const handleModelComplete = () => {
    setCurrentView('tarot');
  };

  return (
    <div className="App">
      <AudioPlayer />
      {currentView === 'welcome' && <HomePage onStart={handleStart} />}
      {currentView === 'model' && <ModelViewer onComplete={handleModelComplete} />}
      {currentView === 'tarot' && <TarotCard />}
    </div>
  );
}

export default App; 