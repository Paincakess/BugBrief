'use server';

import { generateReport } from '@/lib/ai';
import { sanitizeInput } from '@/lib/sanitizer';
import { db } from '@/lib/db';

export async function submitReport(prevState: any, formData: FormData): Promise<{ result?: string; error?: string }> {
    const mode = formData.get('mode') as "poc" | "def";
    const pocContent = formData.get('pocContent') as string;
    const vulName = formData.get('vulName') as string;
    const abuse = formData.get('abuse') as string;

    try {
        let result = "";

        if (mode === 'poc') {
            if (!pocContent) return { error: "Please paste the POC or logs." };
            const safeContent = sanitizeInput(pocContent);
            result = await generateReport({
                pocMode: true,
                pocContent: safeContent
            });

            // Persist to DB
            // We don't have a title easily from POC mode until generated or asked.
            // For now, fast path: just return result.
            // In a real app we might parse the title from the report.

        } else {
            if (!vulName || !abuse) return { error: "Please fill in the details." };
            result = await generateReport({
                pocMode: false,
                vulnerabilityName: vulName,
                abuseExplanation: abuse
            });
        }

        // Optional: Save to DB (async, fire and forget or await)
        // Extract title (Simple heuristic: First line if header, or fallback)
        const titleMatch = result.match(/^#\s+(.*?)$/m);
        const title = mode === 'def' ? vulName : (titleMatch ? titleMatch[1] : "POC Analysis Report");

        // Extract Summary (First paragraph after Description header, or just first 200 chars)
        // Heuristic: Find "Description" header, take next paragraph.
        let summary = "";
        const descMatch = result.match(/Description\s*\n+([^\n]+)/i);
        if (descMatch && descMatch[1]) {
            summary = descMatch[1].substring(0, 255);
        } else {
            summary = result.substring(0, 200).replace(/[#*]/g, '').trim();
        }

        await db.report.create({
            data: {
                title,
                summary,
                content: result,
                mode: mode === 'poc' ? 'report_poc' : 'report_def',
                pocs: mode === 'poc' ? {
                    create: {
                        // "POCs stored encrypted or masked"
                        content: sanitizeInput(pocContent),
                        type: 'RAW'
                    }
                } : undefined
            }
        });

        return { result };

    } catch (e: any) {
        console.error(e);
        return { error: 'Report generation failed. Check connection or API Key.' };
    }
}
