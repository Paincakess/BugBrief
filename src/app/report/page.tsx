'use client';

import { useActionState, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { submitReport } from './actions';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { FileText, Database, Lock, Copy, Check, Maximize2, Minimize2, ZoomIn, ZoomOut, Sparkles, Calculator } from 'lucide-react';
import { useRouter } from 'next/navigation';
import clsx from 'clsx';
import dynamic from 'next/dynamic';

const CVSSCalculator = dynamic(() => import('@/components/CVSSCalculator'), { ssr: false });

function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <button type="submit" disabled={pending} className="btn btn-primary w-full h-12 text-base shadow-lg shadow-blue-900/20">
            {pending ? 'Analyzing & Drafting...' : 'Generate Professional Report'}
        </button>
    );
}

export default function ReportPage() {
    const [state, formAction] = useActionState(submitReport, { result: '', error: '' });
    const [mode, setMode] = useState<'poc' | 'def'>('poc');
    const [copied, setCopied] = useState(false);
    const [isFullScreen, setIsFullScreen] = useState(false);
    const [fontSize, setFontSize] = useState(1); // 1 = normal, 1.25 = large, etc.
    const [vulName, setVulName] = useState(''); // Track vulnerability name for Explainer
    const [showCVSS, setShowCVSS] = useState(false);
    const router = useRouter();

    const handleApplyCVSS = (score: number, severity: string, vector: string) => {
        // Update the CVSS section in the report
        if (state.result) {
            const cvssLine = `**${score.toFixed(1)}** | **${severity}**`;
            // Replace existing CVSS line
            const updatedResult = state.result.replace(
                /\*\*[\d.]+\*\* \| \*\*(None|Low|Medium|High|Critical)\*\*/,
                cvssLine
            );
            // Note: Since state.result is from useActionState, we'd need a different approach
            // For now, copy to clipboard with updated CVSS
            navigator.clipboard.writeText(updatedResult);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
        setShowCVSS(false);
    };

    const handleExplain = () => {
        if (!state.result) return;

        // Extract title from the first H1 heading in the report, or use tracked vulName
        const titleMatch = state.result.match(/^#\s+(.+)$/m);
        const title = titleMatch ? titleMatch[1].trim() : (vulName || "Vulnerability Report");
        const query = encodeURIComponent(title);

        // context: Use summary heuristic (first p after Description)
        let summary = "";
        const descP = state.result.match(/Description\s*\n+([^\n]+)/i);
        if (descP && descP[1]) {
            summary = descP[1].substring(0, 255);
        } else {
            summary = state.result.substring(0, 200).replace(/[#*]/g, '').trim();
        }
        const context = encodeURIComponent(summary);

        // description: Extract Description and Impact (now uses ## headings)
        let description = state.result || '';
        const descMatch = state.result?.match(/(##\s*Description[\s\S]*?)(##\s*Steps of Reproduction|##\s*Recommendation|$)/i);
        if (descMatch && descMatch[1]) {
            description = descMatch[1].trim();
        }
        const encodedDescription = encodeURIComponent(description);

        // Use SessionStorage to avoid URL length limits and cleaner logs
        sessionStorage.setItem('explainerData', JSON.stringify({
            query: title,
            context: summary,
            description: description
        }));

        window.open('/explainer', '_blank');
    };

    const copyToClipboard = () => {
        if (state.result) {
            navigator.clipboard.writeText(state.result);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    return (
        <>
            <div className={clsx(
                "grid gap-8 h-[calc(100vh-220px)] transition-all ease-in-out duration-300",
                isFullScreen ? "grid-cols-1" : "grid-cols-1 lg:grid-cols-2"
            )}>
                {/* Input Section - Hidden when full screen */}
                {!isFullScreen && (
                    <div className="space-y-6 overflow-y-auto pr-2">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-2xl font-bold mb-1">Report Generator</h2>
                                <p className="text-[var(--muted)]">Consultant-grade documentation.</p>
                            </div>

                            <div className="flex bg-[var(--card-bg)] p-1 rounded-lg border border-[var(--card-border)]">
                                <button
                                    onClick={() => setMode('poc')}
                                    className={clsx(
                                        "px-4 py-2 text-sm font-medium rounded-md transition-all",
                                        mode === 'poc' ? "bg-[var(--primary)] text-white shadow" : "text-[var(--muted)] hover:text-white"
                                    )}
                                >
                                    Batch POC Upload
                                </button>
                                <button
                                    onClick={() => setMode('def')}
                                    className={clsx(
                                        "px-4 py-2 text-sm font-medium rounded-md transition-all",
                                        mode === 'def' ? "bg-[var(--primary)] text-white shadow" : "text-[var(--muted)] hover:text-white"
                                    )}
                                >
                                    Short Description
                                </button>
                            </div>
                        </div>

                        <form action={formAction} className="space-y-6">
                            <input type="hidden" name="mode" value={mode} />

                            {mode === 'poc' ? (
                                <div className="space-y-2">
                                    <label className="label flex items-center gap-2">
                                        <Database size={14} />
                                        Paste Raw Logs / Requests / CLI Output
                                    </label>
                                    <div className="relative">
                                        <textarea
                                            name="pocContent"
                                            placeholder="POST /api/v1/auth/reset HTTP/1.1..."
                                            className="textarea h-[400px] font-mono text-sm leading-relaxed custom-scrollbar"
                                        />
                                        <div className="absolute bottom-4 right-4 text-xs bg-black/50 px-2 py-1 rounded text-[var(--muted)] border border-[var(--card-border)] flex items-center gap-1">
                                            <Lock size={10} />
                                            Auto-sanitized locally
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div className="space-y-2">
                                        <label className="label">Vulnerability Name</label>
                                        <input
                                            name="vulName"
                                            className="input"
                                            placeholder="e.g. IDOR in Order Processing"
                                            required={mode === 'def'}
                                            value={vulName}
                                            onChange={(e) => setVulName(e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="label">Abuse Explanation</label>
                                        <textarea
                                            name="abuse"
                                            className="textarea h-64"
                                            placeholder="Describe how an attacker exploits this..."
                                            required={mode === 'def'}
                                        />
                                    </div>
                                </>
                            )}

                            <SubmitButton />

                            {state.error && (
                                <div className="p-4 rounded bg-red-900/20 border border-red-900 text-red-200 text-sm">
                                    {state.error}
                                </div>
                            )}
                        </form>
                    </div>
                )}

                {/* Output Section */}
                <div className="flex flex-col h-full bg-[#050505] border border-[var(--card-border)] rounded-xl overflow-hidden shadow-2xl">
                    <div className="p-4 border-b border-[var(--card-border)] flex items-center justify-between bg-[#0a0a0a]">
                        <h3 className="font-mono text-sm text-[var(--muted)] flex items-center gap-2">
                            <FileText size={14} />
                            REPORT_DRAFT.md
                        </h3>

                        <div className="flex items-center gap-2">
                            <div className="flex items-center bg-[#151515] rounded border border-[var(--card-border)] mr-2">
                                <button onClick={() => setFontSize(Math.max(0.8, fontSize - 0.1))} className="p-1.5 hover:text-white text-[var(--muted)] transition-colors"><ZoomOut size={14} /></button>
                                <span className="text-xs px-1 min-w-[3ch] text-center text-[var(--muted)]">{Math.round(fontSize * 100)}%</span>
                                <button onClick={() => setFontSize(Math.min(2, fontSize + 0.1))} className="p-1.5 hover:text-white text-[var(--muted)] transition-colors"><ZoomIn size={14} /></button>
                            </div>

                            <button
                                onClick={() => setIsFullScreen(!isFullScreen)}
                                className="p-1.5 hover:text-white text-[var(--muted)] transition-colors bg-[#151515] rounded border border-[var(--card-border)] mr-2"
                                title={isFullScreen ? "Exit Fullscreen" : "Fullscreen"}
                            >
                                {isFullScreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
                            </button>

                            {state.result && (
                                <>
                                    <button
                                        onClick={() => setShowCVSS(true)}
                                        className="p-1.5 hover:text-white text-[var(--muted)] transition-colors bg-[#151515] rounded border border-[var(--card-border)] mr-2"
                                        title="CVSS Calculator"
                                    >
                                        <Calculator size={14} />
                                    </button>
                                    <button
                                        onClick={handleExplain}
                                        className="p-1.5 hover:text-white text-[var(--muted)] transition-colors bg-[#151515] rounded border border-[var(--card-border)] mr-2"
                                        title="Explain This"
                                    >
                                        <Sparkles size={14} />
                                    </button>
                                    <button
                                        onClick={copyToClipboard}
                                        className="flex items-center gap-2 text-xs font-medium text-[var(--primary)] hover:text-white transition-colors border border-[var(--card-border)] bg-[#151515] px-3 py-1.5 rounded"
                                    >
                                        {copied ? <Check size={14} /> : <Copy size={14} />}
                                        {copied ? 'COPIED' : 'COPY'}
                                    </button>
                                </>
                            )}
                        </div>
                    </div>

                    <div className="flex-1 p-8 overflow-y-auto markdown-content transition-all" style={{ fontSize: `${fontSize}em` }}>
                        {state.result ? (
                            <div className="max-w-4xl mx-auto">
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                    {state.result}
                                </ReactMarkdown>
                            </div>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-[var(--muted)] opacity-50 space-y-4">
                                <FileText size={48} strokeWidth={1} />
                                <p>Generated report will appear here.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* CVSS Calculator Modal */}
            <CVSSCalculator
                isOpen={showCVSS}
                onClose={() => setShowCVSS(false)}
                onApply={handleApplyCVSS}
            />
        </>
    );
}
