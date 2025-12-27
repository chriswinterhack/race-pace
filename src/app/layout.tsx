import type { Metadata, Viewport } from "next";
import { Inter, Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import { Toaster } from "sonner";
import { Providers } from "@/components/providers";
import "@/styles/globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  display: "swap",
});

const siteConfig = {
  name: "FinalClimb",
  url: process.env.NEXT_PUBLIC_APP_URL || "https://finalclimbapp.com",
  description:
    "Build personalized race execution plans with power targets, pacing strategy, nutrition timing, and Garmin integration. Designed for gravel racing, mountain biking, and ultra-endurance cycling.",
};

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: "FinalClimb - Race Day Execution Plans for Gravel & MTB",
    template: "%s | FinalClimb",
  },
  description: siteConfig.description,
  keywords: [
    "gravel race planning",
    "cycling race pacing",
    "MTB race strategy",
    "cycling power targets",
    "race nutrition plan",
    "Garmin data field",
    "top tube sticker",
    "cycling crew logistics",
    "Unbound Gravel",
    "Mid South",
    "Leadville 100",
    "SBT GRVL",
    "endurance cycling",
  ],
  authors: [{ name: "FinalClimb" }],
  creator: "FinalClimb",
  publisher: "FinalClimb",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteConfig.url,
    siteName: siteConfig.name,
    title: "FinalClimb - Race Day Execution Plans for Gravel & MTB",
    description: siteConfig.description,
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "FinalClimb - Race planning for gravel and mountain bike racing",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "FinalClimb - Race Day Execution Plans for Gravel & MTB",
    description: siteConfig.description,
    images: ["/og-image.png"],
    creator: "@finalclimbapp",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: siteConfig.url,
  },
  category: "sports",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#102a43" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${plusJakarta.variable} ${jetbrainsMono.variable}`}
      suppressHydrationWarning
    >
      <body className="min-h-screen bg-background antialiased">
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>
        <Providers>{children}</Providers>
        <Toaster
          position="bottom-right"
          toastOptions={{
            classNames: {
              toast: "bg-card border-border text-foreground",
              title: "text-foreground font-medium",
              description: "text-muted-foreground",
              success: "border-success",
              error: "border-error",
              warning: "border-warning",
            },
          }}
        />
      </body>
    </html>
  );
}
