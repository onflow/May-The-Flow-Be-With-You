"use client";

import { useEffect, useState } from "react";
import { ref, onValue, off } from "firebase/database";
import { db } from "@/lib/firebase";
import ListItem from "./list-item";
import { motion, AnimatePresence } from "framer-motion";

// Define the shape of the item object that will be added to the state
interface Item {
  key: string;
  item: string;
  randNum: number;
  txHash: string | null; // txHash could be null if not available
}

// Define props for the List component
interface ListProps {
  walletListening: string | undefined; // walletListening can be a string or undefined
}

const watchedKeys = ["costume", "background", "accessory"];

const List: React.FC<ListProps> = ({ walletListening }) => {
  const walletAddress = walletListening;
  const [items, setItems] = useState<Item[]>([]); // items is an array of Item objects

  useEffect(() => {
    if (!walletAddress) return;

    const unsubscribes: (() => void)[] = []; // Array to hold unsubscribe functions

    watchedKeys.forEach((key) => {
      const nodeRef = ref(db, `${walletAddress}/${key}`);
      const listener = onValue(nodeRef, (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.val();

          setItems((prev) => {
            const alreadyAdded = prev.some((entry) => entry.key === key);
            if (alreadyAdded) return prev;

            return [
              ...prev,
              {
                key,
                item: data.item,
                randNum: data.randNum,
                txHash: data.txHash || null, // txHash can be null if not available
              },
            ];
          });
        }
      });

      unsubscribes.push(() => off(nodeRef, "value", listener)); // Store unsubscribe function
    });

    // Cleanup all listeners when the component unmounts or walletAddress changes
    return () => {
      unsubscribes.forEach((unsub) => unsub());
    };
  }, [walletAddress]);

  return (
    // <ul>
    //   <ListItem title="Selfie image received!" haveLink={false} />
    //   {items.map(({ key, item, randNum, txHash }) => (
    //     <ListItem
    //       key={key}
    //       title={`The ${key} is chosen.`}
    //       haveLink={!!txHash} // Convert txHash to boolean (true if it's not null/undefined)
    //       hash={txHash || ""} // Pass txHash as empty string if it's null
    //     />
    //   ))}
    // </ul>
    <ul className="list-none p-0 space-y-2">
      <ListItem title="Selfie image received!" haveLink={false} />
      <AnimatePresence>
        {items.map(({ key, item, randNum, txHash }) => (
          <motion.li
            key={key}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4 }}
          >
            <ListItem
              title={`The ${key} is chosen.`}
              haveLink={!!txHash}
              hash={txHash || ""}
            />
          </motion.li>
        ))}
      </AnimatePresence>
    </ul>
  );
};

export default List;
