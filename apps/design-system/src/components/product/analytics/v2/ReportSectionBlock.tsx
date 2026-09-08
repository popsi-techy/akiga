'use client';

import * as React from 'react';
import ArrowUpward from '@mui/icons-material/ArrowUpward';
import ArrowDownward from '@mui/icons-material/ArrowDownward';
import AltRouteOutlined from '@mui/icons-material/AltRouteOutlined';
import AssignmentTurnedInOutlined from '@mui/icons-material/AssignmentTurnedInOutlined';
import GppMaybeOutlined from '@mui/icons-material/GppMaybeOutlined';
import PeopleOutlined from '@mui/icons-material/PeopleOutlined';
import PersonOffOutlined from '@mui/icons-material/PersonOffOutlined';
import PolicyOutlined from '@mui/icons-material/PolicyOutlined';
import VerifiedUserOutlined from '@mui/icons-material/VerifiedUserOutlined';
import WarningAmberOutlined from '@mui/icons-material/WarningAmberOutlined';
import BarChartIcon from '@mui/icons-material/BarChart';
import PieChart from '@mui/icons-material/PieChart';
import { BarChart, Card, DataTable, DonutChart, StatTile, StatusChip, Tooltip, type Column, type StatTone } from '@ds/components';
import { RiskScoreChip } from '@/components/product/directory';
import { OVERVIEW_SECTION_ID } from '@/data/governance-analytics-v2';
import type { DerivedKpi, DerivedRow, DerivedSection } from '@/data/governance-analytics-v2-derive';

/**
 * One section of a rendered report: its charts, then its table.
 *
 * Charts before table, always. The charts say *what to notice*; the table says *exactly
 * what is happening*. A reader who meets the table first has to build the summary
 * themselves, which is the work the section exists to have already done.
 *
 * Overview is the exception: eight `StatTile`s in the same 4-across row as the
 * dashboard, no title, no wrapping card, and it cannot be reordered — it opens
 * the document. The numbers are the recap; a heading that restates "this is an
 * overview" would be the section introducing itself.
 *
 * In edit mode a content block grows a pair of move buttons. Drag-to-reorder is
 * parked — the handle fought the document more than it helped.
 */
export function ReportSectionBlock({
  section,
  editing = false,
  isFirst,
  isLast,
  onMove,
}: {
  section: DerivedSection;
  editing?: boolean;
  isFirst?: boolean;
  isLast?: boolean;
  onMove?: (direction: -1 | 1) => void;
}) {
  const { def, rows, charts, filterSummary, kpis } = section;
  const isOverview = def.id === OVERVIEW_SECTION_ID;

  const columns: Column<DerivedRow>[] = def.columns.map((c) => ({
    id: c.id,
    header: c.header,
    sortable: true,
    align: c.type === 'num' || c.type === 'risk' ? ('right' as const) : undefined,
    value: (r: DerivedRow) => r[c.id],
    render: (r: DerivedRow) => {
      if (c.type === 'risk') return <RiskScoreChip score={Number(r[c.id])} />;
      if (c.type === 'status') {
        const v = String(r[c.id]);
        return <StatusChip intent={v === 'Assigned' ? 'success' : 'warning'} label={v} />;
      }
      if (c.type === 'num') return <span className="tabular-nums text-text-primary">{String(r[c.id])}</span>;
      return <span className="text-text-primary">{String(r[c.id])}</span>;
    },
  }));

  return (
    <section
      className={
        isOverview
          ? 'transition-colors'
          : 'overflow-hidden rounded-xl border border-border-subtle bg-surface'
      }
      aria-label={def.title}
    >
      {isOverview ? (
        <OverviewKpiGrid kpis={kpis ?? []} />
      ) : (
        <>
          <header className="flex items-start justify-between gap-4 border-b border-border-subtle px-5 py-4">
            <div className="min-w-0">
              <h2 className="text-h5 text-text-primary">{def.title}</h2>
              {filterSummary && (
                <p className="mt-1 text-caption text-text-tertiary">Narrowed to — {filterSummary}</p>
              )}
            </div>
            {editing && onMove && (
              <MoveButtons title={def.title} isFirst={isFirst} isLast={isLast} onMove={onMove} />
            )}
          </header>

          {charts.length > 0 && (
            <div className="grid gap-4 border-b border-border-subtle px-5 py-5 lg:grid-cols-2">
              {charts.map((chart) => (
                <Card
                  key={chart.id}
                  title={chart.title}
                  icon={chart.shape === 'donut' ? <PieChart /> : <BarChartIcon />}
                  className="h-full min-w-0"
                >
                  {chart.data.length === 0 ? (
                    <p className="text-body-sm text-text-tertiary">Nothing matched this section&rsquo;s filters.</p>
                  ) : chart.shape === 'donut' ? (
                    <DonutChart segments={chart.data} ariaLabel={chart.title} />
                  ) : (
                    <BarChart bars={chart.data} ariaLabel={chart.title} />
                  )}
                </Card>
              ))}
            </div>
          )}

          <div className="px-5 py-5">
            <DataTable<DerivedRow>
              layout="fixed"
              columns={columns}
              rows={rows}
              paginated={rows.length > 10}
              emptyTitle="Nothing to show"
              emptyMessage="No rows matched this section's filters for the chosen organisation and period."
            />
          </div>
        </>
      )}
    </section>
  );
}

