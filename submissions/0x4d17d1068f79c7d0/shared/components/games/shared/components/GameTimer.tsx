"use client";

import React from "react";

interface GameTimerProps {
  timeLeft: number;
  formatTime: () => string;
  getTimeColor: () => string;
  getProgressColor: () => string;
  getProgressPercentage: (maxTime?: number) => number;
  maxTime?: number;
  showProgress?: boolean;
  size?: "small" | "medium" | "large";
}

export function GameTimer({
  timeLeft,
  formatTime,
  getTimeColor,
  getProgressColor,
  getProgressPercentage,
  maxTime,
  showProgress = true,
  size = "medium",
}: GameTimerProps) {
  const sizeClasses = {
    small: "text-xl",
    medium: "text-3xl",
    large: "text-4xl",
  };

  const progressHeight = {
    small: "h-2",
    medium: "h-3",
    large: "h-4",
  };

  return (
    <div className="text-center">
      <div className={`font-bold mb-2 ${getTimeColor()} ${sizeClasses[size]}`}>
        {formatTime()}
      </div>
      
      {showProgress && (
        <div className={`w-full max-w-md mx-auto bg-gray-200 rounded-full ${progressHeight[size]}`}>
          <div
            className={`${progressHeight[size]} rounded-full transition-all duration-1000 ${getProgressColor()}`}
            style={{ width: `${getProgressPercentage(maxTime)}%` }}
          ></div>
        </div>
      )}
    </div>
  );
}
