'use client';

import { Toaster } from 'react-hot-toast';
import Navigation from '@/components/Navigation';
import '../styles/globals.css';
//import type { Metadata } from 'next';
import { FlowNetwork, FlowProvider } from '@onflow/kit';
import flowJSON from '../../flow.json';

/*export const metadata: Metadata = {
  title: 'Flow Gift Card App',
  description: 'Create and send gift cards on the Flow blockchain',
};*/

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html>
      <body>
        <FlowProvider
            config={{
              accessNodeUrl: 'https://rest-testnet.onflow.org',
              discoveryWallet: 'https://fcl-discovery.onflow.org/testnet/authn',
              flowNetwork: "testnet" as FlowNetwork,
              appDetailTitle: "Flow Gift Card App",
              appDetailIcon: "/globe.svg", // You'll need to add this icon to your public folder
              appDetailDescription: "A decentralized gift card app on Flow",
              //appDetailUrl: "https://your-app-url.com"
              //accessNodeUrl: 'http://localhost:8888',
              //flowNetwork: 'emulator',
              //discoveryWallet: 'http://localhost:8701/fcl/authn',
            }}
            flowJson={flowJSON}
        >
          <Navigation />
          {children}
          <Toaster />
        </FlowProvider>
      </body>
    </html>
  );
} 