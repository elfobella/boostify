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
  title: "Boostify",
  description: "Modern Next.js application with dark mode",
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
