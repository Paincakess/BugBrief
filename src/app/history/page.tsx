'use client';

import { getReports, deleteReport } from './actions';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { FileText, Trash2, Calendar, ArrowRight, ShieldAlert, Sparkles } from 'lucide-react';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

const MySwal = withReactContent(Swal);

type Report = {
    id: string;
    title: string;
    mode: string;
    createdAt: Date;
    summary: string | null;
};

export default function HistoryPage() {
    const [reports, setReports] = useState<Report[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadReports();
    }, []);

    const loadReports = async () => {
        setLoading(true);
        const { result } = await getReports();
        if (result) {
            setReports(result);
        }
        setLoading(false);
    };

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        const result = await MySwal.fire({
            title: 'Delete Report?',
            text: "This action cannot be undone.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Yes, delete it!',
            background: '#0a0a0a',
            color: '#fff',
            customClass: {
                popup: 'border border-white/10 rounded-2xl',
            }
        });

        if (result.isConfirmed) {
            await deleteReport(id);
            setReports(reports.filter(r => r.id !== id));

            MySwal.fire({
                title: 'Deleted!',
                text: 'Report has been deleted.',
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

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-10 h-10 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
                    <p className="text-[var(--muted)] text-sm">Loading archives...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-6">
                <div>
                    <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                        Report Archives
                    </h1>
                    <p className="text-[var(--muted)]">Access and manage your generated security documentation.</p>
                </div>
                <div className="text-right glass-card px-6 py-4 rounded-2xl">
                    <div className="text-3xl font-mono font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                        {reports.length}
                    </div>
                    <div className="text-xs text-[var(--muted)] uppercase tracking-wider mt-1">Reports</div>
                </div>
            </div>

            {reports.length === 0 ? (
                <div className="text-center py-20 glass-card rounded-2xl border border-white/[0.06]">
                    <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-blue-500/10 to-purple-500/10 flex items-center justify-center">
                        <ShieldAlert className="text-[var(--muted)]" size={36} />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">No Reports Found</h3>
                    <p className="text-[var(--muted)] mb-8 max-w-sm mx-auto">
                        Start by generating your first vulnerability report to see it here.
                    </p>
                    <Link href="/report" className="btn btn-primary px-8">
                        <Sparkles size={16} className="mr-2" />
                        Generate Report
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {reports.map((report, index) => (
                        <Link
                            key={report.id}
                            href={`/history/${report.id}`}
                            className="group block card overflow-hidden hover:border-blue-500/30 transition-all duration-500"
                            style={{ animationDelay: `${index * 50}ms` }}
                        >
                            <div className="p-6 space-y-4">
                                {/* Header row */}
                                <div className="flex justify-between items-start">
                                    <div className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1.5 rounded-lg border ${report.mode === 'poc'
                                            ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                                            : 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                                        }`}>
                                        {report.mode === 'poc' ? 'POC Analysis' : 'Definition'}
                                    </div>
                                    <button
                                        onClick={(e) => handleDelete(report.id, e)}
                                        className="p-2 -mt-1 -mr-1 rounded-lg text-gray-600 hover:text-red-400 hover:bg-red-500/10 transition-all duration-300"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>

                                {/* Content */}
                                <div>
                                    <h3 className="font-bold text-lg mb-2 group-hover:text-blue-400 transition-colors duration-300 line-clamp-2">
                                        {report.title}
                                    </h3>
                                    <p className="text-sm text-[var(--muted)] line-clamp-2 leading-relaxed min-h-[2.75em]">
                                        {report.summary || "No summary provided."}
                                    </p>
                                </div>

                                {/* Footer */}
                                <div className="pt-4 border-t border-white/[0.04] flex items-center justify-between text-xs text-[var(--muted)]">
                                    <div className="flex items-center gap-1.5">
                                        <Calendar size={12} />
                                        <span>{new Date(report.createdAt).toLocaleDateString()}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 text-blue-400 opacity-0 group-hover:opacity-100 transition-all duration-300">
                                        <span className="font-medium">View Details</span>
                                        <ArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
                                    </div>
                                </div>
                            </div>

                            {/* Bottom gradient line on hover */}
                            <div className="h-0.5 bg-gradient-to-r from-transparent via-blue-500/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
