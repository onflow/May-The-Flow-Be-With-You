import React, { useState } from 'react';
import TarotCard from './components/TarotCard';
import HomePage from './components/HomePage';
import ModelViewer from './components/ModelViewer';
import './App.css';

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
      {currentView === 'welcome' && <HomePage onStart={handleStart} />}
      {currentView === 'model' && <ModelViewer onComplete={handleModelComplete} />}
      {currentView === 'tarot' && <TarotCard />}
    </div>
  );
}

export default App; 