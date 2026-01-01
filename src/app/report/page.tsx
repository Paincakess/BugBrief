'use client';

import { useActionState, useState, useEffect } from 'react';
import { useFormStatus } from 'react-dom';
import { submitReport } from './actions';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { FileText, Database, Lock, Copy, Check, Maximize2, Minimize2, ZoomIn, ZoomOut, Sparkles, Calculator, AlertTriangle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import clsx from 'clsx';
import dynamic from 'next/dynamic';

import { saveReport } from './actions';
import { Save, Trash2, X, UploadCloud, Image as ImageIcon } from 'lucide-react';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import { useNavigationGuard } from '@/lib/useNavigationGuard';

const MySwal = withReactContent(Swal);

const CVSSCalculator = dynamic(() => import('@/components/CVSSCalculator'), { ssr: false });

// Simple hook for drag resizing
function useResizable(initialWidth = 50) {
    const [width, setWidth] = useState(initialWidth);
    const [isDragging, setIsDragging] = useState(false);

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isDragging) return;
            // Calculate percentage based on window width
            const newWidth = (e.clientX / window.innerWidth) * 100;
            if (newWidth > 20 && newWidth < 80) {
                setWidth(newWidth);
            }
        };
        const handleMouseUp = () => setIsDragging(false);

        if (isDragging) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
            document.body.style.cursor = 'col-resize';
            document.body.style.userSelect = 'none'; // Prevent text selection while dragging
        } else {
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
        }

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
        };
    }, [isDragging]);

    return { width, isDragging, startDrag: () => setIsDragging(true) };
}

function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <button type="submit" disabled={pending} className="btn btn-primary w-full h-14 text-base shadow-lg shadow-blue-500/20 group">
            <Sparkles size={18} className={clsx("mr-2 transition-transform", pending && "animate-spin")} />
            {pending ? 'Analyzing & Drafting...' : 'Generate Report'}
        </button>
    );
}


