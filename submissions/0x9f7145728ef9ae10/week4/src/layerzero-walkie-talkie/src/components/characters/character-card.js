"use client";

import { useState } from "react";
import Image from "next/image";
import char1 from "../../../public/char1.png";
import char2 from "../../../public/char2.png";
import walkie_talkie from "../../../public/walkie-talkie.png";
import bomb from "../../../public/bomb.gif";
import copyIcon from "../../../public/copy.png";
import tickIcon from "../../../public/tick.png";

export default function CharacterCard({
  character,
  name,
  location,
  address,
  chain,
}) {
  const [copied, setCopied] = useState(false);

  const truncatedAddress = `${address.slice(0, 5)}...${address.slice(-5)}`;
  const explorerBaseURL =
    chain === "flow"
      ? "https://evm-testnet.flowscan.io/address/"
      : "https://eth-sepolia.blockscout.com/address/";
  const addressURL = `${explorerBaseURL}${address}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 1000);
    } catch (err) {
      console.error("Failed to copy address:", err);
    }
  };

  return (
    <div className="flex bg-black w-fit h-auto">
      {/* Left Character Image */}
      <div className="w-1/2 flex items-end">
        <Image
          src={character === "char1" ? char1 : char2}
          alt="Character"
          width={320}
          height={320}
          priority
        />
      </div>

      {/* Right Info Box */}
      <div className="w-lg flex items-end -ml-15">
        <div className="relative w-full h-fit">
          {/* Bomb GIF */}
          <div className="absolute -top-21 right-6 z-20">
            <Image src={bomb} alt="Bomb" width={100} height={100} unoptimized />
          </div>

          {/* Main Info Box */}
          <div className="flex flex-row border-2 border-[#39FF14] rounded-xl bg-black px-4 py-[22px] items-end">
            {/* Walkie Talkie Icon */}
            <div className="flex-shrink-0">
              <Image
                src={walkie_talkie}
                alt="Walkie Talkie"
                width={120}
                height={120}
                className="mr-4"
              />
            </div>

            {/* Text Info */}
            <div className="text-sm space-y-1 font-mono text-white self-end mb-2.5">
              <h2 className="text-lg font-bold text-[#39FF14]">
                Walkie Talkie Info:
              </h2>
              <p>
                <span className="font-semibold">Name:</span> {name}
              </p>
              <p>
                <span className="font-semibold">Located:</span> {location}
              </p>
              <p className="flex items-center space-x-2">
                <span className="font-semibold">
                  {chain === "eth" ? "Receiver Address" : "Sender Address"}:
                </span>
                <a
                  href={addressURL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline text-blue-400 hover:text-blue-600"
                >
                  {truncatedAddress}
                </a>
                <button onClick={handleCopy} className="ml-0.5 mb-0.5">
                  <Image
                    src={copied ? tickIcon : copyIcon}
                    alt={copied ? "Copied" : "Copy"}
                    width={16}
                    height={16}
                  />
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
