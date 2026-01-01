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

        const images: { inlineData: { data: string; mimeType: string } }[] = [];
        const dbImages: { base64: string; mimeType: string }[] = [];


        if (mode === 'poc') {
            // Handle Images first to check if we have any
            const files = formData.getAll('pocImages') as File[];
            for (const file of files) {
                if (file.size > 0 && file.type.startsWith('image/')) {
                    const arrayBuffer = await file.arrayBuffer();
                    const buffer = Buffer.from(arrayBuffer);
                    const base64 = buffer.toString('base64');

                    images.push({
                        inlineData: {
                            data: base64,
                            mimeType: file.type
                        }
                    });

                    dbImages.push({
                        base64,
                        mimeType: file.type
                    });
                }
            }

            if (!pocContent && images.length === 0) {
                return { error: "Please paste POC logs or upload an image." };
            }

            const safeContent = sanitizeInput(pocContent);
            result = await generateReport({
                pocMode: true,
                pocContent: safeContent,
                images // Pass images to AI
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


        // Extract title (Simple heuristic: First line if header, or fallback)
        const titleMatch = result.match(/^#\s+(.*?)$/m);
        const title = mode === 'def' ? vulName : (titleMatch ? titleMatch[1] : "POC Analysis Report");

        // Extract Summary (First paragraph after Description header, or just first 200 chars)
        let summary = "";
        const descMatch = result.match(/Description\s*\n+([^\n]+)/i);
        if (descMatch && descMatch[1]) {
            summary = descMatch[1].substring(0, 255);
        } else {
            summary = result.substring(0, 200).replace(/[#*]/g, '').trim();
        }

        // Return everything needed to save state on client, but DO NOT save to DB yet.
        return {
            result,
            metadata: {
                title,
                summary,
                mode,
                pocContent: mode === 'poc' ? sanitizeInput(pocContent) : undefined,
                images: mode === 'poc' ? dbImages : undefined, // pass back the base64 images so we can save them later
                vulName: mode === 'def' ? vulName : undefined,
                abuse: mode === 'def' ? abuse : undefined
            }
        };


    } catch (e: any) {
        console.error(e);
        return { error: 'Report generation failed: ' + (e.message || e) };
    }
}


export async function saveReport(formData: FormData) {
    try {
        const content = formData.get('content') as string;
        const metadataString = formData.get('metadata') as string;

        if (!content || !metadataString) {
            throw new Error("Missing content or metadata");
        }

        const metadata = JSON.parse(metadataString);

        await db.report.create({
            data: {
                title: metadata.title || "Untitled Report",
                summary: metadata.summary || "",
                content: content,
                mode: metadata.mode === 'poc' ? 'report_poc' : 'report_def',
                pocs: metadata.mode === 'poc' ? {
                    create: {
                        content: metadata.pocContent || "",
                        type: 'RAW',
                        images: {
                            // Correctly map the images array to the nested create syntax if they exist
                            create: (metadata.images || []).map((img: any) => ({
                                base64: img.base64,
                                mimeType: img.mimeType
                            }))
                        }
                    }
                } : undefined
            }
        });
        return { success: true };
    } catch (e: any) {
        console.error(e);
        return { error: 'Failed to save report: ' + e.message };
    }
}
