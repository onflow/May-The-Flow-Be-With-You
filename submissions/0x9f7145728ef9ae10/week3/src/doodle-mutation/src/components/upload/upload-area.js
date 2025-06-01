"use client";

import { useRef } from "react";
import { useAccount } from "wagmi";
import { config } from "@/config/wagmi";

import Image from "next/image";
import incubator from "../../../public/incubator.png";
import lock from "../../../public/lock.png";
import green from "../../../public/green.png";
import remove from "../../../public/delete.png";
import loader from "../../../public/loader.gif";
import link from "../../../public/link.png";

import { useMutationContext } from "@/context/MutationContext";

const TARGET_CHAIN = config.chains[0];

export default function UploadArea({ preview, setPreview }) {
  const fileInputRef = useRef();
  const { isConnected, chainId } = useAccount();
  const isCorrectChain = isConnected && chainId === TARGET_CHAIN.id;

  const { isLocked, resultBase64, explorerLink } = useMutationContext();

  const fullSrc = resultBase64?.startsWith("data:image/")
    ? resultBase64
    : `data:image/png;base64,${resultBase64}`;

  const handleClick = () => {
    if (!isLocked && isCorrectChain && !explorerLink && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith("image/")) {
      setPreview(file);
    }
  };

  const handleRemove = (e) => {
    e.stopPropagation();
    if (isLocked) return; // Don't allow removing while locked
    setPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div
      className={`relative w-105 h-105 mt-4 bg-white/60 border-4 border-black rounded-2xl flex flex-col items-center justify-center text-center p-4 transition-all duration-200
    ${
      isCorrectChain && !isLocked && !explorerLink
        ? "cursor-pointer hover:shadow-lg"
        : "cursor-not-allowed"
    }
    ${(!isCorrectChain || isLocked) && !explorerLink ? "opacity-60" : ""}`}
      onClick={handleClick}
    >
      {preview ? (
        <div className="relative w-full h-full flex items-center justify-center">
          <Image
            src={
              resultBase64 && (isLocked || explorerLink)
                ? fullSrc
                : URL.createObjectURL(preview)
            }
            alt="Uploaded Preview"
            width={500}
            height={500}
            className="object-contain max-h-full rounded-2xl"
          />

          {!isLocked && explorerLink ? (
            <a
              href={explorerLink}
              target="_blank"
              rel="noopener noreferrer"
              className="absolute top-2 right-2 rounded-full p-1 shadow-md hover:bg-blue-100 transition"
              aria-label="View on explorer"
            >
              <Image src={link} alt="Explorer Link" width={40} height={40} />
            </a>
          ) : !isLocked ? (
            <button
              onClick={handleRemove}
              className="absolute top-2 right-2 rounded-full p-1 shadow-md hover:bg-red-100 transition"
              aria-label="Remove uploaded image"
              type="button"
            >
              <Image src={remove} alt="Remove" width={40} height={40} />
            </button>
          ) : null}

          {isLocked && (
            <>
              <div className="absolute inset-0 bg-white/80 rounded-2xl z-10" />
              <div className="absolute inset-0 flex items-center justify-center z-20">
                <Image src={loader} alt="Loading..." width={200} height={200} />
              </div>
            </>
          )}
        </div>
      ) : (
        <>
          <p className="my-4 px-14 text-black font-bold text-2xl">
            Upload your Doodles into the Mutator
          </p>
          <Image
            src={incubator}
            alt="Incubator Icon"
            width={200}
            height={200}
          />
          <div
            className={`my-5 flex items-center justify-center gap-2 px-5 py-3 rounded-full ${
              isCorrectChain ? "bg-green-100" : "bg-red-200"
            }`}
          >
            <Image
              src={isCorrectChain ? green : lock}
              alt={isCorrectChain ? "Unlocked" : "Locked"}
              width={15}
              height={15}
              className="mt-0.5"
            />
            <span
              className={`font-medium text-base ${
                isCorrectChain ? "text-green-500" : "text-red-500"
              }`}
            >
              {isCorrectChain
                ? "Mutator is unlocked and ready."
                : "Locked. Wallet is not connected."}
            </span>
          </div>
        </>
      )}

      <input
        type="file"
        accept="image/*"
        ref={fileInputRef}
        onChange={handleChange}
        className="hidden"
      />
    </div>
  );
}
