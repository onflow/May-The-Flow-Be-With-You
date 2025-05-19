import { http, createConfig } from 'wagmi'
import {  flowTestnet } from 'wagmi/chains'
import {  metaMask } from 'wagmi/connectors'


export const config = createConfig({
    chains: [flowTestnet],
    connectors: [
        // walletConnect({ projectId }),
        metaMask(),
        // safe(),
    ],
    transports: {
        [flowTestnet.id]: http(),
    },
})