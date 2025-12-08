import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import { FrappeClientProvider } from "@/providers/FrappeClientProvider";
import AuthProvider from "@/context/AuthContext";
import { Toaster } from "@/components/ui/toaster";
import I18nProvider from "@/components/I18nProvider";
import SplashWrapper from "@/components/SplashWrapper";
import QRCodeScanner from "@/components/QRCodeScanner";
import { GoogleTagManager } from "@next/third-parties/google"
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      {process.env.NEXT_GOOGLE_TAG_MANAGER && <GoogleTagManager gtmId={process.env.NEXT_GOOGLE_TAG_MANAGER} />}
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <I18nProvider>
          <FrappeClientProvider>
            <AuthProvider>
              <ThemeProvider>
                <SplashWrapper>
                  {children}
                </SplashWrapper>
                <QRCodeScanner />
                <Toaster />
              </ThemeProvider>
            </AuthProvider>
          </FrappeClientProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