export default function ReportPage() {
    const [state, formAction] = useActionState(submitReport, { result: '', error: '' });

    // Layout State
    const { width: leftPanelWidth, isDragging, startDrag } = useResizable(50);

    // Local state for the draft content, initialized when state.result changes
    const [draftContent, setDraftContent] = useState('');
    const [pocMetadata, setPocMetadata] = useState<any>(null);
    const [isSaving, setIsSaving] = useState(false);

    const [mode, setMode] = useState<'poc' | 'def'>('poc');
    const [copied, setCopied] = useState(false);
    const [isFullScreen, setIsFullScreen] = useState(false);
    const [fontSize, setFontSize] = useState(1);

    const [vulName, setVulName] = useState('');
    const [showCVSS, setShowCVSS] = useState(false);

    // Image Upload State
    const [isDraggingFile, setIsDraggingFile] = useState(false);
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            validateAndSetFiles(Array.from(e.target.files));
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDraggingFile(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDraggingFile(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDraggingFile(false);
        if (e.dataTransfer.files) {
            validateAndSetFiles(Array.from(e.dataTransfer.files));
        }
    };

    const validateAndSetFiles = (files: File[]) => {
        const validFiles: File[] = [];
        const invalidFiles: string[] = [];

        files.forEach(file => {
            if (file.type === 'image/jpeg' || file.type === 'image/jpg' || file.type === 'image/png') {
                validFiles.push(file);
            } else {
                invalidFiles.push(file.name);
            }
        });

        if (invalidFiles.length > 0) {
            MySwal.fire({
                title: 'Invalid File Type',
                html: `The following files were rejected (only <b>.jpg, .jpeg, .png</b> allowed):<br/><br/><span class="text-red-400">${invalidFiles.join('<br/>')}</span>`,
                icon: 'error',
                background: '#0a0a0a',
                color: '#fff',
                customClass: {
                    popup: 'border border-white/10 rounded-2xl',
                }
            });
        }

        if (validFiles.length > 0) {
            // Append to existing files
            const allFiles = [...selectedFiles, ...validFiles];
            updateFileInput(allFiles);
        }
    };

    const updateFileInput = (files: File[]) => {
        const dataTransfer = new DataTransfer();
        files.forEach(file => dataTransfer.items.add(file));

        const fileInput = document.querySelector('input[name="pocImages"]') as HTMLInputElement;
        if (fileInput) {
            fileInput.files = dataTransfer.files;
            setSelectedFiles(files);
        }
    };

    const removeFile = (index: number) => {
        const newFiles = selectedFiles.filter((_, i) => i !== index);
        updateFileInput(newFiles);
    };

    const clearAllFiles = () => {
        updateFileInput([]);
    };

    // Warnings logic
    const router = useRouter();

    // Effect to SYNC server result to local draft
    // Track which server results we've already processed to avoid re-populating after save
    const [processedResults, setProcessedResults] = useState<Set<string>>(new Set());

    if (state.result && !processedResults.has(state.result)) {
        setDraftContent(state.result);
        setPocMetadata(state.metadata);
        setProcessedResults(prev => new Set(prev).add(state.result!));
    }



    const handleApplyCVSS = (score: number, severity: string, vector: string) => {
        if (draftContent) {
            const newCVSS = `**${score.toFixed(1)} | ${severity}**`;

            const sectionRegex = /(##\s*CVSS\s*3\.1\s*Base\s*Score\n+)([^\n#]+)/i;

            if (sectionRegex.test(draftContent)) {
                const updatedDraft = draftContent.replace(sectionRegex, `$1${newCVSS}`);
                setDraftContent(updatedDraft);
            } else {
                const fallbackRegex = /(\*\*\s*[\d.]+\s*\|\s*[A-Za-z]+\s*\*+)|(\*\*\s*[\d.]+\s*\*\*\s*\|\s*\*\*\s*[A-Za-z]+\s*\*+)/;

                if (fallbackRegex.test(draftContent)) {
                    setDraftContent(draftContent.replace(fallbackRegex, newCVSS));
                } else {
                    MySwal.fire({
                        title: 'Update Failed',
                        text: 'Could not automatically locate the CVSS score in the report. Please update it manually.',
                        icon: 'warning',
                        background: '#0a0a0a',
                        color: '#fff',
                        customClass: {
                            popup: 'border border-white/10 rounded-2xl',
                        }
                    });
                }
            }
        }
        setShowCVSS(false);
    };


    const handleSave = async () => {
        if (!draftContent || !pocMetadata) return;
        setIsSaving(true);
        try {
            const formData = new FormData();
            formData.append('content', draftContent);
            formData.append('metadata', JSON.stringify(pocMetadata));

            const result = await saveReport(formData);

            if (result.success) {
                MySwal.fire({
                    title: 'Report Saved!',
                    text: 'Your report has been securely saved to the database.',
                    icon: 'success',
                    timer: 2000,
                    showConfirmButton: false,
                    background: '#0a0a0a',
                    color: '#fff',
                    customClass: {
                        popup: 'border border-white/10 rounded-2xl',
                    }
                });

                setDraftContent('');
                setPocMetadata(null);
                router.refresh();
            } else {
                MySwal.fire({
                    title: 'Save Failed',
                    text: result.error || 'Unknown error occurred.',
                    icon: 'error',
                    background: '#0a0a0a',
                    color: '#fff',
                    customClass: {
                        popup: 'border border-white/10 rounded-2xl',
                    }
                });
            }

        } catch (e) {
            console.error(e);
            MySwal.fire({
                title: 'Error',
                text: 'An unexpected network error occurred.',
                icon: 'error',
                background: '#0a0a0a',
                color: '#fff',
                customClass: {
                    popup: 'border border-white/10 rounded-2xl',
                }
            });
        } finally {
            setIsSaving(false);
        }
    };

    // Navigation guard to prevent accidental data loss
    useNavigationGuard({
        hasUnsavedChanges: !!draftContent && !isSaving,
        onSave: async () => {
            if (!draftContent || !pocMetadata) return;
            setIsSaving(true);
            try {
                const formData = new FormData();
                formData.append('content', draftContent);
                formData.append('metadata', JSON.stringify(pocMetadata));
                await saveReport(formData);
                setDraftContent('');
                setPocMetadata(null);
            } finally {
                setIsSaving(false);
            }
        },
        onDiscard: () => {
            setDraftContent('');
            setPocMetadata(null);
        },
    });

    const handleDiscard = async () => {
        const result = await MySwal.fire({
            title: 'Discard Draft?',
            text: "You will lose all generated content. This action cannot be undone.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Yes, discard it!',
            background: '#0a0a0a',
            color: '#fff',
            customClass: {
                popup: 'border border-white/10 rounded-2xl',
            }
        });


        if (result.isConfirmed) {
            setDraftContent('');
            setPocMetadata(null);

            MySwal.fire({
                title: 'Discarded!',
                text: 'Draft has been discarded.',
                icon: 'success',
                timer: 1500,
                showConfirmButton: false,
                background: '#0a0a0a',
                color: '#fff',
                customClass: {
                    popup: 'border border-white/10 rounded-2xl',
                }
            });
        }
    };

    const handleExplain = () => {
        if (!draftContent) return;

        const titleMatch = draftContent.match(/^#\s+(.+)$/m);
        const title = titleMatch ? titleMatch[1].trim() : (vulName || "Vulnerability Report");

        const query = encodeURIComponent(title);
        let summary = "";
        const descP = draftContent.match(/Description\s*\n+([^\n]+)/i);
        if (descP && descP[1]) {
            summary = descP[1].substring(0, 255);
        } else {
            summary = draftContent.substring(0, 200).replace(/[#*]/g, '').trim();
        }

        let description = draftContent || '';
        const descMatch = draftContent?.match(/(##\s*Description[\s\S]*?)(##\s*Steps of Reproduction|##\s*Recommendation|$)/i);
        if (descMatch && descMatch[1]) {
            description = descMatch[1].trim();
        }

        sessionStorage.setItem('explainerData', JSON.stringify({
            query: title,
            context: summary,
            description: description
        }));

        window.open('/explainer', '_blank');
    };

    const copyToClipboard = () => {
        if (draftContent) {
            navigator.clipboard.writeText(draftContent);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };


    return (
        <>
            <div className={clsx(
                "flex h-[calc(100vh-220px)] transition-all ease-in-out duration-300 relative",
                isFullScreen ? "" : "gap-0"
            )}>
                {/* Input Panel */}
                {!isFullScreen && (
                    <div
                        style={{ width: `${leftPanelWidth}%` }}
                        className="h-full overflow-y-auto pr-4 pl-1 flex flex-col shrink-0 min-w-[320px] max-w-[80%]"
                    >
                        {/* Header and Mode Switcher */}
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h2 className="text-2xl font-bold mb-1 bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                                    Report Generator
                                </h2>
                                <p className="text-[var(--muted)] text-sm">Consultant-grade documentation.</p>
                            </div>

                            {/* Mode Toggle */}
                            <div className="flex glass-card p-1 rounded-xl border border-white/[0.06]">
                                <button
                                    onClick={() => setMode('poc')}
                                    className={clsx(
                                        "px-4 py-2.5 text-sm font-medium rounded-lg transition-all duration-300",
                                        mode === 'poc'
                                            ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/25"
                                            : "text-[var(--muted)] hover:text-white"
                                    )}
                                >
                                    Batch POC Upload
                                </button>
                                <button
                                    onClick={() => setMode('def')}
                                    className={clsx(
                                        "px-4 py-2.5 text-sm font-medium rounded-lg transition-all duration-300",
                                        mode === 'def'
                                            ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/25"
                                            : "text-[var(--muted)] hover:text-white"
                                    )}
                                >
                                    Short Description
                                </button>
                            </div>
                        </div>

                        <form action={formAction} className="space-y-6 flex-1">
                            <input type="hidden" name="mode" value={mode} />

                            {mode === 'poc' ? (
                                <div className="space-y-2">
                                    <label className="label flex items-center gap-2">
                                        <Database size={14} className="text-blue-400" />
                                        Paste Raw Logs / Requests / CLI Output
                                    </label>
                                    <div className="relative">
                                        <textarea
                                            name="pocContent"
                                            placeholder="POST /api/v1/auth/reset HTTP/1.1..."
                                            className="textarea h-[350px] font-mono text-sm leading-relaxed"
                                        />
                                        <div className="absolute bottom-4 right-4 text-xs bg-black/60 backdrop-blur-sm px-3 py-1.5 rounded-lg text-[var(--muted)] border border-white/[0.06] flex items-center gap-1.5">
                                            <Lock size={10} className="text-green-400" />
                                            Auto-sanitized locally

                                        </div>
                                    </div>
                                    <div className="space-y-3 mt-4">
                                        <label className="label flex items-center gap-2">
                                            <ImageIcon size={14} className="text-purple-400" />
                                            Upload Screenshots (Optional)
                                        </label>

                                        {/* Enhanced Drag/Drop Zone */}
                                        <div
                                            onDragOver={handleDragOver}
                                            onDragLeave={handleDragLeave}
                                            onDrop={handleDrop}
                                            onClick={() => document.getElementById('image-upload-input')?.click()}
                                            className={clsx(
                                                "border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-300 group relative overflow-hidden",
                                                isDraggingFile
                                                    ? "border-blue-500 bg-blue-500/10 scale-[1.02] shadow-lg shadow-blue-500/20"
                                                    : "border-white/[0.08] bg-white/[0.02] hover:border-blue-500/50 hover:bg-blue-500/5"
                                            )}
                                        >
                                            <input
                                                id="image-upload-input"
                                                type="file"
                                                name="pocImages"
                                                multiple
                                                accept="image/png, image/jpeg, image/jpg"
                                                onChange={handleFileSelect}
                                                className="hidden"
                                            />

                                            <div className="flex flex-col items-center gap-4 relative z-10">
                                                <div className={clsx(
                                                    "w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300",
                                                    isDraggingFile
                                                        ? "bg-blue-500 text-white scale-110 rotate-6"
                                                        : "bg-white/[0.04] text-[var(--muted)] group-hover:text-blue-400 group-hover:bg-blue-500/10"
                                                )}>
                                                    <UploadCloud size={26} />
                                                </div>
                                                <div>
                                                    <p className="font-medium text-sm group-hover:text-white transition-colors">
                                                        {selectedFiles.length > 0
                                                            ? `${selectedFiles.length} file${selectedFiles.length > 1 ? 's' : ''} selected`
                                                            : "Click or Drag images here"}
                                                    </p>
                                                    <p className="text-xs text-[var(--muted)] mt-1.5">
                                                        Supports JPG, PNG
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Preview Thumbnails with Remove buttons */}
                                            {selectedFiles.length > 0 && (
                                                <div className="mt-5 space-y-3">
                                                    <div className="flex items-center justify-center gap-2 flex-wrap">
                                                        {selectedFiles.map((file, i) => (
                                                            <div
                                                                key={i}
                                                                className="flex items-center gap-1.5 text-[11px] bg-white/[0.04] pl-2.5 pr-1 py-1 rounded-lg border border-white/[0.06] text-gray-400 group/file"
                                                            >
                                                                <ImageIcon size={11} className="text-purple-400" />
                                                                <span className="max-w-[80px] truncate">{file.name}</span>
                                                                <button
                                                                    type="button"
                                                                    onClick={(e) => { e.stopPropagation(); removeFile(i); }}
                                                                    className="w-5 h-5 flex items-center justify-center rounded text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-all"
                                                                >
                                                                    <X size={10} />
                                                                </button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={(e) => { e.stopPropagation(); clearAllFiles(); }}
                                                        className="text-[10px] text-red-400/70 hover:text-red-400 transition-colors"
                                                    >
                                                        Clear All
                                                    </button>
                                                </div>
                                            )}
                                        </div>

                                        {/* Warning Banner */}
                                        <div className="flex items-start gap-3 text-xs text-amber-400/90 bg-amber-500/10 p-4 rounded-xl border border-amber-500/20">
                                            <AlertTriangle size={16} className="mt-0.5 shrink-0" />
                                            <span className="leading-relaxed">
                                                <strong>Disclaimer:</strong> Images are sent <strong>RAW</strong> to the AI provider.
                                                Unlike text logs, images are <strong>NOT automatically sanitized</strong>.
                                                Please manually blur sensitive data (PII, credentials) before uploading.
                                            </span>
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
                                <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-sm">
                                    {state.error}
                                </div>
                            )}
                        </form>

                    </div>
                )}

                {/* Drag Handle */}
                {!isFullScreen && (
                    <div
                        onMouseDown={startDrag}
                        className={clsx(
                            "w-2 cursor-col-resize flex items-center justify-center group z-10 transition-all duration-200",
                            isDragging ? "bg-blue-500/20" : "hover:bg-blue-500/10"
                        )}
                    >
                        <div className={clsx(
                            "h-12 w-1 rounded-full transition-all duration-200",
                            isDragging
                                ? "bg-blue-500 w-1.5"
                                : "bg-white/10 group-hover:bg-blue-400 group-hover:w-1.5"
                        )} />
                    </div>
                )}

                {/* Output Panel */}
                <div style={{ width: isFullScreen ? '100%' : `${100 - leftPanelWidth}%` }} className="h-full flex flex-col pl-4 min-w-[300px]">
                    <div className="flex flex-col h-full glass-card border border-white/[0.06] rounded-2xl overflow-hidden shadow-2xl relative">

                        {/* Toolbar */}
                        <div className="h-14 px-5 border-b border-white/[0.06] flex items-center justify-between bg-white/[0.02]">
                            <div className="flex items-center gap-3 overflow-hidden">
                                <h3 className="font-mono text-xs text-[var(--muted)] flex items-center gap-2 whitespace-nowrap">
                                    <FileText size={14} className="text-blue-400" />
                                    <span className={clsx(draftContent && "text-white font-medium")}>
                                        {draftContent ? 'DRAFT_REPORT.md' : 'REPORT.md'}
                                    </span>
                                    {draftContent && (
                                        <span className="text-[10px] bg-amber-500/15 text-amber-400 px-2 py-0.5 rounded-md border border-amber-500/25 font-semibold">
                                            Unsaved
                                        </span>
                                    )}
                                </h3>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                                {/* Save/Discard Controls */}
                                {draftContent && (
                                    <div className="flex items-center glass-card rounded-lg border border-white/[0.06] overflow-hidden h-8 mr-2">
                                        <button
                                            onClick={handleSave}
                                            disabled={isSaving}
                                            className="flex items-center gap-1.5 px-3 h-full text-[11px] font-bold tracking-wide text-emerald-400 hover:text-white hover:bg-emerald-500/20 transition-all border-r border-white/[0.06]"
                                        >
                                            <Save size={12} />
                                            {isSaving ? 'SAVING...' : 'SAVE'}
                                        </button>
                                        <button
                                            onClick={handleDiscard}
                                            className="flex items-center gap-1.5 px-3 h-full text-[11px] font-bold tracking-wide text-red-400 hover:text-white hover:bg-red-500/20 transition-all"
                                        >
                                            <Trash2 size={12} />
                                        </button>
                                    </div>
                                )}

                                <div className="h-5 w-px bg-white/[0.06]" />

                                {/* Zoom controls */}
                                <div className="flex items-center glass-card rounded-lg border border-white/[0.06] h-8">
                                    <button onClick={() => setFontSize(Math.max(0.8, fontSize - 0.1))} className="w-8 h-full flex items-center justify-center hover:text-white text-[var(--muted)] transition-colors">
                                        <ZoomOut size={13} />
                                    </button>
                                    <span className="text-[10px] min-w-[3ch] text-center text-[var(--muted)] font-mono">{Math.round(fontSize * 100)}%</span>
                                    <button onClick={() => setFontSize(Math.min(2, fontSize + 0.1))} className="w-8 h-full flex items-center justify-center hover:text-white text-[var(--muted)] transition-colors">
                                        <ZoomIn size={13} />
                                    </button>
                                </div>

                                <button onClick={() => setIsFullScreen(!isFullScreen)} className="w-8 h-8 flex items-center justify-center hover:text-white text-[var(--muted)] transition-colors glass-card rounded-lg border border-white/[0.06]" title="Toggle Fullscreen">
                                    {isFullScreen ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
                                </button>

                                {draftContent && (
                                    <>
                                        <button onClick={() => setShowCVSS(true)} className="w-8 h-8 flex items-center justify-center hover:text-white text-[var(--muted)] transition-colors glass-card rounded-lg border border-white/[0.06]" title="CVSS Calculator">
                                            <Calculator size={13} />
                                        </button>
                                        <button onClick={handleExplain} className="w-8 h-8 flex items-center justify-center hover:text-white text-[var(--muted)] transition-colors glass-card rounded-lg border border-white/[0.06]" title="Explain">
                                            <Sparkles size={13} />
                                        </button>
                                        <button onClick={copyToClipboard} className={clsx(
                                            "h-8 px-3 flex items-center gap-1.5 rounded-lg border text-[11px] font-bold transition-all duration-300",
                                            copied
                                                ? "bg-green-500/15 text-green-400 border-green-500/30"
                                                : "glass-card text-blue-400 border-white/[0.06] hover:bg-blue-500/10"
                                        )}>
                                            {copied ? <Check size={12} /> : <Copy size={12} />}
                                            {copied ? 'COPIED' : 'COPY'}
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>



                        <div className="flex-1 p-8 overflow-y-auto markdown-content transition-all bg-[#050505]" style={{ fontSize: `${fontSize}em` }}>
                            {draftContent ? (
                                <div className="max-w-4xl mx-auto text-justify">
                                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                        {draftContent}
                                    </ReactMarkdown>
                                </div>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-[var(--muted)] space-y-6 select-none">
                                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500/10 to-purple-500/10 flex items-center justify-center border border-white/[0.04]">
                                        <FileText size={36} strokeWidth={1.5} className="text-gray-600" />
                                    </div>
                                    <div className="text-center">
                                        <p className="font-medium text-gray-500 mb-1">Ready to generate</p>
                                        <p className="text-sm text-gray-600">Paste your logs and click generate to see the report here.</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div >
                </div >
            </div >

            {/* CVSS Calculator Modal */}
            <CVSSCalculator
                isOpen={showCVSS}
                onClose={() => setShowCVSS(false)}
                onApply={handleApplyCVSS}
            />
        </>
    );
}
