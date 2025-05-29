"use client";

import React from "react";

export default function ChatArea({ children }) {
  return (
    <div className="w-full h-[350px] border-2 border-[#39FF14] rounded-xl overflow-y-auto p-4 bg-black">
      {children}
    </div>
  );
}
