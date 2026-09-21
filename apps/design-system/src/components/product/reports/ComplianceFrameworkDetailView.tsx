'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import LockOutlined from '@mui/icons-material/LockOutlined';
import AddOutlined from '@mui/icons-material/AddOutlined';
import SearchOutlined from '@mui/icons-material/SearchOutlined';
import ReportProblemOutlined from '@mui/icons-material/ReportProblemOutlined';
import DownloadOutlined from '@mui/icons-material/DownloadOutlined';
import VerifiedUser from '@mui/icons-material/VerifiedUser';
import { Avatar, Button, DataTable, Input, QuickFilter, StatusChip, Tooltip, type Column } from '@ds/components';
import { DetailShell } from '@/components/product/directory';
import {
  OPERATIONAL_REPORTS,
  REPORT_STATE,
  clauseCoverage,
  clausesForFramework,
  evidenceGaps,
  packagesForFramework,
  sealOutcome,
  type ComplianceClause,
  type ComplianceFramework,
  type SealedPackage,
} from '@/data/reports';
import { formatDate, formatDateTime } from '@/lib/datetime';
import { useSetBreadcrumbs } from '@/lib/breadcrumb';
import { ReportStateChip } from './ReportStateChip';
import { EvidenceGapDrawer } from './EvidenceGapDrawer';
import { AttachEvidenceDrawer } from './AttachEvidenceDrawer';
import { SealPackageModal } from './SealPackageModal';

type DetailTab = 'coverage' | 'history';

const PERIODS = [
  { value: 'last-30', label: 'Last 30 days', from: '2026-08-17', to: '2026-09-16' },
  { value: 'this-quarter', label: 'This quarter', from: '2026-07-01', to: '2026-09-16' },
  { value: 'last-quarter', label: 'Last quarter', from: '2026-04-01', to: '2026-06-30' },
  { value: 'ytd', label: 'Year to date', from: '2026-01-01', to: '2026-09-16' },
];

/**
 * One framework: what it asks for, what we can show, and the artefact that proves it.
 *
 * Two tabs, not three. The screenshots had Coverage, Generate package and Package history,
 * where "Generate" was a whole tab holding one button and a list of the reports the
 * package would contain — a list the coverage matrix already shows, clause by clause, in
 * more detail. Sealing is an action, so it lives in the header as an action; the tab it
 * used to occupy was a page you had to visit to press a button.
 *
 * The reporting period sits above both tabs because it governs both: the matrix shows
 * coverage *for a window*, and the history lists packages sealed *over* windows. Putting it
 * inside a tab would make the same control mean something different depending on which tab
 * you were on.
 *
 * Built on `DetailShell`, the same frame every other detail page in the product uses — an
 * application, a policy, a request. This page had its own hand-rolled header with its own
 * back arrow, its own title size and its own action slot, which is how a product ends up
 * with five headers that are nearly the same. A framework is an entity with a name, a
 * badge, a description, an action and a tab strip; that is exactly what the shell is for.
 */
