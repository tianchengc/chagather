import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ChaGather | Live Tea Master Agent",
  description:
    "Traditional Gongfu tea mastery meets Gemini Live native audio and live camera awareness.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-[var(--tea-bg)] text-[var(--tea-cream)] antialiased">
        {children}
      </body>
    </html>
  );
}
