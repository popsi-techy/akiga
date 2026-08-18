'use client';

import * as React from 'react';
import { BarChart, DonutChart, Drawer } from '@ds/components';
import { ReportTable, Cell } from './ReportTable';
import type {
  AssembledBlock,
  DerivedKpi,
  DerivedPlot,
  DerivedRow,
  DerivedSection,
} from '@/data/governance-analytics-derive';

/**
 * The generated report.
 *
 * Layout language, from the spec and worth restating because it is the thing most
 * easily lost: **numbered section headers separated by hairline rules and vertical
 * rhythm, not nested cards.** A report is a document. Wrapping each section in a
 * bordered card would put seven boxes down a page, and the reader would spend
 * their attention on the boxes rather than the tables inside them — which are the
 * evidence, and the only reason the page exists.
 */
export function ReportBody({ blocks, provenance }: { blocks: AssembledBlock[]; provenance: string }) {
  const [detail, setDetail] = React.useState<{ section: DerivedSection; row: DerivedRow } | null>(null);

  return (
    <>
      <div className="divide-y divide-border">
        {blocks.map((b) =>
          b.kind === 'insights' ? (
            <InsightsBand key="insights" number={b.number} plots={b.plots ?? []} provenance={provenance} />
          ) : (
            <SectionBlock
              key={b.section!.id}
              number={b.number}
              section={b.section!}
              onRowClick={
                b.section!.detailKind ? (row) => setDetail({ section: b.section!, row }) : undefined
              }
            />
          ),
        )}
      </div>

      <RowDetailDrawer detail={detail} onClose={() => setDetail(null)} />
    </>
  );
}

function SectionHeading({ number, title, description }: { number: string; title: string; description: string }) {
  return (
    <div className="mb-5">
      <div className="flex items-baseline gap-3">
        <span className="text-overline tabular-nums text-text-tertiary">{number}</span>
        <h2 className="text-h4 text-text-primary">{title}</h2>
      </div>
      <p className="mt-1 max-w-3xl text-body-sm text-text-secondary">{description}</p>
    </div>
  );
}

function SectionBlock({
  number,
  section,
  onRowClick,
}: {
  number: string;
  section: DerivedSection;
  onRowClick?: (row: DerivedRow) => void;
}) {
  return (
    <section className="ds-print-keep py-8 first:pt-0">
      <SectionHeading number={number} title={section.title} description={section.description} />

      {section.kpis && <KpiGrid kpis={section.kpis} />}

      {section.headline && (
        <p className="mb-5 text-h5 text-text-primary">{section.headline}</p>
      )}

      {section.bars && section.bars.length > 0 && (
        <div className="mb-6 max-w-xl">
          {section.chartTitle && (
            <div className="mb-3 text-body-sm-strong text-text-secondary">{section.chartTitle}</div>
          )}
          <BarChart
            ariaLabel={section.chartTitle ?? section.title}
            bars={section.bars.map((b) => ({
              ...b,
              // One colour for a single-series ranking: colouring each bar
              // differently implies the categories differ in kind, when the only
              // thing that differs is the number.
              color: 'var(--ds-color-status-info-fill)',
            }))}
          />
        </div>
      )}

      {section.table && <ReportTable table={section.table} onRowClick={onRowClick} />}
    </section>
  );
}

/**
 * KPIs as a plain grid, not StatTiles.
 *
 * `StatTile` is the dashboard's card — a bordered box with a tinted icon. Eight of
 * them at the top of a report would be eight boxes competing with each other and
 * with the tables below. Here the number is the object and the rules do the
 * separating, which is the same reason the sections are not cards.
 */
function KpiGrid({ kpis }: { kpis: DerivedKpi[] }) {
  return (
    <dl className="mb-6 grid gap-x-6 gap-y-5 sm:grid-cols-2 lg:grid-cols-4">
      {kpis.map((k) => (
        <div key={k.label}>
          <dt className="text-body-sm text-text-secondary">{k.label}</dt>
          <dd className="mt-0.5 text-stat leading-8 tabular-nums text-text-primary">{k.value}</dd>
          {k.hint && <dd className="mt-0.5 text-caption text-text-tertiary">{k.hint}</dd>}
        </div>
      ))}
    </dl>
  );
}

