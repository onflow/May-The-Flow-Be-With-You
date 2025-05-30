"use client";

import React from "react";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  message?: string;
  className?: string;
}

export function LoadingSpinner({ 
  size = "md", 
  message = "Loading...", 
  className = "" 
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-8 h-8", 
    lg: "w-12 h-12"
  };

  const textSizeClasses = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg"
  };

  return (
    <div className={`flex flex-col items-center justify-center p-6 ${className}`}>
      <div className={`${sizeClasses[size]} animate-spin`}>
        <svg
          className="w-full h-full text-blue-600"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          ></circle>
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          ></path>
        </svg>
      </div>
      {message && (
        <p className={`mt-3 text-gray-600 ${textSizeClasses[size]} text-center`}>
          {message}
        </p>
      )}
    </div>
  );
}

interface LoadingCardProps {
  title?: string;
  description?: string;
  className?: string;
}

export function LoadingCard({ 
  title = "Loading", 
  description = "Please wait while we prepare your content...",
  className = ""
}: LoadingCardProps) {
  return (
    <div className={`bg-white rounded-xl shadow-lg border border-gray-200 p-6 ${className}`}>
      <div className="animate-pulse">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-6 h-6 bg-gray-200 rounded"></div>
          <div className="h-6 bg-gray-200 rounded w-32"></div>
        </div>
        <div className="space-y-3">
          <div className="h-4 bg-gray-200 rounded"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
        <div className="mt-6 flex justify-center">
          <LoadingSpinner size="sm" message="" />
        </div>
      </div>
      <div className="text-center mt-4">
        <h3 className="font-semibold text-gray-800">{title}</h3>
        <p className="text-sm text-gray-600 mt-1">{description}</p>
      </div>
    </div>
  );
}

interface LoadingOverlayProps {
  isVisible: boolean;
  message?: string;
  className?: string;
}

export function LoadingOverlay({ 
  isVisible, 
  message = "Loading...", 
  className = "" 
}: LoadingOverlayProps) {
  if (!isVisible) return null;

  return (
    <div className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 ${className}`}>
      <div className="bg-white rounded-xl p-8 shadow-2xl max-w-sm mx-4">
        <LoadingSpinner size="lg" message={message} />
      </div>
    </div>
  );
}

// Memory-themed loading messages
export const memoryLoadingMessages = [
  "Building your memory palace...",
  "Arranging the furniture of your mind...",
  "Consulting ancient memory masters...",
  "Preparing your cognitive challenge...",
  "Steddie is gathering wisdom...",
  "Generating procedural memories...",
  "Calibrating your mental gymnasium...",
  "Loading the halls of remembrance...",
  "Preparing your journey through time...",
  "Awakening dormant neural pathways..."
];

export function getRandomMemoryMessage(): string {
  return memoryLoadingMessages[Math.floor(Math.random() * memoryLoadingMessages.length)];
}

interface MemoryLoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function MemoryLoadingSpinner({ 
  size = "md", 
  className = "" 
}: MemoryLoadingSpinnerProps) {
  const [message, setMessage] = React.useState(getRandomMemoryMessage());

  React.useEffect(() => {
    const interval = setInterval(() => {
      setMessage(getRandomMemoryMessage());
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  return (
    <LoadingSpinner 
      size={size} 
      message={message} 
      className={className}
    />
  );
}
