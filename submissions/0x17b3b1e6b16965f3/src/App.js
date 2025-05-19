import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import GameBoard from './components/GameBoard/GameBoard';
import PlayerStats from './components/PlayerStats/PlayerStats';
import { MOVES, THEME } from './constants/game';
import { formatAddress, playSound } from './utils/helpers';
import * as flowService from './services/flow';
import * as fcl from "@onflow/fcl";

const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
  text-align: center;
  background: ${THEME.colors.background};
  min-height: 100vh;
`;

const Title = styled.h1`
  color: ${THEME.colors.text};
  margin-bottom: 2rem;
  font-size: 3rem;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.1);
`;

const GameContainer = styled.div`
  display: grid;
  grid-template-columns: 1fr 2fr 1fr;
  gap: 2rem;
  align-items: start;
`;

const ConnectButton = styled.button`
  padding: 1rem 2rem;
  font-size: 1.2rem;
  border: none;
  border-radius: 8px;
  background: ${THEME.gradients.primary};
  color: white;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: ${THEME.shadows.md};

  &:hover {
    transform: translateY(-3px);
    box-shadow: ${THEME.shadows.lg};
  }
`;

const UserBadge = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: ${THEME.colors.text};
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 9999px;
  margin: 1rem 0;
  font-weight: 500;

  &:hover {
    background: ${THEME.colors.textLight};
  }
`;

function App() {
  const [user, setUser] = useState(null);
  const [result, setResult] = useState(null);
  const [playerStats, setPlayerStats] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fcl.currentUser.subscribe(setUser);
  }, []);

  useEffect(() => {
    if (user?.addr) {
      fetchPlayerData();
    }
  }, [user?.addr]);

  const fetchPlayerData = async () => {
    try {
      const stats = await flowService.getPlayerStats(user.addr);
      setPlayerStats(stats);
    } catch (error) {
      console.error('Error fetching player data:', error);
    }
  };

  const playGame = async (playerMove) => {
    if (!user?.addr) {
      alert('Please connect your wallet first!');
      return;
    }

    setLoading(true);
    try {
      const computerMove = Math.floor(Math.random() * 3);
      const txResult = await flowService.playGame(
        MOVES[playerMove.toUpperCase()].index,
        computerMove
      );

      const outcome = txResult.status === 4 ? 'success' : 'error';
      setResult({
        playerMove: MOVES[playerMove.toUpperCase()].emoji,
        computerMove: Object.values(MOVES)[computerMove].emoji,
        outcome
      });

      playSound(outcome);
      await fetchPlayerData();
    } catch (error) {
      console.error('Error playing game:', error);
      alert('Error playing game. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container>
      <Title>Flow Rock Paper Scissors 🎮</Title>
      
      {!user?.addr ? (
        <ConnectButton onClick={fcl.authenticate}>
          Connect Wallet to Play
        </ConnectButton>
      ) : (
        <>
          <UserBadge>
            <span>🎮</span>
            {formatAddress(user.addr)}
          </UserBadge>

          <GameContainer>
            <PlayerStats 
              stats={playerStats} 
              moves={Object.values(MOVES).map(m => m.emoji)} 
            />
            
            <GameBoard
              loading={loading}
              moves={Object.values(MOVES).map(m => m.emoji)}
              moveNames={Object.values(MOVES).map(m => m.name)}
              playGame={playGame}
              result={result}
            />
          </GameContainer>
        </>
      )}
    </Container>
  );
}

export default App; 