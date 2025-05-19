import { useAccount, useConnect, useDisconnect, type Connector } from 'wagmi'
import React from 'react'

function Account() {
    const { address } = useAccount()
    const { disconnect } = useDisconnect()

    return (
        <div className="flex items-center gap-3">
            <div className="px-6 py-3 bg-blue-500 text-white rounded-lg font-medium text-lg border border-white-500">
                {address?.slice(0, 6)}...{address?.slice(-4)}
            </div>
            <button
                type="button"
                onClick={() => disconnect()}
                className="px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 text-lg font-medium"
            >
                Disconnect
            </button>
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
                            onClick={() => {
                                connect({ connector })
                                setIsOpen(false)
                            }}
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