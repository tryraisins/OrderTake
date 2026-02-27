import type { Metadata } from "next";
import { DM_Sans, Outfit, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import { Navbar } from "@/components/Navbar";
import { AnimatedBackground } from "@/components/AnimatedBackground";
import { Toaster } from "@/components/ui/sonner";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  display: "swap",
});

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "TGIF Food Cost Manager",
    template: "%s | TGIF Food Cost",
  },
  description: "Track and manage food order costs with automated CSV imports, discount calculations, and historical data analysis. Built for Nubiaville team food ordering.",
  keywords: ["food cost", "order management", "CSV import", "cost calculator", "TGIF"],
  authors: [{ name: "Nubiaville" }],
  openGraph: {
    title: "TGIF Food Cost Manager",
    description: "Track and manage food order costs with automated CSV imports and discount calculations.",
    type: "website",
    locale: "en_US",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${dmSans.variable} ${outfit.variable} ${jetbrainsMono.variable} font-sans antialiased min-h-screen relative`}
        style={{ fontFamily: 'var(--font-dm-sans), system-ui, sans-serif' }}
      >
        <ThemeProvider>
          <AnimatedBackground />
          <Navbar />
          <main className="pt-24 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto relative z-10">
            {children}
          </main>
          <Toaster
            position="bottom-right"
            toastOptions={{
              className: 'glass',
            }}
          />
        </ThemeProvider>
      </body>
    </html>
  );
}
