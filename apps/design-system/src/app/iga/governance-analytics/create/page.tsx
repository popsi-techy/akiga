'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import ArrowForwardOutlined from '@mui/icons-material/ArrowForward';
import { Button, StatusChip } from '@ds/components';
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

  const [flagship, ...rest] = REPORT_TEMPLATES;

  const use = (templateId: string) =>
    router.push(`/iga/governance-analytics/report/new?template=${templateId}`);

  return (
    <div className="ds-scroll h-full overflow-y-auto">
      <div className="mx-auto max-w-4xl pb-10">
        <h1 className="text-h2 text-text-primary">Create a report</h1>
        <p className="mt-1 text-body-sm text-text-secondary">
          Start with a template, or build one from scratch.
        </p>

        <div className="mt-6 space-y-4">
          {/* Recommended: tinted and full width. The one orange on this screen is
              its Use template button — see visual-language §5.1. */}
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

          {/* Dashed, and last: it is the escape hatch, not the recommendation. */}
          <button
            type="button"
            onClick={() => router.push('/iga/governance-analytics/report/new')}
            className="flex w-full items-center justify-between gap-4 rounded-xl border border-dashed border-border-strong bg-surface px-6 py-5 text-left transition-colors hover:bg-surface-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-subtle"
          >
            <span className="min-w-0">
              <span className="block text-body-strong text-text-primary">Start from scratch</span>
              <span className="mt-0.5 block text-body-sm text-text-secondary">
                An empty report. Choose the scope, then add the plots and tables you want.
              </span>
            </span>
            <ArrowForwardOutlined sx={{ fontSize: 18 }} className="shrink-0 text-icon" />
          </button>
        </div>

        {REPORT_TEMPLATES.length === 1 && (
          <p className="mt-6 text-caption text-text-tertiary">
            More templates — Application, Policy, Access Risk and Ownership — are next. Each one is the same
            machinery with different defaults, so anything you can build from scratch today they will preset
            for you.
          </p>
        )}
      </div>
    </div>
  );
}
