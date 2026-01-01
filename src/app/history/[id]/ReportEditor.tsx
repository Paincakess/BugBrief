'use client';

import { useState } from 'react';
import { updateReport } from '../actions';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, Sparkles, Edit3, Calculator, FileText } from 'lucide-react';
import dynamic from 'next/dynamic';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import clsx from 'clsx';

const MySwal = withReactContent(Swal);

// Dynamic imports to avoid SSR issues
const WysiwygEditor = dynamic(() => import('@/components/WysiwygEditor'), {
    ssr: false,
    loading: () => (
        <div className="flex-1 flex items-center justify-center text-[var(--muted)]">
            <div className="flex flex-col items-center gap-4">
                <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
                <span className="text-sm">Loading editor...</span>
            </div>
        </div>
    )
});

const CVSSCalculator = dynamic(() => import('@/components/CVSSCalculator'), { ssr: false });

export default function ReportEditor({ initialReport }: { initialReport: any }) {
    const [content, setContent] = useState(initialReport.content);
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [showCVSS, setShowCVSS] = useState(false);
    const router = useRouter();

    const handleSave = async () => {
        setIsSaving(true);
        await updateReport(initialReport.id, content);
        setIsSaving(false);
        setIsEditing(false);

        // Show success toast
        MySwal.fire({
            title: 'Saved!',
            text: 'Report changes saved successfully.',
            icon: 'success',
            timer: 1500,
            showConfirmButton: false,
            background: '#0a0a0a',
            color: '#fff',
            customClass: {
                popup: 'border border-white/10 rounded-2xl',
            }
        });

        router.refresh();
    };

    const handleApplyCVSS = (score: number, severity: string, vector: string) => {
        // Update the CVSS section in the report content
        const newCVSS = `**${score.toFixed(1)} | ${severity}**`;

        // Try multiple patterns to find and replace CVSS score
        const patterns = [
            /\*\*[\d.]+\s*\|\s*(?:None|Low|Medium|High|Critical)\*\*/i,
            /\*\*[\d.]+\*\*\s*\|\s*\*\*(?:None|Low|Medium|High|Critical)\*\*/i,
        ];

        let updatedContent = content;
        for (const pattern of patterns) {
            if (pattern.test(content)) {
                updatedContent = content.replace(pattern, newCVSS);
                break;
            }
        }

        setContent(updatedContent);
        setShowCVSS(false);
    };

    const handleExplain = () => {
        const query = encodeURIComponent(initialReport.title);
        const context = encodeURIComponent(initialReport.summary || '');

        let description = initialReport.content || '';
        const descMatch = initialReport.content?.match(/(##\s*Description[\s\S]*?)(##\s*Affected Endpoint|##\s*Recommendation|$)/i);
        if (descMatch && descMatch[1]) {
            description = descMatch[1].trim();
        }

        sessionStorage.setItem('explainerData', JSON.stringify({
            query: initialReport.title,
            context: initialReport.summary || '',
            description: description
        }));

        router.push('/explainer');
    };

    return (
        <>
            <div className="max-w-6xl mx-auto h-full min-h-[calc(100vh-220px)] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between mb-6 pb-6 border-b border-white/[0.06] flex-shrink-0">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => router.back()}
                            className="w-10 h-10 flex items-center justify-center rounded-xl glass-card border border-white/[0.06] text-[var(--muted)] hover:text-white hover:bg-white/[0.04] transition-all"
                        >
                            <ArrowLeft size={18} />
                        </button>
                        <div>
                            <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                                {initialReport.title}
                            </h1>
                            <p className="text-sm text-[var(--muted)] mt-1 flex items-center gap-2">
                                <span>Last updated: {new Date(initialReport.updatedAt).toLocaleDateString()}</span>
                                <span className="text-white/10">•</span>
                                <span className={clsx(
                                    "text-xs px-2 py-0.5 rounded-md border",
                                    initialReport.mode === 'poc'
                                        ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
                                        : "bg-purple-500/10 text-purple-400 border-purple-500/20"
                                )}>
                                    {initialReport.mode === 'poc' ? 'POC Mode' : 'Definition Mode'}
                                </span>
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setShowCVSS(true)}
                            className="flex items-center gap-2 px-4 py-2.5 glass-card border border-orange-500/20 text-orange-400 rounded-xl hover:bg-orange-500/10 transition-all duration-300"
                            title="CVSS Calculator"
                        >
                            <Calculator size={16} />
                        </button>
                        <button
                            onClick={handleExplain}
                            className="flex items-center gap-2 px-4 py-2.5 glass-card border border-purple-500/20 text-purple-400 rounded-xl hover:bg-purple-500/10 transition-all duration-300"
                        >
                            <Sparkles size={16} />
                            <span className="font-medium text-sm">Explain</span>
                        </button>
                        {isEditing ? (
                            <>
                                <button
                                    onClick={() => { setIsEditing(false); setContent(initialReport.content); }}
                                    className="px-4 py-2.5 text-[var(--muted)] hover:text-white transition-colors text-sm font-medium"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSave}
                                    disabled={isSaving}
                                    className="btn btn-primary px-5 py-2.5"
                                >
                                    <Save size={16} className="mr-2" />
                                    {isSaving ? 'Saving...' : 'Save'}
                                </button>
                            </>
                        ) : (
                            <button
                                onClick={() => setIsEditing(true)}
                                className="flex items-center gap-2 px-5 py-2.5 glass-card border border-white/[0.08] rounded-xl hover:bg-white/[0.04] transition-all duration-300 text-sm font-medium"
                            >
                                <Edit3 size={16} />
                                Edit
                            </button>
                        )}
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-hidden min-h-0 glass-card border border-white/[0.06] rounded-2xl">
                    {isEditing ? (
                        <WysiwygEditor
                            content={content}
                            onChange={setContent}
                            editable={true}
                        />
                    ) : (
                        <div className="h-full overflow-y-auto p-8 markdown-content bg-[#050505]">
                            <div className="max-w-4xl mx-auto text-justify">
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                    {content}
                                </ReactMarkdown>
                            </div>
                        </div>
                    )}
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
