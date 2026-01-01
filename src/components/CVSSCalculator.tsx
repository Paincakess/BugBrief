'use client';

import { useState, useEffect } from 'react';
import { Calculator, X, Info } from 'lucide-react';
import clsx from 'clsx';

// CVSS 3.1 Metric Values
const METRICS = {
    AV: {
        name: 'Attack Vector', options: [
            { value: 'N', label: 'Network', score: 0.85 },
            { value: 'A', label: 'Adjacent', score: 0.62 },
            { value: 'L', label: 'Local', score: 0.55 },
            { value: 'P', label: 'Physical', score: 0.2 }
        ]
    },
    AC: {
        name: 'Attack Complexity', options: [
            { value: 'L', label: 'Low', score: 0.77 },
            { value: 'H', label: 'High', score: 0.44 }
        ]
    },
    PR: {
        name: 'Privileges Required', options: [
            { value: 'N', label: 'None', score: 0.85 },
            { value: 'L', label: 'Low', score: 0.62 },
            { value: 'H', label: 'High', score: 0.27 }
        ]
    },
    UI: {
        name: 'User Interaction', options: [
            { value: 'N', label: 'None', score: 0.85 },
            { value: 'R', label: 'Required', score: 0.62 }
        ]
    },
    S: {
        name: 'Scope', options: [
            { value: 'U', label: 'Unchanged', score: 0 },
            { value: 'C', label: 'Changed', score: 1 }
        ]
    },
    C: {
        name: 'Confidentiality', options: [
            { value: 'N', label: 'None', score: 0 },
            { value: 'L', label: 'Low', score: 0.22 },
            { value: 'H', label: 'High', score: 0.56 }
        ]
    },
    I: {
        name: 'Integrity', options: [
            { value: 'N', label: 'None', score: 0 },
            { value: 'L', label: 'Low', score: 0.22 },
            { value: 'H', label: 'High', score: 0.56 }
        ]
    },
    A: {
        name: 'Availability', options: [
            { value: 'N', label: 'None', score: 0 },
            { value: 'L', label: 'Low', score: 0.22 },
            { value: 'H', label: 'High', score: 0.56 }
        ]
    }
};

// PR scores change based on Scope
const PR_SCORES_CHANGED = { N: 0.85, L: 0.68, H: 0.50 };
const PR_SCORES_UNCHANGED = { N: 0.85, L: 0.62, H: 0.27 };

function calculateCVSS(values: Record<string, string>): { score: number; severity: string; vector: string } {
    const AV = METRICS.AV.options.find(o => o.value === values.AV)?.score || 0;
    const AC = METRICS.AC.options.find(o => o.value === values.AC)?.score || 0;
    const UI = METRICS.UI.options.find(o => o.value === values.UI)?.score || 0;
    const scopeChanged = values.S === 'C';

    // PR depends on scope
    const PR_SCORES = scopeChanged ? PR_SCORES_CHANGED : PR_SCORES_UNCHANGED;
    const PR = PR_SCORES[values.PR as keyof typeof PR_SCORES] || 0;

    const C = METRICS.C.options.find(o => o.value === values.C)?.score || 0;
    const I = METRICS.I.options.find(o => o.value === values.I)?.score || 0;
    const A = METRICS.A.options.find(o => o.value === values.A)?.score || 0;

    // Calculate Impact Sub Score
    const ISS = 1 - ((1 - C) * (1 - I) * (1 - A));

    // Calculate Impact
    let impact: number;
    if (scopeChanged) {
        impact = 7.52 * (ISS - 0.029) - 3.25 * Math.pow(ISS - 0.02, 15);
    } else {
        impact = 6.42 * ISS;
    }

    // Calculate Exploitability
    const exploitability = 8.22 * AV * AC * PR * UI;

    // Calculate Base Score
    let score: number;
    if (impact <= 0) {
        score = 0;
    } else if (scopeChanged) {
        score = Math.min(1.08 * (impact + exploitability), 10);
    } else {
        score = Math.min(impact + exploitability, 10);
    }

    // Round up to 1 decimal
    score = Math.ceil(score * 10) / 10;

    // Determine severity
    let severity: string;
    if (score === 0) severity = 'None';
    else if (score < 4) severity = 'Low';
    else if (score < 7) severity = 'Medium';
    else if (score < 9) severity = 'High';
    else severity = 'Critical';

    // Build vector string
    const vector = `CVSS:3.1/AV:${values.AV}/AC:${values.AC}/PR:${values.PR}/UI:${values.UI}/S:${values.S}/C:${values.C}/I:${values.I}/A:${values.A}`;

    return { score, severity, vector };
}

interface CVSSCalculatorProps {
    isOpen: boolean;
    onClose: () => void;
    onApply: (score: number, severity: string, vector: string) => void;
    initialScore?: number;
}

