'use client';

import * as React from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { Button } from '@ds/components';
import Link from 'next/link';
import {
  blankReport,
  getReport,
  reportFromTemplate,
  templateById,
  type Report,
} from '@/data/governance-analytics';
import { ReportWorkspace } from '@/components/product/analytics/ReportWorkspace';
import { useSetBreadcrumbs } from '@/lib/breadcrumb';

/**
 * The report workspace route.
 *
 * `/report/new` is the unsaved case — a template's defaults, or a blank report —
 * and `/report/:id` is a stored one. One route rather than two because the screen
 * is identical either way: a report that has never been generated is still a
 * report, and the difference is a timestamp, not a layout.
 *
 * `?template=` seeds a new report; `?configure=1` lands with the panel open, which
 * is what the list's Edit action means.
 */
/**
 * `useSearchParams` opts a page into client-side rendering, and Next refuses to
 * prerender the route unless the component reading it sits under a Suspense
 * boundary. The local build tolerates it for a dynamic `[id]` segment; the
 * production build does not, and it fails at *export* time with
 * "missing-suspense-with-csr-bailout" rather than at compile — which is how it
 * reaches a deploy. The other two pages here reading search params carry the same
 * boundary.
 */
export default function ReportWorkspacePage() {
  return (
    <React.Suspense fallback={<div className="p-6 text-body-sm text-text-tertiary">Loading report…</div>}>
      <ReportWorkspaceRoute />
    </React.Suspense>
  );
}

function ReportWorkspaceRoute() {
  const params = useParams<{ id: string }>();
  const search = useSearchParams();
  const id = params?.id ?? 'new';
  const templateId = search?.get('template') ?? null;
  const configure = search?.get('configure') === '1';

  // localStorage-backed, so resolve after mount. `undefined` means "still
  // looking", which is different from `null` meaning "no such report".
  const [initial, setInitial] = React.useState<Report | null | undefined>(undefined);

  React.useEffect(() => {
    if (id === 'new') {
      const t = templateById(templateId);
      setInitial(t ? reportFromTemplate(t) : blankReport());
      return;
    }
    setInitial(getReport(id));
  }, [id, templateId]);

  useSetBreadcrumbs(
    React.useMemo(
      () => [
        { label: 'Governance Analytics', href: '/iga/governance-analytics' },
        { label: initial?.name || (id === 'new' ? 'New report' : 'Report') },
      ],
      [initial?.name, id],
    ),
  );

  if (initial === undefined) {
    return <div className="p-6 text-body-sm text-text-tertiary">Loading report…</div>;
  }

  if (initial === null) {
    return (
      <div className="px-6 py-12">
        <div className="mx-auto max-w-md rounded-xl border border-border bg-surface p-6 text-center">
          <div className="text-h5 text-text-primary">That report no longer exists</div>
          <p className="mt-1 text-body-sm text-text-secondary">
            It may have been deleted from another tab. The reports list has everything that is still saved.
          </p>
          <div className="mt-4">
            <Link href="/iga/governance-analytics">
              <Button variant="secondary">Back to reports</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Keyed on the resolved id so navigating between reports remounts the workspace
  // rather than leaving the previous report's draft state in place.
  return <ReportWorkspace key={initial.id || 'new'} initial={initial} openConfigInitially={configure} />;
}
