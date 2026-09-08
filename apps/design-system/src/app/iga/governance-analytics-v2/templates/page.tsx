'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import ArrowForwardOutlined from '@mui/icons-material/ArrowForwardOutlined';
import AssessmentOutlined from '@mui/icons-material/AssessmentOutlined';
import SearchOutlined from '@mui/icons-material/SearchOutlined';
import { Button, Input, Modal, NavList, StatusChip } from '@ds/components';
import { AtmosphericBackground } from '@/components/atmosphere/AtmosphericBackground';
import {
  CATEGORY_HEADING,
  REPORT_TEMPLATES_V2,
  REPORT_TEMPLATE_CATEGORIES,
  describeOrganization,
  getReportV2,
  sectionDefById,
  timelineById,
  type ReportTemplateV2,
  type ReportV2,
  type SectionCategory,
} from '@/data/governance-analytics-v2';
import { useSetBreadcrumbs } from '@/lib/breadcrumb';

/**
 * Create a report — the template gallery.
 *
 * Same machinery as the workflow and email galleries: a banner with search and a
 * start-from-scratch escape, a category rail, and a card grid that scrolls under it. Three
 * galleries that behaved differently would be three things to learn for one idea.
 *
 * One template is built and one holds its place. A coming-soon card is not a placeholder
 * for its own sake — the set of reports the product intends to answer is itself
 * information, and hiding the unbuilt ones would make the catalogue look finished at one.
 */
function ReportTemplateCard({
  template,
  onPreview,
  onUse,
}: {
  template: ReportTemplateV2;
  onPreview: () => void;
  onUse: () => void;
}) {
  const soon = template.status === 'comingSoon';
  return (
    <article
      className={[
        'flex h-full flex-col rounded-xl border border-border p-4 transition-colors',
        // Present but not yet available: it keeps its place in the grid and recedes, so
        // nothing invites a click that would do nothing.
        soon ? 'bg-subtle' : 'bg-surface hover:border-border-strong hover:shadow-sm',
      ].join(' ')}
    >
      {/* Not the category — the grid is already grouped under a category heading, and a
          chip repeating it would spend the card's one badge saying nothing. What a reader
          cannot tell otherwise is that this card opens a report that already exists. */}
      <div className="flex flex-wrap items-center gap-1.5 self-start">
        {soon ? (
          <StatusChip intent="neutral" label="Coming soon" />
        ) : (
          <StatusChip intent="info" label="Sample report" />
        )}
      </div>
      <h3 className="mt-2 truncate text-body-strong text-text-primary">{template.name}</h3>
      <p className="mt-0.5 line-clamp-2 text-body-sm text-text-secondary">{template.description}</p>
      <div className="mt-auto flex flex-wrap items-center justify-end gap-3 pt-3">
        {soon ? (
          <span className="text-caption-medium text-text-tertiary">Not available yet</span>
        ) : (
          <>
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
              Open report
            </button>
          </>
        )}
      </div>
    </article>
  );
}

