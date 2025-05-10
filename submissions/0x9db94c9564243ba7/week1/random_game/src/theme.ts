import { createTheme } from '@mui/material/styles';

declare module '@mui/material/styles' {
  interface Palette {
    cyberpunk: {
      cyan: string;
      magenta: string;
      dark: string;
      orange: string;
    };
  }
  interface PaletteOptions {
    cyberpunk: {
      cyan: string;
      magenta: string;
      dark: string;
      orange: string;
    };
  }
}

export const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#00ffff',
    },
    secondary: {
      main: '#ff00ff',
    },
    background: {
      default: '#0a0a0a',
      paper: '#0a0a0a',
    },
    text: {
      primary: '#ffffff',
      secondary: '#888888',
    },
    cyberpunk: {
      cyan: '#00ffff',
      magenta: '#ff00ff',
      dark: '#0a0a0a',
      orange: "#FF7F11"
    },
  },
  typography: {
    fontFamily: 'Inter, sans-serif',
    h1: {
      fontFamily: 'Orbitron, sans-serif',
    },
    h2: {
      fontFamily: 'Orbitron, sans-serif',
    },
    h3: {
      fontFamily: 'Orbitron, sans-serif',
    },
    h4: {
      fontFamily: 'Orbitron, sans-serif',
    },
    h5: {
      fontFamily: 'Orbitron, sans-serif',
    },
    h6: {
      fontFamily: 'Orbitron, sans-serif',
    },
    button: {
      fontFamily: 'JetBrains Mono, monospace',
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 4,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
      },
    },
  },
}); 