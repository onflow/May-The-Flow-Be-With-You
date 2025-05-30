import "../shared/styles/globals.css";
import { Layout } from "../shared/components/Layout";
import { AuthProvider } from "../shared/providers/AuthProvider";
import { GameProvider } from "../shared/providers/GameProvider";
import { AchievementManager } from "../shared/components/AchievementNotification";
import { Suspense } from "react";
import { LoadingSpinner } from "../shared/components/LoadingSpinner";

export const metadata = {
  title: "Memoreee - Memory Training Platform",
  description:
    "A gamified memory training platform that awakens the dormant powers of human memory through classical techniques",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body suppressHydrationWarning={true}>
        <Suspense
          fallback={
            <LoadingSpinner size="lg" message="Initializing Memoreee..." />
          }
        >
          <AuthProvider>
            <GameProvider>
              <AchievementManager>
                <Layout>{children}</Layout>
              </AchievementManager>
            </GameProvider>
          </AuthProvider>
        </Suspense>
      </body>
    </html>
  );
}
