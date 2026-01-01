'use client';

import { useActionState, useState, Suspense, useEffect } from 'react';
import { useFormStatus } from 'react-dom';
import { submitExplainer } from './actions';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Shield, Key, Code, CheckCircle, Search, Copy, Check, Sparkles, FileText } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import clsx from 'clsx';


const ROLES = [
    { id: 'BOD', label: 'Board of Directors', icon: Shield, desc: 'High-level risk & business impact' },
    { id: 'PM', label: 'Project Managers', icon: Key, desc: 'Timeline & compliance impact' },
    { id: 'DEV', label: 'Developers', icon: Code, desc: 'Root cause & validation logic' },
    { id: 'QA', label: 'QA / Testers', icon: CheckCircle, desc: 'Reproduction & test cases' },
    { id: 'NTP', label: 'Non-technical Person', icon: Search, desc: 'Simple language & analogies' },
] as const;

function SubmitButton() {
    const { pending } = useFormStatus();

    return (
        <button type="submit" disabled={pending} className="btn btn-primary w-full h-14 text-base shadow-lg shadow-blue-500/20 group">
            <Sparkles size={18} className={clsx("mr-2 transition-transform", pending && "animate-spin")} />
            {pending ? 'Translating Vulnerability...' : 'Generate Explanation'}
        </button>
    );
}

export default function ExplainerPage() {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="w-10 h-10 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
            </div>
        }>
            <ExplainerContent />
        </Suspense>
    );
}


function ExplainerContent() {
    const [state, formAction] = useActionState(submitExplainer, { result: '', error: '' });
    const [selectedRole, setSelectedRole] = useState(ROLES[0].id);
    const [copied, setCopied] = useState(false);
    const searchParams = useSearchParams();

    // State for inputs to allow both URL params and SessionStorage
    const [name, setName] = useState(searchParams.get('query') || '');
    const [summary, setSummary] = useState(searchParams.get('context') || '');
    const [description, setDescription] = useState(searchParams.get('description') || '');

    // Check SessionStorage on mount if URL params are missing
    useEffect(() => {
        const stored = sessionStorage.getItem('explainerData');
        if (stored) {
            try {
                const data = JSON.parse(stored);
                if (data.query && !name) setName(data.query);
                if (data.context && !summary) setSummary(data.context);
                if (data.description && !description) setDescription(data.description);

                // Clear it so it doesn't persist forever
                sessionStorage.removeItem('explainerData');
            } catch (e) {
                console.error("Failed to parse explainer data", e);
            }
        }
    }, []); // Run once on mount

    const copyToClipboard = () => {
        if (state.result) {
            navigator.clipboard.writeText(state.result);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-[calc(100vh-220px)]">
            {/* Input Section */}
            <div className="space-y-6 overflow-y-auto pr-2">
                <div>
                    <h2 className="text-2xl font-bold mb-2 bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                        Detailed Input
                    </h2>
                    <p className="text-[var(--muted)]">Provide the vulnerability context.</p>
                </div>

                <form action={formAction} className="space-y-6">
                    <div className="space-y-2">
                        <label htmlFor="name" className="label">Vulnerability Name</label>
                        <input
                            name="name"
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g. OTP Bypass via Response Manipulation"
                            className="input"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="summary" className="label">Brief Summary</label>
                        <textarea
                            name="summary"
                            id="summary"
                            value={summary}
                            onChange={(e) => setSummary(e.target.value)}
                            placeholder="e.g. The application relies on client-side status codes..."
                            className="textarea h-24 resize-none"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="description" className="label">Full Description (Optional)</label>
                        <textarea
                            name="description"
                            id="description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Paste raw findings or notes here..."
                            className="textarea h-32 resize-none"
                        />
                    </div>

                    <div className="space-y-3">
                        <label className="label">Target Audience</label>
                        <div className="grid grid-cols-1 gap-2">
                            <input type="hidden" name="audience" value={selectedRole} />
                            {ROLES.map((role) => (
                                <div
                                    key={role.id}
                                    onClick={() => setSelectedRole(role.id as typeof selectedRole)}
                                    className={clsx(
                                        "cursor-pointer p-4 rounded-xl border transition-all duration-300 flex items-center gap-4 group",
                                        selectedRole === role.id
                                            ? "border-blue-500/50 bg-gradient-to-r from-blue-500/15 to-purple-500/10 shadow-lg shadow-blue-500/10"
                                            : "border-white/[0.06] bg-white/[0.02] hover:border-white/[0.12] hover:bg-white/[0.04]"
                                    )}
                                >
                                    <div className={clsx(
                                        "w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-300",
                                        selectedRole === role.id
                                            ? "bg-blue-500/20 text-blue-400"
                                            : "bg-white/[0.04] text-[var(--muted)] group-hover:text-white"
                                    )}>
                                        <role.icon size={20} />
                                    </div>
                                    <div className="flex-1">
                                        <div className={clsx(
                                            "font-semibold text-sm transition-colors",
                                            selectedRole === role.id ? "text-white" : "text-gray-300"
                                        )}>
                                            {role.label}
                                        </div>
                                        <div className={clsx(
                                            "text-xs transition-colors",
                                            selectedRole === role.id ? "text-blue-300/70" : "text-[var(--muted)]"
                                        )}>
                                            {role.desc}
                                        </div>
                                    </div>
                                    {selectedRole === role.id && (
                                        <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center">
                                            <CheckCircle size={14} className="text-white" />
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    <SubmitButton />

                    {state.error && (
                        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-sm">
                            {state.error}
                        </div>
                    )}
                </form>
            </div>

            {/* Output Section */}
            <div className="flex flex-col h-full glass-card border border-white/[0.06] rounded-2xl overflow-hidden shadow-2xl relative">
                {/* Header */}
                <div className="px-5 py-4 border-b border-white/[0.06] flex items-center justify-between bg-white/[0.02]">
                    <h3 className="font-mono text-sm text-[var(--muted)] flex items-center gap-2">
                        <FileText size={14} className="text-blue-400" />
                        <span className={clsx(state.result && "text-white font-medium")}>
                            GENERATED_EXPLANATION.md
                        </span>
                    </h3>
                    {state.result && (
                        <button
                            onClick={copyToClipboard}
                            className={clsx(
                                "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-300",
                                copied
                                    ? "bg-green-500/15 text-green-400 border border-green-500/30"
                                    : "bg-white/[0.04] text-blue-400 hover:bg-white/[0.08] border border-white/[0.06]"
                            )}
                        >
                            {copied ? <Check size={12} /> : <Copy size={12} />}
                            {copied ? 'COPIED' : 'COPY'}
                        </button>
                    )}
                </div>

                {/* Content */}
                <div className="flex-1 p-6 overflow-y-auto markdown-content bg-[#050505]">
                    {state.result ? (
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {state.result}
                        </ReactMarkdown>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-[var(--muted)] space-y-6">
                            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500/10 to-purple-500/10 flex items-center justify-center border border-white/[0.04]">
                                <Shield size={36} strokeWidth={1.5} className="text-gray-600" />
                            </div>
                            <div className="text-center">
                                <p className="font-medium text-gray-500 mb-1">No explanation generated yet</p>
                                <p className="text-sm text-gray-600">Select an audience and generate to see the explanation here.</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
