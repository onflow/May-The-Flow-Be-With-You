"use client";
import { useState, useEffect } from "react";
import { useAccount, useReadContract } from "wagmi";
import { useMutationContext } from "@/context/MutationContext";
import Image from "next/image";
import wording from "../../public/wording.png";
import potion_img from "../../public/potion.png";
import { potion } from "@/contracts/abi";
import setting from "../../public/setting.png";
import SettingsModal from "@/components/setting/modal";
import WalletConnectButton from "@/components/connect/wallet-connect";
import UploadArea from "@/components/upload/upload-area";
import MintModal from "@/components/mint/modal";
import PotionCounter from "@/components/counter/potion-count";

const POTION_ADDRESS = "0x6Ea1258406B88101073Fec4c3a306699717B69d9";
const POTION_ID = 1;

export default function Home() {
  const { address } = useAccount();
  const [balance, setBalance] = useState(0);
  const [preview, setPreview] = useState(null);
  const hasImage = !!preview;
  const [settingsChanged, setSettingsChanged] = useState(false);
  const { burnCompleted } = useMutationContext();

  const { data, isFetched, refetch } = useReadContract({
    address: POTION_ADDRESS,
    abi: potion,
    functionName: "balanceOf",
    args: [address, POTION_ID],
    query: {
      enabled: !!address,
    },
  });

  useEffect(() => {
    if (isFetched && data) {
      setBalance(Number(data));
    }
  }, [data, isFetched]);

  useEffect(() => {
    if (burnCompleted) {
      refetch().then((result) => {
        const newBalance = Number(result.data);
        console.log("Old balance:", balance, "New balance:", newBalance);
        if (balance !== newBalance) {
          setBalance(newBalance);
        }
      });
    }
  }, [burnCompleted]);

  const [isMintModalOpen, setIsMintModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const openMintModal = () => setIsMintModalOpen(true);
  const closeMintModal = () => {
    setIsMintModalOpen(false);
    refetch();
  };

  const openSettingsModal = () => setIsSettingsOpen(true);
  const closeSettingsModal = () => {
    setIsSettingsOpen(false);
    setSettingsChanged((prev) => !prev); // Toggle to force rerender
  };

  return (
    <main className="min-h-screen flex relative">
      {/* Settings + Potion Counter at Top Left */}
      <div className="absolute top-4 left-4 z-50 flex items-center gap-4">
        <button
          onClick={openSettingsModal}
          className="p-2 transition-transform duration-500 hover:scale-125 hover:rotate-[360deg]"
          aria-label="Open Settings"
        >
          <Image src={setting} alt="Settings" width={50} height={50} />
        </button>

        <PotionCounter balance={balance} />
      </div>

      {/* Left Side */}
      <div className="w-1/2 flex items-center justify-center">
        {/* Empty or any content */}
      </div>

      {/* Right Side */}
      <div className="w-1/2 flex flex-col items-center justify-center gap-6">
        <Image src={wording} alt="Wording" width={500} priority />
        <UploadArea preview={preview} setPreview={setPreview} />
        <WalletConnectButton
          hasImage={hasImage}
          balance={balance}
          settingsChanged={settingsChanged}
          preview={preview}
        />
      </div>

      {/* Potion Image at bottom left */}
      <div
        className="absolute bottom-5 left-2 transition-transform duration-300 hover:scale-110 animate-float cursor-pointer"
        onClick={openMintModal}
      >
        <Image src={potion_img} alt="Potion" width={220} height={220} />
      </div>

      {/* Mint Modal */}
      <MintModal isOpen={isMintModalOpen} onClose={closeMintModal} />

      {/* Settings Modal */}
      <SettingsModal open={isSettingsOpen} onClose={closeSettingsModal} />
    </main>
  );
}