export default function CVSSCalculator({ isOpen, onClose, onApply, initialScore }: CVSSCalculatorProps) {
    const [values, setValues] = useState<Record<string, string>>({
        AV: 'N', AC: 'L', PR: 'N', UI: 'N', S: 'U', C: 'H', I: 'H', A: 'N'
    });

    const { score, severity, vector } = calculateCVSS(values);

    const severityConfig: Record<string, { bg: string; text: string; glow: string; gradient: string }> = {
        'None': { bg: 'bg-gray-500', text: 'text-gray-400', glow: '', gradient: 'from-gray-600 to-gray-700' },
        'Low': { bg: 'bg-green-500', text: 'text-green-400', glow: 'shadow-green-500/30', gradient: 'from-green-500 to-green-600' },
        'Medium': { bg: 'bg-yellow-500', text: 'text-yellow-400', glow: 'shadow-yellow-500/30', gradient: 'from-yellow-500 to-orange-500' },
        'High': { bg: 'bg-orange-500', text: 'text-orange-400', glow: 'shadow-orange-500/30', gradient: 'from-orange-500 to-red-500' },
        'Critical': { bg: 'bg-red-500', text: 'text-red-400', glow: 'shadow-red-500/30', gradient: 'from-red-500 to-rose-600' }
    };

    const config = severityConfig[severity];

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md">
            <div
                className="glass-card border border-white/[0.08] rounded-3xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto animate-in"
                style={{ animation: 'fadeIn 0.3s ease-out' }}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-white/[0.06]">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center">
                            <Calculator className="text-blue-400" size={20} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold">CVSS 3.1 Calculator</h2>
                            <p className="text-xs text-[var(--muted)]">Common Vulnerability Scoring System</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-white/[0.06] text-gray-500 hover:text-white transition-all duration-200"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Score Display */}
                <div className="p-6 border-b border-white/[0.06] bg-gradient-to-r from-white/[0.02] to-transparent">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-5">
                            {/* Score Circle */}
                            <div className={clsx(
                                "w-24 h-24 rounded-2xl flex items-center justify-center text-3xl font-bold text-white shadow-2xl",
                                `bg-gradient-to-br ${config.gradient}`,
                                config.glow && `shadow-lg ${config.glow}`
                            )}>
                                {score.toFixed(1)}
                            </div>
                            <div>
                                <div className={clsx("text-xl font-bold", config.text)}>{severity}</div>
                                <div className="text-xs text-gray-500 font-mono mt-2 bg-black/30 px-3 py-1.5 rounded-lg border border-white/[0.04] max-w-[280px] truncate">
                                    {vector}
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={() => onApply(score, severity, vector)}
                            className="btn btn-primary px-6"
                        >
                            Apply Score
                        </button>
                    </div>
                </div>

                {/* Metrics */}
                <div className="p-6 space-y-8">
                    {/* Exploitability Metrics */}
                    <div>
                        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-blue-500" />
                            Exploitability Metrics
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            {(['AV', 'AC', 'PR', 'UI'] as const).map(key => (
                                <div key={key} className="space-y-2.5">
                                    <label className="text-sm text-gray-300 font-medium">{METRICS[key].name}</label>
                                    <div className="flex gap-1.5">
                                        {METRICS[key].options.map(opt => (
                                            <button
                                                key={opt.value}
                                                onClick={() => setValues(v => ({ ...v, [key]: opt.value }))}
                                                className={clsx(
                                                    "flex-1 py-2.5 px-3 text-xs font-semibold rounded-xl transition-all duration-300",
                                                    values[key] === opt.value
                                                        ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/25"
                                                        : "bg-white/[0.04] text-gray-400 hover:bg-white/[0.08] hover:text-white border border-white/[0.04]"
                                                )}
                                            >
                                                {opt.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Scope */}
                    <div>
                        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-purple-500" />
                            Scope
                        </h3>
                        <div className="space-y-2">
                            <div className="flex gap-2">
                                {METRICS.S.options.map(opt => (
                                    <button
                                        key={opt.value}
                                        onClick={() => setValues(v => ({ ...v, S: opt.value }))}
                                        className={clsx(
                                            "flex-1 py-3.5 px-4 text-sm font-semibold rounded-xl transition-all duration-300",
                                            values.S === opt.value
                                                ? "bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-lg shadow-purple-500/25"
                                                : "bg-white/[0.04] text-gray-400 hover:bg-white/[0.08] hover:text-white border border-white/[0.04]"
                                        )}
                                    >
                                        {opt.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Impact Metrics */}
                    <div>
                        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-orange-500" />
                            Impact Metrics
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                            {(['C', 'I', 'A'] as const).map(key => (
                                <div key={key} className="space-y-2.5">
                                    <label className="text-sm text-gray-300 font-medium">{METRICS[key].name}</label>
                                    <div className="flex gap-1.5">
                                        {METRICS[key].options.map(opt => (
                                            <button
                                                key={opt.value}
                                                onClick={() => setValues(v => ({ ...v, [key]: opt.value }))}
                                                className={clsx(
                                                    "flex-1 py-2.5 px-2 text-xs font-semibold rounded-xl transition-all duration-300",
                                                    values[key] === opt.value
                                                        ? "bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/25"
                                                        : "bg-white/[0.04] text-gray-400 hover:bg-white/[0.08] hover:text-white border border-white/[0.04]"
                                                )}
                                            >
                                                {opt.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
