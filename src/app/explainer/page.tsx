'use client';

import { useActionState, useState, Suspense, useEffect } from 'react';
import { useFormStatus } from 'react-dom';
import { submitExplainer } from './actions';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Shield, Key, Code, CheckCircle, Search, Copy, Check, Sparkles } from 'lucide-react';
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
        <button type="submit" disabled={pending} className="btn btn-primary w-full h-12 text-base shadow-lg shadow-blue-900/20">
            {pending ? 'Translating Vulnerability...' : 'Generate Explanation'}
        </button>
    );
}

export default function ExplainerPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
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
                    <h2 className="text-2xl font-bold mb-2">Detailed Input</h2>
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
                                    onClick={() => setSelectedRole(role.id as any)}
                                    className={clsx(
                                        "cursor-pointer p-3 rounded-lg border transition-all flex items-center gap-3",
                                        selectedRole === role.id
                                            ? "border-[var(--primary)] bg-[var(--primary)] text-white"
                                            : "border-[var(--card-border)] bg-[var(--card-bg)] hover:border-[var(--muted)]"
                                    )}
                                >
                                    <role.icon size={20} className={selectedRole === role.id ? "text-white" : "text-[var(--primary)]"} />
                                    <div className="flex-1">
                                        <div className="font-semibold text-sm">{role.label}</div>
                                        <div className={clsx("text-xs", selectedRole === role.id ? "text-blue-100" : "text-[var(--muted)]")}>
                                            {role.desc}
                                        </div>
                                    </div>
                                    {selectedRole === role.id && <CheckCircle size={16} />}
                                </div>
                            ))}
                        </div>
                    </div>

                    <SubmitButton />

                    {state.error && (
                        <div className="p-4 rounded bg-red-900/20 border border-red-900 text-red-200 text-sm">
                            {state.error}
                        </div>
                    )}
                </form>
            </div>

            {/* Output Section */}
            <div className="flex flex-col h-full bg-[#050505] border border-[var(--card-border)] rounded-xl overflow-hidden shadow-2xl relative">
                <div className="p-4 border-b border-[var(--card-border)] flex items-center justify-between bg-[#0a0a0a]">
                    <h3 className="font-mono text-sm text-[var(--muted)]">GENERATED_EXPLANATION.md</h3>
                    {state.result && (
                        <button
                            onClick={copyToClipboard}
                            className="flex items-center gap-2 text-xs font-medium text-[var(--primary)] hover:text-white transition-colors"
                        >
                            {copied ? <Check size={14} /> : <Copy size={14} />}
                            {copied ? 'COPIED' : 'COPY'}
                        </button>
                    )}
                </div>

                <div className="flex-1 p-6 overflow-y-auto markdown-content">
                    {state.result ? (
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {state.result}
                        </ReactMarkdown>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-[var(--muted)] opacity-50 space-y-4">
                            <Shield size={48} strokeWidth={1} />
                            <p>Select an audience and generate to see the explanation here.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
