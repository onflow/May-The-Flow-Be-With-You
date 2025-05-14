import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "../src/app/globals.css"; // El CSS global de Next.js
import { Provider } from "../src/components/ui/provider"; // Importa el Provider de Chakra UI
import React from 'react'; // Import React
import Header from "../src/components/Header"; // Import Header

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Elemental Strikers",
  description: "A Flow-based game of elemental combat on Flow",
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