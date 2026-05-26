import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Nav from "./components/Nav";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Bufferbloat Test | Check Internet Responsiveness Under Load",
    template: "%s | Bufferbloat.org",
  },
  description:
    "Run a browser-based bufferbloat test to check whether your internet connection stays responsive while downloads and uploads are active.",
  keywords: [
    "bufferbloat test",
    "internet responsiveness test",
    "latency under load",
    "ping test",
    "upload latency",
    "download latency",
    "network latency test",
    "internet lag test",
  ],
  openGraph: {
    title: "Bufferbloat Test",
    description:
      "Check whether your internet connection stays responsive while busy.",
    url: "https://bufferbloat.org",
    siteName: "Bufferbloat.org",
    type: "website",
  },
  alternates: {
    canonical: "https://bufferbloat.org",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body>
        <Nav />
        {children}
      </body>
    </html>
  );
}
