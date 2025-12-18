import { getReport } from '../actions';
import ReportEditor from './ReportEditor';
import { notFound } from 'next/navigation';

export default async function ReportDetailPage({ params }: { params: { id: string } }) {
    const { id } = await params;
    const { result, error } = await getReport(id);

    if (error || !result) {
        notFound();
    }

    return <ReportEditor initialReport={result} />;
}