/**
 * The synthesized insights band — every enabled plot, two across.
 *
 * Not a configured section: it is assembled from the report's plots so that
 * "what should I notice" always sits between the posture summary and the
 * evidence, whatever sections the reader picked. Omitted entirely when no plots
 * are enabled, never rendered as an empty chart area.
 */
function InsightsBand({
  number,
  plots,
  provenance,
}: {
  number: string;
  plots: DerivedPlot[];
  provenance: string;
}) {
  return (
    <section className="py-8 first:pt-0">
      <SectionHeading
        number={number}
        title="Governance insights"
        description="The patterns worth noticing before reading the evidence below."
      />
      <div className="grid gap-5 lg:grid-cols-2">
        {plots.map((p) => (
          <PlotCard key={p.id} plot={p} provenance={provenance} />
        ))}
      </div>
    </section>
  );
}

/**
 * One plot.
 *
 * A bordered card here, unlike the sections — because two plots sit side by side
 * and something has to say where one ends and the next begins. The section rules
 * cannot do it for a grid.
 *
 * Every card prints the report's scope and filters at its foot. Without it a plot
 * lifted into a slide deck, or simply read after scrolling past the header, can be
 * mistaken for the whole organisation — and a governance chart read against the
 * wrong population is worse than no chart.
 */
function PlotCard({ plot, provenance }: { plot: DerivedPlot; provenance: string }) {
  const total = plot.series.reduce((s, x) => s + x.value, 0);

  return (
    <div className="flex flex-col rounded-xl border border-border bg-surface p-5">
      <div className="mb-4">
        <h3 className="text-body-strong text-text-primary">{plot.title}</h3>
        <p className="mt-0.5 text-caption text-text-secondary">{plot.description}</p>
      </div>

      <div className="flex-1">
        {plot.series.length === 0 ? (
          <p className="text-body-sm text-text-tertiary">Nothing to plot in this scope.</p>
        ) : plot.viz === 'donut' ? (
          <DonutChart
            segments={plot.series}
            size={160}
            thickness={20}
            centerValue={plot.percent ? `${plot.series[0]?.value ?? 0}%` : total}
            centerLabel={plot.centerLabel}
            ariaLabel={`${plot.title}: ${plot.series.map((s) => `${s.label} ${s.value}`).join(', ')}`}
          />
        ) : (
          <BarChart
            bars={plot.series}
            suffix={plot.percent ? '%' : ''}
            ariaLabel={plot.title}
          />
        )}
      </div>

      <p className="mt-4 border-t border-border pt-3 text-caption text-text-tertiary">{provenance}</p>
    </div>
  );
}

/**
 * The row detail drawer.
 *
 * On the **right**, with a scrim — deliberately the opposite edge from the
 * configuration panel. The two surfaces do different jobs: this is about the
 * report's content, that is about the report's definition, and a reader who
 * cannot tell them apart by where they come from has to read them to find out.
 */
function RowDetailDrawer({
  detail,
  onClose,
}: {
  detail: { section: DerivedSection; row: DerivedRow } | null;
  onClose: () => void;
}) {
  const section = detail?.section;
  const row = detail?.row;
  // Hooks cannot sit behind the early return, so the extras are computed
  // defensively and the guard follows.
  const extras = React.useMemo(() => (section && row ? section.extra?.(row) ?? [] : []), [section, row]);
  if (!section || !row) return null;

  return (
    <Drawer
      open
      onClose={onClose}
      title={String(row[section.table!.columns[0].id] ?? 'Detail')}
      subtitle={section.title}
      width={520}
      footer={
        <p className="text-caption text-text-tertiary">
          Remediation workflows are out of scope for this report — this drawer is evidence, not an action.
        </p>
      }
    >
      <dl className="divide-y divide-border">
        {section.table!.columns.map((c) => (
          <div key={c.id} className="flex items-baseline gap-4 py-3">
            <dt className="w-40 shrink-0 text-body-sm text-text-secondary">{c.header}</dt>
            <dd className="min-w-0 flex-1">
              <Cell type={c.type} value={row[c.id]} />
            </dd>
          </div>
        ))}
        {extras.map((e) => (
          <div key={e.label} className="py-3">
            <dt className="text-body-sm text-text-secondary">{e.label}</dt>
            <dd className="mt-1 text-body-sm text-text-primary">{e.value}</dd>
          </div>
        ))}
      </dl>
    </Drawer>
  );
}
