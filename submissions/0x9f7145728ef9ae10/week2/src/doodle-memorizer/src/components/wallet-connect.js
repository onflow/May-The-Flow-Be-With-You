'use client';

import { ArrowRight, Play } from "lucide-react";
import { useConnectModal } from '@rainbow-me/rainbowkit';
import { useAccount, useSwitchChain } from 'wagmi';
import { config } from '@/config/wagmi';
import Image from "next/image";
import up from "../../public/up.png";
import switch_icon from "../../public/switch.png";

const TARGET_CHAIN = config.chains[0];

export default function WalletConnectButton({ selectedLevel, onStartGame }) {
  const { openConnectModal } = useConnectModal();
  const { isConnected, chainId } = useAccount();
  const { switchChain, isPending: isSwitching } = useSwitchChain({ config });

  const needsSwitch = isConnected && chainId !== TARGET_CHAIN.id;
  const isReadyToPlay = isConnected && !needsSwitch && selectedLevel;
  const isLevelSelected = !!selectedLevel;

  const handlePlay = () => {
    if (isReadyToPlay) {
      onStartGame(selectedLevel);
    }
  };

  return (
    <div className="pt-6 pb-4">
      {!isConnected ? (
        <button
          onClick={openConnectModal}
          className="flex items-center justify-between pl-10 pr-6 py-5 w-96 bg-[#E296E4] text-black text-2xl font-bold border-[3px] border-black rounded-full shadow-[4px_4px_0_0_#000] hover:-translate-y-1 hover:shadow-[6px_6px_0_0_#000] transition-all duration-200"
        >
          Connect Your Wallet
          <span className="ml-4 w-10 h-10 bg-white rounded-full flex items-center justify-center border-[2px] border-black">
            <ArrowRight size={20} className="text-black" />
          </span>
        </button>
      ) : needsSwitch ? (
        <button
          onClick={() => switchChain?.({ chainId: TARGET_CHAIN.id })}
          disabled={isSwitching}
          className="flex items-center justify-between pl-10 pr-6 py-5 w-md bg-yellow-200 text-black text-xl font-bold border-[3px] border-black rounded-full shadow-[4px_4px_0_0_#000] hover:-translate-y-1 hover:shadow-[6px_6px_0_0_#000] transition-all duration-200"
        >
          Switch to {TARGET_CHAIN.name}
          <span className="ml-4 w-10 h-10 bg-white rounded-full flex items-center justify-center border-[2px] border-black">
            <Image src={switch_icon} width={20} alt="a switch icon"/>
          </span>
        </button>
      ) : (
        <button
          onClick={handlePlay}
          disabled={!isLevelSelected}
          className={`flex items-center justify-between pl-10 pr-6 py-5 w-96 
            ${isLevelSelected ? "bg-green-300 hover:-translate-y-1 hover:shadow-[6px_6px_0_0_#000]" : "bg-gray-100 w-md cursor-not-allowed"} 
            text-black text-2xl font-bold border-[3px] border-black rounded-full shadow-[4px_4px_0_0_#000] transition-all duration-200`}
        >
          {isLevelSelected ? "Start the Game" : "Choose a level to proceed"}
          <span className="ml-4 w-10 h-10 bg-white rounded-full flex items-center justify-center border-[2px] border-black">
            {isLevelSelected ? <Play size={20} className="text-black" /> : <Image src={up} width={20} alt="a up arrow icon"/>}
          </span>
        </button>
      )}
    </div>
  );
}
