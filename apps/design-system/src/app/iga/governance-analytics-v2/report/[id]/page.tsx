'use client';

import * as React from 'react';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import AddOutlined from '@mui/icons-material/AddOutlined';
import CheckOutlined from '@mui/icons-material/CheckOutlined';
import CloseOutlined from '@mui/icons-material/CloseOutlined';
import DescriptionOutlined from '@mui/icons-material/DescriptionOutlined';
import EditOutlined from '@mui/icons-material/EditOutlined';
import TuneOutlined from '@mui/icons-material/TuneOutlined';
import ViewAgendaOutlined from '@mui/icons-material/ViewAgendaOutlined';
import { Button, FormSection, Menu, StatusChip } from '@ds/components';
import { ReportSectionBlock } from '@/components/product/analytics/v2/ReportSectionBlock';
import {
  NameAndDescriptionFields,
  ScopeFields,
  SectionFields,
  availableSections,
  commitDockSections,
  dockSectionCandidates,
  newSection,
} from '@/components/product/analytics/v2/ReportConfigFields';
import { deriveSection, type DerivedSection } from '@/data/governance-analytics-v2-derive';
import {
  OVERVIEW_SECTION_ID,
  describeOrganization,
  getReportV2,
  moveSection,
  timelineById,
  updateReportV2,
  type ReportV2,
} from '@/data/governance-analytics-v2';
import { formatDateTime } from '@/lib/datetime';
import { useSetBreadcrumbs } from '@/lib/breadcrumb';

/**
 * A rendered report, and the dock that changes it.
 *
 * Reading and editing are the same screen rather than two. A report is judged by how it
 * reads, so a separate builder would have the reader configuring one artifact while looking
 * at another — every change here lands in the document immediately, and the dock is the
 * form beside it, not a mode that replaces it.
 *
 * The dock is a right-hand slider, not a modal Drawer: covering the report with the
 * thing that edits it would hide the effect of every change. The report reflows into
 * the remaining width. V1 docks the same job on the left; this one takes the right
 * edge so the document keeps its reading start.
 *
 * Edit mode is still a mode, for one reason: it puts move buttons on every
 * section. Those are chrome a reader does not want on a document they came to read.
 */
/**
 * `useSearchParams` opts the page into client rendering, and Next refuses to prerender the
 * route unless the component reading it sits under a Suspense boundary — the production
 * build fails at export with "missing-suspense-with-csr-bailout" where the local one does
 * not, which is how it reaches a deploy. Same boundary V1's workspace route carries.
 */
export default function GovernanceAnalyticsV2ReportPage() {
  return (
    <React.Suspense fallback={<div className="p-6 text-body-sm text-text-tertiary">Loading report…</div>}>
      <ReportRoute />
    </React.Suspense>
  );
}

