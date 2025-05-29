"use client";

import { useEffect, useState } from "react";
import { ref, onValue } from "firebase/database";
import { db } from "@/config/firebase.js";

import CharacterCard from "@/components/characters/character-card";
import ChatArea from "@/components/chat/chat-area";
import ChatCard from "@/components/chat/chat-card";
import ChatBox from "@/components/chat/chat-box";
import Stats from "@/components/stats/stats";

import Image from "next/image";
import empty from "../../public/empty.png";

export default function Home() {
  const [char1Messages, setChar1Messages] = useState({});
  const [char2Messages, setChar2Messages] = useState({});

  // Firebase listener for char1 (toSe)
  useEffect(() => {
    const toSeRef = ref(db, "toSe");

    const unsubscribe = onValue(toSeRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) return;

      const filtered = {};
      Object.entries(data).forEach(([txHash, value]) => {
        if (value.isReady) {
          filtered[txHash] = {
            message: value.message,
            sender: value.sender,
            timestamp: value.timestamp,
          };
        }
      });

      setChar1Messages(filtered);
    });

    return () => unsubscribe();
  }, []);

  // Firebase listener for char2 (toFlow)
  useEffect(() => {
    const toFlowRef = ref(db, "toFlow");

    const unsubscribe = onValue(toFlowRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) return;

      const filtered = {};
      Object.entries(data).forEach(([txHash, value]) => {
        if (value.isReady) {
          filtered[txHash] = {
            message: value.message,
            sender: value.sender,
            timestamp: value.timestamp,
          };
        }
      });

      setChar2Messages(filtered);
    });

    return () => unsubscribe();
  }, []);

  // Poll to keep synced
  useEffect(() => {
    const poll = async () => {
      try {
        const res = await fetch("/api/toSePolling");
        const data = await res.json();
      } catch (error) {
        console.error("Polling toSe error:", error);
      }
    };

    poll();
    const interval = setInterval(poll, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const poll = async () => {
      try {
        const res = await fetch("/api/toFlowPolling");
        const data = await res.json();
      } catch (error) {
        console.error("Polling toFlow error:", error);
      }
    };

    poll();
    const interval = setInterval(poll, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex justify-center items-start pt-3 gap-8 w-full">
      {/* Flow Explorer + Chat */}
      <div className="flex flex-col items-center space-y-4">
        <CharacterCard
          character="char1"
          name="Flow Explorer"
          location="Flow EVM Testnet"
          address="0xE1046B3E4AF399cbd47c5a88BBD74ef49668BeD8"
          chain="flow"
        />
        <ChatArea>
          {Object.keys(char1Messages).length === 0 ? (
            <div className="flex flex-col items-center justify-center mt-25 text-gray-400">
              <Image
                src={empty}
                alt="No messages"
                width={50}
                height={50}
                className="mb-4 opacity-60"
              />
              <p>No message at this moment</p>
            </div>
          ) : (
            Object.entries(char1Messages)
              .sort(
                (a, b) =>
                  new Date(b[1].timestamp).getTime() -
                  new Date(a[1].timestamp).getTime()
              )
              .map(([txHash, { sender, message, timestamp }]) => (
                <ChatCard
                  key={txHash}
                  character="char1"
                  sender={sender}
                  message={message}
                  timestamp={timestamp}
                  txHash={txHash}
                />
              ))
          )}
        </ChatArea>
        <ChatBox />
      </div>

      {/* Ethereum Explorer + Chat */}
      <div className="flex flex-col items-center space-y-4">
        <CharacterCard
          character="char2"
          name="Ethereum Explorer"
          location="Ethereum Sepolia"
          address="0xe58708eF50079A4886818DdCF44c159Fff28c0E4"
          chain="eth"
        />
        <ChatArea>
          {Object.keys(char2Messages).length === 0 ? (
            <div className="flex flex-col items-center justify-center mt-25 text-gray-400">
              <Image
                src={empty}
                alt="No messages"
                width={50}
                height={50}
                className="mb-4 opacity-60"
              />
              <p>No message at this moment</p>
            </div>
          ) : (
            Object.entries(char2Messages)
              .sort(
                (a, b) =>
                  new Date(b[1].timestamp).getTime() -
                  new Date(a[1].timestamp).getTime()
              )
              .map(([txHash, { sender, message, timestamp }]) => (
                <ChatCard
                  key={txHash}
                  character="char2"
                  sender={sender}
                  message={message}
                  timestamp={timestamp}
                  txHash={txHash}
                />
              ))
          )}
        </ChatArea>
        <Stats
          toSe={Object.keys(char1Messages).length}
          toFlow={Object.keys(char2Messages).length}
        />
      </div>
    </div>
  );
}
