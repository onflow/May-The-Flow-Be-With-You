import { useEffect } from "react";
import Image from "next/image";
import timer from "../../public/timer.gif";

export default function Timer({ time, setTime, isRunning }) {
  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      setTime((prevTime) => prevTime + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, setTime]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  return (
    <div className="flex items-center gap-3 pl-1 pr-4 h-16 bg-white border-[3px] border-black shadow-[4px_4px_0_0_#000] rounded-xl">
      <Image className="mt-1" src={timer} alt="Timer Icon" width={50} height={50} />
      <span className="text-lg font-bold text-black ml-[-10]">Time: {formatTime(time)}</span>
    </div>
  );
}
