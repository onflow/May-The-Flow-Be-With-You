import React from 'react';
import './ImageFrame.css';

// Import all frame images
const frameImages: Record<number, string> = {
  1: new URL('../assets/frame1.png', import.meta.url).href,
  2: new URL('../assets/frame2.png', import.meta.url).href,
  3: new URL('../assets/frame3.png', import.meta.url).href,
  4: new URL('../assets/frame4.png', import.meta.url).href,
  5: new URL('../assets/frame5.png', import.meta.url).href,
  6: new URL('../assets/frame6.png', import.meta.url).href,
  7: new URL('../assets/frame7.png', import.meta.url).href,
  8: new URL('../assets/frame8.png', import.meta.url).href,
  9: new URL('../assets/frame9.png', import.meta.url).href,
  10: new URL('../assets/frame10.png', import.meta.url).href,
  11: new URL('../assets/frame11.png', import.meta.url).href,
  12: new URL('../assets/frame12.png', import.meta.url).href,
  13: new URL('../assets/frame13.png', import.meta.url).href,
  14: new URL('../assets/frame14.png', import.meta.url).href,
  15: new URL('../assets/frame15.png', import.meta.url).href,
};

interface ImageFrameProps {
  id: number;
  top: string;
  left: string;
  onClick: () => void;
}

const ImageFrame: React.FC<ImageFrameProps> = ({ id, top, left, onClick }) => {
  return (
    <div
      className="image-frame"
      style={{ top, left }}
      onClick={onClick}
      data-frame-id={id}
    >
      <img 
        src={frameImages[id]}
        alt={`Frame ${id}`}
        className="frame-image"
      />
    </div>
  );
};

export default ImageFrame;