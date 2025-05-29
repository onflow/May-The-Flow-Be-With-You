import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { flowTestnet } from '@wagmi/core/chains';

export const config = getDefaultConfig({
  appName: 'layerzero',
  projectId: '',
  chains: [flowTestnet],
  ssr: true,
});