const OVERVIEW_TILE: Record<string, { icon: React.ReactNode; tone: StatTone }> = {
  routes: { icon: <AltRouteOutlined sx={{ fontSize: 22 }} />, tone: 'info' },
  grants: { icon: <AssignmentTurnedInOutlined sx={{ fontSize: 22 }} />, tone: 'brand' },
  'access-people': { icon: <PeopleOutlined sx={{ fontSize: 22 }} />, tone: 'info' },
  'peak-risk': { icon: <GppMaybeOutlined sx={{ fontSize: 22 }} />, tone: 'danger' },
  permissions: { icon: <VerifiedUserOutlined sx={{ fontSize: 22 }} />, tone: 'brand' },
  'high-risk': { icon: <WarningAmberOutlined sx={{ fontSize: 22 }} />, tone: 'warning' },
  unassigned: { icon: <PersonOffOutlined sx={{ fontSize: 22 }} />, tone: 'warning' },
  breaks: { icon: <PolicyOutlined sx={{ fontSize: 22 }} />, tone: 'danger' },
};

/**
 * The dashboard's top row — eight StatTiles, four across, sitting on the canvas
 * rather than inside a second card.
 */
function OverviewKpiGrid({ kpis }: { kpis: DerivedKpi[] }) {
  if (kpis.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-border bg-subtle px-5 py-5 text-body-sm text-text-tertiary">
        Include another section — Overview recaps those, not itself.
      </p>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {kpis.map((k) => {
        const tile = OVERVIEW_TILE[k.id];
        return (
          <StatTile
            key={k.id}
            label={k.label}
            value={k.value}
            icon={tile?.icon}
            tone={tile?.tone ?? 'neutral'}
            hoverElevate
          />
        );
      })}
    </div>
  );
}

function MoveButtons({
  title,
  isFirst,
  isLast,
  onMove,
}: {
  title: string;
  isFirst?: boolean;
  isLast?: boolean;
  onMove: (direction: -1 | 1) => void;
}) {
  return (
    <div className="flex shrink-0 items-center gap-1">
      <Tooltip title="Move up">
        <button
          type="button"
          disabled={isFirst}
          onClick={() => onMove(-1)}
          aria-label={`Move ${title} up`}
          className="rounded-md p-1 text-icon-subtle transition-colors hover:bg-surface-hover hover:text-text-primary disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-subtle"
        >
          <ArrowUpward sx={{ fontSize: 18 }} />
        </button>
      </Tooltip>
      <Tooltip title="Move down">
        <button
          type="button"
          disabled={isLast}
          onClick={() => onMove(1)}
          aria-label={`Move ${title} down`}
          className="rounded-md p-1 text-icon-subtle transition-colors hover:bg-surface-hover hover:text-text-primary disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-subtle"
        >
          <ArrowDownward sx={{ fontSize: 18 }} />
        </button>
      </Tooltip>
    </div>
  );
}
