import React, { useState } from 'react';
import TarotCard from './components/TarotCard';
import HomePage from './components/HomePage';
import './App.css';

function App() {
  const [showTarot, setShowTarot] = useState(false);

  const handleStart = () => {
    setShowTarot(true);
  };

  return (
    <div className="App">
      {!showTarot ? (
        <HomePage onStart={handleStart} />
      ) : (
        <TarotCard />
      )}
    </div>
  );
}

export default App; 