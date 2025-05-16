// pages/index.js
"use client";

import { useState } from "react";
import StartScreen from "@/components/start-screen";
import GameBoard from "@/components/gameboard";

export default function Home() {
  const [gridSize, setGridSize] = useState(null); // null -> Start screen, other -> game grid size

  const handleStartGame = (size) => {
    setGridSize(size); // Start the game by setting the grid size
  };

  const handleGameOver = () => {
    setGridSize(null); // Go back to the start screen
  };

  return (
    <div>
      {gridSize ? (
        <GameBoard gridSize={gridSize} onGameOver={handleGameOver} />
      ) : (
        <StartScreen onStartGame={handleStartGame} />
      )}
    </div>
  );
}
