'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import SearchOutlined from '@mui/icons-material/SearchOutlined';
import { Input, NavCard, QuickFilter } from '@ds/components';
import {
  OPERATIONAL_REPORTS,
  REPORT_CATEGORY_LABEL,
  type OperationalReport,
  type ReportCategory,
} from '@/data/reports';

const CATEGORIES = Object.keys(REPORT_CATEGORY_LABEL) as ReportCategory[];

/**
 * The registers an administrator runs — the hub's landing tab.
 *
 * Twelve cards, four categories. Chips narrow the grid in place; search finds a register
 * by name without leaving the catalogue.
 */
export function OperationalReportsTab({
  reports = OPERATIONAL_REPORTS,
}: {
  reports?: OperationalReport[];
}) {
  const router = useRouter();
  const [category, setCategory] = React.useState<ReportCategory | null>(null);
  const [query, setQuery] = React.useState('');

  const q = query.trim().toLowerCase();
  const searched = reports.filter(
    (r) =>
      !q ||
      r.name.toLowerCase().includes(q) ||
      r.description.toLowerCase().includes(q) ||
      REPORT_CATEGORY_LABEL[r.category].toLowerCase().includes(q),
  );

  const options = CATEGORIES.map((c) => ({
    value: c,
    label: REPORT_CATEGORY_LABEL[c],
    count: searched.filter((r) => r.category === c).length,
  })).filter((o) => o.count > 0);

  const shown = category ? searched.filter((r) => r.category === category) : searched;

  return (
    <div className="ds-scroll flex min-h-0 flex-1 flex-col overflow-y-auto">
      <div className="mb-4 flex shrink-0 flex-wrap items-center gap-3">
        <div className="w-full max-w-sm">
          <Input
            aria-label="Search registers"
            placeholder="Search registers"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            startAdornment={<SearchOutlined sx={{ fontSize: 18 }} className="text-icon-subtle" />}
          />
        </div>
        {options.length > 1 && (
          <QuickFilter
            ariaLabel="Filter registers by category"
            options={options}
            value={category}
            onChange={setCategory}
          />
        )}
      </div>

      {shown.length === 0 ? (
        <p className="rounded-xl border border-border bg-surface px-6 py-10 text-center text-body-sm text-text-secondary">
          {q ? 'No register matches that search.' : 'No registers are catalogued yet.'}
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
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
