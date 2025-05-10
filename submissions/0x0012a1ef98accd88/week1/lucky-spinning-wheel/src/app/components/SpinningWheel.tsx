import React from 'react';

interface SpinningWheelProps {
    isSpinning: boolean;
    selectedNumber: number | null;
    onSpinComplete: () => void;
}

export default function SpinningWheel({ isSpinning, selectedNumber, onSpinComplete }: SpinningWheelProps) {
    // Create 10 segments for the wheel
    const segments = Array.from({ length: 10 }, (_, i) => i + 1);
    const segmentAngle = 360 / segments.length;

    return (
        <div className="relative w-[300px] h-[300px] md:w-[400px] md:h-[400px] mx-auto">
            {/* Outer ring with glow effect */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 animate-pulse blur-md"></div>

            {/* Wheel container */}
            <div
                className={`relative w-full h-full rounded-full bg-black border-4 border-purple-500/30 overflow-hidden transform ${isSpinning ? 'animate-spin-slow' : ''
                    } transition-transform duration-[3000ms] ease-out`}
                style={{
                    transform: selectedNumber ? `rotate(${-(selectedNumber - 0.5) * segmentAngle}deg)` : 'rotate(0deg)'
                }}
                onAnimationEnd={onSpinComplete}
            >
                {/* Wheel segments */}
                {segments.map((number, index) => (
                    <div
                        key={number}
                        className="absolute w-1/2 h-1/2 left-1/2 top-0 origin-bottom-left"
                        style={{
                            transform: `rotate(${index * segmentAngle}deg)`
                        }}
                    >
                        <div className="absolute inset-0 border-l border-purple-500/30">
                            <div
                                className="absolute left-1/2 top-[25%] -translate-x-1/2 transform text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent"
                                style={{
                                    transform: `rotate(${-index * segmentAngle - (segmentAngle / 2)}deg)`,
                                }}
                            >
                                {number}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Center point */}
            <div className="absolute top-1/2 left-1/2 w-8 h-8 -mt-4 -ml-4 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 shadow-lg z-10"></div>

            {/* Pointer */}
            <div className="absolute top-0 left-1/2 -ml-6 w-12 h-16 z-20">
                <div className="w-full h-full relative">
                    <div className="absolute top-0 left-1/2 -ml-4 w-8 h-8 bg-gradient-to-r from-pink-500 to-purple-500 transform rotate-45"></div>
                </div>
            </div>
        </div>
    );
} 