import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "../src/app/globals.css"; // El CSS global de Next.js
import { Provider } from "../src/components/ui/provider"; // Importa el Provider de Chakra UI
import React from 'react'; // Import React
import Header from "../src/components/Header"; // Import Header

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Elemental Strikers",
  description: "A strategic elemental battle game built on the Flow blockchain",
  openGraph: {
    title: "Elemental Strikers | Flow Blockchain Game",
    description: "A strategic elemental battle game where Fire, Water, and Plant clash in blockchain-based combat",
    url: "https://elementalstrikers.flow.com",
    siteName: "Elemental Strikers",
    images: [
      {
        url: "/assets/opengraph-image.png",
        width: 1200,
        height: 630,
        alt: "Elemental Strikers - Flow blockchain game with elemental powers",
      }
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Elemental Strikers | Strategic Elemental Battles",
    description: "Join the elemental combat arena on Flow blockchain",
    images: ["/assets/opengraph-image.png"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <Provider>
          <Header />
          <main>{children}</main> 
        </Provider>
      </body>
    </html>
  );
} 