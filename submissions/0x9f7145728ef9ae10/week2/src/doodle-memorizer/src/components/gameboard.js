"use client";
import Timer from "./timer";
import MovesCounter from "./moves-counter";
import RestartButton from "./restart-button";
import Image from "next/image";
import plus from "../../public/plus.png";
import bomb from "../../public/bomb.png";
import Grid from "./grid";
import { useGameLogic } from "../../src/hooks/useGameLogic";
import { imagesDb } from "@/constants/imagesDB";
import generateRandom from "@/utils/generateRandom";
import { useState, useEffect } from "react";
import { toast, Toaster } from "react-hot-toast";
import { useAccount } from "wagmi";
import mint from "@/utils/mintNFT";
import trophy from "../../public/trophy.png";

export default function GameBoard({ gridSize, onGameOver }) {
  const [isShuffleBombActive, setIsShuffleBombActive] = useState(false);
  const [bombToastId, setBombToastId] = useState(null); // Store toast ID for active bomb
  const [isMinting, setIsMinting] = useState(false);
  const [txHash, setTxHash] = useState(null);
  const { address } = useAccount();

  const {
    cards,
    moves,
    timer,
    setTimer,
    isTimerRunning,
    isGameOver,
    handleCardClick,
    startNewGame,
    reshuffleCards,
    isPreparing,
  } = useGameLogic(gridSize, imagesDb);

  // Timer should run only if not preparing AND game is not over
  const effectiveTimerRunning = isTimerRunning && !isPreparing && !isGameOver;

  useEffect(() => {
    const interval = setInterval(async () => {
      if (isShuffleBombActive || isGameOver || isPreparing) return;

      setIsShuffleBombActive(true);

      const { txHash, rand } = await generateRandom();

      const id = toast.custom(
        (t) => (
          <div
            className={`bg-red-50 border-[3px] border-red-500 rounded-2xl p-6 mt-2 shadow-xl shadow-red-100 w-auto ${
              t.visible ? "animate-enter" : "animate-leave"
            }`}
          >
            <div className="animate-shake">
              <div className="flex items-center font-extrabold text-red-600 text-xl">
                <Image src={bomb} alt="a bomb icon" width={30} height={30} />
                <span className="ml-3">Shuffle coming in {rand} seconds!</span>
              </div>
              <div className="text-md text-red-600 font-medium my-4">{`Randomness: ${txHash.slice(
                0,
                8
              )}...${txHash.slice(-8)}`}</div>
              <div className="h-3 bg-gray-200 rounded-xl overflow-hidden">
                <div
                  className="h-full bg-red-500 animate-progress"
                  style={{ animationDuration: `${rand}s`, width: "100%" }}
                />
              </div>
            </div>
          </div>
        ),
        { duration: Infinity } // Keep it open until we dismiss it manually
      );

      setBombToastId(id); // Store the active toast ID

      setTimeout(() => {
        toast.dismiss(id);
        reshuffleCards();
        setIsShuffleBombActive(false);
      }, rand * 1000);
    }, 100);

    return () => clearInterval(interval);
  }, [isShuffleBombActive, isGameOver, isPreparing]);

  useEffect(() => {
    if (isGameOver && bombToastId) {
      toast.dismiss(bombToastId); // Dismiss active bomb when game over
    }
  }, [isGameOver, bombToastId]); // Runs when game over is triggered

  //to control game over minting
  useEffect(() => {
    const mintTrophy = async () => {
      if (address && isGameOver && !txHash) {
        try {
          setIsMinting(true);
          console.log(address);
          const hash = await mint(address);
          console.log(hash);
          setTxHash(hash);
        } catch (error) {
          toast.error("Minting failed. Please try again.");
        } finally {
          setIsMinting(false);
        }
      }
    };

    mintTrophy();
  }, [isGameOver, address, txHash]);

  const handleNewGame = () => {
    toast.dismiss();
    onGameOver();
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center">
      <Toaster position="top-right" />
      <div className="bg-white p-4 sm:p-6 rounded-3xl shadow-md">
        <div className="flex justify-between items-center mb-4">
          <Timer
            time={timer}
            setTime={setTimer}
            isRunning={effectiveTimerRunning}
          />
          <MovesCounter moves={moves} />
        </div>

        {isPreparing ? (
          <div className="flex flex-col items-center justify-center h-96">
            <Image
              src="/prepare.gif"
              alt="Preparing game..."
              width={200}
              height={200}
              priority
              className="rounded-2xl"
            />
            <p className="mt-6 text-black font-semibold text-lg">
              Preparing the game...
            </p>
          </div>
        ) : isGameOver ? (
          <div className="flex flex-col items-center justify-center mt-6 px-4 text-center">
            <h1 className="text-5xl font-bold text-green-700 mb-4 mt-8">
              All cards matched!
            </h1>
            <p className="text-lg text-gray-700 mb-8 max-w-lg px-6">
              You are definitely a Doodle Memorizing master and deserve the
              golden brain trophy in your wallet.
            </p>
            <Image
              src={trophy}
              alt="Golden Trophy"
              width={300}
              height={300}
              className="mb-4 rounded-3xl"
            />

            {isMinting ? (
              <div className="flex items-center gap-3 text-yellow-600 font-medium text-lg">
                <svg
                  className="animate-spin h-6 w-6 text-yellow-600"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v8H4z"
                  />
                </svg>
                Minting in Progress...
              </div>
            ) : txHash ? (
              <div className="text-green-700 font-semibold text-lg mt-2">
                ✅ It&apos;s in your wallet.<br/>
              </div>
            ) : null}
          </div>
        ) : (
          <Grid
            cards={cards}
            onCardClick={handleCardClick}
            gridSize={gridSize}
          />
        )}

        <div className="mt-4 flex justify-center gap-4">
          <RestartButton onClick={startNewGame} />
          <div className="pt-6 pb-4">
            <button
              onClick={handleNewGame}
              className="flex items-center justify-between pl-6 pr-3 py-3 w-52 bg-green-300 text-black text-xl font-bold border-[3px] border-black rounded-full shadow-[4px_4px_0_0_#000] hover:-translate-y-1 hover:shadow-[6px_6px_0_0_#000] transition-all duration-200"
            >
              New Game
              <span className="ml-4 w-10 h-10 bg-white rounded-full flex items-center justify-center border-[2px] border-black">
                <Image src={plus} alt="Plus Icon" width={20} height={20} />
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
