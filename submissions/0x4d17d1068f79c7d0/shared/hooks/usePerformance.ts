"use client";

import { useEffect, useRef, useCallback, useState } from "react";

interface PerformanceMetrics {
  renderTime: number;
  memoryUsage: number;
  frameRate: number;
  loadTime: number;
}

interface UsePerformanceOptions {
  trackRender?: boolean;
  trackMemory?: boolean;
  trackFrameRate?: boolean;
  onMetrics?: (metrics: PerformanceMetrics) => void;
  throttleMs?: number;
}

export function usePerformance(options: UsePerformanceOptions = {}) {
  const {
    trackRender = true,
    trackMemory = false,
    trackFrameRate = false,
    onMetrics,
    throttleMs = 1000,
  } = options;

  const metricsRef = useRef<PerformanceMetrics>({
    renderTime: 0,
    memoryUsage: 0,
    frameRate: 0,
    loadTime: 0,
  });

  const lastReportTime = useRef(Date.now());
  const frameCount = useRef(0);
  const animationFrameId = useRef<number | undefined>(undefined);

  // Measure render time
  const measureRender = useCallback(() => {
    if (!trackRender) return;

    const start = performance.now();

    // Use requestAnimationFrame to measure actual render time
    requestAnimationFrame(() => {
      const end = performance.now();
      metricsRef.current.renderTime = end - start;
    });
  }, [trackRender]);

  // Measure memory usage (if available)
  const measureMemory = useCallback(() => {
    if (!trackMemory) return;

    // @ts-ignore - performance.memory is not in all browsers
    if (performance.memory) {
      // @ts-ignore
      metricsRef.current.memoryUsage = performance.memory.usedJSHeapSize / 1024 / 1024; // MB
    }
  }, [trackMemory]);

  // Measure frame rate
  const measureFrameRate = useCallback(() => {
    if (!trackFrameRate) return;

    const measureFrame = () => {
      frameCount.current++;

      const now = Date.now();
      const elapsed = now - lastReportTime.current;

      if (elapsed >= 1000) {
        metricsRef.current.frameRate = (frameCount.current * 1000) / elapsed;
        frameCount.current = 0;
        lastReportTime.current = now;
      }

      animationFrameId.current = requestAnimationFrame(measureFrame);
    };

    animationFrameId.current = requestAnimationFrame(measureFrame);
  }, [trackFrameRate]);

  // Report metrics
  const reportMetrics = useCallback(() => {
    if (onMetrics) {
      onMetrics({ ...metricsRef.current });
    }
  }, [onMetrics]);

  // Throttled reporting
  useEffect(() => {
    const interval = setInterval(reportMetrics, throttleMs);
    return () => clearInterval(interval);
  }, [reportMetrics, throttleMs]);

  // Start measurements
  useEffect(() => {
    measureRender();
    measureMemory();
    measureFrameRate();

    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [measureRender, measureMemory, measureFrameRate]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, []);

  return {
    metrics: metricsRef.current,
    measureRender,
    measureMemory,
    reportMetrics,
  };
}

// Hook for game-specific performance tracking
export function useGamePerformance(gameType: string) {
  const gameStartTime = useRef<number | undefined>(undefined);
  const interactionCount = useRef(0);
  const errorCount = useRef(0);

  const startGame = useCallback(() => {
    gameStartTime.current = performance.now();
    interactionCount.current = 0;
    errorCount.current = 0;
  }, []);

  const trackInteraction = useCallback(() => {
    interactionCount.current++;
  }, []);

  const trackError = useCallback(() => {
    errorCount.current++;
  }, []);

  const getGameMetrics = useCallback(() => {
    const duration = gameStartTime.current
      ? performance.now() - gameStartTime.current
      : 0;

    return {
      gameType,
      duration,
      interactions: interactionCount.current,
      errors: errorCount.current,
      interactionsPerSecond: duration > 0 ? (interactionCount.current / duration) * 1000 : 0,
    };
  }, [gameType]);

  return {
    startGame,
    trackInteraction,
    trackError,
    getGameMetrics,
  };
}

// Hook for memory usage optimization
export function useMemoryOptimization() {
  const cleanupFunctions = useRef<(() => void)[]>([]);

  const addCleanup = useCallback((cleanup: () => void) => {
    cleanupFunctions.current.push(cleanup);
  }, []);

  const cleanup = useCallback(() => {
    cleanupFunctions.current.forEach(fn => fn());
    cleanupFunctions.current = [];
  }, []);

  // Auto-cleanup on unmount
  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  return {
    addCleanup,
    cleanup,
  };
}

// Hook for lazy loading optimization
export function useLazyLoad<T>(
  loader: () => Promise<T>,
  dependencies: any[] = []
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await loader();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setLoading(false);
    }
  }, dependencies);

  return {
    data,
    loading,
    error,
    load,
  };
}

// Performance monitoring utilities
export const performanceUtils = {
  // Measure function execution time
  measureFunction: <T extends any[], R>(
    fn: (...args: T) => R,
    name?: string
  ) => {
    return (...args: T): R => {
      const start = performance.now();
      const result = fn(...args);
      const end = performance.now();

      if (name) {
        console.log(`${name} took ${end - start} milliseconds`);
      }

      return result;
    };
  },

  // Debounce function for performance
  debounce: <T extends any[]>(
    fn: (...args: T) => void,
    delay: number
  ) => {
    let timeoutId: NodeJS.Timeout;

    return (...args: T) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => fn(...args), delay);
    };
  },

  // Throttle function for performance
  throttle: <T extends any[]>(
    fn: (...args: T) => void,
    limit: number
  ) => {
    let inThrottle: boolean;

    return (...args: T) => {
      if (!inThrottle) {
        fn(...args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  },

  // Check if device has good performance
  isHighPerformanceDevice: () => {
    // @ts-ignore
    const memory = navigator.deviceMemory || 4; // Default to 4GB if not available
    const cores = navigator.hardwareConcurrency || 4; // Default to 4 cores

    return memory >= 4 && cores >= 4;
  },
};
