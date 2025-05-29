import { Box, Container, useTheme } from '@mui/material';
import { styled } from '@mui/material/styles';
import NavBar from './NavBar';
import GameContainer from './GameContainer';
import InstructionsPanel from './InstructionsPanel';
import { ReactNode } from 'react';

const StyledContainer = styled(Container)(({ theme }) => ({
  minHeight: '100vh',
  backgroundColor: '#0a0a0a',
  padding: theme.spacing(2),
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(3),
}));

interface AppLayoutProps {
  children: ReactNode;
}

const AppLayout = ({ children }: AppLayoutProps) => {
  const theme = useTheme();

  return (
    <StyledContainer maxWidth={false}>
      <NavBar />
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: theme.spacing(3),
          alignItems: 'center',
          justifyContent: 'center',
          flex: 1,
        }}
      >
        <GameContainer>
          {children}
        </GameContainer>
        <InstructionsPanel />
      </Box>
    </StyledContainer>
  );
};

export default AppLayout; 