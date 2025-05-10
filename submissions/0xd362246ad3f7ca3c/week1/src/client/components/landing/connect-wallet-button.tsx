'use client';

import { ConnectButton } from '@rainbow-me/rainbowkit';
import { Button } from '@/components/ui/button';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ConnectWalletButton() {
	const router = useRouter();

	return (
		<ConnectButton.Custom>
			{({
				account,
				chain,
				openAccountModal,
				openChainModal,
				openConnectModal,
				authenticationStatus,
				mounted,
			}) => {
				const ready = mounted && authenticationStatus !== 'loading';
				const connected =
					ready &&
					account &&
					chain &&
					(!authenticationStatus || authenticationStatus === 'authenticated');

				// ✅ Register wallet address only once using localStorage guard
				useEffect(() => {
					const wallet = account?.address;
					if (!wallet) return;

					const key = `walletRegistered_${wallet}`;
					const alreadyRegistered = localStorage.getItem(key);
					if (alreadyRegistered) {
						console.log('Wallet already registered — skipping API call.');
						return;
					}

					const requestBody = { walletAddress: wallet };
					console.log('Calling /api/register-wallet with:', requestBody);

					fetch('/api/register-wallet', {
						method: 'POST',
						headers: {
							'Content-Type': 'application/json',
						},
						body: JSON.stringify(requestBody),
					})
						.then((response) => {
							console.log('Response:', {
								status: response.status,
								url: response.url,
							});
							return response.json();
						})
						.then((data) => {
							console.log('Response data:', data);
							if (data.success) {
								console.log('Success:', data.message);
								localStorage.setItem(key, 'true'); // ✅ Save to localStorage
							} else {
								console.error(
									'Registration failed:',
									data.message || 'Unknown error'
								);
							}
						})
						.catch((error) => {
							console.error('API error:', error);
						});
				}, [account?.address]);

				// Redirect when wallet is connected and chain is supported
				useEffect(() => {
					if (connected && chain && !chain.unsupported) {
						router.push('/upload');
					}
				}, [connected, chain, router]);

				return (
					<div
						{...(!ready && {
							'aria-hidden': true,
							style: {
								opacity: 0,
								pointerEvents: 'none',
								userSelect: 'none',
							},
						})}
					>
						{!connected ? (
							<Button
								size="lg"
								onClick={openConnectModal}
								className="mx-auto px-8 py-6 text-lg rounded-full bg-[#00EF8B] hover:bg-[#00EF8B]/90"
							>
								Connect My Wallet
							</Button>
						) : chain.unsupported ? (
							<Button
								size="lg"
								onClick={openChainModal}
								className="mx-auto px-8 py-6 text-lg rounded-full bg-red-500 hover:bg-red-600"
							>
								Wrong network
							</Button>
						) : (
							<div className="flex space-x-4">
								<Button onClick={openChainModal}>
									{chain.hasIcon && chain.iconUrl && (
										<img
											alt={chain.name ?? 'Chain icon'}
											src={chain.iconUrl}
											className="w-4 h-4 mr-2 rounded-full"
										/>
									)}
									{chain.name}
								</Button>
								<Button onClick={openAccountModal}>
									{account.displayName}
									{account.displayBalance ? ` (${account.displayBalance})` : ''}
								</Button>
							</div>
						)}
					</div>
				);
			}}
		</ConnectButton.Custom>
	);
}
