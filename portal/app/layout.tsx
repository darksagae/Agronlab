import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AmplifyProvider } from '../components/AmplifyProvider';
import { QueryClientProvider } from '../components/QueryClientProvider';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'AGRON Portal — Merchant Dashboard',
  description: 'Manage your agricultural store and connect with buyers and sellers',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AmplifyProvider>
          <QueryClientProvider>
            {children}
          </QueryClientProvider>
        </AmplifyProvider>
      </body>
    </html>
  );
}