export function ComplianceFrameworkDetailView({ framework }: { framework: ComplianceFramework }) {
  const router = useRouter();
  const [tab, setTab] = React.useState<DetailTab>('coverage');
  const [period, setPeriod] = React.useState(PERIODS[2].value);
  const [query, setQuery] = React.useState('');
  const [state, setState] = React.useState<ComplianceClause['state'] | null>(null);
  const [gapDrawer, setGapDrawer] = React.useState(false);
  const [attaching, setAttaching] = React.useState<ComplianceClause | null>(null);
  const [sealing, setSealing] = React.useState(false);

  useSetBreadcrumbs([
    { label: 'Reports', href: '/iga/reports' },
    { label: 'Evidence packages', href: '/iga/reports?tab=compliance' },
    { label: framework.name },
  ]);

  const clauses = clausesForFramework(framework.id);
  const coverage = clauseCoverage(clauses);
  const gaps = evidenceGaps(clauses);
  const outcome = sealOutcome(clauses);
  const window = PERIODS.find((p) => p.value === period) ?? PERIODS[2];

  const q = query.trim().toLowerCase();
  const shown = clauses.filter((c) => {
    if (state && c.state !== state) return false;
    if (!q) return true;
    return [c.clause, c.subClause, c.requirement, c.ref, c.evidencedBy]
      .filter(Boolean)
      .some((v) => String(v).toLowerCase().includes(q));
  });

  /* ------------------------------------------------------------ columns */

  const clauseColumns: Column<ComplianceClause>[] = [
    { id: 'clause', header: 'Clause', width: '9%', sortable: true, render: (c) => c.clause },
    { id: 'sub', header: 'Sub-clause', width: '9%', render: (c) => c.subClause },
    {
      id: 'requirement',
      header: 'Requirement (verbatim)',
      width: '38%',
      /*
        Wrapped, not truncated. Everywhere else in the product a long cell ellipsizes and
        gives the rest on hover; here the text is quoted from the published framework and
        an assessor reads it against their own copy. Half a requirement is not a shorter
        requirement, it is a different one.
      */
      wrap: true,
      render: (c) => <span className="text-body-sm text-text-primary">{c.requirement}</span>,
    },
    { id: 'ref', header: 'Ref', width: '7%', render: (c) => c.ref },
    {
      id: 'evidencedBy',
      header: 'Evidenced by',
      width: '20%',
      wrap: true,
      render: (c) => {
        /*
          A bound register is only a link when it has a view behind it. Most of the
          catalogue is still Coming soon, and a clause pointing at one of those would open
          the same 404 the hub's cards used to — worse here, because on this page a dead
          link reads as "the evidence is missing" rather than "the screen is not built".
        */
        const openable = c.evidencedById
          ? OPERATIONAL_REPORTS.find((r) => r.id === c.evidencedById)?.href
          : undefined;
        return c.evidencedBy ? (
          openable ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                router.push(openable);
              }}
              className="rounded-sm text-left text-body-sm-medium text-text-link hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-subtle"
            >
              {c.evidencedBy}
            </button>
          ) : (
            <span className="text-body-sm text-text-primary">{c.evidencedBy}</span>
          )
        ) : (
          /*
            Inline evidence mapping. An empty cell in this column is the whole problem the
            page exists to solve, so it carries the fix rather than a dash — binding a
            register to a clause is a two-second job that was previously a trip to another
            screen and back.
          */
          <Button size="xs" variant="tertiary" startIcon={<AddOutlined />} onClick={() => setAttaching(c)}>
            Attach evidence
          </Button>
        );
      },
    },
    {
      id: 'state',
      header: 'Evidence status',
      width: '17%',
      wrap: true,
      render: (c) => (
        <span className="flex items-center gap-2">
          <ReportStateChip state={c.state} />
          {c.state === 'partial' && (
            <Tooltip title="The bound register answers part of this requirement — usually current state where the clause asks about a period.">
              <span
                tabIndex={0}
                aria-label="Why this is partial"
                className="inline-flex shrink-0 text-icon-subtle"
              >
                <ReportProblemOutlined sx={{ fontSize: 15 }} />
              </span>
            </Tooltip>
          )}
        </span>
      ),
    },
  ];

  const packageColumns: Column<SealedPackage>[] = [
    { id: 'id', header: 'Package ID', width: '18%', render: (p) => p.id },
    {
      id: 'period',
      header: 'Period covered',
      width: '18%',
      render: (p) => `${formatDate(p.periodFrom)} – ${formatDate(p.periodTo)}`,
    },
    { id: 'sealed', header: 'Sealed', width: '16%', sortable: true, render: (p) => formatDateTime(p.sealedAt) },
    { id: 'by', header: 'Generated by', width: '18%', render: (p) => p.generatedBy },
    { id: 'trigger', header: 'Trigger', width: '10%', render: (p) => p.trigger },
    {
      id: 'state',
      header: 'Seal',
      width: '10%',
      wrap: true,
      render: (p) => <ReportStateChip state={p.state} />,
    },
    {
      id: 'artefact',
      header: '',
      width: '10%',
      align: 'right',
      wrap: true,
      render: (p) => (
        <Button size="xs" variant="tertiary" startIcon={<DownloadOutlined />} onClick={() => undefined}>
          Download
        </Button>
      ),
    },
  ];

  /* --------------------------------------------------------------- view */

  return (
    <>
      <DetailShell
        avatar={<Avatar name={framework.name} icon={<VerifiedUser />} size="md" />}
        title={framework.name}
        description={framework.description}
        chips={<StatusChip intent="neutral" label={framework.version} />}
        actions={
          /*
            Sealing is the page's one primary, and it lives in the shell's action slot so it
            stays put across both tabs: the reader decides to seal after reading the matrix,
            and a button that scrolls away under a long clause list is a button they go
            looking for.
          */
          <Button startIcon={<LockOutlined />} onClick={() => setSealing(true)}>
            Seal package
          </Button>
        }
        tabs={[
          { value: 'coverage', label: 'Coverage & controls', count: coverage.total },
          { value: 'history', label: 'Package history', count: packagesForFramework(framework.id).length },
        ]}
        tab={tab}
        onTab={(v) => setTab(v as DetailTab)}
      >
      {/*
        The period is a filter, so it sits in the filter row rather than in a labelled band
        of its own above the tabs. Its eyebrow said "Reporting period" over four options
        that read as periods without being told; what does earn its place is the resolved
        window beside them, because "Last quarter" is a rule and an assessor needs the two
        dates it resolves to.

        It stays outside the tab panels, though — it governs both. The matrix shows coverage
        *for a window* and the history lists packages sealed *over* windows, so a control
        that lived inside one tab would mean something different in the other.
      */}
      <div className="mb-4 flex shrink-0 flex-wrap items-center gap-3">
        {/* Same chips as the register's period, and required for the same reason: a package
            is always sealed over some window. */}
        <QuickFilter
          ariaLabel="Reporting period"
          clearable={false}
          value={period}
          onChange={(v) => v && setPeriod(v)}
          options={PERIODS.map((p) => ({ value: p.value, label: p.label }))}
        />
        <span className="text-body-sm text-text-secondary">
          {formatDate(window.from)} – {formatDate(window.to)}
        </span>
      </div>

      <div>
        {tab === 'coverage' ? (
          <div className="space-y-4">
            {/*
              The gap banner, above the table rather than inside it.

              It is the one thing on this page that is about the package as a whole rather
              than about a clause, and it is what the reader came to find out: sealing today
              produces a PARTIAL, and here is exactly how many rows are responsible. Below
              the table it would be a footnote to a list nobody finished reading.
            */}
            {gaps.length > 0 && (
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[var(--ds-color-status-warning-border)] bg-[var(--ds-color-status-warning-subtle)] px-4 py-3">
                <div className="flex min-w-0 items-start gap-2.5">
                  <span className="mt-0.5 shrink-0 text-[var(--ds-color-status-warning-fg)]">
                    <ReportProblemOutlined sx={{ fontSize: 18 }} />
                  </span>
                  <p className="min-w-0 text-body-sm text-text-primary">
                    <span className="font-emphasis">
                      {gaps.length} evidence {gaps.length === 1 ? 'gap' : 'gaps'} detected.
                    </span>{' '}
                    This package would seal as {REPORT_STATE[outcome].label.toUpperCase()}. Resolve them before an
                    assessor finds them.
                  </p>
                </div>
                <Button size="sm" variant="secondary" onClick={() => setGapDrawer(true)}>
                  Resolve gaps
                </Button>
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-3">
              {/*
                Coverage as a filter, not as four KPI tiles. The screenshots spent a full
                card row on four numbers whose only use is to narrow the table underneath —
                so the numbers *are* the narrowing control, and the row they used to occupy
                goes to the clause list.
              */}
              <div className="flex flex-wrap items-center gap-2">
                {(['evidenced', 'partial', 'notEvidenced'] as const).map((s) => {
                  const count =
                    s === 'evidenced' ? coverage.evidenced : s === 'partial' ? coverage.partial : coverage.notEvidenced;
                  const on = state === s;
                  return (
                    <button
                      key={s}
                      type="button"
                      aria-pressed={on}
                      onClick={() => setState(on ? null : s)}
                      className={[
                        'flex items-center gap-2 rounded-pill border px-3 py-1.5 transition-colors',
                        on ? 'border-brand bg-surface' : 'border-border bg-surface hover:bg-surface-hover',
                      ].join(' ')}
                    >
                      <ReportStateChip state={s} />
                      <span className="tabular-nums text-body-sm-medium text-text-primary">{count}</span>
                    </button>
                  );
                })}
              </div>

              <div className="w-full sm:w-[280px]">
                <Input
                  size="sm"
                  placeholder="Search clause, requirement or report"
                  aria-label="Search clause, requirement or report"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  startAdornment={<SearchOutlined sx={{ fontSize: 18 }} />}
                />
              </div>
            </div>

            <DataTable
              columns={clauseColumns}
              rows={shown}
              emptyTitle="No clause matches"
              emptyMessage="Clear the coverage filter or the search to see the full control index."
            />

            <p className="rounded-lg border border-border bg-subtle px-4 py-3 text-caption leading-6 text-text-secondary">
              <span className="font-emphasis text-text-primary">Scope of this evidence.</span> This package contains
              identity and access governance evidence generated by this platform to support the organisation&apos;s own
              assessment against applicable requirements of the {framework.name}. It is not a certification of
              compliance, and no such certification scheme exists. The organisation remains responsible for assessing
              control effectiveness, determining its maturity level, addressing findings and obtaining required
              approvals. Evidence is limited to the identity governance scope described in this package and to the
              systems onboarded to the platform.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <div>
              <h2 className="text-body-strong text-text-primary">Generated packages</h2>
              <p className="mt-0.5 max-w-3xl text-body-sm text-text-secondary">
                Every package sealed for this framework, newest first. The package ID and digest are the references an
                assessor quotes back, so both are shown in full.
              </p>
            </div>
            <DataTable
              columns={packageColumns}
              rows={packagesForFramework(framework.id)}
              emptyTitle="Nothing sealed yet"
              emptyMessage="Seal a package to file evidence for a window, or put it on a schedule."
            />
          </div>
        )}
      </div>
      </DetailShell>

      <EvidenceGapDrawer
        open={gapDrawer}
        gaps={gaps}
        onClose={() => setGapDrawer(false)}
        onAttach={(clause) => {
          setGapDrawer(false);
          setAttaching(clause);
        }}
      />

      <AttachEvidenceDrawer open={attaching !== null} clause={attaching} onClose={() => setAttaching(null)} />

      <SealPackageModal
        open={sealing}
        framework={framework}
        clauses={clauses}
        periodFrom={window.from}
        periodTo={window.to}
        onClose={() => setSealing(false)}
      />
    </>
  );
}
