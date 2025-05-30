"use client";

import React, { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { LoadingSpinner, getRandomMemoryMessage } from "./LoadingSpinner";

interface NavigationLoaderProps {
  children: React.ReactNode;
}

export function NavigationLoader({ children }: NavigationLoaderProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState(getRandomMemoryMessage());
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    let messageIntervalId: NodeJS.Timeout;

    const handleStart = () => {
      setIsLoading(true);
      setLoadingMessage(getRandomMemoryMessage());
      
      // Update loading message every 2 seconds
      messageIntervalId = setInterval(() => {
        setLoadingMessage(getRandomMemoryMessage());
      }, 2000);
    };

    const handleComplete = () => {
      // Add a small delay to prevent flashing
      timeoutId = setTimeout(() => {
        setIsLoading(false);
        if (messageIntervalId) {
          clearInterval(messageIntervalId);
        }
      }, 300);
    };

    // Listen for route changes
    const originalPush = router.push;
    router.push = (...args) => {
      handleStart();
      return originalPush.apply(router, args);
    };

    // Clean up on pathname change (route completed)
    handleComplete();

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      if (messageIntervalId) clearInterval(messageIntervalId);
    };
  }, [pathname, router]);

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-white/90 backdrop-blur-sm z-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md mx-4 text-center">
          <div className="mb-6">
            <div className="text-6xl mb-4 animate-bounce">🧠</div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
              Memoreee
            </h2>
          </div>
          <LoadingSpinner size="lg" message={loadingMessage} />
          <div className="mt-4 text-sm text-gray-500">
            Preparing your memory journey...
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

// Enhanced navigation hook with loading states
export function useNavigationWithLoading() {
  const [isNavigating, setIsNavigating] = useState(false);
  const router = useRouter();

  const navigateWithLoading = async (href: string) => {
    setIsNavigating(true);
    try {
      await router.push(href);
    } finally {
      // Add delay to prevent flashing
      setTimeout(() => {
        setIsNavigating(false);
      }, 500);
    }
  };

  return {
    isNavigating,
    navigateWithLoading,
    router,
  };
}

// Button component with built-in loading state
interface NavigationButtonProps {
  href: string;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
  onClick?: () => void;
}

export function NavigationButton({ 
  href, 
  children, 
  className = "", 
  disabled = false,
  onClick 
}: NavigationButtonProps) {
  const { isNavigating, navigateWithLoading } = useNavigationWithLoading();

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (disabled || isNavigating) return;
    
    if (onClick) {
      onClick();
    }
    
    await navigateWithLoading(href);
  };

  return (
    <button
      onClick={handleClick}
      disabled={disabled || isNavigating}
      className={`
        relative transition-all duration-200
        ${isNavigating ? 'opacity-75 cursor-wait' : 'cursor-pointer'}
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        ${className}
      `}
    >
      {isNavigating && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/80 rounded-lg">
          <LoadingSpinner size="sm" message="" />
        </div>
      )}
      <div className={isNavigating ? 'opacity-50' : ''}>
        {children}
      </div>
    </button>
  );
}
