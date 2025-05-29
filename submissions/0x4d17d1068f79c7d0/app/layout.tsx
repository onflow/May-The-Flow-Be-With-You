import "../shared/styles/globals.css";
import { Layout } from "../shared/components/Layout";
import { AuthProvider } from "../shared/providers/AuthProvider";

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
      <body>
        <AuthProvider>
          <Layout>{children}</Layout>
        </AuthProvider>
      </body>
    </html>
  );
}
