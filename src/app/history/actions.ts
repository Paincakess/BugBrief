'use server';

import { db } from '@/lib/db';
import { revalidatePath } from 'next/cache';

export async function getReports() {
    try {
        const reports = await db.report.findMany({
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                title: true,
                mode: true,
                createdAt: true,
                summary: true
            }
        });
        return { result: reports };
    } catch (error) {
        console.error("Error fetching reports:", error);
        return { error: "Failed to load history." };
    }
}

export async function getReport(id: string) {
    try {
        const report = await db.report.findUnique({
            where: { id },
            include: { pocs: true }
        });
        if (!report) return { error: "Report not found" };
        return { result: report };
    } catch (error) {
        console.error("Error fetching report:", error);
        return { error: "Failed to load report." };
    }
}

export async function deleteReport(id: string) {
    try {
        await db.report.delete({ where: { id } });
        revalidatePath('/history');
        return { success: true };
    } catch (error) {
        console.error("Error deleting report:", error);
        return { error: "Failed to delete report." };
    }
}

export async function updateReport(id: string, content: string) {
    try {
        // Extract title from the first H1 heading
        const titleMatch = content.match(/^#\s+(.+)$/m);
        const title = titleMatch ? titleMatch[1].trim() : undefined;

        // Extract summary from Description section (first paragraph after ## Description)
        let summary: string | undefined;
        const descMatch = content.match(/##\s*Description\s*\n+([^\n]+)/i);
        if (descMatch && descMatch[1]) {
            summary = descMatch[1].substring(0, 255).trim();
        }

        await db.report.update({
            where: { id },
            data: {
                content,
                ...(title && { title }),
                ...(summary && { summary })
            }
        });
        revalidatePath(`/history/${id}`);
        revalidatePath('/history');
        return { success: true };
    } catch (error) {
        console.error("Error updating report:", error);
        return { error: "Failed to update report." };
    }
}
