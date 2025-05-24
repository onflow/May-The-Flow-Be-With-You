"use client";

import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { burnPotion } from "@/utils/burn-potion";
import { generatePrompt } from "@/utils/generate-prompt";

export default function useMutation() {
  const { address } = useAccount();

  const [prompt, setPrompt] = useState(null);
  const [error, setError] = useState(null);

  const [isBurning, setIsBurning] = useState(false);
  const [burnCompleted, setBurnCompleted] = useState(false);

  const [isGenerating, setIsGenerating] = useState(false);
  const [generateCompleted, setGenerateCompleted] = useState(false);

  const [isMutating, setIsMutating] = useState(false);
  const [mutateCompleted, setMutateCompleted] = useState(false);

  const [isUploading, setIsUploading] = useState(false);
  const [uploadCompleted, setUploadCompleted] = useState(false);

  const [isMinting, setIsMinting] = useState(false);
  const [mintCompleted, setMintCompleted] = useState(false);

  const [resultBase64, setResultBase64] = useState(null);
  const [explorerLink, setExplorerLink] = useState(null);
  const [uploadedUrl, setUploadedUrl] = useState(null);

  // Explicit lock state
  const [isLocked, setIsLocked] = useState(false);

  // Optional: automatically toggle lock based on burning/mintCompleted
  useEffect(() => {
    if (isBurning) {
      setIsLocked(true); // Lock while burning
    } else if (mintCompleted) {
      setIsLocked(false); // Unlock when mint complete
    }
  }, [isBurning, mintCompleted]);

  const runBurn = async () => {
    try {
      setIsBurning(true);
      setError(null);
      await burnPotion(address);
    } catch (err) {
      setError(err.message || "Burn failed");
    } finally {
      setBurnCompleted(true);
      setIsBurning(false);
      setTimeout(() => setBurnCompleted(false), 100);
    }
  };

  const runGenerate = async () => {
    try {
      setIsGenerating(true);
      setError(null);
      const generated = await generatePrompt();
      setPrompt(generated);
      return generated;
    } catch (err) {
      setError(err.message || "Generation failed");
    } finally {
      setGenerateCompleted(true);
      setIsGenerating(false);
      setTimeout(() => setGenerateCompleted(false), 100);
    }
  };

  const runMutation = async (imageFile, openaiKey, generatedPrompt) => {
    try {
      setIsMutating(true);
      setError(null);

      const formData = new FormData();
      formData.append("prompt", generatedPrompt);
      formData.append("image", imageFile);
      formData.append("openaiKey", openaiKey);

      const res = await fetch("/api/generate-mutation", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Mutation failed");

      const base64 = await res.text();
      setResultBase64(base64);
      return base64;
    } catch (err) {
      setError(err.message || "Mutation failed");
    } finally {
      setMutateCompleted(true);
      setIsMutating(false);
      setTimeout(() => setMutateCompleted(false), 100);
    }
  };

  const runUpload = async (base64Image) => {
    try {
      setIsUploading(true);
      setError(null);

      const res = await fetch("/api/upload-pinata", {
        method: "POST",
        body: JSON.stringify({ base64: base64Image }),
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) throw new Error("Upload failed");

      const url = await res.text(); // plain text
      setUploadedUrl(url);
      return url;
    } catch (err) {
      setError(err.message || "Upload failed");
    } finally {
      setUploadCompleted(true);
      setIsUploading(false);
      setTimeout(() => setUploadCompleted(false), 100);
    }
  };

  const runMint = async (tokenURI) => {
    try {
      setIsMinting(true);
      setError(null);

      const res = await fetch("/api/mint-mutation", {
        method: "POST",
        body: JSON.stringify({
          address,
          tokenURI,
        }),
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) throw new Error("Minting failed");

      const txHash = await res.text();
      setExplorerLink(txHash);
      return txHash;
    } catch (err) {
      setError(err.message || "Minting failed");
    } finally {
      setMintCompleted(true);
      setIsMinting(false);
      setTimeout(() => setMintCompleted(false), 100);
    }
  };

  return {
    // Prompt + burning
    runBurn,
    runGenerate,
    prompt,
    error,

    // OpenAI + Pinata + mint
    runMutation,
    runUpload,
    runMint,
    resultBase64,
    uploadedUrl,

    // State flags
    isBurning,
    burnCompleted,
    isGenerating,
    generateCompleted,
    isMutating,
    mutateCompleted,
    isUploading,
    uploadCompleted,
    isMinting,
    mintCompleted,
    isLocked,
    setIsLocked,
    explorerLink
  };
}
