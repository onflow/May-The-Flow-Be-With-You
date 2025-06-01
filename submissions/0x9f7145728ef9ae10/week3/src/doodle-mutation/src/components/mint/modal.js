"use client";

import React from "react";
import Image from "next/image";
import nft from "../../../public/nft.png";
import close from "../../../public/close.png";
import MintButton from "./mint-button";

export default function MintModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-50"
        onClick={onClose}
      ></div>

      {/* Modal Content */}
      <div className="fixed top-1/2 left-1/2 z-50 w-lg max-w-full -translate-x-1/2 -translate-y-1/2 rounded-3xl bg-white p-10 shadow-[8px_8px_0_0_#000]">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-black text-2xl font-bold hover:text-red-600"
          aria-label="Close modal"
        >
          <Image src={close} alt="close button" width={40} height={40}/>
        </button> 

        <div className="flex flex-col items-center">
          <Image
            src={nft}
            alt="NFT"
            width={350}
            height={350}
            className="rounded-3xl mt-4"
            priority
          />
          <h2 className="mt-10 text-3xl font-extrabold text-black">
            Doodles Mutation Potion
          </h2>
          <p className="mt-3 text-center text-gray-700 text-sm px-4">
            Use the Potion if you dare. Flow&apos;s on-chain randomness will twist your Doodles in ways unknown. No Potion, no mutation. Mint yours, it&apos;s totally free — embrace the chaos.
          </p>

          <MintButton />
        </div>
      </div>
    </>
  );
}
