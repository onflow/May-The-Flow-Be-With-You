"use client";

import { useState } from "react";
import Image from "next/image";
import char1 from "../../../public/char1-avatar.png";
import char2 from "../../../public/char2-avatar.png";
import copyIcon from "../../../public/copy.png";
import tickIcon from "../../../public/tick.png";

export default function ChatCard({ character, sender, message, timestamp, txHash }) {
  const avatar = character === "char1" ? char1 : char2;

  // States for copied icons independently
  const [copiedSender, setCopiedSender] = useState(false);
  const [copiedTx, setCopiedTx] = useState(false);

  const truncatedSender = sender ? `${sender.slice(0, 5)}...${sender.slice(-5)}` : "";
  const truncatedHash = `${txHash.slice(0, 5)}...${txHash.slice(-5)}`;
  const explorerURL = `https://testnet.layerzeroscan.com/tx/${txHash}`;

  // Copy sender address handler
  const handleCopySender = async () => {
    try {
      await navigator.clipboard.writeText(sender);
      setCopiedSender(true);
      setTimeout(() => setCopiedSender(false), 1000);
    } catch (err) {
      console.error("Failed to copy sender:", err);
    }
  };

  // Copy txHash handler
  const handleCopyTx = async () => {
    try {
      await navigator.clipboard.writeText(txHash);
      setCopiedTx(true);
      setTimeout(() => setCopiedTx(false), 1000);
    } catch (err) {
      console.error("Failed to copy txHash:", err);
    }
  };

  return (
    <div className="flex items-start border-2 border-gray-700 rounded-xl p-4 bg-black text-white w-full mb-2">
      {/* Avatar */}
      <div className="flex-shrink-0 mr-4">
        <Image
          src={avatar}
          alt="Character Avatar"
          width={80}
          height={80}
          className="rounded-xl"
        />
      </div>

      {/* Message and Meta */}
      <div className="flex flex-col text-sm font-mono w-0 flex-grow">
        <p className="text-white break-words whitespace-pre-wrap">{message}</p>

        {/* Sender with copy */}
        <p className="text-gray-400 mt-2 flex items-center space-x-2">
          <span>Message By:</span>
          <span className="font-mono">{truncatedSender}</span>
          <button onClick={handleCopySender} className="ml-1">
            <Image
              src={copiedSender ? tickIcon : copyIcon}
              alt={copiedSender ? "Copied" : "Copy"}
              width={16}
              height={16}
              className="cursor-pointer"
            />
          </button>
        </p>

        <p className="text-gray-400 mt-1">Sent: {timestamp}</p>

        {/* Tx Hash with clickable link and copy button */}
        <p className="text-gray-400 mt-1 flex items-center space-x-2">
          <span>Tx Hash:</span>
          <a
            href={explorerURL}
            target="_blank"
            rel="noopener noreferrer"
            className="underline text-blue-400 hover:text-blue-600"
          >
            {truncatedHash}
          </a>
          <button onClick={handleCopyTx} className="ml-1">
            <Image
              src={copiedTx ? tickIcon : copyIcon}
              alt={copiedTx ? "Copied" : "Copy"}
              width={16}
              height={16}
              className="cursor-pointer"
            />
          </button>
        </p>
      </div>
    </div>
  );
}
