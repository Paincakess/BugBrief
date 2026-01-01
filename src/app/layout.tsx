import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import clsx from 'clsx';
import { Navigation } from './Navigation';

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
          {/* Enhanced Header */}
          <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-[#030303]/80 backdrop-blur-2xl mb-8 py-5">
            <div className="container flex items-center justify-between">
              {/* Logo with glow effect */}
              <a href="/" className="group flex items-center gap-1">
                <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-0.5 transition-all duration-300 group-hover:scale-[1.02]">
                  <span className="bg-gradient-to-r from-blue-400 via-blue-500 to-purple-500 bg-clip-text text-transparent drop-shadow-[0_0_20px_rgba(59,130,246,0.3)]">Bug</span>
                  <span className="text-white">Brief</span>
                </h1>
              </a>

              {/* Navigation with active state */}
              <Navigation />
            </div>
          </header>

          <main className="flex-1 container pb-8">
            {children}
          </main>

          {/* Enhanced Footer */}
          <footer className="relative border-t border-white/[0.04] p-6 text-center">
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />
            <div className="flex items-center justify-center gap-3 text-xs text-[var(--muted)]">
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                Local-First
              </span>
              <span className="text-white/10">•</span>
              <span>Offline-Ready</span>
              <span className="text-white/10">•</span>
              <span className="flex items-center gap-1.5">
                <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent font-medium">Gemini</span>
                Powered
              </span>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
