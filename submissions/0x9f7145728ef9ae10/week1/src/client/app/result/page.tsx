"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import placeholder from "../../app/assets/old-man.png";
import { db } from "@/lib/firebase";
import { ref, get } from "firebase/database";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAccount } from "wagmi";

// Type for the wallet address
type WalletAddress = string | undefined;

export default function Result() {
  const router = useRouter();
  const { address } = useAccount();
  const walletAddress: WalletAddress = address;
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  // Function to truncate the wallet address
  const truncateAddress = (addr: string | undefined): string => {
    return addr ? `${addr.slice(0, 7)}...${addr.slice(-4)}` : "";
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!walletAddress) return;

        const walletRef = ref(db, `${walletAddress}`);
        const snapshot = await get(walletRef);

        if (!snapshot.exists()) {
          console.log("Wallet not found");
          router.push("/"); // Redirect to home if wallet not found
          return;
        }

        const data = snapshot.val();
        const image = data.result || null;
        const completed = data.completedGhibli || false;

        // Check if wallet exists but completedGhibli is false
        if (completed === false && !image) {
          console.log("Ghibli not completed and no image");
          router.push("/"); // Redirect to home if completedGhibli is false and no image
        } else if (completed === false && image) {
          console.log("Image exists but Ghibli not completed");
          router.push("/loading"); // Redirect to loading if image exists but Ghibli not completed
        } else {
          // If everything is fine, set the image and continue
          setImageUrl(image);
        }
      } catch (error) {
        console.error("Error fetching wallet data:", error);
        router.push("/"); // Optional: Redirect to home if there's an error
      }
    };

    fetchData();
  }, [walletAddress, router]);

  return (
    <main className="flex flex-col justify-center items-center p-28">
      <section className="flex flex-col mb-8">
        <h1 className="font-bold text-6xl mb-4">Congrats!</h1>
        <h1 className="font-bold text-6xl">
          You're now Ghibli with the
          <span className="text-[#00EF8B] font-bold text-6xl ml-3">Flow</span>.
        </h1>
      </section>

      <section className="py-6">
        <div className="flex p-8 border-stone-100 border-2 max-w-7xl h-80 rounded-2xl items-center shadow">
          <div>
            <Image
              className="h-65 w-65 rounded-2xl border-[#00EF8B] border-8 mr-10"
              src={imageUrl || placeholder}
              alt="Ghibli PFP"
              width={260}
              height={260}
            />
          </div>
          <div className="pl-15">
            <ul>
              <li className="font-normal text-4xl mb-3">
                {truncateAddress(walletAddress)} had
              </li>
              <li className="font-normal text-4xl">turned on Ghibli Mode 💚</li>
              <li className="font-bold text-2xl mt-9">#GhibliWithTheFlow</li>
            </ul>
          </div>
        </div>

        {imageUrl && (
          <a
            href={imageUrl}
            download="ghibli-pfp.png"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-12 inline-block px-10 py-5 rounded-2xl bg-[#00EF8B] hover:bg-[#00c76f] text-white font-semibold text-xl"
          >
            Save my Ghibli PFP
          </a>
        )}

        <Link
          href="/"
          className="mt-15 ml-8 inline-block hover:text-gray-400 text-black font-semibold text-xl underline"
        >
          Back to Home
        </Link>
      </section>
    </main>
  );
}
