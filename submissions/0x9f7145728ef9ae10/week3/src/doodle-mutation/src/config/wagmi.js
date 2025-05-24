import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { flowTestnet } from '@wagmi/core/chains';

export const config = getDefaultConfig({
  appName: 'doodle',
  projectId: '0d96c994eeaf761d2d2ac3a07192d980',
  chains: [flowTestnet],
  ssr: true,
});