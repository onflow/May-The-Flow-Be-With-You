import React, { useState } from 'react';
import styled from 'styled-components';
import * as fcl from "@onflow/fcl";
import "./config/fcl";

import { useFlowUser } from './hooks/useFlowUser';
import CoinAnimation from './components/CoinAnimation';
import PlayerStats from './components/PlayerStats';
import BettingPanel from './components/BettingPanel';
import { FLIP_COIN_SCRIPT, GET_PLAYER_STATS_SCRIPT } from './utils/cadence';

const AppContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  min-height: 100vh;
  padding: 2rem;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  color: white;
`;

const Title = styled.h1`
  font-size: 2.5rem;
  margin-bottom: 2rem;
  color: #00ff88;
  text-shadow: 0 0 10px rgba(0, 255, 136, 0.5);
`;

const Button = styled.button`
  padding: 1rem 2rem;
  font-size: 1.2rem;
  background: #00ff88;
  border: none;
  border-radius: 50px;
  color: #1a1a2e;
  cursor: pointer;
  transition: all 0.3s ease;
  margin: 1rem;

  &:hover {
    transform: scale(1.05);
    box-shadow: 0 0 20px rgba(0, 255, 136, 0.5);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const Result = styled.div`
  font-size: 2rem;
  margin: 2rem 0;
  padding: 1rem;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.1);
  min-width: 200px;
  text-align: center;
  animation: fadeIn 0.5s ease-out;

  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(-20px); }
    to { opacity: 1; transform: translateY(0); }
  }
`;

const UserInfo = styled.div`
  background: rgba(255, 255, 255, 0.1);
  padding: 1rem 2rem;
  border-radius: 25px;
  margin: 1rem;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  gap: 1rem;
`;

function App() {
  const { user, balance, logIn, logOut } = useFlowUser();
  const [result, setResult] = useState(null);
  const [stats, setStats] = useState(null);
  const [isFlipping, setIsFlipping] = useState(false);

  const flipCoin = async () => {
    if (!user?.addr) return;
    
    setIsFlipping(true);
    try {
      const result = await fcl.query({
        cadence: FLIP_COIN_SCRIPT,
        args: (arg, t) => [arg(user.addr, t.Address)],
      });

      setResult(result);
      
      // Fetch updated stats
      const stats = await fcl.query({
        cadence: GET_PLAYER_STATS_SCRIPT,
        args: (arg, t) => [arg(user.addr, t.Address)],
      });
      
      setStats(stats);
    } catch (error) {
      console.error("Error flipping coin:", error);
    } finally {
      setIsFlipping(false);
    }
  };

  const handleBetPlaced = async (txStatus) => {
    if (txStatus.status === 4) { // Sealed
      flipCoin();
    }
  };

  return (
    <AppContainer>
      <Title>🪙 Flow Coin Flip</Title>
      
      {!user?.addr ? (
        <Button onClick={logIn}>Connect Wallet</Button>
      ) : (
        <>
          <UserInfo>
            <span>Address: {user.addr}</span>
            <span>Balance: {balance ? `${balance} FLOW` : 'Loading...'}</span>
            <Button onClick={logOut}>Disconnect</Button>
          </UserInfo>

          <BettingPanel 
            userBalance={balance} 
            onBetPlaced={handleBetPlaced}
          />
          
          <Button onClick={flipCoin} disabled={isFlipping}>
            {isFlipping ? "Flipping..." : "Flip Coin"}
          </Button>

          <CoinAnimation isFlipping={isFlipping} result={result} />

          {result !== null && (
            <Result>
              {result ? "🪙 Heads!" : "🪙 Tails!"}
            </Result>
          )}

          <PlayerStats stats={stats} />
        </>
      )}
    </AppContainer>
  );
}

export default App; 