'use client';

import { useParams } from 'next/navigation';
import { ReportEditor } from '@/components/product/analytics/v2/ReportEditor';

/**
 * Open a saved report — the shared editor loaded from the store.
 *
 * Same screen as create-from-scratch and open-from-template: the configuration on the left,
 * the report on the right, one Save that lights up when something changes. There is no
 * separate "read" and "edit" mode any more — a report is judged by how it reads, so the
 * form sits beside the document it produces rather than replacing it.
 */
export default function GovernanceAnalyticsV2ReportPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id ?? '';
  return <ReportEditor reportId={id} />;
}
