'use client';

import { getReports, deleteReport } from './actions';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { FileText, Trash2, Calendar, ArrowRight, ShieldAlert } from 'lucide-react';

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
        if (confirm("Are you sure you want to delete this report?")) {
            await deleteReport(id);
            setReports(reports.filter(r => r.id !== id));
        }
    };

    if (loading) {
        return <div className="p-8 text-[var(--muted)]">Loading archives...</div>;
    }

    return (
        <div className="max-w-6xl mx-auto space-y-8">
            <div className="flex items-center justify-between border-b border-[var(--card-border)] pb-6">
                <div>
                    <h1 className="text-3xl font-bold mb-2">Report Archives</h1>
                    <p className="text-[var(--muted)]">Access and manage your generated security documentation.</p>
                </div>
                <div className="text-right">
                    <div className="text-2xl font-mono font-bold text-[var(--primary)]">{reports.length}</div>
                    <div className="text-xs text-[var(--muted)] uppercase tracking-wider">Reports</div>
                </div>
            </div>

            {reports.length === 0 ? (
                <div className="text-center py-20 bg-[var(--card-bg)] rounded-xl border border-[var(--card-border)]">
                    <ShieldAlert className="mx-auto mb-4 text-[var(--muted)] opacity-50" size={48} />
                    <h3 className="text-xl font-medium mb-2">No Reports Found</h3>
                    <p className="text-[var(--muted)] mb-6">Start by generating a new vulnerability report.</p>
                    <Link href="/report" className="px-6 py-3 bg-[var(--primary)] text-white rounded-lg font-medium hover:bg-blue-600 transition-colors">
                        Go to Generator
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {reports.map((report) => (
                        <Link
                            key={report.id}
                            href={`/history/${report.id}`}
                            className="group block bg-[#0a0a0a] border border-[var(--card-border)] rounded-xl overflow-hidden hover:border-[var(--primary)] transition-all hover:shadow-[0_0_20px_rgba(59,130,246,0.1)]"
                        >
                            <div className="p-6 space-y-4">
                                <div className="flex justify-between items-start">
                                    <div className="bg-blue-900/20 text-blue-300 text-xs px-2 py-1 rounded border border-blue-900/50 uppercase font-mono">
                                        {report.mode === 'poc' ? 'POC Analysis' : 'Definition'}
                                    </div>
                                    <button
                                        onClick={(e) => handleDelete(report.id, e)}
                                        className="text-[var(--muted)] hover:text-red-500 transition-colors bg-transparent p-1 -mt-2 -mr-2"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>

                                <div>
                                    <h3 className="font-bold text-lg mb-1 group-hover:text-[var(--primary)] transition-colors line-clamp-2">
                                        {report.title}
                                    </h3>
                                    <p className="text-sm text-[var(--muted)] line-clamp-2 min-h-[2.5em]">
                                        {report.summary || "No summary provided."}
                                    </p>
                                </div>

                                <div className="pt-4 border-t border-[var(--card-border)] flex items-center justify-between text-xs text-[var(--muted)]">
                                    <div className="flex items-center gap-1.5">
                                        <Calendar size={12} />
                                        {new Date(report.createdAt).toLocaleDateString()}
                                    </div>
                                    <div className="flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                                        View Details <ArrowRight size={12} />
                                    </div>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
