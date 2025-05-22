import React from 'react';
import styled, { keyframes } from 'styled-components';

const flip = keyframes`
  0% {
    transform: rotateY(0);
  }
  100% {
    transform: rotateY(720deg);
  }
`;

const CoinContainer = styled.div`
  width: 150px;
  height: 150px;
  position: relative;
  margin: 2rem auto;
  transform-style: preserve-3d;
  animation: ${flip} 1s ease-out;
`;

const CoinSide = styled.div`
  position: absolute;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 4rem;
  backface-visibility: hidden;
  background: linear-gradient(45deg, #FFD700, #FFA500);
  box-shadow: 0 0 20px rgba(255, 215, 0, 0.5);
`;

const CoinBack = styled(CoinSide)`
  transform: rotateY(180deg);
`;

const CoinAnimation = ({ isFlipping, result }) => {
  if (!isFlipping && result === null) return null;

  return (
    <CoinContainer>
      <CoinSide>🪙</CoinSide>
      <CoinBack>🪙</CoinBack>
    </CoinContainer>
  );
};

export default CoinAnimation; 