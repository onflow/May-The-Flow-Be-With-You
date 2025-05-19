import React from 'react';
import { StatsPanel, PanelTitle, StatValue, Badge } from './styles';
import { getWinRateColor } from '../../utils/helpers';

const PlayerStats = ({ stats, moves }) => {
  if (!stats) {
    return (
      <StatsPanel>
        <PanelTitle>Your Stats</PanelTitle>
        <div>No games played yet</div>
      </StatsPanel>
    );
  }

  return (
    <StatsPanel>
      <PanelTitle>Your Stats</PanelTitle>
      <StatValue>
        <span>Total Games</span>
        <Badge color="#4299e1">{stats.totalGames}</Badge>
      </StatValue>
      <StatValue>
        <span>Wins</span>
        <Badge color="#48bb78">{stats.wins}</Badge>
      </StatValue>
      <StatValue>
        <span>Win Rate</span>
        <Badge color={getWinRateColor(stats.winRate)}>
          {(stats.winRate * 100).toFixed(1)}%
        </Badge>
      </StatValue>
      <StatValue>
        <span>Favorite Move</span>
        <span style={{ fontSize: '1.5rem' }}>{moves[stats.favoriteMove]}</span>
      </StatValue>
    </StatsPanel>
  );
};

export default PlayerStats; 