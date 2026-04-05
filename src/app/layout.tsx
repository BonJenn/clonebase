import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Clonebase — Build Software with Words',
  description: 'Describe the app you want in plain English. AI builds it in seconds with real data, authentication, and a live URL. No coding required.',
  openGraph: {
    title: 'Clonebase — Build Software with Words',
    description: 'Describe the app you want in plain English. AI builds it in seconds.',
    url: 'https://clonebase.app',
    siteName: 'Clonebase',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Clonebase — Build Software with Words',
    description: 'Describe the app you want in plain English. AI builds it in seconds.',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-gray-50 text-gray-900">{children}</body>
    </html>
  );
}
