'use server';

import { generateExplainer } from '@/lib/ai';

export type ExplainerState = {
    result?: string;
    error?: string;
};

export async function submitExplainer(prevState: any, formData: FormData): Promise<{ result?: string; error?: string }> {
    const name = formData.get('name') as string;
    const summary = formData.get('summary') as string;
    const description = formData.get('description') as string;
    const audience = formData.get('audience') as "BOD" | "PM" | "DEV" | "QA" | "NTP";

    if (!name && !summary) {
        return { error: 'Please provide at least a name or summary.' };
    }

    try {
        const explanation = await generateExplainer({ name, summary, description }, audience);
        return { result: explanation };
    } catch (e: any) {
        console.error(e);
        return { error: 'Failed to generate explanation. Check API Key.' };
    }
}
