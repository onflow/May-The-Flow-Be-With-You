import { Box } from '@mui/material';
import { styled } from '@mui/material/styles';
import { useTheme } from '@mui/material';
import { ReactNode } from 'react';

const StyledGameContainer = styled(Box)(({ theme }) => ({
  width: '480px',
  height: '640px',
  position: 'relative',
  backgroundColor: '#0a0a0a',
  border: '2px solid #00ffff',
  boxShadow: '0 0 20px #00ffff',
  borderRadius: '4px',
  overflow: 'hidden',
  transition: 'all 0.3s ease-in-out',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  '&:hover': {
    boxShadow: '0 0 30px #00ffff',
  },
  '& .game-wrapper': {
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  '& .game-container-wrapper': {
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  '& #game-container': {
    width: '100%',
    height: '100%',
  },
  [theme.breakpoints.down('md')]: {
    width: '100%',
    height: 'auto',
    aspectRatio: '3/4',
    maxWidth: '480px',
  },
}));

interface GameContainerProps {
  children: ReactNode;
}

const GameContainer = ({ children }: GameContainerProps) => {
  const theme = useTheme();

  return (
    <StyledGameContainer>
      {children}
    </StyledGameContainer>
  );
};

export default GameContainer; 