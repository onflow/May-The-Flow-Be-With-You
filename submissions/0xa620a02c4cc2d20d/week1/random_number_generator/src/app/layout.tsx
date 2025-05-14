// src/app/layout.tsx
'use client';

import { FlowProvider } from '@onflow/kit';
import flowJSON from '../../flow.json';

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
            accessNodeUrl: 'http://localhost:8888',
            flowNetwork: 'emulator',
            discoveryWallet: 'https://fcl-discovery.onflow.org/emulator/authn',
          }}
          flowJson={flowJSON}
        >
          {children}
        </FlowProvider>
      </body>
    </html>
  );
}
