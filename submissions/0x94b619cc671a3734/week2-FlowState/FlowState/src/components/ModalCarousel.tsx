import React, { useState } from 'react';
import './ModalCarousel.css';
import modalImage from '../assets/modal.jpg';

interface ModalCarouselProps {
  isOpen: boolean;
  onClose: () => void;
}

const ModalCarousel: React.FC<ModalCarouselProps> = ({ isOpen, onClose }) => {
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = [
    {
      image: modalImage,
      text: 'Explore the Project on the Maze and get the clue'
    },
    {
      image: modalImage,
      text: 'Input the clues to be whitelisted'
    }
  ];

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <button className="close-button" onClick={onClose}>×</button>
        <div className="carousel-container">
          <div className="carousel-slide">
            <img src={slides[currentSlide].image} alt={`Slide ${currentSlide + 1}`} />
            <div className="slide-text">{slides[currentSlide].text}</div>
          </div>
          <button className="nav-button prev" onClick={prevSlide}>Prev</button>
          <button className="nav-button next" onClick={nextSlide}>Next</button>
          <button className="cancel-button" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
};

export default ModalCarousel; 