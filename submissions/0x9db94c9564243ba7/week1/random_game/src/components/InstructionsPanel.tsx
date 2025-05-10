import { Box, Typography, Paper } from '@mui/material';
import { styled } from '@mui/material/styles';

const StyledPaper = styled(Paper)(({ theme }) => ({
  width: '480px',
  backgroundColor: '#0a0a0a',
  border: '2px solid #ff00ff',
  boxShadow: '0 0 20px #ff00ff',
  padding: theme.spacing(3),
  color: '#ffffff',
  [theme.breakpoints.down('md')]: {
    width: '100%',
    maxWidth: '480px',
  },
}));

const StyledTypography = styled(Typography)(({ theme }) => ({
  fontFamily: 'Inter, sans-serif',
  marginBottom: theme.spacing(2),
  '&.title': {
    fontFamily: 'Orbitron, sans-serif',
    color: '#00ffff',
    marginBottom: theme.spacing(3),
  },
}));

const InstructionsPanel = () => {
  return (
    <StyledPaper elevation={3}>
      <StyledTypography variant="h5" className="title">
        How to Play
      </StyledTypography>
      <StyledTypography variant="body1">
        1. Connect your wallet to start playing
      </StyledTypography>
      <StyledTypography variant="body1">
        2. Place your bet using the in-game controls
      </StyledTypography>
      <StyledTypography variant="body1">
        3. Roll the dice and test your luck
      </StyledTypography>
      <StyledTypography variant="body1">
        4. Win Flow tokens based on your roll
      </StyledTypography>
      <StyledTypography variant="body2" sx={{ color: '#888888', mt: 2 }}>
        Powered by Flow Blockchain
      </StyledTypography>
    </StyledPaper>
  );
};

export default InstructionsPanel; 