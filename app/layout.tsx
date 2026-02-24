import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ShipFlow — Idea → Production → Growth",
  description: "SDLC guide with AI assistants for Expo + NestJS + K8s + AWS",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
