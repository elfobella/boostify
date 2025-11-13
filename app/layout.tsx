import type { Metadata } from "next";
import { Inter, Geist_Mono } from "next/font/google";
import "./globals.css";
import { CurrencyProvider, LocaleProvider, LoginModalProvider } from "@/contexts";
import { SessionProvider } from "@/app/components/auth/SessionProvider";
import { GlobalLoginModal } from "@/app/components/auth/GlobalLoginModal";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
  weight: ["300", "400", "500", "600", "700", "800"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Atlas Boost",
  description: "Professional gaming boosting services",
  icons: {
    icon: [
      { url: '/icon.png', type: 'image/png' },
      { url: '/logo.png', type: 'image/png', sizes: '32x32' },
      { url: '/logo.png', type: 'image/png', sizes: '16x16' },
    ],
    apple: [
      { url: '/icon.png', type: 'image/png', sizes: '180x180' },
    ],
    shortcut: '/icon.png',
  },
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Atlas Boost',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${geistMono.variable} antialiased dark`}
      >
        <SessionProvider>
          <CurrencyProvider>
            <LocaleProvider>
              <LoginModalProvider>
              {children}
                <GlobalLoginModal />
              </LoginModalProvider>
            </LocaleProvider>
          </CurrencyProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
