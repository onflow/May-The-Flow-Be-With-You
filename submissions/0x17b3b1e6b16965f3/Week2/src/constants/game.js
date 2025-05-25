export const MOVES = {
  ROCK: {
    emoji: '🪨',
    name: 'rock',
    index: 0,
    beats: 2 // scissors
  },
  PAPER: {
    emoji: '📄',
    name: 'paper',
    index: 1,
    beats: 0 // rock
  },
  SCISSORS: {
    emoji: '✂️',
    name: 'scissors',
    index: 2,
    beats: 1 // paper
  }
};

export const OUTCOMES = {
  WIN: {
    text: 'WIN',
    color: '#48bb78',
    sound: 'win'
  },
  LOSE: {
    text: 'LOSE',
    color: '#f56565',
    sound: 'lose'
  },
  DRAW: {
    text: 'DRAW',
    color: '#ecc94b',
    sound: 'draw'
  }
};

export const ANIMATIONS = {
  DURATION: {
    FADE: '1s',
    BOUNCE: '0.5s',
    ROTATE: '1s'
  },
  TIMING: {
    EASE: 'ease',
    EASE_OUT: 'ease-out',
    LINEAR: 'linear'
  }
};

export const THEME = {
  colors: {
    primary: '#4299e1',
    success: '#48bb78',
    error: '#f56565',
    warning: '#ecc94b',
    background: '#f7fafc',
    text: '#2d3748',
    textLight: '#718096'
  },
  shadows: {
    sm: '0 2px 4px rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px rgba(0, 0, 0, 0.1)',
    lg: '0 4px 15px rgba(0, 0, 0, 0.1)'
  },
  gradients: {
    primary: 'linear-gradient(135deg, #4299e1, #3182ce)',
    success: 'linear-gradient(135deg, #48bb78, #38a169)',
    error: 'linear-gradient(135deg, #f56565, #c53030)',
    warning: 'linear-gradient(135deg, #ecc94b, #d69e2e)'
  }
}; 