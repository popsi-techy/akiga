'use client';

import { ReportsListView } from '@/components/product/analytics/ReportsListView';
import { useSetBreadcrumbs } from '@/lib/breadcrumb';

/**
 * Governance Analytics — the reports list.
 *
 * The landing page is the report-management surface, never a generic dashboard: a
 * dashboard here would answer questions nobody asked and bury the one thing the
 * feature is for, which is producing a specific, downloadable answer about a
 * specific part of the organisation.
 *
 * Renamed from "Governance Explorer", which was a placeholder for a relationship
 * explorer. The governance *data* (`@/data/governance*`) predates both names and
 * survives them — the Applications detail page reads findings, approval hierarchy
 * and owner resolution from it.
 */
export default function GovernanceAnalyticsPage() {
  useSetBreadcrumbs([{ label: 'Governance Analytics' }]);
  return <ReportsListView />;
}
