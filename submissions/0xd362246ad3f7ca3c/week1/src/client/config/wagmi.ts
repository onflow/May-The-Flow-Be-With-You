import { http, createConfig } from '@wagmi/core';
import { mainnet, flowMainnet, flowTestnet } from '@wagmi/core/chains';
import { connectorsForWallets } from '@rainbow-me/rainbowkit';
import {
  rainbowWallet,
  trustWallet,
  walletConnectWallet,
  injectedWallet,
} from '@rainbow-me/rainbowkit/wallets';
import { Wallet, getWalletConnectConnector } from '@rainbow-me/rainbowkit';

const projectId = 'c284f5a3346da817aeca9a4e6bc7f935';

// Flag to track WalletConnect initialization
let walletConnectInitialized = false;

export interface MyWalletOptions {
  projectId: string;
}

// Define the flowWallet connector with a check for WalletConnect initialization
const flowWallet = ({ projectId }: MyWalletOptions): Wallet => {
  if (!walletConnectInitialized) {
    // Initialize WalletConnect only once
    walletConnectInitialized = true;
    // Initialize the WalletConnect connector for the first time
    getWalletConnectConnector({ projectId });
  }

  return {
    id: 'flow-wallet',
    name: 'Flow Wallet',
    iconUrl: 'https://lilico.app/logo_mobile.png',
    iconBackground: '#41CC5D',
    downloadUrls: {
      android: 'https://play.google.com/store/apps/details?id=com.flowfoundation.wallet',
      ios: 'https://apps.apple.com/ca/app/flow-wallet-nfts-and-crypto/id6478996750',
      chrome: 'https://chromewebstore.google.com/detail/flow-wallet/hpclkefagolihohboafpheddmmgdffjm',
      qrCode: 'https://link.lilico.app',
    },
    mobile: {
      getUri: (uri: string) => uri,
    },
    qrCode: {
      getUri: (uri: string) => uri,
      instructions: {
        learnMoreUrl: 'https://wallet.flow.com',
        steps: [
          {
            description: 'We recommend putting Flow Wallet on your home screen for faster access to your wallet.',
            step: 'install',
            title: 'Open the Flow Wallet app',
          },
          {
            description: 'You can find the scan button on home page, a connection prompt will appear for you to connect your wallet.',
            step: 'scan',
            title: 'Tap the scan button',
          },
        ],
      },
    },
    extension: {
      instructions: {
        learnMoreUrl: 'https://wallet.flow.com',
        steps: [
          {
            description: 'We recommend pinning Flow Wallet to your taskbar for quicker access to your wallet.',
            step: 'install',
            title: 'Install the Flow Wallet extension',
          },
          {
            description: 'Be sure to back up your wallet using a secure method. Never share your secret phrase with anyone.',
            step: 'create',
            title: 'Create or Import a Wallet',
          },
          {
            description: 'Once you set up your wallet, click below to refresh the browser and load up the extension.',
            step: 'refresh',
            title: 'Refresh your browser',
          },
        ],
      },
    },
    createConnector: getWalletConnectConnector({ projectId }),
  };
};

// Setup the wallets and connectors
const connectors = connectorsForWallets(
  [
    {
      groupName: 'Recommended',
      wallets: [
        flowWallet,
        trustWallet,
        walletConnectWallet,
        injectedWallet,
        rainbowWallet,
      ],
    },
  ],
  {
    appName: 'My RainbowKit App',
    projectId: projectId,
  }
);

// Create the config for the wagmi core
export const config = createConfig({
  connectors: connectors,
  chains: [mainnet, flowMainnet, flowTestnet],
  transports: {
    [mainnet.id]: http(),
    [flowMainnet.id]: http(),
    [flowTestnet.id]: http(),
  },
  ssr: true,
});
