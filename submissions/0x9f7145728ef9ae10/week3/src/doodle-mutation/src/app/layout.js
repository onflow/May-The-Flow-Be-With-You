import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "@rainbow-me/rainbowkit/styles.css";
import WalletProvider from "@/context/WalletProvider";
import { MutationProvider } from "@/context/MutationContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Doodles Mutation Lab",
  description:
    "Get your Doodles a mutation potion and turn it into a mutated doodles. No one knows what's the mutation result is, everything is random.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <WalletProvider>
          <MutationProvider>{children}</MutationProvider>
        </WalletProvider>
      </body>
    </html>
  );
}
