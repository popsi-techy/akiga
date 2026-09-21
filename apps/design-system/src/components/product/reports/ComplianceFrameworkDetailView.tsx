'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import LockOutlined from '@mui/icons-material/LockOutlined';
import AddOutlined from '@mui/icons-material/AddOutlined';
import SearchOutlined from '@mui/icons-material/SearchOutlined';
import FilterListOutlined from '@mui/icons-material/FilterListOutlined';
import ExpandMore from '@mui/icons-material/ExpandMore';
import ReportProblemOutlined from '@mui/icons-material/ReportProblemOutlined';
import DownloadOutlined from '@mui/icons-material/DownloadOutlined';
import VerifiedUser from '@mui/icons-material/VerifiedUser';
import {
  Avatar,
  Button,
  DataTable,
  FilterDrawer,
  Input,
  StatusChip,
  Tooltip,
  type Column,
  type FilterSelection,
} from '@ds/components';
import { DetailShell } from '@/components/product/directory';
import {
  OPERATIONAL_REPORTS,
  REPORT_STATE,
  clauseCoverage,
  clausesForFramework,
  evidenceGaps,
  packagesForFramework,
  scopeOfEvidence,
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

// The three coverage states, in the order they read on the seal: proven, partial, missing.
const COVERAGE_FILTERS: ComplianceClause['state'][] = ['evidenced', 'partial', 'notEvidenced'];

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
  // Coverage is multi-select — a reader can look at Partial and Not evidenced together —
  // so it is a set of states, empty meaning "show every state".
  const [coverageStates, setCoverageStates] = React.useState<ComplianceClause['state'][]>([]);
  const [filterOpen, setFilterOpen] = React.useState(false);
  const [scopeOpen, setScopeOpen] = React.useState(false);
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
  const scope = scopeOfEvidence(framework.name);

  const q = query.trim().toLowerCase();
  const shown = clauses.filter((c) => {
    if (coverageStates.length && !coverageStates.includes(c.state)) return false;
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
        The scope note, framed and collapsed, at the top of the page rather than as a
        footnote below the clause table. It is the disclaimer that governs how everything
        below it may be read — not a certification, identity-governance scope only — and it
        belongs before the evidence, not after a list nobody scrolls to the end of. It sits
        outside the tab panels because it frames both: the coverage matrix and the sealed
        packages in history are the same evidence under the same limits. Collapsed by
        default, because a reader meets it once; the summary line carries the two facts that
        change how the evidence reads for anyone who never opens it. Reuses the register's
        Evidence-header pattern.
      */}
      <section className="mb-4 shrink-0 overflow-hidden rounded-lg border border-border">
        <button
          type="button"
          aria-expanded={scopeOpen}
          onClick={() => setScopeOpen((v) => !v)}
          className="flex w-full items-center justify-between gap-3 bg-subtle px-4 py-2.5 text-left hover:bg-surface-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-subtle"
        >
          <span className="min-w-0">
            <span className="text-body-sm-strong text-text-primary">About this evidence</span>
            <span className="ml-2 text-caption text-text-secondary">{scope.short}</span>
          </span>
          <ExpandMore
            sx={{ fontSize: 20 }}
            className={`shrink-0 text-icon transition-transform ${scopeOpen ? 'rotate-180' : ''}`}
          />
        </button>
        {scopeOpen && (
          <div className="border-t border-border-subtle bg-surface px-4 py-3">
            <p className="text-caption leading-6 text-text-secondary">{scope.full}</p>
          </div>
        )}
      </section>

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

            {/*
              One filter row, directly above the table: search, then the reporting period,
              then coverage. The period opens the product's FilterDrawer rather than sitting
              inline as four chips — the trigger carries the current window so the applied
              filter is legible without opening it, and the resolved dates ride beside it
              because "Last quarter" is a rule and an assessor needs the two dates it
              resolves to. Coverage stays inline: three toggles the reader flips against the
              rows in front of them, not worth a round-trip through a drawer.
            */}
            <div className="flex flex-wrap items-center gap-3">
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

              {/* One entry point for both filters — period and coverage — through the
                  product's filter drawer. The count is the coverage states in play; the
                  period is always set, so it is not counted. The resolved window lives in
                  the drawer's footer, so the toolbar stays to search and a single control. */}
              <Button
                variant="secondary"
                size="sm"
                startIcon={<FilterListOutlined />}
                onClick={() => setFilterOpen(true)}
              >
                Filter{coverageStates.length > 0 ? ` (${coverageStates.length})` : ''}
              </Button>
            </div>

            <DataTable
              columns={clauseColumns}
              rows={shown}
              emptyTitle="No clause matches"
              emptyMessage="Clear the filter or the search to see the full control index."
            />
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

      {/*
        Both filters through the product's one filter surface: the reporting period and the
        coverage states. Period is a single required choice, so the drawer's multi-select is
        coerced back to one on Apply — the last box ticked wins, and an empty selection keeps
        the current window because a package is always read over some period. Coverage is a
        true multi-select: leave it empty to see every clause, or tick the states you want.
        The footer status resolves the staged period to its two dates and names how many
        coverage states are in play — the facts an assessor actually needs.
      */}
      <FilterDrawer
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        title="Filter"
        subtitle="Narrow the matrix by reporting period and coverage."
        groups={[
          {
            id: 'period',
            label: 'Period',
            optionHeader: 'Reporting period',
            options: PERIODS.map((p) => ({ id: p.value, label: p.label })),
          },
          {
            id: 'coverage',
            label: 'Coverage',
            optionHeader: 'Evidence status',
            options: COVERAGE_FILTERS.map((s) => ({ id: s, label: REPORT_STATE[s].label })),
          },
        ]}
        value={{ period: [period], coverage: coverageStates }}
        onApply={(next: FilterSelection) => {
          const picked = next.period ?? [];
          setPeriod(picked[picked.length - 1] ?? period);
          setCoverageStates((next.coverage ?? []) as ComplianceClause['state'][]);
        }}
        // No footer status: the applied filters are legible from the rail counts and the
        // table itself, so the resolved window and state count would only repeat them.
        renderStatus={() => null}
      />

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
