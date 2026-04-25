import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AppShell } from '@/components/AppShell';
import { SmoothScroll } from '@/components/SmoothScroll';
import { AmplifyProvider } from '@/components/AmplifyProvider';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });

export const metadata: Metadata = {
  title: 'AGRON — AI Crop Intelligence',
  description: 'Detect crop disease with AI, trade globally, access the agricultural store. Available in 50+ languages for farmers worldwide.',
  keywords: ['agriculture', 'AI', 'crop disease', 'marketplace', 'store', 'Agron AI'],
  icons: {
    icon: '/logo.png',
    apple: '/logo.png',
  },
  openGraph: {
    title: 'AGRON',
    description: 'AI Crop Intelligence for the World',
    siteName: 'AGRON',
    images: [{ url: '/logo.png', width: 512, height: 512, alt: 'AGRON' }],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body>
        <AmplifyProvider>
          <SmoothScroll>
            <AppShell>{children}</AppShell>
          </SmoothScroll>
        </AmplifyProvider>
      </body>
    </html>
  );
}
