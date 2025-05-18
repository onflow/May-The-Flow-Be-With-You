export const formatAddress = (address) => {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

export const getWinRateColor = (winRate) => {
  if (winRate >= 0.7) return '#48bb78';
  if (winRate >= 0.5) return '#4299e1';
  if (winRate >= 0.3) return '#ecc94b';
  return '#f56565';
};

export const getOutcomeColor = (outcome) => {
  switch (outcome) {
    case 'win': return '#48bb78';
    case 'lose': return '#f56565';
    case 'draw': return '#ecc94b';
    default: return '#718096';
  }
};

export const playSound = (type) => {
  const audio = new Audio(`/sounds/${type}.mp3`);
  audio.play().catch(e => console.log('Sound play failed:', e));
}; 