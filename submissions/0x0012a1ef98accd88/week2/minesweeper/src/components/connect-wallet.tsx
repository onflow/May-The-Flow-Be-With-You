import { useAccount, useConnect, useDisconnect, useSwitchChain, type Connector } from 'wagmi'
import { flowTestnet } from 'wagmi/chains'
import React from 'react'

function Account() {
    const { address, chain } = useAccount()
    const { disconnect } = useDisconnect()
    const { switchChain } = useSwitchChain()

    const handleSwitchChain = async () => {
        try {
            await switchChain({ chainId: flowTestnet.id })
        } catch (error) {
            console.error('Failed to switch chain:', error)
        }
    }

    return (
        <div className="flex items-center gap-3">
            <div className="px-6 py-3 bg-blue-500 text-white rounded-lg font-medium text-lg border border-white-500">
                {address?.slice(0, 6)}...{address?.slice(-4)}
            </div>
            {chain?.id !== flowTestnet.id ? (
                <button
                    type="button"
                    onClick={handleSwitchChain}
                    className="px-6 py-3 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 text-lg font-medium"
                >
                    Switch to Flow Testnet
                </button>
            ) : (
                <button
                    type="button"
                    onClick={() => disconnect()}
                    className="px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 text-lg font-medium"
                >
                    Disconnect
                </button>
            )}
        </div>
    )
}

function WalletOption({
    connector,
    onClick,
}: {
    connector: Connector
    onClick: () => void
}) {
    const [ready, setReady] = React.useState(false)

    React.useEffect(() => {
        ; (async () => {
            const provider = await connector.getProvider()
            setReady(!!provider)
        })()
    }, [connector])

    return (
        <button
            type="button"
            disabled={!ready}
            onClick={onClick}
            className="w-full px-6 py-3 text-left hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed text-lg"
        >
            {connector.name}
        </button>
    )
}

function WalletOptions() {
    const { connectors, connect } = useConnect()
    const [isOpen, setIsOpen] = React.useState(false)
    const { switchChain } = useSwitchChain()
    const { isConnected, chain } = useAccount()

    React.useEffect(() => {
        const switchToFlowTestnet = async () => {
            if (isConnected && chain?.id !== flowTestnet.id) {
                try {
                    await switchChain({ chainId: flowTestnet.id })
                } catch (error) {
                    console.error('Failed to switch chain:', error)
                }
            }
        }
        switchToFlowTestnet()
    }, [isConnected, chain, switchChain])

    const handleConnect = async (connector: Connector) => {
        try {
            await connect({
                connector,
                chainId: flowTestnet.id
            })
            setIsOpen(false)
        } catch (error) {
            console.error('Failed to connect:', error)
        }
    }

    return (
        <div className="relative">
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="px-8 py-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-lg font-medium"
            >
                Connect
            </button>
            {isOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200">
                    {connectors.map((connector) => (
                        <WalletOption
                            key={connector.uid}
                            connector={connector}
                            onClick={() => handleConnect(connector)}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}

export default function ConnectWallet() {
    const { isConnected } = useAccount()
    if (isConnected) return <Account />
    return <WalletOptions />
} 