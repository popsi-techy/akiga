'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { NavCard, QuickFilter } from '@ds/components';
import {
  REPORT_CATEGORY_LABEL,
  type OperationalReport,
  type ReportCategory,
} from '@/data/reports';

const CATEGORIES = Object.keys(REPORT_CATEGORY_LABEL) as ReportCategory[];

/**
 * The registers an administrator runs — the hub's landing content.
 *
 * Twelve cards, four categories, so the categories are chips rather than a nested page:
 * one click narrows twelve things to three, and the reader stays on the grid they were
 * already reading. Making Access its own destination would have cost a click to show a
 * quarter of what is already on screen.
 *
 * The chips carry counts and clear back to all, because "Access" is a narrowing and not a
 * mode — there is no state of this screen where showing every register is wrong.
 *
 * Unbuilt registers keep their place with a Coming soon tag. The set of registers is itself
 * information: an administrator deciding whether this product can answer a question needs to
 * see the ones it will answer, not an absence they have to ask about.
 *
 * Rows are filtered upstream by the hub's search, so the count on the rail and the cards in
 * here are always the same population.
 */
export function OperationalReportsTab({
  reports,
  filtered = false,
}: {
  reports: OperationalReport[];
  /** Whether a search term produced this set — it changes what an empty grid means. */
  filtered?: boolean;
}) {
  const router = useRouter();
  const [category, setCategory] = React.useState<ReportCategory | null>(null);

  // Counts describe what is on the grid now, not the catalogue: a chip reading "Access 4"
  // under a search that matched one access register would be a promise the click breaks.
  const options = CATEGORIES.map((c) => ({
    value: c,
    label: REPORT_CATEGORY_LABEL[c],
    count: reports.filter((r) => r.category === c).length,
  })).filter((o) => o.count > 0);

  const shown = category ? reports.filter((r) => r.category === category) : reports;

  return (
    <div className="space-y-4">
      {options.length > 1 && (
        <QuickFilter
          ariaLabel="Filter registers by category"
          options={options}
          value={category}
          onChange={setCategory}
        />
      )}

      {shown.length === 0 ? (
        <p className="rounded-xl border border-border bg-surface px-6 py-10 text-center text-body-sm text-text-secondary">
          {filtered
            ? 'No register in this category matches the search.'
            : 'No registers are catalogued yet.'}
        </p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {shown.map((r) => (
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
      )}
    </div>
  );
}
