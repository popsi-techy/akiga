'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import ArrowForwardOutlined from '@mui/icons-material/ArrowForwardOutlined';
import AssessmentOutlined from '@mui/icons-material/AssessmentOutlined';
import SearchOutlined from '@mui/icons-material/SearchOutlined';
import { Button, Input, Modal, NavList, StatusChip } from '@ds/components';
import { AtmosphericBackground } from '@/components/atmosphere/AtmosphericBackground';
import {
  REPORT_TEMPLATES,
  SCOPE_TYPE_LABEL,
  type ReportTemplate,
  type ScopeType,
} from '@/data/governance-analytics';
import { useSetBreadcrumbs } from '@/lib/breadcrumb';

const REPORT_CATEGORIES: ScopeType[] = [
  'department',
  'application',
  'policyType',
  'identityType',
  'governanceTeam',
];

const CATEGORY_HEADING: Record<ScopeType, string> = {
  department: 'Department templates',
  application: 'Application templates',
  policyType: 'Policy templates',
  identityType: 'Identity templates',
  governanceTeam: 'Ownership templates',
};

function ReportTemplateCard({
  template,
  onPreview,
  onUse,
}: {
  template: ReportTemplate;
  onPreview: () => void;
  onUse: () => void;
}) {
  return (
    <article className="flex h-full flex-col rounded-xl border border-border bg-surface p-4 transition-all duration-200 hover:border-border-strong hover:shadow-sm">
      <div className="flex flex-wrap items-center gap-1.5 self-start">
        <StatusChip intent="info" label={template.type} />
      </div>
      <h3 className="mt-2 truncate text-body-strong text-text-primary">{template.name}</h3>
      <p className="mt-0.5 line-clamp-2 text-body-sm text-text-secondary">{template.description}</p>
      <div className="mt-auto flex flex-wrap items-center justify-end gap-3 pt-3">
        <button
          type="button"
          className="text-caption-medium text-text-secondary hover:text-text-primary hover:underline"
          onClick={onPreview}
        >
          Preview
        </button>
        <button
          type="button"
          className="rounded-sm bg-surface-inverse px-2.5 py-1 text-caption-medium text-text-inverse hover:bg-sidebar focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-subtle"
          onClick={onUse}
        >
          Use template
        </button>
      </div>
    </article>
  );
}

function ReportTemplatePreview({ template }: { template: ReportTemplate }) {
  return (
    <div className="space-y-5">
      <p className="text-body-sm text-text-secondary">{template.description}</p>
      <div>
        <p className="text-caption-medium text-text-secondary">Covers</p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {template.covers.map((topic) => (
            <span
              key={topic}
              className="rounded-pill border border-border bg-subtle px-2.5 py-0.5 text-caption-medium text-text-secondary"
            >
              {topic}
            </span>
          ))}
        </div>
      </div>
      <p className="text-body-sm text-text-secondary">
        {template.sections.length} sections and {template.plots.length} plots are included. Open the workspace to
        adjust scope, filters, and layout before saving.
      </p>
    </div>
  );
}

/**
 * Create a report — the template picker.
 *
 * Same machinery as the workflow template gallery: search banner, category rail,
 * and a two-up card grid. Picking a template opens the workspace with the report
 * already rendered; scratch skips the preset.
 */
export default function CreateReportPage() {
  const router = useRouter();
  useSetBreadcrumbs([
    { label: 'Governance Analytics', href: '/iga/governance-analytics' },
    { label: 'Create report' },
  ]);

  const [query, setQuery] = React.useState('');
  const [active, setActive] = React.useState<ScopeType>('department');
  const [preview, setPreview] = React.useState<ReportTemplate | null>(null);
  const scroller = React.useRef<HTMLDivElement>(null);
  const sections = React.useRef(new Map<ScopeType, HTMLElement>());

  const q = query.trim().toLowerCase();
  const matches = React.useMemo(
    () =>
      REPORT_TEMPLATES.filter(
        (t) =>
          !q ||
          t.name.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q) ||
          t.type.toLowerCase().includes(q) ||
          t.covers.some((c) => c.toLowerCase().includes(q)),
      ),
    [q],
  );

  const byCategory = React.useCallback(
    (category: ScopeType) => matches.filter((t) => t.scopeType === category),
    [matches],
  );
  const visibleCategories = REPORT_CATEGORIES.filter((category) => byCategory(category).length > 0);

  const jumpTo = (category: ScopeType) => {
    setActive(category);
    const el = sections.current.get(category);
    const box = scroller.current;
    if (!el || !box) return;
    box.scrollTo({ top: el.offsetTop - box.offsetTop, behavior: 'smooth' });
  };

  const onScroll = () => {
    const box = scroller.current;
    if (!box) return;
    const atBottom = box.scrollTop + box.clientHeight >= box.scrollHeight - 2;
    let current = visibleCategories[0];
    if (atBottom) {
      current = visibleCategories[visibleCategories.length - 1];
    } else {
      for (const category of visibleCategories) {
        const el = sections.current.get(category);
        if (el && el.offsetTop - box.offsetTop <= box.scrollTop + 24) current = category;
      }
    }
    if (current && current !== active) setActive(current);
  };

  const use = (templateId: string) =>
    router.push(`/iga/governance-analytics/report/new?template=${templateId}`);

  const usePreview = () => {
    if (!preview) return;
    const template = preview;
    setPreview(null);
    use(template.id);
  };

  const scratch = () => router.push('/iga/governance-analytics/report/new');

  return (
    <>
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

      <div className="flex min-h-0 min-w-0 flex-1 gap-5 px-6 py-5">
        <aside className="flex w-56 shrink-0 flex-col rounded-xl border border-border bg-surface px-3 py-4">
          <h2 className="mb-3 px-1 text-overline uppercase text-text-tertiary">Categories</h2>
          <NavList
            ariaLabel="Report template categories"
            value={active}
            onChange={(id) => jumpTo(id as ScopeType)}
            items={REPORT_CATEGORIES.map((category) => ({
              id: category,
              label: SCOPE_TYPE_LABEL[category],
              count: byCategory(category).length,
            }))}
          />
        </aside>

        <div ref={scroller} onScroll={onScroll} className="ds-scroll min-h-0 min-w-0 flex-1 overflow-y-auto">
          {matches.length === 0 && q ? (
            <p className="text-body-sm text-text-secondary">
              Nothing matches “{query.trim()}”. Clear the search, or start from scratch above.
            </p>
          ) : (
            <div className="flex flex-col gap-8">
              {visibleCategories.map((category) => (
                <section
                  key={category}
                  ref={(el) => {
                    if (el) sections.current.set(category, el);
                    else sections.current.delete(category);
                  }}
                >
                  <h2 className="text-h5 text-text-primary">{CATEGORY_HEADING[category]}</h2>
                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    {byCategory(category).map((template) => (
                      <ReportTemplateCard
                        key={template.id}
                        template={template}
                        onPreview={() => setPreview(template)}
                        onUse={() => use(template.id)}
                      />
                    ))}
                  </div>
                </section>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>

      <Modal
        open={preview !== null}
        onClose={() => setPreview(null)}
        title={preview?.name ?? ''}
        subtitle={preview?.description}
        icon={<AssessmentOutlined sx={{ fontSize: 22 }} />}
        width={720}
        footer={
          <>
            <Button variant="tertiary" onClick={() => setPreview(null)}>
              Close
            </Button>
            <Button endIcon={<ArrowForwardOutlined />} onClick={usePreview}>
              Use this template
            </Button>
          </>
        }
      >
        {preview ? <ReportTemplatePreview template={preview} /> : null}
      </Modal>
    </>
  );
}
