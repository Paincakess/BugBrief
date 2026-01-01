import Link from 'next/link';
import { ArrowRight, ShieldAlert, FileText, Lock, Zap, History } from 'lucide-react';

export default function Home() {
  return (
    <div className="max-w-5xl mx-auto space-y-16">
      {/* Hero Section */}
      <section className="text-center space-y-6 pt-8 relative">
        {/* Ambient background glow */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-gradient-to-b from-blue-500/15 via-purple-500/10 to-transparent blur-3xl" />
          <div className="absolute top-20 left-1/4 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute top-32 right-1/4 w-24 h-24 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        </div>

        {/* Badge */}
        <div className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 text-sm text-blue-400 animate-float">
          <Zap size={14} className="text-blue-400" />
          <span className="font-medium">Local-first AI toolkit for security professionals</span>
        </div>

        {/* Main Headline */}
        <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.1]">
          <span className="bg-gradient-to-r from-white via-white to-gray-400 bg-clip-text text-transparent">VAPT Documentation</span>
          <br />
          <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent animate-gradient bg-[length:200%_200%]">Simplified.</span>
        </h1>

        {/* Subheading */}
        <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
          Translate technical vulnerabilities for executives, generate consultant-grade reports,
          and explain complex attacks in seconds.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-6">
          <Link href="/report" className="btn btn-primary px-8 py-3.5 text-base group">
            <span>Get Started</span>
            <ArrowRight size={18} className="ml-2 group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link href="/history" className="btn btn-secondary px-8 py-3.5 text-base">
            View History
          </Link>
        </div>
      </section>

      {/* Feature Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <FeatureCard
          href="/explainer"
          icon={ShieldAlert}
          title="Explainer"
          description="Translate attacks into audience-specific language for BODs, PMs, or Devs."
          color="blue"
        />

        <FeatureCard
          href="/report"
          icon={FileText}
          title="Report Gen"
          description="Generate consultant-grade markdown reports from logs or definitions."
          color="purple"
        />

        <FeatureCard
          href="/history"
          icon={History}
          title="History"
          description="Browse, edit, and manage all your saved vulnerability reports."
          color="green"
        />
      </div>

      {/* Trust Badge */}
      <div className="text-center pb-8">
        <div className="inline-flex items-center gap-3 px-6 py-3.5 rounded-full glass-card border border-white/[0.06] text-sm text-gray-400 animate-float" style={{ animationDelay: '0.5s' }}>
          <span className="flex items-center justify-center w-6 h-6 rounded-full bg-green-500/10 border border-green-500/20">
            <Lock size={12} className="text-green-400" />
          </span>
          <span>Data stays local. No cloud uploads. No training on your inputs.</span>
        </div>
      </div>
    </div>
  );
}

function FeatureCard({
  href,
  icon: Icon,
  title,
  description,
  color,
}: {
  href: string;
  icon: React.ComponentType<{ size?: number }>;
  title: string;
  description: string;
  color: 'blue' | 'purple' | 'green';
}) {
  const colorClasses = {
    blue: {
      border: 'hover:border-blue-500/40',
      iconBg: 'bg-gradient-to-br from-blue-500/20 to-blue-500/5',
      iconText: 'text-blue-400',
      arrow: 'text-blue-400',
      glow: 'group-hover:shadow-[0_0_40px_-10px_rgba(59,130,246,0.4)]',
    },
    purple: {
      border: 'hover:border-purple-500/40',
      iconBg: 'bg-gradient-to-br from-purple-500/20 to-purple-500/5',
      iconText: 'text-purple-400',
      arrow: 'text-purple-400',
      glow: 'group-hover:shadow-[0_0_40px_-10px_rgba(139,92,246,0.4)]',
    },
    green: {
      border: 'hover:border-green-500/40',
      iconBg: 'bg-gradient-to-br from-green-500/20 to-green-500/5',
      iconText: 'text-green-400',
      arrow: 'text-green-400',
      glow: 'group-hover:shadow-[0_0_40px_-10px_rgba(16,185,129,0.4)]',
    },
  };

  const classes = colorClasses[color];

  return (
    <Link href={href} className="group">
      <div className={`card h-full p-6 space-y-4 ${classes.border} ${classes.glow} transition-all duration-500`}>
        {/* Icon */}
        <div className={`w-12 h-12 rounded-xl ${classes.iconBg} flex items-center justify-center ${classes.iconText} group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg`}>
          <Icon size={24} />
        </div>

        {/* Title */}
        <h2 className="text-xl font-bold flex items-center gap-2 group-hover:text-white transition-colors">
          {title}
          <ArrowRight size={16} className={`opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 ${classes.arrow}`} />
        </h2>

        {/* Description */}
        <p className="text-gray-500 text-sm leading-relaxed group-hover:text-gray-400 transition-colors">
          {description}
        </p>
      </div>
    </Link>
  );
}
