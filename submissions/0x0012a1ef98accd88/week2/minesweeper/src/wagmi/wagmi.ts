import { http, createConfig } from 'wagmi'
import { flowMainnet } from 'wagmi/chains'
import {  metaMask } from 'wagmi/connectors'


export const config = createConfig({
    chains: [flowMainnet],
    connectors: [
        // walletConnect({ projectId }),
        metaMask(),
        // safe(),
    ],
    transports: {
        [flowMainnet.id]: http("https://mainnet.evm.nodes.onflow.org"),
    },
})