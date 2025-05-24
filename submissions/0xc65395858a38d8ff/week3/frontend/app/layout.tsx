import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css"; // We'll create this file next
import { Providers } from "./providers"; // Chakra UI and other providers

const inter = Inter({ subsets: ["latin"] });

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
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
} 