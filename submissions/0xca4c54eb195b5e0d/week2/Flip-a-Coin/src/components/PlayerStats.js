import React from 'react';
import styled from 'styled-components';

const StatsContainer = styled.div`
  background: rgba(255, 255, 255, 0.1);
  padding: 2rem;
  border-radius: 15px;
  margin-top: 2rem;
  width: 100%;
  max-width: 400px;
`;

const StatGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1.5rem;
  margin-top: 1rem;
`;

const StatBox = styled.div`
  background: rgba(0, 255, 136, 0.1);
  padding: 1rem;
  border-radius: 10px;
  text-align: center;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 5px 15px rgba(0, 255, 136, 0.2);
  }
`;

const StatLabel = styled.div`
  font-size: 0.9rem;
  color: #00ff88;
  margin-bottom: 0.5rem;
`;

const StatValue = styled.div`
  font-size: 1.5rem;
  font-weight: bold;
`;

const WinRate = styled.div`
  text-align: center;
  margin-top: 1.5rem;
  font-size: 1.2rem;
  color: #00ff88;
`;

const PlayerStats = ({ stats }) => {
  if (!stats) return null;

  const winRate = stats.totalFlips > 0 
    ? ((stats.wins / stats.totalFlips) * 100).toFixed(1)
    : 0;

  return (
    <StatsContainer>
      <h3>Player Statistics</h3>
      <StatGrid>
        <StatBox>
          <StatLabel>Total Flips</StatLabel>
          <StatValue>{stats.totalFlips}</StatValue>
        </StatBox>
        <StatBox>
          <StatLabel>Wins</StatLabel>
          <StatValue>{stats.wins}</StatValue>
        </StatBox>
        <StatBox>
          <StatLabel>Current Streak</StatLabel>
          <StatValue>{stats.currentStreak}</StatValue>
        </StatBox>
        <StatBox>
          <StatLabel>Best Streak</StatLabel>
          <StatValue>{stats.bestStreak}</StatValue>
        </StatBox>
      </StatGrid>
      <WinRate>
        Win Rate: {winRate}%
      </WinRate>
    </StatsContainer>
  );
};

export default PlayerStats; 