import type { Metadata } from 'next';
import { Cormorant_Garamond, Space_Mono, DM_Serif_Display, DM_Sans } from 'next/font/google';
import './globals.css';
import { AmplifyProvider } from '../components/AmplifyProvider';

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['300', '400', '600'],
  style: ['normal', 'italic'],
  variable: '--font-cormorant',
  display: 'swap',
});
const spaceMono = Space_Mono({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-space-mono',
  display: 'swap',
});
const dmSerif = DM_Serif_Display({
  subsets: ['latin'],
  weight: ['400'],
  style: ['normal', 'italic'],
  variable: '--font-dm-serif',
  display: 'swap',
});
const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500'],
  variable: '--font-dm-sans',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Agron Coffee — Single Origin. Total Transparency.',
  description: 'From the highland farms of Yirgacheffe to your cup — nothing hidden, nothing compromised.',
  icons: {
    icon: '/agron-logo.png',
    apple: '/agron-logo.png',
  },
  openGraph: {
    title: 'Agron Coffee',
    description: 'Single Origin. Total Transparency.',
    images: [{ url: '/agron-logo.png', width: 512, height: 512, alt: 'Agron Coffee' }],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${cormorant.variable} ${spaceMono.variable} ${dmSerif.variable} ${dmSans.variable}`}>
        <AmplifyProvider>
          {children}
        </AmplifyProvider>
      </body>
    </html>
  );
}
