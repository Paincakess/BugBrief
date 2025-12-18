import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import Link from 'next/link';
import './globals.css';
import clsx from 'clsx';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });
const jetbrainsMono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono' });

export const metadata: Metadata = {
  title: 'BugBrief | VAPT Documentation Toolkit',
  description: 'Local-first vulnerability documentation and reporting for security professionals.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={clsx(inter.variable, jetbrainsMono.variable, "antialiased")}>
        <div className="min-h-screen bg-[var(--background)] flex flex-col">
          <header className="sticky top-0 z-50 border-b border-[#1a1a1a] bg-[#030303]/90 backdrop-blur-xl mb-8 py-6 min-h-20">
            <div className="container flex items-center justify-between">
              <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-1">
                <span className="bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">Bug</span>
                <span className="text-white">Brief</span>
              </h1>
              <nav className="flex items-center gap-1">
                <Link href="/" className="px-4 py-2 rounded-lg text-sm font-medium text-gray-400 hover:text-white hover:bg-white/5 transition-all">Home</Link>
                <Link href="/explainer" className="px-4 py-2 rounded-lg text-sm font-medium text-gray-400 hover:text-white hover:bg-white/5 transition-all">Explainer</Link>
                <Link href="/report" className="px-4 py-2 rounded-lg text-sm font-medium text-gray-400 hover:text-white hover:bg-white/5 transition-all">Report Gen</Link>
                <Link href="/history" className="px-4 py-2 rounded-lg text-sm font-medium text-gray-400 hover:text-white hover:bg-white/5 transition-all">History</Link>
              </nav>
            </div>
          </header>
          <main className="flex-1 container pb-8">
            {children}
          </main>
          <footer className="border-t border-[var(--card-border)] p-6 text-center text-xs text-[var(--muted)]">
            Local-First • Offline-Ready • Gemini Powered
          </footer>
        </div>
      </body>
    </html>
  );
}
