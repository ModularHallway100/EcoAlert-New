import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ConvexClientProvider } from "@/components/convex-client-provider";
import { ClerkProvider } from "@clerk/nextjs";
import { Toaster } from "@/components/ui/toaster";
import { Suspense } from "react";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "EcoAlert - Pollution Intelligence & Emergency Response Suite",
  description: "Real-time environmental monitoring, AI-powered analytics, and emergency response for air, water, and noise quality data.",
  keywords: ["environmental monitoring", "air quality", "water quality", "pollution", "AI analytics", "emergency response"],
  authors: [{ name: "EcoAlert Team" }],
  creator: "EcoAlert",
  publisher: "EcoAlert Inc.",
  robots: "index, follow",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://ecoalert.app",
    title: "EcoAlert - Pollution Intelligence & Emergency Response Suite",
    description: "Real-time environmental monitoring, AI-powered analytics, and emergency response for air, water, and noise quality data.",
    siteName: "EcoAlert",
  },
  twitter: {
    card: "summary_large_image",
    title: "EcoAlert - Pollution Intelligence & Emergency Response Suite",
    description: "Real-time environmental monitoring, AI-powered analytics, and emergency response for air, water, and noise quality data.",
    creator: "@ecoalert",
    images: ["/og-image.jpg"],
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <body className={inter.className}>
          <Suspense fallback={
            <div className="flex items-center justify-center min-h-screen">
              <div className="loading-spinner"></div>
            </div>
          }>
            <ConvexClientProvider>
              {children}
              <Toaster />
            </ConvexClientProvider>
          </Suspense>
        </body>
      </html>
    </ClerkProvider>
  );
}