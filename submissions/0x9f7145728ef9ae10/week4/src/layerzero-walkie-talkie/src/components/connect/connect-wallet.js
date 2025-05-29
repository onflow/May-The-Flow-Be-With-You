'use client';

import { useConnectModal } from '@rainbow-me/rainbowkit';
import { useAccount, useSwitchChain } from 'wagmi';
import { config } from '@/config/wagmi';
import Image from "next/image";
import signal from "../../../public/signal.png";
import swap from "../../../public/switch.png";

const TARGET_CHAIN = config.chains[0];

export default function WalletConnect() {
  const { openConnectModal } = useConnectModal();
  const { isConnected, chainId } = useAccount();
  const { switchChain, isPending: isSwitching } = useSwitchChain({ config });

  const needsSwitch = isConnected && chainId !== TARGET_CHAIN.id;

  if (isConnected && !needsSwitch) return null;

  return (
    <div className="pt-4">
      {!isConnected ? (
        <button
          onClick={openConnectModal}
          className="flex items-center bg-black border-2 border-[#39FF14] text-[#39FF14] font-semibold px-6 py-3 rounded-2xl transform transition-all duration-200 hover:brightness-125 hover:scale-105"
        >
          <Image src={signal} alt="signal icon" width={20} height={20} className="mr-3" />
          Connect Wallet To Activate
        </button>
      ) : (
        <button
          onClick={() => switchChain?.({ chainId: TARGET_CHAIN.id })}
          disabled={isSwitching}
          className="flex items-center bg-black border-2 border-[#39FF14] text-[#39FF14] font-semibold px-6 py-3 rounded-2xl transform transition-all duration-200 hover:brightness-125 hover:scale-105"
        >
          <Image src={swap} alt="swap icon" width={20} height={20} className="mr-3" />
          Switch to {TARGET_CHAIN.name}
        </button>
      )}
    </div>
  );
}
