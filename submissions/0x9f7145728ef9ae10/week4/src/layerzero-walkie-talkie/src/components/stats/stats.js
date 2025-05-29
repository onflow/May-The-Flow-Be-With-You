"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { ref, onValue } from "firebase/database";
import { db } from "@/config/firebase.js";

import radarGif from "../../../public/radar.gif";
import flowIcon from "../../../public/flow.png";
import seIcon from "../../../public/se.png";

export default function Stats() {
  const [toSe, setToSe] = useState(0);
  const [toFlow, setToFlow] = useState(0);

  useEffect(() => {
    const toSeRef = ref(db, "pendingToSe/amount");
    const toFlowRef = ref(db, "pendingToFlow/amount");

    const unsubscribeToSe = onValue(toSeRef, (snapshot) => {
      setToSe(snapshot.val() || 0);
    });

    const unsubscribeToFlow = onValue(toFlowRef, (snapshot) => {
      setToFlow(snapshot.val() || 0);
    });

    return () => {
      unsubscribeToSe();
      unsubscribeToFlow();
    };
  }, []);

  return (
    <div className="flex flex-row justify-between items-start bg-black text-white w-full max-w-4xl mx-auto p-4 gap-4">
      {/* Column 1: Radar + Label */}
      <div className="flex flex-col items-center">
        <Image src={radarGif} alt="Radar" width={90} height={90} />
        <p className="mt-2 text-md font-mono text-[#39FF14]">
          Current Pending Stats
        </p>
      </div>

      {/* Column 2: toSe */}
      <div className="flex flex-col items-center border-2 border-gray-700 rounded-xl px-2 py-4 w-62">
        <p className="text-5xl font-mono text-[#39FF14]">{toSe}</p>
        <div className="flex items-center gap-2 mt-3">
          <span className="text-sm font-mono text-gray-300">messages from</span>
          <Image src={flowIcon} alt="Flow" width={30} height={30} />
          <span className="text-sm font-mono text-gray-300">to</span>
          <Image src={seIcon} alt="SE" width={30} height={30} />
        </div>
      </div>

      {/* Column 3: toFlow (now from Firebase) */}
      <div className="flex flex-col items-center border-2 border-gray-700 rounded-xl px-2 py-4 w-62">
        <p className="text-5xl font-mono text-[#39FF14]">{toFlow}</p>
        <div className="flex items-center gap-2 mt-3">
          <span className="text-sm font-mono text-gray-300">messages from</span>
          <Image src={seIcon} alt="SE" width={30} height={30} />
          <span className="text-sm font-mono text-gray-300">to</span>
          <Image src={flowIcon} alt="Flow" width={30} height={30} />
        </div>
      </div>
    </div>
  );
}
