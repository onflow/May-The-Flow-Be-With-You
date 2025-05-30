import React from "react";
import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="flex flex-col items-center justify-center text-center space-y-12">
      {/* Hero Section */}
      <div className="space-y-8">
        <div className="relative">
          <h1 className="text-6xl md:text-8xl font-extrabold bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-800 bg-clip-text text-transparent">
            Memoreee
          </h1>
          <div className="absolute -top-4 -right-4 text-4xl animate-bounce">
            🧠
          </div>
        </div>
        <div className="text-xl md:text-2xl text-gray-600 font-light italic">
          "Where Ancient Wisdom Meets Modern Mastery"
        </div>
      </div>

      {/* Memory Palace Visualization */}
      <div className="relative w-full max-w-4xl h-64 bg-gradient-to-br from-blue-100 via-purple-50 to-indigo-100 rounded-3xl overflow-hidden shadow-2xl">
        {/* Ancient Greek Columns */}
        <div className="absolute bottom-0 left-8 w-8 h-32 bg-gradient-to-t from-stone-300 to-stone-100 rounded-t-lg shadow-lg"></div>
        <div className="absolute bottom-0 left-20 w-8 h-40 bg-gradient-to-t from-stone-300 to-stone-100 rounded-t-lg shadow-lg"></div>
        <div className="absolute bottom-0 left-32 w-8 h-36 bg-gradient-to-t from-stone-300 to-stone-100 rounded-t-lg shadow-lg"></div>

        {/* Floating Memory Orbs */}
        <div className="absolute top-8 left-16 w-12 h-12 bg-gradient-to-br from-yellow-300 to-orange-400 rounded-full shadow-lg animate-pulse flex items-center justify-center text-xl">
          🎲
        </div>
        <div className="absolute top-16 right-20 w-16 h-16 bg-gradient-to-br from-green-300 to-emerald-400 rounded-full shadow-lg animate-pulse flex items-center justify-center text-2xl">
          🎮
        </div>
        <div className="absolute top-12 left-1/2 w-14 h-14 bg-gradient-to-br from-pink-300 to-rose-400 rounded-full shadow-lg animate-pulse flex items-center justify-center text-xl">
          🎨
        </div>
        <div className="absolute bottom-16 right-16 w-10 h-10 bg-gradient-to-br from-blue-300 to-cyan-400 rounded-full shadow-lg animate-pulse flex items-center justify-center text-lg">
          🤖
        </div>

        {/* Connecting Lines */}
        <svg className="absolute inset-0 w-full h-full">
          <path
            d="M 80 120 Q 200 80 320 140"
            stroke="url(#gradient1)"
            strokeWidth="2"
            fill="none"
            className="animate-pulse"
          />
          <path
            d="M 320 140 Q 400 100 480 160"
            stroke="url(#gradient2)"
            strokeWidth="2"
            fill="none"
            className="animate-pulse"
          />
          <defs>
            <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.6" />
            </linearGradient>
            <linearGradient id="gradient2" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.6" />
            </linearGradient>
          </defs>
        </svg>

        {/* Central Text */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/30">
            <div className="text-lg font-semibold text-gray-800">
              Your Memory Palace Awaits
            </div>
            <div className="text-sm text-gray-600 mt-1">
              Connect ancient techniques with modern challenges
            </div>
          </div>
        </div>
      </div>

      {/* Journey Path */}
      <div className="w-full max-w-4xl">
        <div className="text-2xl font-bold text-gray-800 mb-8">
          Choose Your Path
        </div>
        <div className="flex flex-col md:flex-row items-center justify-center gap-8">
          {[
            {
              icon: "🏛️",
              title: "Grecian Roman",
              path: "/randomness-revolution",
              desc: "classical wisdom",
              color: "from-yellow-400 to-orange-500",
            },
            {
              icon: "🥁",
              title: "African Tradition",
              path: "/actually-fun-games",
              desc: "griot mastery",
              color: "from-amber-400 to-orange-500",
            },
            {
              icon: "🎨",
              title: "Aborigine Dreams",
              path: "/generative-art-worlds",
              desc: "indigenous scapes",
              color: "from-pink-400 to-rose-500",
            },
            {
              icon: "🧘",
              title: "Buddhist Confucian",
              path: "/ai-and-llms",
              desc: "eastern practice",
              color: "from-blue-400 to-cyan-500",
            },
          ].map((path, i) => (
            <Link key={i} href={path.path}>
              <div className="group cursor-pointer">
                <div
                  className={`w-24 h-24 bg-gradient-to-br ${path.color} rounded-full shadow-xl flex items-center justify-center text-3xl transform group-hover:scale-110 transition-all duration-300 mb-4 mx-auto`}
                >
                  {path.icon}
                </div>
                <div className="text-center">
                  <div className="font-bold text-gray-800 group-hover:text-indigo-600 transition-colors">
                    {path.title}
                  </div>
                  <div className="text-sm text-gray-600 mt-1 max-w-32">
                    {path.desc}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Wisdom Quote */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl p-8 max-w-2xl border border-indigo-100">
        <div className="text-lg italic text-gray-700 mb-4">
          "Memory is the treasury and guardian of all things."
        </div>
        <div className="text-sm text-gray-500">
          — Cicero, Ancient Roman Orator
        </div>
      </div>
    </div>
  );
}
