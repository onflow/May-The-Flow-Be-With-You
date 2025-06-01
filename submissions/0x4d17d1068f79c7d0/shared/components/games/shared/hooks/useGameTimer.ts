"use client";

import { useState, useEffect, useCallback } from "react";

interface UseGameTimerProps {
  initialTime: number;
  onTimeUp?: () => void;
  autoStart?: boolean;
}

export function useGameTimer({ 
  initialTime, 
  onTimeUp, 
  autoStart = false 
}: UseGameTimerProps) {
  const [timeLeft, setTimeLeft] = useState(initialTime);
  const [isRunning, setIsRunning] = useState(autoStart);
  const [hasStarted, setHasStarted] = useState(autoStart);

  const start = useCallback(() => {
    setIsRunning(true);
    setHasStarted(true);
  }, []);

  const pause = useCallback(() => {
    setIsRunning(false);
  }, []);

  const reset = useCallback((newTime?: number) => {
    setTimeLeft(newTime ?? initialTime);
    setIsRunning(false);
    setHasStarted(false);
  }, [initialTime]);

  const stop = useCallback(() => {
    setIsRunning(false);
    setHasStarted(false);
  }, []);

  // Timer effect
  useEffect(() => {
    if (!isRunning || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setIsRunning(false);
          onTimeUp?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isRunning, timeLeft, onTimeUp]);

  const formatTime = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, []);

  const getTimeColor = useCallback((threshold1 = 15, threshold2 = 5) => {
    if (timeLeft > threshold1) return "text-green-600";
    if (timeLeft > threshold2) return "text-yellow-600";
    return "text-red-600";
  }, [timeLeft]);

  const getProgressColor = useCallback((threshold1 = 15, threshold2 = 5) => {
    if (timeLeft > threshold1) return "bg-green-500";
    if (timeLeft > threshold2) return "bg-yellow-500";
    return "bg-red-500";
  }, [timeLeft]);

  const getProgressPercentage = useCallback((maxTime?: number) => {
    const max = maxTime ?? initialTime;
    return Math.max(0, (timeLeft / max) * 100);
  }, [timeLeft, initialTime]);

  return {
    timeLeft,
    isRunning,
    hasStarted,
    start,
    pause,
    reset,
    stop,
    formatTime: () => formatTime(timeLeft),
    getTimeColor,
    getProgressColor,
    getProgressPercentage,
  };
}
