import type { Metadata } from "next";
import { Sora } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";
import { LanguageProvider } from "@/context/LanguageContext";

const sora = Sora({
  subsets: ["latin"],
  variable: "--font-sora",
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: 'BelPower Command Center',
    template: '%s · BelPower Command Center',
  },
  description:
    'Internal admin dashboard for BelPower — monitor platform health, manage users, and operate BuyPower services.',
  applicationName: 'BelPower Command Center',
  keywords: [
    'BelPower',
    'BuyPower',
    'admin',
    'command center',
    'utilities',
    'Nigeria',
  ],
  robots: {
    index: false,
    follow: false,
  },
  icons: {
    icon: [
      { url: '/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-256x256.png', sizes: '256x256', type: 'image/png' },
    ],
    apple: [{ url: '/icon-192x192.png', sizes: '192x192', type: 'image/png' }],
  },
  openGraph: {
    title: 'BelPower Command Center',
    description:
      'Internal admin dashboard for BelPower platform operations and customer support.',
    siteName: 'BelPower Command Center',
    type: 'website',
    locale: 'en_NG',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${sora.variable} h-full antialiased`}>
      <body className={`${sora.className} min-h-full flex flex-col`}>
        <LanguageProvider>
          {children}
          <Toaster richColors position="top-right" closeButton />
        </LanguageProvider>
      </body>
    </html>
  );
}