function ReportRoute() {
  const params = useParams<{ id: string }>();
  const search = useSearchParams();
  const id = params?.id ?? '';

  // localStorage-backed, so resolve after mount. `undefined` is "still looking", which is
  // a different screen from `null` meaning "no such report".
  const [report, setReport] = React.useState<ReportV2 | null | undefined>(undefined);
  const [editing, setEditing] = React.useState(false);
  const [dockOpen, setDockOpen] = React.useState(false);

  React.useEffect(() => {
    const found = getReportV2(id);
    setReport(found);
    // `?edit=1` is what the list's Edit action means: land with the dock already open.
    if (found && search?.get('edit') === '1') {
      setEditing(true);
      setDockOpen(true);
    }
  }, [id, search]);

  const finishEditing = React.useCallback(() => {
    setEditing(false);
    setDockOpen(false);
  }, []);

  React.useEffect(() => {
    if (!dockOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') finishEditing();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [dockOpen, finishEditing]);

  useSetBreadcrumbs(
    React.useMemo(
      () => [
        { label: 'Governance Analytics V2', href: '/iga/governance-analytics-v2' },
        { label: report?.name || 'Report' },
      ],
      [report?.name],
    ),
  );

  /** Write through to the store on every change — the dock has no Save, so there is no
   *  moment where the page and the store disagree about what the report is. */
  const apply = React.useCallback(
    (patch: Partial<Omit<ReportV2, 'id'>>) => {
      if (!report) return;
      const next = updateReportV2(report.id, patch);
      if (next) setReport(next);
    },
    [report],
  );

  const sections: DerivedSection[] = React.useMemo(() => {
    if (!report) return [];
    return report.sections
      .map((cfg) => deriveSection(cfg, report.organization, report.sections))
      .filter((s): s is DerivedSection => s !== null);
  }, [report]);

  if (report === undefined) {
    return <div className="p-6 text-body-sm text-text-tertiary">Loading report…</div>;
  }

  if (report === null) {
    return (
      <div className="px-6 py-12">
        <div className="mx-auto max-w-md rounded-xl border border-border bg-surface p-6 text-center">
          <div className="text-h5 text-text-primary">That report no longer exists</div>
          <p className="mt-1 text-body-sm text-text-secondary">
            It may have been deleted from another tab. The reports list has everything that is still
            saved.
          </p>
          <div className="mt-4">
            <Link href="/iga/governance-analytics-v2">
              <Button variant="secondary">Back to reports</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const timeline = timelineById(report.timelineId);
  const addable = availableSections(report.sections);
  const addItems = addable.map((d) => ({
    label: d.title,
    onClick: () => apply({ sections: [...report.sections, newSection(d.id)] }),
  }));

  return (
    <div className="-mx-8 -my-6 flex h-[calc(100%+var(--ds-space-12))] min-h-0">
      <div className="flex min-h-0 min-w-0 flex-1 flex-col px-8 py-6">
      <header className="shrink-0 pb-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-h2 text-text-primary">{report.name}</h1>
              {editing && <StatusChip intent="info" label="Editing" />}
            </div>
            {report.description && (
              <p className="mt-1 max-w-3xl text-body-sm text-text-secondary">{report.description}</p>
            )}
            {/* The report's own definition, printed on it — an evidence artifact that does
                not say what it covers cannot be checked against anything. Values only:
                the labels restated what the words already say. */}
            <p className="mt-3 text-body-sm text-text-secondary">
              {[
                describeOrganization(report.organization),
                timeline ? `${timeline.label} (${timeline.covers})` : null,
                formatDateTime(report.updatedAt),
              ]
                .filter(Boolean)
                .join(' · ')}
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            {editing ? (
              <Button startIcon={<CheckOutlined />} onClick={finishEditing}>
                Done
              </Button>
            ) : (
              <Button
                variant="secondary"
                startIcon={<EditOutlined />}
                onClick={() => {
                  setEditing(true);
                  setDockOpen(true);
                }}
              >
                Edit
              </Button>
            )}
          </div>
        </div>
      </header>

      <div className="ds-scroll min-h-0 flex-1 overflow-y-auto py-5">
        <div className="flex flex-col gap-5">
          {sections.map((section, index) => (
            <ReportSectionBlock
              key={section.def.id}
              section={section}
              editing={editing}
              isFirst={
                index === 0 ||
                sections.slice(0, index).every((s) => s.def.id === OVERVIEW_SECTION_ID)
              }
              isLast={index === sections.length - 1}
              onMove={(direction) =>
                apply({ sections: moveSection(report.sections, section.def.id, direction) })
              }
            />
          ))}

          {sections.length === 0 && (
            <div className="rounded-xl border border-dashed border-border bg-subtle p-8 text-center">
              <p className="text-body-strong text-text-primary">This report has no sections</p>
              <p className="mt-1 text-body-sm text-text-secondary">
                Add one to give it something to say.
              </p>
            </div>
          )}

          {/* Adding a section is an edit, so it appears only in edit mode — and at the end
              of the document, where the new block will land. */}
          {editing && addItems.length > 0 && (
            <Menu
              items={addItems}
              ariaLabel="Add a section"
              trigger={
                <button
                  type="button"
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-subtle px-5 py-6 text-body-sm-medium text-text-secondary transition-colors hover:border-border-strong hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-subtle"
                >
                  <AddOutlined sx={{ fontSize: 18 }} />
                  Add a section
                </button>
              }
            />
          )}

          {editing && addItems.length === 0 && (
            <p className="rounded-xl border border-dashed border-border bg-subtle px-5 py-4 text-center text-body-sm text-text-tertiary">
              Every available section is already in this report.
            </p>
          )}
        </div>
      </div>
      </div>

      <div
        className={[
          'ds-print-hide shrink-0 overflow-hidden bg-surface transition-[width] duration-200 ease-out',
          dockOpen ? 'w-[400px] border-l border-border' : 'w-0',
        ].join(' ')}
      >
        <aside
          role="region"
          aria-label="Report configuration"
          aria-hidden={!dockOpen}
          inert={!dockOpen}
          className="flex h-full w-[400px] flex-col"
        >
          <header className="flex items-center justify-between gap-3 border-b border-border px-6 py-4">
            <h2 className="text-h4 text-text-primary">Report configuration</h2>
            <button
              type="button"
              onClick={finishEditing}
              aria-label="Close configuration"
              className="-mr-1 shrink-0 rounded-md p-1.5 text-icon hover:bg-surface-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-subtle"
            >
              <CloseOutlined sx={{ fontSize: 20 }} />
            </button>
          </header>

          <div className="ds-scroll flex-1 overflow-y-auto px-6 py-5">
            <div className="flex flex-col gap-8">
              <FormSection title="What this report is" icon={<DescriptionOutlined sx={{ fontSize: 18 }} />}>
                <NameAndDescriptionFields
                  name={report.name}
                  description={report.description}
                  onName={(name) => apply({ name })}
                  onDescription={(description) => apply({ description })}
                />
              </FormSection>

              <FormSection title="What it covers" icon={<TuneOutlined sx={{ fontSize: 18 }} />}>
                <ScopeFields
                  stacked
                  organization={report.organization}
                  timelineId={report.timelineId}
                  onOrganization={(organization) => apply({ organization })}
                  onTimeline={(timelineId) => apply({ timelineId })}
                />
              </FormSection>

              <FormSection title="Sections to include" icon={<ViewAgendaOutlined sx={{ fontSize: 18 }} />}>
                <SectionFields
                  sections={dockSectionCandidates(report.sections)}
                  onChange={(next) => apply({ sections: commitDockSections(report.sections, next) })}
                />
              </FormSection>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
