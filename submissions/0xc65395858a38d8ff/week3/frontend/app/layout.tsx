import type { Metadata } from "next";
import { Exo_2, Roboto } from "next/font/google";
import "./globals.css"; // We'll create this file next
import { Providers } from "./providers"; // Chakra UI and other providers

// Initialize the fonts with desired subsets and weights
const exo2 = Exo_2({
  subsets: ["latin"],
  variable: '--font-exo2', // CSS variable for Exo 2
  display: 'swap',
  weight: ['400', '500', '600', '700', '800'] // Example weights
});

const roboto = Roboto({
  subsets: ["latin"],
  variable: '--font-roboto', // CSS variable for Roboto
  display: 'swap',
  weight: ['300', '400', '500', '700'] // Example weights
});

export const metadata: Metadata = {
  title: "Primordia: Genesis Protocol",
  description: "Forge your destiny in a world of evolving elemental creatures.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={`${exo2.variable} ${roboto.variable}`}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
} 