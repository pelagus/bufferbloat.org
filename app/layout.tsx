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
    default: "Bufferbloat.org | Open Source Bufferbloat Test",
    template: "%s | Bufferbloat.org",
  },
  description:
    "An open-source browser-based bufferbloat test and technical resource for measuring internet responsiveness and latency under load.",
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
    title: "Bufferbloat.org",
    description:
      "An open-source test for internet responsiveness and latency under load.",
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
