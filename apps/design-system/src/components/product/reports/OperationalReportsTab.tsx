'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { NavCard } from '@ds/components';
import { OPERATIONAL_REPORTS, REPORT_CATEGORY_LABEL } from '@/data/reports';

/**
 * The registers an administrator runs — the page's landing content.
 *
 * No toolbar. Twelve cards fit on one screen and each carries its category as a tag, so
 * filtering by category narrows twelve things to four and searching finds what is already
 * in front of you. A control row that saves nobody a scroll is chrome charging rent on the
 * first thing the reader sees. It earns its place again when this list is long enough that
 * the answer is below the fold.
 *
 * Unbuilt registers keep their place with a Coming soon tag. The set of registers is itself
 * information: an administrator deciding whether this product can answer a question needs to
 * see the ones it will answer, not an absence they have to ask about.
 */
export function OperationalReportsTab() {
  const router = useRouter();

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {OPERATIONAL_REPORTS.map((r) => (
        <NavCard
          key={r.id}
          title={r.name}
          description={r.description}
          count={r.href ? r.rows : undefined}
          tags={r.href ? [REPORT_CATEGORY_LABEL[r.category]] : ['Coming soon']}
          disabled={!r.href}
          onClick={r.href ? () => router.push(r.href as string) : undefined}
        />
      ))}
    </div>
  );
}
