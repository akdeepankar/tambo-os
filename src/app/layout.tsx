"use client";
"use client";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import React, { useState, useEffect } from "react";
import WelcomeScreen from "@/components/ui/WelcomeScreen";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const [showWelcome, setShowWelcome] = useState(true);
  useEffect(() => {
    const timer = setTimeout(() => setShowWelcome(false), 3000);
    return () => clearTimeout(timer);
  }, []);
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {showWelcome && <WelcomeScreen />}
        {!showWelcome && children}
      </body>
    </html>
  );
}
