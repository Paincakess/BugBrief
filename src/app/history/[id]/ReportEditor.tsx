'use client';

import { useState } from 'react';
import { updateReport } from '../actions';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, Sparkles, Edit3, Calculator } from 'lucide-react';
import dynamic from 'next/dynamic';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

const MySwal = withReactContent(Swal);

// Dynamic imports to avoid SSR issues
const WysiwygEditor = dynamic(() => import('@/components/WysiwygEditor'), {
    ssr: false,
    loading: () => <div className="flex-1 flex items-center justify-center text-[var(--muted)]">Loading editor...</div>
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
            background: '#1a1a1a',
            color: '#fff'
        });

        router.refresh();
    };

    const handleApplyCVSS = (score: number, severity: string, vector: string) => {
        // Update the CVSS section in the report content
        const cvssLine = `**${score.toFixed(1)}** | **${severity}**`;
        const updatedContent = content.replace(
            /\*\*[\d.]+\*\* \| \*\*(None|Low|Medium|High|Critical)\*\*/,
            cvssLine
        );
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
                <div className="flex items-center justify-between mb-6 pb-6 border-b border-[var(--card-border)] flex-shrink-0">
                    <div className="flex items-center gap-4">
                        <button onClick={() => router.back()} className="p-2 hover:bg-[var(--card-bg)] rounded-full text-[var(--muted)] hover:text-white transition-colors">
                            <ArrowLeft size={20} />
                        </button>
                        <div>
                            <h1 className="text-2xl font-bold">{initialReport.title}</h1>
                            <p className="text-sm text-[var(--muted)]">Last updated: {new Date(initialReport.updatedAt).toLocaleDateString()} • {initialReport.mode === 'poc' ? 'POC Mode' : 'Definition Mode'}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setShowCVSS(true)}
                            className="flex items-center gap-2 px-3 py-2 bg-orange-900/20 text-orange-300 border border-orange-900/50 rounded-lg hover:bg-orange-900/40 transition-colors"
                            title="CVSS Calculator"
                        >
                            <Calculator size={16} />
                        </button>
                        <button
                            onClick={handleExplain}
                            className="flex items-center gap-2 px-3 py-2 bg-purple-900/20 text-purple-300 border border-purple-900/50 rounded-lg hover:bg-purple-900/40 transition-colors"
                        >
                            <Sparkles size={16} /> Explain
                        </button>
                        {isEditing ? (
                            <>
                                <button onClick={() => { setIsEditing(false); setContent(initialReport.content); }} className="px-4 py-2 text-[var(--muted)] hover:text-white transition-colors">Cancel</button>
                                <button
                                    onClick={handleSave}
                                    disabled={isSaving}
                                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors"
                                >
                                    <Save size={16} /> {isSaving ? 'Saving...' : 'Save'}
                                </button>
                            </>
                        ) : (
                            <button
                                onClick={() => setIsEditing(true)}
                                className="flex items-center gap-2 px-4 py-2 bg-[#1a1a1a] border border-[var(--card-border)] rounded-lg hover:bg-[#252525] transition-colors"
                            >
                                <Edit3 size={16} /> Edit
                            </button>
                        )}
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-hidden min-h-0 bg-[#050505] border border-[var(--card-border)] rounded-xl">
                    {isEditing ? (
                        <WysiwygEditor
                            content={content}
                            onChange={setContent}
                            editable={true}
                        />
                    ) : (
                        <div className="h-full overflow-y-auto p-8 markdown-content">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                {content}
                            </ReactMarkdown>
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
