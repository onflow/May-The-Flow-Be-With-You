"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../providers/AuthProvider";
import { Wallet, User, LogOut, ChevronDown } from "lucide-react";
import { NavigationButton } from "./NavigationLoader";

const culturalCategories = [
  {
    name: "Randomness Revolution",
    path: "/randomness-revolution",
    icon: "🏛️",
    culture: "Greek Classical",
    description: "Ancient wisdom meets chaos theory",
  },
  {
    name: "Actually Fun Games",
    path: "/actually-fun-games",
    icon: "🥁",
    culture: "West African Griot",
    description: "Oral tradition memory mastery",
  },
  {
    name: "Generative Art & Worlds",
    path: "/generative-art-worlds",
    icon: "🎨",
    culture: "Indigenous/Aboriginal",
    description: "Visual memory landscapes",
  },
  {
    name: "AI & LLMs",
    path: "/ai-and-llms",
    icon: "🧘",
    culture: "Eastern Sage",
    description: "Contemplative memory practices",
  },
];

const WalletButton = () => {
  const { user, signInWithFlow, signInWithSupabase, signOut } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  if (!user) {
    return (
      <div className="flex gap-2">
        <button
          onClick={signInWithFlow}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-medium hover:from-purple-700 hover:to-indigo-700 transition-all duration-200"
        >
          <Wallet size={16} />
          Connect Wallet
        </button>
        <button
          onClick={signInWithSupabase}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/20 hover:bg-white/30 text-gray-700 font-medium transition-all duration-200"
        >
          <User size={16} />
          Sign In
        </button>
      </div>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/20 hover:bg-white/30 text-gray-700 font-medium transition-all duration-200"
      >
        {user.authMethod === "flow" ? <Wallet size={16} /> : <User size={16} />}
        <span className="max-w-32 truncate">
          {user.profile?.name ||
            `${user.flowAddress?.slice(0, 8)}...` ||
            user.email}
        </span>
        {user.walletType && (
          <span className="text-xs px-2 py-1 rounded bg-purple-100 text-purple-700">
            {user.walletType.toUpperCase()}
          </span>
        )}
        <ChevronDown size={14} />
      </button>

      {showDropdown && (
        <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
          <div className="p-3 border-b border-gray-100">
            <div className="text-sm font-medium text-gray-900">
              {user.profile?.name || "Anonymous User"}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {user.authMethod === "flow" ? (
                <>
                  <div>Flow Address: {user.flowAddress}</div>
                  {user.walletType && (
                    <div className="mt-1">
                      Wallet Type:{" "}
                      <span className="font-medium">
                        {user.walletType === "evm"
                          ? "EVM (Ethereum Compatible)"
                          : "Cadence (Flow Native)"}
                      </span>
                    </div>
                  )}
                </>
              ) : (
                <div>Email: {user.email}</div>
              )}
            </div>
          </div>
          <div className="p-2">
            <button
              onClick={() => {
                signOut();
                setShowDropdown(false);
              }}
              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md transition-colors"
            >
              <LogOut size={14} />
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export const Nav = () => {
  const router = useRouter();

  return (
    <nav className="flex items-center justify-between p-4">
      <div
        className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent cursor-pointer"
        onClick={() => router.push("/")}
      >
        🧠 Memoreee
      </div>

      <div className="flex items-center gap-4">
        {/* Cultural Navigation */}
        <div className="flex gap-2">
          {culturalCategories.map((category) => (
            <NavigationButton
              key={category.path}
              href={category.path}
              className="px-3 py-2 rounded-lg bg-white/20 hover:bg-white/30 text-gray-700 font-medium transition-all duration-200 text-sm group relative"
            >
              <span className="text-lg">{category.icon}</span>

              {/* Tooltip */}
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                <div className="font-semibold">{category.culture}</div>
                <div className="text-gray-300">{category.description}</div>
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
              </div>
            </NavigationButton>
          ))}
        </div>

        {/* Wallet/Auth Section */}
        <WalletButton />
      </div>
    </nav>
  );
};
