import type { Metadata } from "next";
import PWARegister from "@/components/PWARegister";
import "./globals.css";

export const metadata: Metadata = {
  title: "ChaGather | Live Tea Master Agent",
  description:
    "Traditional Gongfu tea mastery meets Gemini Live native audio and live camera awareness.",
  applicationName: "ChaGather",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/favicon.png",
    shortcut: "/favicon.png",
    apple: "/favicon.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "ChaGather",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-[var(--tea-bg)] text-[var(--tea-cream)] antialiased">
        <PWARegister />
        {children}
      </body>
    </html>
  );
}
