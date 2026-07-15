import type { Metadata } from 'next';
import { JetBrains_Mono } from 'next/font/google';
import './globals.css';
import Nav from './components/ui/Nav';
import { Sidebar } from './components/repo/Sidebar';
import { StoreSync } from './store/StoreSync';
import { AuthGate } from './components/auth/AuthGate';

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Sentra — Codebase Intelligence',
  description: 'Ask anything about any GitHub repository.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang='en' className={jetbrainsMono.variable}>
      <body className='antialiased'>
        <StoreSync />
        <AuthGate>
          <div className='flex flex-col h-screen'>
            <Nav />
            <div className='flex flex-1 min-h-0 overflow-hidden'>
              <Sidebar />
              <div className='flex-1 min-h-0 overflow-hidden'>{children}</div>
            </div>
          </div>
        </AuthGate>
      </body>
    </html>
  );
}
