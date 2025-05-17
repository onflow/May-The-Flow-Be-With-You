import React, { useEffect, useRef, useState } from "react";

export default function DinoGame() {
  const [isJumping, setIsJumping] = useState(false);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const dinoRef = useRef(null);
  const obstacleRef = useRef(null);
  const gameRef = useRef(null);

  const jump = () => {
    if (isJumping || gameOver) return;
    setIsJumping(true);
    let position = 0;

    const upInterval = setInterval(() => {
      if (position >= 100) {
        clearInterval(upInterval);
        const downInterval = setInterval(() => {
          if (position <= 0) {
            clearInterval(downInterval);
            setIsJumping(false);
          } else {
            position -= 5;
            if (dinoRef.current) dinoRef.current.style.bottom = `${position}px`;
          }
        }, 20);
      } else {
        position += 5;
        if (dinoRef.current) dinoRef.current.style.bottom = `${position}px`;
      }
    }, 20);
  };

  useEffect(() => {
    let animationFrameId;
    let obstacleLeft = 500;

    const moveObstacle = () => {
      if (gameOver) return;

      obstacleLeft -= 5;
      if (obstacleLeft < -50) {
        obstacleLeft = 500;
        setScore((prev) => prev + 1);
      }

      if (obstacleRef.current) {
        obstacleRef.current.style.left = `${obstacleLeft}px`;
      }

      const dinoRect = dinoRef.current.getBoundingClientRect();
      const obsRect = obstacleRef.current.getBoundingClientRect();

      const isColliding =
        dinoRect.right > obsRect.left &&
        dinoRect.left < obsRect.right &&
        dinoRect.bottom > obsRect.top + 10 &&
        dinoRect.top < obsRect.bottom;

      if (isColliding) {
        setGameOver(true);
        return;
      }

      animationFrameId = requestAnimationFrame(moveObstacle);
    };

    if (!gameOver) {
      animationFrameId = requestAnimationFrame(moveObstacle);
    }

    return () => cancelAnimationFrame(animationFrameId);
  }, [gameOver]);

  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.code === "Space") {
        e.preventDefault();
        jump();
      }
    };
    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, []);

  const resetGame = () => {
    setGameOver(false);
    setScore(0);
    if (dinoRef.current) {
      dinoRef.current.style.bottom = "0px";
    }
    if (obstacleRef.current) {
      obstacleRef.current.style.left = "500px";
    }
  };

  return (
    <div className="h-screen flex flex-col items-center justify-center bg-gray-100">
      <h1 className="text-3xl font-bold mb-4">Chrome Dino Clone</h1>
      <div
        ref={gameRef}
        className="relative w-full max-w-xl h-60 bg-white border overflow-hidden"
      >
        <div
          ref={dinoRef}
          className="absolute bottom-0 left-10 w-12 h-12 bg-gray-700 rounded transition-all duration-75"
        ></div>
        <div
          ref={obstacleRef}
          className="absolute bottom-0 left-[500px] w-10 h-10 bg-red-500 rounded"
        ></div>
      </div>
      <div className="mt-4 flex flex-col items-center gap-2">
        <button
          onClick={jump}
          className="px-6 py-2 bg-blue-600 text-white rounded shadow disabled:opacity-50"
          disabled={gameOver}
        >
          Jump (Space)
        </button>
        {gameOver && (
          <>
            <p className="text-red-500 text-lg">Game Over</p>
            <button
              onClick={resetGame}
              className="mt-2 px-6 py-2 bg-gray-700 text-white rounded shadow"
            >
              Restart Game
            </button>
          </>
        )}
        <p className="text-xl">Score: {score}</p>
      </div>
    </div>
  );
}
