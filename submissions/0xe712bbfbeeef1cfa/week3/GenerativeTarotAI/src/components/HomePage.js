import React, { useEffect, useState } from 'react';
import './HomePage.css';

function HomePage({ onStart }) {
  const [isVisible, setIsVisible] = useState(false);
  const [isButtonVisible, setIsButtonVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
    setTimeout(() => setIsButtonVisible(true), 1000);
  }, []);

  return (
    <div className="home-container">
      <div className="stars"></div>
      <div className="twinkling"></div>
      <div className="welcome-content">
        <div className={`title-container ${isVisible ? 'visible' : ''}`}>
          <h1 className="main-title">Welcome to the Tarot Reading</h1>
          <div className="subtitle-container">
            <p className="subtitle">Where Mystical Wisdom Meets Modern Magic</p>
            <p className="subtitle">Unveil the Secrets of Your Destiny</p>
          </div>
        </div>
        
        <div className={`button-container ${isButtonVisible ? 'visible' : ''}`}>
          <button onClick={onStart} className="start-button">
            <span className="button-text">Begin Your Journey</span>
            <span className="button-icon">→</span>
          </button>
        </div>

        <div className="floating-elements">
          <div className="floating-card card1">✨</div>
          <div className="floating-card card2">🔮</div>
          <div className="floating-card card3">🌙</div>
          <div className="floating-card card4">⭐</div>
        </div>
      </div>
    </div>
  );
}

export default HomePage;
