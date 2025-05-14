"use client";

import Image from "next/image";
import image from "../assets/old-man.png";
import List from "@/components/ui/list";
import Loader from "@/components/ui/loader";
import { useAccount } from "wagmi";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

const HomePage: React.FC = () => {
  const router = useRouter();
  const { address, isConnected } = useAccount();

  const walletAddress: string | undefined = address;

  // Redirect to home if wallet is not connected
  useEffect(() => {
    if (!isConnected) {
      router.push("/");
    }
  }, [isConnected, router]);

  return (
    <>
      <main className="flex min-h-auto pt-16">
        {/* Left Side: Image */}
        <div className="w-1/2 flex items-center justify-center">
          <Image
            src={image}
            alt="Old man"
            className="w-auto h-auto object-cover rounded-2xl ml-56"
          />
        </div>

        {/* Right Side: List */}
        <div className="w-1/2 flex flex-col items-center justify-center px-20 pr-30">
          <List walletListening={walletAddress} />
        </div>
      </main>
      <Loader walletAddress={walletAddress} />
    </>
  );
};

export default HomePage;
