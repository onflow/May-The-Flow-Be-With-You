import * as fcl from '@onflow/fcl';

fcl
  .config()
  .put('flow.network', 'testnet')
  .put('accessNode.api', 'https://rest-testnet.onflow.org')