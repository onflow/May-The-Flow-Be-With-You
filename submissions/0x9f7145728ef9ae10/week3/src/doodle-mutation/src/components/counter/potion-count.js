"use client";
import { useAccount } from 'wagmi';
import Image from "next/image";
import radar from "../../../public/radar.gif";

export default function PotionCounter({ balance }) {

  const { address } = useAccount();

  if (!address) return null;

  const borderColor = balance > 0 ? "border-green-400" : "border-red-500";
  const textColor = balance > 0 ? "text-green-400" : "text-red-500";

  return (
    <div
      className={`bg-black/50 border-2 ${borderColor} ${textColor} p-2 rounded-full flex items-center gap-2 font-mono shadow-md max-w-md`}
    >
      <Image
        src={radar}
        alt="Radar scanning"
        width={40}
        height={40}
        className="rounded-sm pl-2"
      />
      <div className="text-lg font-bold pr-3">
        {balance > 0
          ? `${balance} mutation potion${balance > 1 ? "s" : ""} left`
          : "No mutation potion minted"}
      </div>
    </div>
  );
}
