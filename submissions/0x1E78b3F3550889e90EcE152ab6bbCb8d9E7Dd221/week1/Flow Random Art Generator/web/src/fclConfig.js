import * as fcl from '@onflow/fcl';

fcl.config()
  .put('accessNode.api', 'https://rest-testnet.onflow.org')
  .put('discovery.wallet', 'https://fcl-discovery.onflow.org/testnet/authn')
  .put('app.detail.title', 'Flow Random Art Generator')
  .put('app.detail.icon', 'https://placekitten.com/g/200/200');

export default fcl; 