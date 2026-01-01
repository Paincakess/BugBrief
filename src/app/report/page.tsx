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
        <button type="submit" disabled={pending} className="btn btn-primary w-full h-12 text-base shadow-lg shadow-blue-900/20">
            {pending ? 'Analyzing & Drafting...' : 'Generate Professional Report'}
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
                background: '#1a1a1a',
                color: '#fff'
            });
        }

        if (validFiles.length > 0) {
            // Append to existing files or replace? Usually append is nicer for "batch" but for simplicity let's replace or add to state.
            // Requirement was "upload multiple images".
            // Let's replace for now to keep state simple, or append if user wants to build up a list.
            // Given "Batch POC Upload", append makes sense, but we need to manage the Remove action then.
            // For now, let's just SET the files.

            // To ensure these get sent to the server action, we need to sync them to the <input> 
            // OR simpler: we rely on our 'selectedFiles' state and when form submits we might need to manually append?
            // Wait, useActionState uses the FORM data. 
            // If we want the DROP to work with the FORM, we must update the <input type="file">.

            const dataTransfer = new DataTransfer();
            validFiles.forEach(file => dataTransfer.items.add(file));

            // Find our input and update it
            const fileInput = document.querySelector('input[name="pocImages"]') as HTMLInputElement;
            if (fileInput) {
                fileInput.files = dataTransfer.files;
                // Update local state for UI preview
                setSelectedFiles(validFiles);
            }
        }
    };

    // Warnings logic
    const router = useRouter();

    // Effect to SYNC server result to local draft
    // But ONLY if we don't have a draft or if the server result is NEW (simple check: if result changed and is not empty)
    const [lastServerResult, setLastServerResult] = useState('');
    if (state.result && state.result !== lastServerResult) {
        setDraftContent(state.result);
        setPocMetadata(state.metadata); // Capture the sensitive data needed for saving
        setLastServerResult(state.result);
    }


    // Prevent accidental navigation if unsaved changes
    // Next.js App Router doesn't have a simple synchronous boolean for "dirty" state easily intercepted for client transitions without experimental hooks.
    // We will use standard window.beforeunload for browser refresh/close which handles the most critical "oops" moments.
    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (draftContent && !isSaving) {
                e.preventDefault();
                e.returnValue = '';
            }
        };
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [draftContent, isSaving]);



    const handleApplyCVSS = (score: number, severity: string, vector: string) => {
        if (draftContent) {
            const newCVSS = `**${score.toFixed(1)} | ${severity}**`;

            // 1. Try to find the specific section "## CVSS 3.1 Base Score" and replace the line following it.
            // This is the most robust method as it targets the semantic location.
            const sectionRegex = /(##\s*CVSS\s*3\.1\s*Base\s*Score\n+)([^\n#]+)/i;

            if (sectionRegex.test(draftContent)) {
                const updatedDraft = draftContent.replace(sectionRegex, `$1${newCVSS}`);
                setDraftContent(updatedDraft);
            } else {
                // 2. Fallback: Try to find the pattern anywhere in the text (legacy behavior)
                // Expanded to accept surrounding spaces inside valid markers
                const fallbackRegex = /(\*\*\s*[\d.]+\s*\|\s*[A-Za-z]+\s*\*+)|(\*\*\s*[\d.]+\s*\*\*\s*\|\s*\*\*\s*[A-Za-z]+\s*\*+)/;

                if (fallbackRegex.test(draftContent)) {
                    setDraftContent(draftContent.replace(fallbackRegex, newCVSS));
                } else {
                    // 3. Last resort: Just append an alert or log
                    MySwal.fire({
                        title: 'Update Failed',
                        text: 'Could not automatically locate the CVSS score in the report. Please update it manually.',
                        icon: 'warning',
                        background: '#1a1a1a',
                        color: '#fff'
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
            formData.append('content', draftContent); // The potentially EDITED content
            formData.append('metadata', JSON.stringify(pocMetadata));

            const result = await saveReport(formData);

            if (result.success) {
                // Success!
                MySwal.fire({
                    title: 'Report Saved!',
                    text: 'Your report has been securely saved to the database.',
                    icon: 'success',
                    timer: 2000,
                    showConfirmButton: false,
                    background: '#1a1a1a',
                    color: '#fff'
                });

                // Clear local state after successful save
                setDraftContent('');
                setPocMetadata(null);
                setLastServerResult(''); // Important to prevent re-sync
                router.refresh();
            } else {
                MySwal.fire({
                    title: 'Save Failed',
                    text: result.error || 'Unknown error occurred.',
                    icon: 'error',
                    background: '#1a1a1a',
                    color: '#fff'
                });
            }

        } catch (e) {
            console.error(e);
            MySwal.fire({
                title: 'Error',
                text: 'An unexpected network error occurred.',
                icon: 'error',
                background: '#1a1a1a',
                color: '#fff'
            });
        } finally {
            setIsSaving(false);
        }
    };

    const handleDiscard = async () => {
        const result = await MySwal.fire({
            title: 'Discard Draft?',
            text: "You will lose all generated content. This action cannot be undone.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Yes, discard it!',
            background: '#1a1a1a',
            color: '#fff'
        });


        if (result.isConfirmed) {
            setDraftContent('');
            setPocMetadata(null);
            // DO NOT reset lastServerResult here. 
            // If we reset it to '', and state.result is still "Report Content", the useEffect will
            // differ ('' !== 'Report Content') and thus re-apply the draft we just deleted.
            // keeping it as-is means "we have already processed this server result".


            MySwal.fire({
                title: 'Discarded!',
                text: 'Draft has been discarded.',
                icon: 'success',
                timer: 1500,
                showConfirmButton: false,
                background: '#1a1a1a',
                color: '#fff'
            });
        }
    };

    const handleExplain = () => {
        if (!draftContent) return;

        // Extract title from the first H1 heading in the report
        const titleMatch = draftContent.match(/^#\s+(.+)$/m);
        const title = titleMatch ? titleMatch[1].trim() : (vulName || "Vulnerability Report");

        // ... (rest of logic same but using draftContent) ...
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

    // ... [RENDER logic updates]


    return (
        <>
            <div className={clsx(
                "flex h-[calc(100vh-220px)] transition-all ease-in-out duration-300 relative",
                isFullScreen ? "" : "gap-0" // Gap handled internally
            )}>
                {/* Input Panel */}
                {!isFullScreen && (
                    <div
                        style={{ width: `${leftPanelWidth}%` }}
                        className="h-full overflow-y-auto pr-4 pl-1 flex flex-col shrink-0 min-w-[320px] max-w-[80%]"
                    >
                        {/* ... Header and Mode Switcher same ... */}
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
                                    <div className="space-y-2 mt-4">
                                        <label className="label flex items-center gap-2">
                                            <Sparkles size={14} />
                                            Upload Screenshots (Optional)
                                        </label>

                                        <div
                                            onDragOver={handleDragOver}
                                            onDragLeave={handleDragLeave}
                                            onDrop={handleDrop}
                                            onClick={() => document.getElementById('image-upload-input')?.click()}
                                            className={clsx(
                                                "border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all duration-200 group relative overflow-hidden",
                                                isDraggingFile
                                                    ? "border-blue-500 bg-blue-500/10 scale-[1.02]"
                                                    : "border-[var(--card-border)] bg-[var(--card-bg)] hover:border-[var(--primary)] hover:bg-[#1a1a1a]"
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

                                            <div className="flex flex-col items-center gap-3 relative z-10">
                                                <div className={clsx(
                                                    "p-3 rounded-full transition-colors duration-300",
                                                    isDraggingFile ? "bg-blue-500 text-white" : "bg-[#1f1f1f] text-[var(--muted)] group-hover:text-[var(--primary)]"
                                                )}>
                                                    <UploadCloud size={24} />
                                                </div>
                                                <div>
                                                    <p className="font-medium text-sm group-hover:text-white transition-colors">
                                                        {selectedFiles.length > 0
                                                            ? `${selectedFiles.length} file${selectedFiles.length > 1 ? 's' : ''} selected`
                                                            : "Click or Drag images here"}
                                                    </p>
                                                    <p className="text-xs text-[var(--muted)] mt-1">
                                                        Supports JPG, PNG
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Preview Thumbnails (if any) */}
                                            {selectedFiles.length > 0 && (
                                                <div className="flex items-center justify-center gap-2 mt-4 flex-wrap">
                                                    {selectedFiles.slice(0, 5).map((file, i) => (
                                                        <div key={i} className="flex items-center gap-1 text-[10px] bg-[#0a0a0a] px-2 py-1 rounded border border-[#333] text-[var(--muted)]">
                                                            <ImageIcon size={10} />
                                                            <span className="max-w-[60px] truncate">{file.name}</span>
                                                        </div>
                                                    ))}
                                                    {selectedFiles.length > 5 && (
                                                        <span className="text-[10px] text-[var(--muted)]">+{selectedFiles.length - 5} more</span>
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex items-start gap-2 text-xs text-amber-500/80 bg-amber-900/10 p-2 rounded border border-amber-500/20">
                                            <AlertTriangle size={14} className="mt-0.5 shrink-0" />
                                            <span>
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
                                <div className="p-4 rounded bg-red-900/20 border border-red-900 text-red-200 text-sm">
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
                            "w-1 cursor-col-resize hover:bg-blue-500/50 transition-colors flex items-center justify-center group z-10 mx-[-2px]",
                            isDragging ? "bg-blue-600 w-1.5" : "bg-transparent"
                        )}
                    >
                        <div className="h-8 w-1 bg-[var(--card-border)] rounded-full group-hover:bg-blue-400 transition-colors" />
                    </div>
                )}

                {/* Output Panel */}
                <div style={{ width: isFullScreen ? '100%' : `${100 - leftPanelWidth}%` }} className="h-full flex flex-col pl-4 min-w-[300px]">
                    <div className="flex flex-col h-full bg-[#050505] border border-[var(--card-border)] rounded-xl overflow-hidden shadow-2xl relative">

                        <div className="h-12 px-4 border-b border-[var(--card-border)] flex items-center justify-between bg-[#0a0a0a]">
                            <div className="flex items-center gap-3 overflow-hidden">
                                <h3 className="font-mono text-xs text-[var(--muted)] flex items-center gap-2 whitespace-nowrap">
                                    <FileText size={14} className="text-blue-400" />
                                    <span className={clsx(draftContent && "text-white font-medium")}>
                                        {draftContent ? 'DRAFT_REPORT.md' : 'REPORT.md'}
                                    </span>
                                    {draftContent && <span className="text-[10px] bg-yellow-500/10 text-yellow-500 px-1.5 rounded border border-yellow-500/20">Unsaved</span>}
                                </h3>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                                {/* Save/Discard Controls - Only show if we have content */}
                                {draftContent && (
                                    <div className="flex items-center bg-[#151515] rounded-md border border-[var(--card-border)] mr-2 overflow-hidden h-7">
                                        <button
                                            onClick={handleSave}
                                            disabled={isSaving}
                                            className="flex items-center gap-1.5 px-3 h-full text-[10px] font-bold tracking-wide text-emerald-400 hover:text-white hover:bg-emerald-500/20 transition-all border-r border-[#333]"
                                        >
                                            <Save size={12} />
                                            {isSaving ? 'SAVING...' : 'SAVE'}
                                        </button>
                                        <button
                                            onClick={handleDiscard}
                                            className="flex items-center gap-1.5 px-3 h-full text-[10px] font-bold tracking-wide text-red-400 hover:text-white hover:bg-red-500/20 transition-all"
                                        >
                                            <Trash2 size={12} />
                                        </button>
                                    </div>
                                )}

                                <div className="h-4 w-[1px] bg-[#333] mx-1" />

                                <div className="flex items-center bg-[#151515] rounded-md border border-[var(--card-border)] h-7">
                                    <button onClick={() => setFontSize(Math.max(0.8, fontSize - 0.1))} className="w-7 h-full flex items-center justify-center hover:text-white text-[var(--muted)] transition-colors"><ZoomOut size={12} /></button>
                                    <span className="text-[10px] min-w-[3ch] text-center text-[var(--muted)] font-mono">{Math.round(fontSize * 100)}%</span>
                                    <button onClick={() => setFontSize(Math.min(2, fontSize + 0.1))} className="w-7 h-full flex items-center justify-center hover:text-white text-[var(--muted)] transition-colors"><ZoomIn size={12} /></button>
                                </div>

                                <button onClick={() => setIsFullScreen(!isFullScreen)} className="w-7 h-7 flex items-center justify-center hover:text-white text-[var(--muted)] transition-colors bg-[#151515] rounded-md border border-[var(--card-border)]" title="Toggle Fullscreen">
                                    {isFullScreen ? <Minimize2 size={12} /> : <Maximize2 size={12} />}
                                </button>

                                {draftContent && (
                                    <>
                                        <button onClick={() => setShowCVSS(true)} className="w-7 h-7 flex items-center justify-center hover:text-white text-[var(--muted)] transition-colors bg-[#151515] rounded-md border border-[var(--card-border)] ml-1" title="CVSS Calculator">
                                            <Calculator size={12} />
                                        </button>
                                        <button onClick={handleExplain} className="w-7 h-7 flex items-center justify-center hover:text-white text-[var(--muted)] transition-colors bg-[#151515] rounded-md border border-[var(--card-border)] ml-1" title="Explain">
                                            <Sparkles size={12} />
                                        </button>
                                        <button onClick={copyToClipboard} className={clsx("h-7 px-3 flex items-center gap-1.5 rounded-md border border-[var(--card-border)] ml-1 text-[10px] font-bold transition-all", copied ? "bg-green-500/20 text-green-400 border-green-500/50" : "bg-[#151515] text-[var(--primary)] hover:bg-[#202020]")}>
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
                                <div className="h-full flex flex-col items-center justify-center text-[var(--muted)] opacity-30 space-y-4 select-none">
                                    <FileText size={48} strokeWidth={1} />
                                    <p className="text-sm font-medium">Ready to generate.</p>
                                </div>
                            )}
                        </div>
                    </div >
                </div >
            </div >

            {/* CVSS Calculator Modal */}

            {/* CVSS Calculator Modal */}
            <CVSSCalculator
                isOpen={showCVSS}
                onClose={() => setShowCVSS(false)}
                onApply={handleApplyCVSS}
            />
        </>
    );
}

