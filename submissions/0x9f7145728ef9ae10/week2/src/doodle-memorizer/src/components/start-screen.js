import Image from "next/image";
import logo from "../../public/logo.png";
import WalletConnectButton from "./wallet-connect";
import { useEffect, useState } from "react";

const levels = [
  { size: 2, label: "Easy", gif: "/easy.gif" },
  { size: 4, label: "Medium", gif: "/medium.gif" },
  { size: 6, label: "Hard", gif: "/hard.gif" },
];

export default function StartScreen({ onStartGame }) {
  const [isClient, setIsClient] = useState(false);
  const [selectedLevel, setSelectedLevel] = useState(null);

  useEffect(() => {
    setIsClient(true);
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FEF6F0] px-4">
      <div className="flex flex-col items-center space-y-10">
        <Image src={logo} alt="Game logo" width={400} height={100} priority />

        <div className="flex flex-wrap justify-center gap-6">
          {levels.map(({ size, label, gif }) => {
            const isSelected = selectedLevel === size;
            return (
              <div
                key={size}
                onClick={() =>
                  setSelectedLevel(selectedLevel === size ? null : size)
                }
                className={`relative z-10 cursor-pointer w-56 h-72 rounded-md bg-white border-[3px] border-[#333] transition-all duration-200 ease-in-out 
        ${
          isSelected
            ? "rainbow-spiral-shadow border-[5px]"
            : "shadow-[6px_6px_0_0_#000] hover:border-[5px] hover:-translate-y-1 hover:shadow-[10px_10px_0_0_#000]"
        }`}
              >
                <div className="h-2/3 w-full">
                  {isClient && (
                    <Image
                      src={gif}
                      alt={`${label} level preview`}
                      width={192}
                      height={128}
                      unoptimized
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
                <div className="h-1/3 bg-white flex flex-col justify-center items-center p-2">
                  <p className="text-xl font-bold text-black">Level: {label}</p>
                  <p className="text-md text-gray-800">
                    Grid Size: {size} x {size}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        <WalletConnectButton
          selectedLevel={selectedLevel}
          onStartGame={onStartGame}
        />
      </div>
    </div>
  );
}
