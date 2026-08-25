'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import ArrowForwardOutlined from '@mui/icons-material/ArrowForward';
import SearchOutlined from '@mui/icons-material/SearchOutlined';
import { Button, Input, StatusChip } from '@ds/components';
import { AtmosphericBackground } from '@/components/atmosphere/AtmosphericBackground';
import { REPORT_TEMPLATES } from '@/data/governance-analytics';
import { useSetBreadcrumbs } from '@/lib/breadcrumb';

/**
 * Create a report — the template picker.
 *
 * Templates first, scratch second, because the reader's problem is almost never
 * "assemble a report" — it is "show me Finance". A template answers that in one
 * click and stays editable afterwards, which is why picking one opens the
 * workspace with the report already rendered rather than a form.
 *
 * The flagship template gets the full-width card. Ranking them is the point: a
 * grid of equal cards makes the reader compare five things they cannot yet
 * evaluate, where one recommended card and a row of alternates makes the common
 * case obvious.
 */
export default function CreateReportPage() {
  const router = useRouter();
  useSetBreadcrumbs([
    { label: 'Governance Analytics', href: '/iga/governance-analytics' },
    { label: 'Create report' },
  ]);

  const [query, setQuery] = React.useState('');
  const q = query.trim().toLowerCase();
  const matches = React.useMemo(
    () =>
      REPORT_TEMPLATES.filter(
        (t) =>
          !q ||
          t.name.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q) ||
          t.covers.some((c) => c.toLowerCase().includes(q)),
      ),
    [q],
  );
  const [flagship, ...rest] = matches;

  const use = (templateId: string) =>
    router.push(`/iga/governance-analytics/report/new?template=${templateId}`);

  const scratch = () => router.push('/iga/governance-analytics/report/new');

  return (
    <div className="-mx-8 -my-6 flex h-[calc(100%+3rem)] flex-col">
      <header className="relative shrink-0 overflow-hidden border-b border-border px-6 py-7">
        <AtmosphericBackground />
        <div className="relative mx-auto flex w-full max-w-2xl flex-col items-center text-center">
          <h1 className="text-balance text-h3 text-text-primary">
            Start reporting faster with ready-to-use templates
          </h1>
          <div className="mt-3 w-full max-w-xl">
            <Input
              placeholder="Search report templates…"
              aria-label="Search report templates"
              size="md"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              startAdornment={<SearchOutlined sx={{ fontSize: 18 }} />}
            />
          </div>
          <p className="mt-2.5 text-body-sm text-text-secondary">
            Want a blank canvas?{' '}
            <button
              type="button"
              className="text-body-sm-medium text-text-link hover:underline"
              onClick={scratch}
            >
              Start from scratch
            </button>
          </p>
        </div>
      </header>

      <div className="ds-scroll min-h-0 flex-1 overflow-y-auto px-6 py-5">
        <div className="mx-auto max-w-4xl space-y-4">
          {matches.length === 0 && q ? (
            <p className="text-body-sm text-text-secondary">
              Nothing matches “{query.trim()}”. Clear the search, or start from scratch above.
            </p>
          ) : (
            <>
              {flagship && (
                <div className="rounded-xl border border-border bg-subtle p-6">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h2 className="text-h4 text-text-primary">{flagship.name}</h2>
                        <StatusChip intent="info" label="Recommended" />
                      </div>
                      <p className="mt-1 max-w-xl text-body-sm text-text-secondary">{flagship.description}</p>
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {flagship.covers.map((c) => (
                          <span
                            key={c}
                            className="rounded-pill border border-border bg-surface px-2.5 py-0.5 text-caption-medium text-text-secondary"
                          >
                            {c}
                          </span>
                        ))}
                      </div>
                      <p className="mt-3 text-caption text-text-tertiary">
                        {flagship.sections.length} sections and {flagship.plots.length} plots included
                      </p>
                    </div>
                    <Button endIcon={<ArrowForwardOutlined />} onClick={() => use(flagship.id)}>
                      Use template
                    </Button>
                  </div>
                </div>
              )}

              {rest.length > 0 && (
                <div className="grid gap-4 sm:grid-cols-2">
                  {rest.map((t) => (
                    <div key={t.id} className="flex flex-col rounded-xl border border-border bg-surface p-5">
                      <h3 className="text-body-strong text-text-primary">{t.name}</h3>
                      <p className="mt-1 flex-1 text-body-sm text-text-secondary">{t.description}</p>
                      <p className="mt-3 text-caption text-text-tertiary">
                        {t.sections.length} sections · {t.plots.length} plots
                      </p>
                      <div className="mt-3">
                        <Button variant="secondary" size="sm" onClick={() => use(t.id)}>
                          Use template
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {REPORT_TEMPLATES.length === 1 && !q && (
            <p className="text-caption text-text-tertiary">
              More templates — Application, Policy, Access Risk and Ownership — are next. Each one is the same
              machinery with different defaults, so anything you can build from scratch today they will preset
              for you.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
