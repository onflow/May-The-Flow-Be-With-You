import { AppBar, Toolbar, Typography, Button, Box } from '@mui/material';
import { styled } from '@mui/material/styles';

const StyledAppBar = styled(AppBar)(({ theme }) => ({
  backgroundColor: '#0a0a0a',
  borderBottom: '2px solid #00ffff',
  boxShadow: '0 0 10px #00ffff',
  height: '64px',
}));

const StyledTypography = styled(Typography)(({ theme }) => ({
  fontFamily: 'Orbitron, sans-serif',
  color: '#ffffff',
  flexGrow: 1,
}));

const WalletButton = styled(Button)(({ theme }) => ({
  backgroundColor: 'transparent',
  border: '1px solid #ff00ff',
  color: '#ffffff',
  fontFamily: 'JetBrains Mono, monospace',
  '&:hover': {
    backgroundColor: 'rgba(255, 0, 255, 0.1)',
    boxShadow: '0 0 10px #ff00ff',
  },
}));

const NavBar = () => {
  return (
    <StyledAppBar position="static">
      <Toolbar>
        <StyledTypography variant="h6">
          Cyber Dice
        </StyledTypography>
        <WalletButton variant="outlined">
          Connect Wallet
        </WalletButton>
      </Toolbar>
    </StyledAppBar>
  );
};

export default NavBar; 