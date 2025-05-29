"use client";

import React, { useState, useEffect } from "react";
import { Sheet } from "@silk-hq/components";
import steddieProfile from "../steddie/steddie";

const randomTagline = () => {
  const taglines = steddieProfile.taglines;
  return taglines[Math.floor(Math.random() * taglines.length)];
};

export const Steddie = () => {
  // Start with first tagline to avoid hydration mismatch
  const [tagline, setTagline] = useState(steddieProfile.taglines[0]);
  const [isClient, setIsClient] = useState(false);

  // Set random tagline only on client side
  useEffect(() => {
    setIsClient(true);
    setTagline(randomTagline());
  }, []);

  return (
    <div className="flex flex-col items-center p-4">
      {/* Steddie Avatar */}
      <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-green-700 rounded-full flex items-center justify-center text-white text-3xl font-bold shadow-lg">
        🐢
      </div>
      <div className="mt-3 text-xl font-bold text-green-800">Steddie</div>
      <div className="italic text-gray-600 text-center max-w-xs mt-2 text-sm leading-relaxed">
        “{tagline}”
      </div>

      {/* Silk Sheet for Wisdom */}
      <Sheet.Root license="non-commercial">
        <Sheet.Trigger asChild>
          <button className="mt-4 px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 transition-all duration-200 shadow-md hover:shadow-lg font-medium">
            💡 Get Wisdom
          </button>
        </Sheet.Trigger>
        <Sheet.Portal>
          <Sheet.View>
            <Sheet.Backdrop themeColorDimming="auto" />
            <Sheet.Content className="bg-white rounded-t-3xl p-6 max-w-md mx-auto">
              <Sheet.BleedingBackground />
              <div className="text-center">
                <div className="text-4xl mb-4">🐢</div>
                <h2 className="text-2xl font-bold text-green-800 mb-4">
                  Steddie's Wisdom
                </h2>
                <div className="space-y-4">
                  <div className="p-4 bg-green-50 rounded-lg border-l-4 border-green-500">
                    <p className="italic text-green-700">"{tagline}"</p>
                  </div>
                  <button
                    className="w-full py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                    onClick={() => setTagline(randomTagline())}
                  >
                    🔄 New Wisdom
                  </button>
                  <div className="text-sm text-gray-500 mt-4">
                    <p>Steddie has been sharing memory wisdom for centuries.</p>
                    <p className="mt-2">Ready to start your memory journey?</p>
                  </div>
                </div>
              </div>
            </Sheet.Content>
          </Sheet.View>
        </Sheet.Portal>
      </Sheet.Root>
    </div>
  );
};
