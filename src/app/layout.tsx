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
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
