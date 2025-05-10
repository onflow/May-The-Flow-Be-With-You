import type React from 'react';
import type { Metadata, Viewport } from 'next';
import { Sora } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/components/theme-provider';
import WalletProvider from '@/providers/wallet-provider';
import '@rainbow-me/rainbowkit/styles.css';

const sora = Sora({
	subsets: ['latin'],
	variable: '--font-sora',
	display: 'swap',
});

export const metadata: Metadata = {
	title: 'Ghibli with the Flow',
	description: 'Transform your images into Studio Ghibli-style artwork',
	keywords: [
		'Studio Ghibli',
		'AI',
		'Image Transformation',
		'Art',
		'Blockchain',
	],
	authors: [{ name: 'Ghibli Mode Team' }],
	creator: 'Ghibli Mode Team'
};

export const viewport: Viewport = {
	width: 'device-width',
	initialScale: 1,
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en" suppressHydrationWarning>
			<body className={`${sora.variable} font-sans antialiased`}>
				<WalletProvider>
					<ThemeProvider
						attribute="class"
						defaultTheme="light"
						enableSystem={false}
						disableTransitionOnChange
					>
						{children}
					</ThemeProvider>
				</WalletProvider>
			</body>
		</html>
	);
}
