import * as fcl from '@onflow/fcl';

// Configure FCL for Flow Testnet
fcl.config({
  'accessNode.api': 'https://rest-testnet.onflow.org',
  'discovery.wallet': 'https://fcl-discovery.onflow.org/testnet/authn',
  'app.detail.title': 'Click to Moon',
  'app.detail.icon': 'https://placekitten.com/g/200/200',
  'app.detail.url': 'https://click-to-moon.vercel.app'
}); 