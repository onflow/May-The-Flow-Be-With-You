"use client";

import React from "react";
import { Nav } from "./Nav";
import { NavigationLoader } from "./NavigationLoader";

export const Layout = ({ children }: { children: React.ReactNode }) => (
  <NavigationLoader>
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex flex-col safe-area-padding">
      <header className="backdrop-blur-md bg-white/80 shadow-lg border-b border-white/20 sticky top-0 z-40">
        <Nav />
      </header>
      <main className="flex-1 flex flex-col items-center justify-center p-2 sm:p-4 lg:p-8 space-y-4 sm:space-y-8">
        <div className="w-full max-w-7xl px-2 sm:px-4">
          <div className="bg-white/60 backdrop-blur-sm rounded-lg sm:rounded-xl lg:rounded-2xl shadow-xl border border-white/20 p-3 sm:p-6 lg:p-8">
            {children}
          </div>
        </div>
      </main>
      <footer className="text-center text-xs text-gray-500 py-3 sm:py-4 bg-white/30 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-4">
          Memoreee &copy; {new Date().getFullYear()} — Powered by ancient wisdom
          and modern technology
        </div>
      </footer>
    </div>
  </NavigationLoader>
);
