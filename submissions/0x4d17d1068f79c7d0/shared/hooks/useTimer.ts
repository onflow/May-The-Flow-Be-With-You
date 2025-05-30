"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { TimerHookReturn } from "../types/game";

export function useTimer(onComplete?: () => void): TimerHookReturn {
  const [timeLeft, setTimeLeft] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const onCompleteRef = useRef(onComplete);

  // Update the callback ref when it changes
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const start = useCallback((duration: number) => {
    clearTimer();
    setTimeLeft(duration);
    setIsRunning(true);
    
    intervalRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setIsRunning(false);
          clearTimer();
          if (onCompleteRef.current) {
            onCompleteRef.current();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [clearTimer]);

  const pause = useCallback(() => {
    setIsRunning(false);
    clearTimer();
  }, [clearTimer]);

  const resume = useCallback(() => {
    if (timeLeft > 0) {
      setIsRunning(true);
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            setIsRunning(false);
            clearTimer();
            if (onCompleteRef.current) {
              onCompleteRef.current();
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
  }, [timeLeft, clearTimer]);

  const stop = useCallback(() => {
    setIsRunning(false);
    setTimeLeft(0);
    clearTimer();
  }, [clearTimer]);

  const reset = useCallback(() => {
    setIsRunning(false);
    setTimeLeft(0);
    clearTimer();
  }, [clearTimer]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearTimer();
    };
  }, [clearTimer]);

  return {
    timeLeft,
    isRunning,
    start,
    pause,
    resume,
    stop,
    reset,
  };
}

// Specialized timer hooks
export function useStudyTimer(onComplete?: () => void) {
  return useTimer(onComplete);
}

export function useChaosTimer(onComplete?: () => void) {
  return useTimer(onComplete);
}

export function useGameTimer(onComplete?: () => void) {
  return useTimer(onComplete);
}
