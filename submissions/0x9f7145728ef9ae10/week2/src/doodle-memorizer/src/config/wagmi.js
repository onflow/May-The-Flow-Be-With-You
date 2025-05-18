import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { flowTestnet } from '@wagmi/core/chains';

export const config = getDefaultConfig({
  appName: 'YOUR-PROJECT-NAME',
  projectId: 'YOUR-PROJECT-ID',
  chains: [flowTestnet],
  ssr: true,
});