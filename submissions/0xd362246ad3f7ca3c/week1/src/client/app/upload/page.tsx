"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAccount } from "wagmi";
import { Button } from "@/components/ui/button";
import { FileUpload } from "@/components/ui/file-upload";

export default function UploadPage() {
  const router = useRouter();
  const { address, isConnected } = useAccount();
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Redirect to home if wallet is not connected
  useEffect(() => {
    if (!isConnected) {
      router.push("/");
    }
  }, [isConnected, router]);

  const handleUpload = async () => {
    if (!file || !address) return;

    // Check if file exceeds 1MB
    if (file.size > 1024 * 1024) {
      alert("Image file must be less than 1MB.");
      return;
    }

    setIsUploading(true);

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onloadend = async () => {
      const base64File = reader.result as string;

      const payload = {
        walletAddress: address,
        imageFile: base64File.split(",")[1],
      };

      try {
        const response = await fetch("/api/upload", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });

        const result = await response.json();

        if (response.ok) {
          // ✅ Fire-and-forget paint request
          fetch("/api/generate", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ walletAddress: address }),
          }).catch((err) => {
            console.error("Paint request error (non-blocking):", err);
          });

          // ✅ Immediate redirect
          setIsUploading(false);
          router.push("/generate");
        } else {
          console.error("Upload failed:", result.error);
          setIsUploading(false);
          alert("Upload failed, please try again.");
        }
      } catch (error) {
        console.error("Error during upload:", error);
        setIsUploading(false);
        alert("An error occurred. Please try again.");
      }
    };
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="w-full max-w-xl mx-auto">
        <FileUpload onChange={setFile} />

        <div className="mt-8 flex justify-center">
          <Button
            onClick={handleUpload}
            disabled={!file || isUploading}
            className="px-8 py-6 text-lg rounded-full bg-[#00EF8B] hover:bg-[#00EF8B]/90 w-64"
          >
            {isUploading ? "Uploading..." : "Ghibli with the Flow"}
          </Button>
        </div>
      </div>
    </div>
  );
}
