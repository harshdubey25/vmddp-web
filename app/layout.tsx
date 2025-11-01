import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import { FrappeClientProvider } from "@/providers/FrappeClientProvider";
import AuthProvider from "@/context/AuthContext";
import { Toaster } from "@/components/ui/toaster";
import I18nProvider from "@/components/I18nProvider";
import SplashWrapper from "@/components/SplashWrapper";
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "VMDDP",
  description: "Vidharbha Marathwada Dairy Development Programe",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Fetch splash screen config from our API route
  let showSplash = false;
  let inaugurationDate = null;

  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/site-config`, {
      cache: 'no-store' // Always fetch fresh data
    });
    if (response.ok) {
      const data = await response.json();
      showSplash = data.showSplash;
      inaugurationDate = data.inaugurationDate;
    }
  } catch (error) {
    console.error('Error fetching splash config:', error);
    // Default to false if there's an error
  }

  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <I18nProvider>
          <FrappeClientProvider>
            <AuthProvider>
              <ThemeProvider>
                <SplashWrapper
                  initialShowSplash={showSplash}
                  inaugurationDate={inaugurationDate}
                >
                  {children}
                </SplashWrapper>
                <Toaster />
              </ThemeProvider>
            </AuthProvider>
          </FrappeClientProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
