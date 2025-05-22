import styled, { keyframes } from 'styled-components';

const bounce = keyframes`
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
`;

const rotate = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`;

export const MovesContainer = styled.div`
  display: flex;
  gap: 1.5rem;
  justify-content: center;
  margin-bottom: 2rem;
`;

export const MoveButton = styled.button`
  padding: 1.5rem 2.5rem;
  font-size: 2.5rem;
  border: none;
  border-radius: 16px;
  background: linear-gradient(135deg, #4a5568, #2d3748);
  color: white;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);

  &:hover {
    transform: translateY(-5px) scale(1.05);
    box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
  }

  &:active {
    transform: translateY(0) scale(0.95);
  }

  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }
`;

export const Result = styled.div`
  font-size: 2rem;
  margin-top: 2rem;
  padding: 1.5rem;
  border-radius: 12px;
  background: ${props => {
    switch (props.outcome) {
      case 'win': return 'linear-gradient(135deg, #48bb78, #38a169)';
      case 'lose': return 'linear-gradient(135deg, #f56565, #c53030)';
      case 'draw': return 'linear-gradient(135deg, #ecc94b, #d69e2e)';
      default: return 'transparent';
    }
  }};
  color: white;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
  animation: ${bounce} 0.5s ease;
`;

export const LoadingSpinner = styled.div`
  width: 30px;
  height: 30px;
  border: 3px solid #f0f0f0;
  border-top: 3px solid #3182ce;
  border-radius: 50%;
  animation: ${rotate} 1s linear infinite;
  margin: 1rem auto;
`; 