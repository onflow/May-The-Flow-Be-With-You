import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css"; // El CSS global de Next.js
import { Provider } from "@/components/ui/provider"; // Importa el Provider de Chakra UI
import "../flow/config"; // Importa la configuración de FCL

const inter = Inter({ subsets: [["latin"]] });

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
          {children}
        </Provider>
      </body>
    </html>
  );
} 