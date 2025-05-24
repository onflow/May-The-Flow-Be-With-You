"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import close from "../../../public/close.png";

export default function SettingsModal({ open, onClose }) {
  const [apiKey, setApiKey] = useState("");
  const [saved, setSaved] = useState(false);
  const [storedKey, setStoredKey] = useState("");

  // Load from sessionStorage on open
  useEffect(() => {
    if (open) {
      const key = sessionStorage.getItem("openai_api_key") || "";
      setApiKey(key);
      setStoredKey(key);
      setSaved(true);
    }
  }, [open]);

  const handleInputChange = (e) => {
    const newKey = e.target.value;
    setApiKey(newKey);
    setSaved(newKey === storedKey);
  };

  const handleSave = () => {
    sessionStorage.setItem("openai_api_key", apiKey);
    setStoredKey(apiKey);
    setSaved(true);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 px-4">
      <div className="bg-white rounded-xl max-w-4xl w-4xl p-10 relative shadow-lg text-center">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-xl font-bold hover:text-gray-600"
          aria-label="Close settings modal"
        >
          <Image src={close} alt="close icon" width={40} height={40} />
        </button>

        <h2 className="text-3xl font-extrabold mb-4 mt-8">
          Store your OpenAI API Key
        </h2>
        <p className="text-gray-700 mb-6 px-10">
          Since we want to keep this app running on the testnet, you&apos;ll
          need to cover the cost of generating the mutation. Your OpenAI API key
          is saved only in this tab and will be cleared when you close it. We
          never store it on our servers. You can get one at the 
          <a
            href={`https://platform.openai.com/settings/organization/api-keys`}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-1 underline"
          >
            OpenAI developer dashboard.
          </a>
        </p>

        <input
          type="password"
          placeholder="Paste your OpenAI API Key"
          value={apiKey}
          onChange={handleInputChange}
          spellCheck="false"
          autoComplete="off"
          className="w-full rounded-2xl px-4 py-3 mb-6 bg-white border-8 border-black font-mono text-lg focus:outline-none focus:ring-2 focus:ring-green-400"
        />

        <button
          className={`mt-5 mx-auto flex items-center justify-center w-40 text-black text-2xl font-bold border-4 rounded-full shadow-[4px_4px_0_0_#000] transition-all duration-200 py-4
            ${
              saved
                ? "bg-gray-300 border-gray-600 cursor-default shadow-none"
                : "bg-green-300 border-black hover:-translate-y-1 hover:shadow-[6px_6px_0_0_#000] cursor-pointer"
            }
          `}
          onClick={handleSave}
          disabled={saved}
        >
          {saved ? "Saved" : "Save"}
        </button>
      </div>
    </div>
  );
}
