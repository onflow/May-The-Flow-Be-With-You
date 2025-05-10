'use client';

import React from 'react';
import RandomNumber from './components/RandomNumber';

export default function Home() {
  return (
    <main className="min-h-screen bg-black overflow-x-hidden relative">
      {/* Animated background */}
      <div className="fixed inset-0 bg-black">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-purple-500/20 via-transparent to-transparent animate-pulse"></div>
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.1)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[size:4rem_4rem]"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Title */}
          <div className="text-center space-y-4">
            <h1 className="text-4xl bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 bg-clip-text text-transparent font-bold">
              Random Number Generator
            </h1>
            <p className="text-blue-400 text-sm">
              True Random Generator powered by Flow VRF
            </p>
          </div>

          {/* Random Number Component */}
          <RandomNumber />
        </div>
      </div>
    </main>
  );
}
