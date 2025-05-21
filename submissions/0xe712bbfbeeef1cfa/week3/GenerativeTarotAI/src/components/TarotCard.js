import React, { useState } from 'react';
import './TarotCard.css';

const TarotCard = () => {
  const [isFlipped, setIsFlipped] = useState(false);
  const [selectedCard, setSelectedCard] = useState(null);

  const cards = [
    'chariot.png',
    'emperor.png',
    'fool.png',
    'hermit.png',
    'high.png',
    'justice.png',
    'magician.png',
    'star.png',
    'sun.png',
    'tower.png'
  ];

  const handleCardClick = () => {
    if (!isFlipped) {
      const randomIndex = Math.floor(Math.random() * cards.length);
      setSelectedCard(cards[randomIndex]);
    }
    setIsFlipped(!isFlipped);
  };

  return (
    <div className="tarot-container">
      <div 
        className={`card ${isFlipped ? 'flipped' : ''}`}
        onClick={handleCardClick}
      >
        <div className="card-inner">
          <div className="card-front">
            <img src="/cards/backcard.png" alt="Card Back" />
          </div>
          <div className="card-back">
            {selectedCard && (
              <img src={`/cards/${selectedCard}`} alt="Tarot Card" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TarotCard; 