import * as fcl from '@onflow/fcl';

export const initializeFCL = () => {
  fcl.config({
    'accessNode.api': 'https://rest-testnet.onflow.org',
    'discovery.wallet': 'https://fcl-discovery.onflow.org/testnet/authn',
    'app.detail.title': 'FlowPersona',
    'app.detail.icon': 'https://placekitten.com/g/200/200',
    'fcl.walletDiscovery': true,
    'fcl.walletDiscovery.api': 'https://fcl-discovery.onflow.org/testnet/authn',
    'fcl.walletDiscovery.include': ['dapper', 'blocto', 'ledger'],
    'fcl.walletDiscovery.exclude': ['ethereum'],
    'fcl.walletDiscovery.method': 'POP/RPC',
    'fcl.walletDiscovery.override': {
      'ethereum': null
    }
  });
}; 