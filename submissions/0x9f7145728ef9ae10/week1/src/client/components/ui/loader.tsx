import { useEffect, useState } from "react";
import loader from "../../app/assets/paint.gif";
import Image from "next/image";
import { db } from "@/lib/firebase";
import { ref, onValue } from "firebase/database";
import Link from "next/link";

// Define the props type for the Loader component
interface LoaderProps {
  walletAddress: string | undefined; // walletAddress can be a string or undefined
}

const Loader: React.FC<LoaderProps> = ({ walletAddress }) => {
  const [isDone, setIsDone] = useState<boolean>(false); // isDone is a boolean state

  useEffect(() => {
  if (!walletAddress) return;

  const ghibliRef = ref(db, `${walletAddress}/completedGhibli`);

  const unsubscribe = onValue(ghibliRef, (snapshot) => {
    const value = snapshot.val();
    if (value === true) {
      setTimeout(() => {
        setIsDone(true);
      }, 8000);
    }
  });

  return () => unsubscribe();
}, [walletAddress]);


  return (
    <section className="flex flex-col justify-center items-center h-40 pt-20">
      {isDone ? (
        <Link className="px-20 py-5 rounded-2xl bg-[#00EF8B] hover:bg-[#00c76f] text-white font-semibold text-xl" href="./result">
          Done! See the result.
        </Link>
      ) : (
        <>
          <h1 className="font-bold text-xl mb-3 mt-16">
            Just one painter on duty. Rushing him only makes things worse...
          </h1>
          <Image unoptimized src={loader} alt="loader" className="w-28 h-28" />
        </>
      )}
    </section>
  );
};

export default Loader;
