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

export const metadata: Metadata = {
  title: {
    default: "FinalClimb - Race Planning for Cyclists",
    template: "%s | FinalClimb",
  },
  description:
    "Build personalized race execution plans with pacing, nutrition, gear management, and checkpoint strategies for gravel, road, MTB, and cyclocross racing.",
  keywords: [
    "gravel racing",
    "cycling",
    "race planning",
    "pacing",
    "nutrition",
    "endurance",
    "MTB",
    "road cycling",
    "cyclocross",
  ],
  authors: [{ name: "FinalClimb" }],
  creator: "FinalClimb",
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "FinalClimb",
    title: "FinalClimb - Race Planning for Cyclists",
    description:
      "Build personalized race execution plans with pacing, nutrition, gear management, and checkpoint strategies for gravel, road, MTB, and cyclocross racing.",
  },
  twitter: {
    card: "summary_large_image",
    title: "FinalClimb - Race Planning for Cyclists",
    description:
      "Build personalized race execution plans with pacing, nutrition, gear management, and checkpoint strategies for gravel, road, MTB, and cyclocross racing.",
  },
  robots: {
    index: true,
    follow: true,
  },
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
