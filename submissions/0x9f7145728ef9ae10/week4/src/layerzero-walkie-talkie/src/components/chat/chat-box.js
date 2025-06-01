"use client";

import { useState } from "react";
import Image from "next/image";
import sendIcon from "../../../public/send.png";
import aiIcon from "../../../public/ai.png";
import WalletConnect from "../connect/connect-wallet";
import { toSe } from "@/utils/toSe";

import { useAccount } from "wagmi";
import { config } from "@/config/wagmi";

const TARGET_CHAIN = config.chains[0];

export default function ChatBox() {
  const [message, setMessage] = useState("");
  const [loadingAI, setLoadingAI] = useState(false);
  const { isConnected, chainId, address } = useAccount();

  const needsSwitch = isConnected && chainId !== TARGET_CHAIN.id;
  const isReady = isConnected && !needsSwitch;

  const handleSend = async () => {
    try {
      await toSe(message, address);
      console.log("Message sent successfully");
      setMessage("");
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };

  const handleAI = async () => {
    if (!isReady) return;
    setLoadingAI(true);
    try {
      const res = await fetch("/api/autofill"); // Changed to relative path
      if (!res.ok) throw new Error("AI response failed");
      const aiMessage = await res.text();

      setMessage(aiMessage.slice(0, 200));
    } catch (error) {
      console.error("AI fetch error:", error);
    } finally {
      setLoadingAI(false);
    }
  };

  return (
    <div className="relative w-full max-w-3xl mx-auto">
      {/* Chatbox content */}
      <div
        className={`border-2 border-[#39FF14] rounded-lg p-4 bg-black text-white transition-all duration-300 ${
          !isReady ? "pointer-events-none opacity-50 blur-[2px]" : ""
        }`}
      >
        <textarea
          className="w-full h-15 bg-black font-mono text-sm resize-none rounded-md focus:outline-none placeholder:text-gray-500 overflow-y-auto"
          placeholder="Type your cross-chain message here and send it through the walkie-talkie."
          value={message}
          onChange={(e) => {
            const input = e.target.value;
            if (input.length <= 200) {
              setMessage(input);
            }
          }}
          style={{
            border: "none",
            color: "#39FF14",
          }}
          disabled={!isReady || loadingAI}
        />

        <div className="text-right text-xs text-gray-400 mt-1">
          {message.length} / 200
        </div>

        <div className="flex justify-between mt-2 items-center">
          {/* AI button */}
          <button
            onClick={handleAI}
            className="rounded-md transition-transform duration-150 ease-in-out hover:scale-130 w-8 h-8 flex items-center justify-center"
            type="button"
            aria-label="AI button"
            disabled={!isReady || loadingAI}
          >
            {loadingAI ? (
              <span className="loader-neon inline-block w-5 h-5 rounded-full border-2 border-t-[#39FF14] border-r-transparent animate-spin"></span>
            ) : (
              <Image src={aiIcon} alt="AI" width={20} height={20} />
            )}
          </button>

          {/* Send button */}
          <button
            onClick={handleSend}
            className="rounded-md transition-transform duration-150 ease-in-out hover:scale-130"
            type="button"
            aria-label="Send message"
            disabled={!isReady || message.trim().length === 0 || loadingAI}
          >
            <Image src={sendIcon} alt="Send" width={28} height={28} />
          </button>
        </div>
      </div>

      {/* Overlay wallet connect button in the center if not ready */}
      {!isReady && (
        <div className="absolute inset-0 flex items-center justify-center">
          <WalletConnect />
        </div>
      )}

      <style jsx>{`
        .loader-neon {
          border-color: #39ff14;
          border-top-color: transparent;
          animation: spin 1s linear infinite;
          box-shadow:
            0 0 8px #39ff14,
            0 0 15px #39ff14,
            0 0 20px #39ff14,
            0 0 40px #39ff14;
        }
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}
