'use client';

import { useState, useEffect } from 'react';
import { Calculator, X } from 'lucide-react';
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

    const severityColors: Record<string, string> = {
        'None': 'bg-gray-500',
        'Low': 'bg-green-500',
        'Medium': 'bg-yellow-500',
        'High': 'bg-orange-500',
        'Critical': 'bg-red-500'
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
            <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-2xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-[#1a1a1a]">
                    <div className="flex items-center gap-3">
                        <Calculator className="text-blue-400" size={24} />
                        <h2 className="text-xl font-bold">CVSS 3.1 Calculator</h2>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Score Display */}
                <div className="p-6 border-b border-[#1a1a1a] flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className={clsx("w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold text-white", severityColors[severity])}>
                            {score.toFixed(1)}
                        </div>
                        <div>
                            <div className={clsx("text-lg font-bold", {
                                'text-gray-400': severity === 'None',
                                'text-green-400': severity === 'Low',
                                'text-yellow-400': severity === 'Medium',
                                'text-orange-400': severity === 'High',
                                'text-red-400': severity === 'Critical'
                            })}>{severity}</div>
                            <div className="text-xs text-gray-500 font-mono mt-1">{vector}</div>
                        </div>
                    </div>
                    <button
                        onClick={() => onApply(score, severity, vector)}
                        className="btn btn-primary"
                    >
                        Apply Score
                    </button>
                </div>

                {/* Metrics */}
                <div className="p-6 space-y-6">
                    {/* Exploitability Metrics */}
                    <div>
                        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-4">Exploitability Metrics</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {(['AV', 'AC', 'PR', 'UI'] as const).map(key => (
                                <div key={key} className="space-y-2">
                                    <label className="text-sm text-gray-300">{METRICS[key].name}</label>
                                    <div className="flex gap-1">
                                        {METRICS[key].options.map(opt => (
                                            <button
                                                key={opt.value}
                                                onClick={() => setValues(v => ({ ...v, [key]: opt.value }))}
                                                className={clsx(
                                                    "flex-1 py-2 px-3 text-xs font-medium rounded-lg transition-all",
                                                    values[key] === opt.value
                                                        ? "bg-blue-500 text-white"
                                                        : "bg-[#1a1a1a] text-gray-400 hover:bg-[#252525]"
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
                        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-4">Scope</h3>
                        <div className="space-y-2">
                            <div className="flex gap-2">
                                {METRICS.S.options.map(opt => (
                                    <button
                                        key={opt.value}
                                        onClick={() => setValues(v => ({ ...v, S: opt.value }))}
                                        className={clsx(
                                            "flex-1 py-3 px-4 text-sm font-medium rounded-lg transition-all",
                                            values.S === opt.value
                                                ? "bg-purple-500 text-white"
                                                : "bg-[#1a1a1a] text-gray-400 hover:bg-[#252525]"
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
                        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-4">Impact Metrics</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {(['C', 'I', 'A'] as const).map(key => (
                                <div key={key} className="space-y-2">
                                    <label className="text-sm text-gray-300">{METRICS[key].name}</label>
                                    <div className="flex gap-1">
                                        {METRICS[key].options.map(opt => (
                                            <button
                                                key={opt.value}
                                                onClick={() => setValues(v => ({ ...v, [key]: opt.value }))}
                                                className={clsx(
                                                    "flex-1 py-2 px-2 text-xs font-medium rounded-lg transition-all",
                                                    values[key] === opt.value
                                                        ? "bg-orange-500 text-white"
                                                        : "bg-[#1a1a1a] text-gray-400 hover:bg-[#252525]"
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
