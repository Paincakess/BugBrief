import Link from 'next/link';
import { ArrowRight, ShieldAlert, FileText, Lock, Sparkles, History, Zap } from 'lucide-react';

export default function Home() {
  return (
    <div className="max-w-5xl mx-auto space-y-16">
      {/* Hero Section */}
      <section className="text-center space-y-6 pt-8 relative">
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-blue-500/10 via-transparent to-transparent blur-3xl" />

        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-sm text-blue-400 mb-4">
          <Zap size={14} />
          <span>Local-first AI toolkit for security professionals</span>
        </div>

        <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight">
          <span className="bg-gradient-to-r from-white via-white to-gray-400 bg-clip-text text-transparent">VAPT Documentation</span>
          <br />
          <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">Simplified.</span>
        </h1>

        <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
          Translate technical vulnerabilities for executives, generate consultant-grade reports,
          and explain complex attacks in seconds.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <Link href="/report" className="btn btn-primary px-8 py-3 text-base">
            <span>Get Started</span>
            <ArrowRight size={18} className="ml-2" />
          </Link>
          <Link href="/history" className="btn btn-secondary px-8 py-3 text-base">
            View History
          </Link>
        </div>
      </section>

      {/* Feature Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link href="/explainer" className="group">
          <div className="card h-full p-6 space-y-4 hover:border-blue-500/50 transition-all">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-500/5 flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform">
              <ShieldAlert size={24} />
            </div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              Explainer
              <ArrowRight size={16} className="opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-blue-400" />
            </h2>
            <p className="text-gray-500 text-sm leading-relaxed">
              Translate attacks into audience-specific language for BODs, PMs, or Devs.
            </p>
          </div>
        </Link>

        <Link href="/report" className="group">
          <div className="card h-full p-6 space-y-4 hover:border-purple-500/50 transition-all">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/20 to-purple-500/5 flex items-center justify-center text-purple-400 group-hover:scale-110 transition-transform">
              <FileText size={24} />
            </div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              Report Gen
              <ArrowRight size={16} className="opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-purple-400" />
            </h2>
            <p className="text-gray-500 text-sm leading-relaxed">
              Generate consultant-grade markdown reports from logs or definitions.
            </p>
          </div>
        </Link>

        <Link href="/history" className="group">
          <div className="card h-full p-6 space-y-4 hover:border-green-500/50 transition-all">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500/20 to-green-500/5 flex items-center justify-center text-green-400 group-hover:scale-110 transition-transform">
              <History size={24} />
            </div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              History
              <ArrowRight size={16} className="opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-green-400" />
            </h2>
            <p className="text-gray-500 text-sm leading-relaxed">
              Browse, edit, and manage all your saved vulnerability reports.
            </p>
          </div>
        </Link>
      </div>

      {/* Trust Badge */}
      <div className="text-center pb-8">
        <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-[#0a0a0a] border border-[#1a1a1a] text-sm text-gray-500">
          <Lock size={14} className="text-green-500" />
          <span>Data stays local. No cloud uploads. No training on your inputs.</span>
        </div>
      </div>
    </div>
  );
}