/** What the template's report actually contains, read from the stored report itself. */
function ReportTemplatePreview({
  template,
  report,
}: {
  template: ReportTemplateV2;
  report: ReportV2 | null;
}) {
  return (
    <div className="space-y-5">
      <div>
        <p className="text-caption-medium text-text-secondary">Answers</p>
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

      {report ? (
        <>
          {/* What the report is *about* comes before its section list: a list of sections
              means nothing until you know which slice of the organisation it ran over. */}
          <dl className="grid gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-caption text-text-tertiary">About</dt>
              <dd className="mt-0.5 text-body-sm text-text-primary">
                {describeOrganization(report.organization)}
              </dd>
            </div>
            <div>
              <dt className="text-caption text-text-tertiary">Period</dt>
              <dd className="mt-0.5 text-body-sm text-text-primary">
                {timelineById(report.timelineId)?.label ?? '—'}
              </dd>
              <dd className="text-caption text-text-tertiary">
                {timelineById(report.timelineId)?.covers}
              </dd>
            </div>
          </dl>

          <div>
            <p className="text-caption text-text-tertiary">Sections, in the order they appear</p>
            <ol className="mt-2 space-y-2">
              {report.sections.map((cfg, i) => {
                const def = sectionDefById(cfg.id);
                if (!def) return null;
                return (
                  <li key={cfg.id} className="rounded-lg border border-border-subtle bg-surface p-4">
                    <div className="flex items-baseline gap-2">
                      <span className="text-caption tabular-nums text-text-tertiary">{i + 1}</span>
                      <h3 className="min-w-0 flex-1 truncate text-body-strong text-text-primary">
                        {def.title}
                      </h3>
                      <span className="shrink-0 text-caption text-text-tertiary">{def.category}</span>
                    </div>
                    <p className="mt-1 text-body-sm text-text-secondary">{def.description}</p>
                    <p className="mt-2 text-caption text-text-tertiary">
                      {def.columns.length} columns — {def.charts.length} charts —{' '}
                      {def.filters.length} filters of its own
                    </p>
                  </li>
                );
              })}
            </ol>
          </div>

          <p className="text-body-sm text-text-secondary">
            Opening it changes nothing. The scope, the period, which sections are in it and how each
            one is narrowed are all editable from the report itself.
          </p>
        </>
      ) : (
        <p className="text-body-sm text-text-secondary">
          The report behind this template is no longer saved. Start from scratch to build one.
        </p>
      )}
    </div>
  );
}

export default function GovernanceAnalyticsV2TemplatesPage() {
  const router = useRouter();
  useSetBreadcrumbs([
    { label: 'Governance Analytics V2', href: '/iga/governance-analytics-v2' },
    { label: 'Create report' },
  ]);

  const [query, setQuery] = React.useState('');
  const [active, setActive] = React.useState<SectionCategory>('Access');
  const [preview, setPreview] = React.useState<ReportTemplateV2 | null>(null);
  // localStorage-backed, so read after mount rather than during render.
  const [previewReport, setPreviewReport] = React.useState<ReportV2 | null>(null);
  const scroller = React.useRef<HTMLDivElement>(null);
  const sections = React.useRef(new Map<SectionCategory, HTMLElement>());

  React.useEffect(() => {
    setPreviewReport(preview?.reportId ? getReportV2(preview.reportId) : null);
  }, [preview]);

  const q = query.trim().toLowerCase();
  const matches = React.useMemo(
    () =>
      REPORT_TEMPLATES_V2.filter(
        (t) =>
          !q ||
          t.name.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q) ||
          t.category.toLowerCase().includes(q) ||
          t.covers.some((c) => c.toLowerCase().includes(q)),
      ),
    [q],
  );

  const byCategory = React.useCallback(
    (category: SectionCategory) => matches.filter((t) => t.category === category),
    [matches],
  );
  const visibleCategories = REPORT_TEMPLATE_CATEGORIES.filter((c) => byCategory(c).length > 0);

  const jumpTo = (category: SectionCategory) => {
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

  const openReport = (template: ReportTemplateV2) => {
    if (!template.reportId) return;
    router.push(`/iga/governance-analytics-v2/report/${template.reportId}`);
  };

  const scratch = () => router.push('/iga/governance-analytics-v2/create');

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
              onChange={(id) => jumpTo(id as SectionCategory)}
              items={REPORT_TEMPLATE_CATEGORIES.map((category) => ({
                id: category,
                label: CATEGORY_HEADING[category],
                count: byCategory(category).length,
              }))}
            />
          </aside>

          <div
            ref={scroller}
            onScroll={onScroll}
            className="ds-scroll min-h-0 min-w-0 flex-1 overflow-y-auto"
          >
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
                          onUse={() => openReport(template)}
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
            <Button
              endIcon={<ArrowForwardOutlined />}
              onClick={() => {
                const template = preview;
                setPreview(null);
                if (template) openReport(template);
              }}
            >
              Open the report
            </Button>
          </>
        }
      >
        {preview ? <ReportTemplatePreview template={preview} report={previewReport} /> : null}
      </Modal>
    </>
  );
}
