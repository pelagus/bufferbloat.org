import type { Metadata, Viewport } from "next";
import { Geist_Mono, Inter } from "next/font/google";
import "./globals.css";
import Nav from "./components/Nav";
import Footer from "./components/Footer";

const interSans = Inter({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://bufferbloat.org"),
  title: {
    default: "Bufferbloat Test for Internet Reliability and Quality",
    template: "%s | Bufferbloat.org",
  },
  description:
    "An open-source browser-based bufferbloat test for measuring internet reliability, latency / ping under load, and connection quality beyond Mbps.",
  keywords: [
    "bufferbloat test",
    "internet reliability test",
    "internet stability test",
    "internet quality test",
    "latency under load",
    "ping test",
    "upload latency",
    "download latency",
    "network latency test",
    "internet lag test",
  ],
  openGraph: {
    title: "Bufferbloat Test for Internet Reliability and Quality",
    description:
      "An open-source bufferbloat test for internet reliability, latency / ping under load, and connection quality beyond Mbps.",
    url: "https://bufferbloat.org",
    siteName: "Bufferbloat.org",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Bufferbloat Test for Internet Reliability and Quality",
    description:
      "An open-source bufferbloat test for internet reliability, latency / ping under load, and connection quality beyond Mbps.",
  },
  alternates: {
    canonical: "https://bufferbloat.org",
  },
};

export const viewport: Viewport = {
  colorScheme: "light",
  themeColor: "#f1f3f5",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${interSans.variable} ${geistMono.variable}`}>
      <body>
        <Nav />
        {children}
        <Footer />
      </body>
    </html>
  );
}
