import React from 'react';
import styled from 'styled-components';
import { MovesContainer, MoveButton, Result, LoadingSpinner } from './styles';

const GameBoard = ({ loading, moves, moveNames, playGame, result }) => {
  return (
    <div>
      {loading && <LoadingSpinner />}
      <MovesContainer>
        {moveNames.map((move, index) => (
          <MoveButton 
            key={move} 
            onClick={() => playGame(move)}
            disabled={loading}
          >
            {moves[index]}
          </MoveButton>
        ))}
      </MovesContainer>
      {result && (
        <Result outcome={result.outcome}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>
            {result.playerMove} vs {result.computerMove}
          </div>
          {result.outcome === 'success' ? 'Game recorded on Flow!' : 'Game failed'}
        </Result>
      )}
    </div>
  );
};

export default GameBoard; 