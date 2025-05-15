import { useEffect, useState } from "react";
import { generateShuffledCards } from "../utils/cardUtils";

export const useGameLogic = (gridSize, imagesDb) => {
  const [cards, setCards] = useState([]);
  const [flippedCards, setFlippedCards] = useState([]);
  const [matchedCards, setMatchedCards] = useState([]);
  const [moves, setMoves] = useState(0);
  const [timer, setTimer] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(true);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isPreparing, setIsPreparing] = useState(false);

  useEffect(() => {
    if (gridSize) {
      startNewGame();
    }
  }, [gridSize]);

  useEffect(() => {
    if (cards.length > 0 && matchedCards.length === cards.length / 2) {
      setIsGameOver(true);
      setIsTimerRunning(false);
    }
  }, [matchedCards, cards.length]);

  const startNewGame = async () => {
    setIsPreparing(true);
    setIsTimerRunning(false); // stop timer while preparing
    setTimer(0); // reset timer immediately before loading

    const shuffledCards = await generateShuffledCards(
      gridSize,
      gridSize,
      imagesDb
    );

    setCards(shuffledCards);
    setMoves(0);
    setMatchedCards([]);
    setFlippedCards([]);
    setIsGameOver(false);

    setIsPreparing(false); // done preparing

    setIsTimerRunning(true); // start timer only AFTER preparing is done
  };

  const handleCardClick = (index) => {
    if (
      flippedCards.length === 2 ||
      cards[index].matched ||
      cards[index].flipped
    )
      return;

    const newFlippedCards = [...flippedCards, index];

    setCards((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], flipped: true };
      return updated;
    });

    setFlippedCards(newFlippedCards);

    if (newFlippedCards.length === 2) {
      setMoves((prev) => prev + 1);
      setTimeout(() => compareCards(newFlippedCards), 700);
    }
  };

  const reshuffleCards = () => {
    // Step 1: Flip unmatched cards closed first
    setCards((prevCards) =>
      prevCards.map((card) =>
        card.matched ? { ...card, flipped: true } : { ...card, flipped: false }
      )
    );

    // Step 2: Wait for animation to complete, then shuffle
    setTimeout(() => {
      setCards((prevCards) => {
        const matched = [];
        const unmatched = [];

        prevCards.forEach((card) => {
          if (card.matched) {
            matched.push({ ...card, flipped: true });
          } else {
            unmatched.push({ ...card, flipped: false });
          }
        });

        const shuffledUnmatched = unmatched.sort(() => Math.random() - 0.5);

        const newCards = prevCards.map((card) => {
          return card.matched ? card : shuffledUnmatched.shift(); // use next shuffled card
        });

        return newCards;
      });

      setFlippedCards([]);
    }, 500); // wait 0.5s before reshuffling
  };

  const compareCards = ([firstIndex, secondIndex]) => {
    setCards((prevCards) => {
      const updatedCards = [...prevCards];
      const firstCard = updatedCards[firstIndex];
      const secondCard = updatedCards[secondIndex];

      if (
        firstCard.image === secondCard.image &&
        !firstCard.matched &&
        !secondCard.matched
      ) {
        updatedCards[firstIndex] = { ...firstCard, matched: true };
        updatedCards[secondIndex] = { ...secondCard, matched: true };

        setMatchedCards((prevMatched) => {
          if (!prevMatched.includes(firstCard.image)) {
            return [...prevMatched, firstCard.image];
          }
          return prevMatched;
        });
      } else {
        // Flip cards back
        updatedCards[firstIndex] = { ...firstCard, flipped: false };
        updatedCards[secondIndex] = { ...secondCard, flipped: false };
      }

      return updatedCards;
    });

    setFlippedCards([]);
  };

  return {
    cards,
    flippedCards,
    matchedCards,
    moves,
    timer,
    setTimer,
    isTimerRunning,
    isGameOver,
    handleCardClick,
    startNewGame,
    reshuffleCards,
    isPreparing,
  };
};
