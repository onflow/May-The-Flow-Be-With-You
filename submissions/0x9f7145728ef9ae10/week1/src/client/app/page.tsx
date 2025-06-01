import { GhibliMarquee } from '@/components/landing/ghibli-marquee';
import ConnectWalletButton from '@/components/landing/connect-wallet-button';

export default function Home() {
	return (
		<main className="flex min-h-screen flex-col items-center justify-between p-4">
			<div className="flex-1 flex flex-col items-center justify-center max-w-xl w-full mx-auto text-center space-y-6 py-12">
				<h1 className="text-4xl md:text-5xl font-semibold">
					Are you ready to <br />
					Ghibli with the <span className="text-[#00EF8B]">Flow</span>?
				</h1>
				<p className="text-sm max-w-md mx-auto">
					Drop your selfie and let Flow's On-Chain Magic (Randomness) flip the
					switch to full Ghibli Mode ✨ Your anime glow-up starts now!
				</p>
				<ConnectWalletButton />
			</div>

			{/* Ghibli Marquee */}
			<div className="w-full mt-auto">
				<GhibliMarquee />
			</div>
		</main>
	);
}
