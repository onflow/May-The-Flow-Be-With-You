"use client";

import { useEffect, useState } from "react";
import { ArrowRight, Play } from "lucide-react";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import { useAccount, useSwitchChain } from "wagmi";
import { config } from "@/config/wagmi";
import Image from "next/image";
import switch_icon from "../../../public/switch.png";
import { useMutationContext } from "@/context/MutationContext";

const TARGET_CHAIN = config.chains[0];

export default function WalletConnectButton({
  hasImage,
  balance,
  settingsChanged,
  preview,
}) {
  const { openConnectModal } = useConnectModal();
  const { isConnected, chainId } = useAccount();
  const { switchChain, isPending: isSwitching } = useSwitchChain({ config });

  const needsSwitch = isConnected && chainId !== TARGET_CHAIN.id;

  const {
    runBurn,
    runGenerate,
    runMutation,
    runUpload,
    runMint,
    isBurning,
    isGenerating,
    isMutating,
    isUploading,
    isMinting,
    explorerLink,
  } = useMutationContext();

  const [hasApiKey, setHasApiKey] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const key = sessionStorage.getItem("openai_api_key");
      setHasApiKey(!!key);
    }
  }, [settingsChanged]);

  const handleMutate = async () => {
    try {
      const openaiKey = sessionStorage.getItem("openai_api_key");
      if (!openaiKey) throw new Error("Missing API key");

      await runBurn();
      const generatedPrompt = await runGenerate();

      const base64 = await runMutation(preview, openaiKey, generatedPrompt);

      const uri = await runUpload(base64);

      const txHash = await runMint(uri);

      console.log("Mint transaction hash:", txHash);
    } catch (err) {
      console.error("Mutation process failed:", err);
    }
  };

  // Determine button status
  let isDisabled = false;
  let buttonText = "Start Mutating";

  if (!hasImage) {
    isDisabled = true;
    buttonText = "No Doodles detected...";
  } else if (!hasApiKey) {
    isDisabled = true;
    buttonText = "Set your API key.";
  } else if (isBurning) {
    isDisabled = true;
    buttonText = "Burning potion...";
  } else if (isGenerating) {
    isDisabled = true;
    buttonText = "Analysing potion effect...";
  } else if (isMutating) {
    isDisabled = true;
    buttonText = "Mutating Doodles...";
  } else if (isUploading) {
    isDisabled = true;
    buttonText = "Bringing it on-chain...";
  } else if (isMinting) {
    isDisabled = true;
    buttonText = "Minting on Flow...";
  } else if (balance === 0) {
    isDisabled = true;
    buttonText = "Get yourself some potion.";
  }

  const disabledStyles =
    "bg-gray-300 text-gray-600 cursor-not-allowed shadow-none";

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
          className="flex items-center justify-between pl-10 pr-6 py-5 w-auto bg-yellow-200 text-black text-xl font-bold border-[3px] border-black rounded-full shadow-[4px_4px_0_0_#000] hover:-translate-y-1 hover:shadow-[6px_6px_0_0_#000] transition-all duration-200"
        >
          Switch to {TARGET_CHAIN.name}
          <span className="ml-4 w-10 h-10 bg-white rounded-full flex items-center justify-center border-[2px] border-black">
            <Image src={switch_icon} width={20} alt="Switch network icon" />
          </span>
        </button>
      ) : (
        <button
          onClick={explorerLink ? () => window.location.reload() : handleMutate}
          disabled={!explorerLink && isDisabled}
          className={`flex items-center justify-between pl-10 pr-6 py-5 w-auto min-w-96 text-2xl font-bold border-[3px] border-black rounded-full shadow-[4px_4px_0_0_#000] transition-all duration-200
            ${
              explorerLink
                ? "bg-green-300 text-black hover:-translate-y-1 hover:shadow-[6px_6px_0_0_#000] cursor-pointer"
                : isDisabled
                ? disabledStyles
                : "bg-[#E296E4] text-black hover:-translate-y-1 hover:shadow-[6px_6px_0_0_#000] cursor-pointer"
            }
          `}
        >
          {explorerLink ? "Create new mutation" : buttonText}
          <span className="ml-4 w-10 h-10 bg-white rounded-full flex items-center justify-center border-[2px] border-black">
            {explorerLink || !isDisabled ? (
              <Play size={20} className="text-black" />
            ) : (
              <ArrowRight size={20} className="text-gray-600" />
            )}
          </span>
        </button>
      )}
    </div>
  );
}
