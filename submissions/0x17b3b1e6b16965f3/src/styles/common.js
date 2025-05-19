import styled, { keyframes } from 'styled-components';
import { THEME } from '../constants/game';

export const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
`;

export const bounce = keyframes`
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
`;

export const rotate = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`;

export const Panel = styled.div`
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: ${THEME.shadows.lg};
  transition: transform 0.3s ease;
  animation: ${fadeIn} 1s ease-out;

  &:hover {
    transform: translateY(-5px);
  }
`;

export const Button = styled.button`
  padding: ${props => props.size === 'large' ? '1rem 2rem' : '0.5rem 1rem'};
  font-size: ${props => props.size === 'large' ? '1.2rem' : '1rem'};
  border: none;
  border-radius: 8px;
  background: ${props => props.variant === 'primary' ? THEME.gradients.primary : 
    props.variant === 'success' ? THEME.gradients.success :
    props.variant === 'error' ? THEME.gradients.error :
    THEME.gradients.warning};
  color: white;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: ${THEME.shadows.md};

  &:hover {
    transform: translateY(-3px);
    box-shadow: ${THEME.shadows.lg};
  }

  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }
`;

export const Badge = styled.span`
  background: ${props => props.color || THEME.colors.primary};
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.875rem;
  font-weight: 500;
`;

export const LoadingSpinner = styled.div`
  width: ${props => props.size || '30px'};
  height: ${props => props.size || '30px'};
  border: 3px solid #f0f0f0;
  border-top: 3px solid ${THEME.colors.primary};
  border-radius: 50%;
  animation: ${rotate} 1s linear infinite;
  margin: 1rem auto;
`;

export const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(${props => props.minWidth || '200px'}, 1fr));
  gap: ${props => props.gap || '1rem'};
`;

export const Card = styled.div`
  background: white;
  padding: 1rem;
  border-radius: 8px;
  box-shadow: ${THEME.shadows.sm};
  transition: transform 0.2s ease;

  &:hover {
    transform: translateY(-3px);
    box-shadow: ${THEME.shadows.md};
  }
`;

export const Title = styled.h1`
  color: ${THEME.colors.text};
  margin-bottom: ${props => props.spacing || '2rem'};
  font-size: ${props => props.size || '3rem'};
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.1);
  animation: ${fadeIn} 1s ease-out;
`;

export const Text = styled.p`
  color: ${props => props.color || THEME.colors.text};
  font-size: ${props => props.size || '1rem'};
  margin: ${props => props.margin || '0'};
  font-weight: ${props => props.weight || 'normal'};
  line-height: 1.5;
`; 