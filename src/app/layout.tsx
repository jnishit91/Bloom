import type { Metadata } from "next";
import { Inter, Fraunces } from "next/font/google";
import { cn } from "@/lib/utils";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Bloom — Transform Your Relationships",
  description:
    "Premium relationship-transformation courses for India. Communication, healing, intimacy, and becoming your highest self.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={cn("h-full", inter.variable, fraunces.variable)}
    >
      <body className="min-h-full flex flex-col">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:rounded-xl focus:bg-bloom-rose focus:px-4 focus:py-2 focus:text-white focus:text-sm focus:font-medium focus:shadow-bloom"
        >
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
