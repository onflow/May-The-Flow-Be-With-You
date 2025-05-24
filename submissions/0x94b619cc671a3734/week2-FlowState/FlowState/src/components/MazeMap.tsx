import React from 'react';
import ImageFrame from './ImageFrame';
import './MazeMap.css';

interface MazeMapProps {
  onFrameClick: (id: number) => void;
}

const MazeMap: React.FC<MazeMapProps> = ({ onFrameClick }) => {
  // Define positions for 15 frames along the track
  const framePositions = [
    { id: 1, top: '13%', left: '30%' },
    { id: 2, top: '22%', left: '35%' },
    { id: 3, top: '20%', left: '55%' },
    { id: 4, top: '30%', left: '67%' },
    { id: 5, top: '42%', left: '79%' },
    { id: 6, top: '55%', left: '67%' },
    { id: 7, top: '62%', left: '55%' },
    { id: 8, top: '70%', left: '40%' },
    { id: 9, top: '75%', left: '25%' },
    { id: 10, top: '75%', left: '68%' },
    { id: 11, top: '70%', left: '78%' },
    { id: 12, top: '50%', left: '45%' },
    { id: 13, top: '40%', left: '30%' },
    { id: 14, top: '35%', left: '15%' },
    { id: 15, top: '60%', left: '15%' },
  ];

  return (
    <div className="maze-container">
      {/* Background maze image */}
      <div className="maze-background"></div>
      
      {/* Container that maintains frame positions relative to the image */}
      <div className="frames-container">
        {/* Image frames placed along the track */}
        {framePositions.map((frame) => (
          <ImageFrame
            key={frame.id}
            id={frame.id}
            top={frame.top}
            left={frame.left}
            onClick={() => onFrameClick(frame.id)}
          />
        ))}
      </div>
    </div>
  );
};

export default MazeMap;