'use client';

import * as React from 'react';
import SchemaOutlined from '@mui/icons-material/SchemaOutlined';
import FilterListOutlined from '@mui/icons-material/FilterListOutlined';
import CloseIcon from '@mui/icons-material/Close';
import SummarizeOutlined from '@mui/icons-material/SummarizeOutlined';
import { Button, Drawer, Menu, SegmentedControl, StatusChip, useToast } from '@ds/components';
import { GovernanceHealthBar } from '@/components/product/governance/GovernanceHealthBar';
import { GovernanceScopeRail } from '@/components/product/governance/GovernanceScopeRail';
import { GovernanceMap } from '@/components/product/governance/GovernanceMap';
import { GovernanceExplorer, type ExplorerTab } from '@/components/product/governance/GovernanceExplorer';
import { GovernanceDetailsPanel, RelationshipCard } from '@/components/product/governance/GovernanceDetailsPanel';
import { GovernanceFiltersDrawer } from '@/components/product/governance/GovernanceFiltersDrawer';
import { GovernanceSearch } from '@/components/product/governance/GovernanceSearch';
import { RISK_TIER_LABEL } from '@/lib/risk';
import {
  DOMAIN_KINDS,
  FINDING_LABEL,
  KIND_LABEL,
  RELATION_META,
  type GovEntityKind,
  type GovHealthMetric,
  type GovHealthMetricId,
} from '@/data/governance-types';
import {
  buildGraph,
  displayName,
  emptyFilters,
  explorerRows,
  filterCount,
  findingsByKind,
  findingsFor,
  getGovEntity,
  getGovRelationship,
  getHealthMetrics,
  getModelSummary,
  listByKind,
  matchesFilters,
  type GovFilterState,
} from '@/data/governance';

type ViewMode = 'map' | 'explorer';

/** Where the map opens. A department reads as the executive entry point: it fans
    out to roles, to the applications they reach, to the controls governing them. */
const DEFAULT_ROOT = 'dep-finance';

const ALL_KINDS: GovEntityKind[] = Object.values(DOMAIN_KINDS).flat();

/**
 * Governance Model — the governance intelligence surface.
 *
 * A canvas-archetype page: the frame's padding is cancelled, nothing scrolls except
 * the inner regions, and the chrome is a thin band so the model itself is the
 * protagonist. Two views render the same query — switching preserves the selected
 * entity, the scope, the filters and the risk lens, because all of them live here
 * and neither view owns any state of its own.
 */
export default function GovernanceModelPage() {
  const toast = useToast();

  const [view, setView] = React.useState<ViewMode>('map');
  const [rootId, setRootId] = React.useState(DEFAULT_ROOT);
  const [selectedId, setSelectedId] = React.useState<string | null>(DEFAULT_ROOT);
  const [selectedEdgeId, setSelectedEdgeId] = React.useState<string | null>(null);
  const [expanded, setExpanded] = React.useState<Set<string>>(new Set());
  const [filters, setFilters] = React.useState<GovFilterState>(emptyFilters);
  const [scopeKind, setScopeKind] = React.useState<GovEntityKind | null>(null);
  const [activeMetric, setActiveMetric] = React.useState<GovHealthMetricId | null>(null);
  const [riskView, setRiskView] = React.useState(false);
  const [focusMode, setFocusMode] = React.useState(false);
  /**
   * The rail's state is remembered per view, not globally. On the map the canvas
   * needs every pixel and the rail's job (choosing a domain) is already covered by
   * search and focus, so it starts closed; in the Explorer the domain list *is* the
   * navigation, so it starts open.
   */
  const [railCollapsed, setRailCollapsed] = React.useState<Record<ViewMode, boolean>>({ map: true, explorer: false });
  const [filtersOpen, setFiltersOpen] = React.useState(false);
  const [summaryOpen, setSummaryOpen] = React.useState(false);
  const [explorerTab, setExplorerTab] = React.useState<ExplorerTab>('relationships');

  const metrics = React.useMemo(() => getHealthMetrics(), []);
  const summary = React.useMemo(() => getModelSummary(), []);

  /** The kind filter and the scope rail are the same constraint from two places. */
  const effectiveFilters = React.useMemo<GovFilterState>(
    () => (scopeKind ? { ...filters, kinds: [scopeKind] } : filters),
    [filters, scopeKind],
  );

  const graph = React.useMemo(() => buildGraph(rootId, expanded, effectiveFilters), [rootId, expanded, effectiveFilters]);
  const rows = React.useMemo(
    () => explorerRows(scopeKind ? [scopeKind] : ALL_KINDS, filters),
    [scopeKind, filters],
  );
  const findings = React.useMemo(() => {
    const scoped = findingsByKind(filters.findingKinds).filter((f) => {
      const e = getGovEntity(f.entityId);
      if (!e) return false;
      if (scopeKind && e.kind !== scopeKind) return false;
      return matchesFilters(e, filters);
    });
    return scoped;
  }, [filters, scopeKind]);

  const counts = React.useMemo(() => {
    const out = {} as Record<GovEntityKind, { total: number; findings: number }>;
    for (const kind of ALL_KINDS) {
      const list = listByKind(kind).filter((e) => matchesFilters(e, filters));
      out[kind] = { total: list.length, findings: list.filter((e) => findingsFor(e.id).length > 0).length };
    }
    return out;
  }, [filters]);

  const selectedEntity = selectedId ? getGovEntity(selectedId) ?? null : null;
  const selectedRelationship = selectedEdgeId ? getGovRelationship(selectedEdgeId) ?? null : null;
  const rootEntity = getGovEntity(rootId);

  // ---- interactions ----------------------------------------------------
  const selectEntity = (id: string) => {
    setSelectedId(id);
    setSelectedEdgeId(null);
  };

  /** Re-root the map on an entity, and take the user to the view that shows it. */
  const focusEntity = (id: string) => {
    setRootId(id);
    setSelectedId(id);
    setSelectedEdgeId(null);
    setExpanded(new Set());
    setView('map');
  };

  const toggleExpand = (id: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  /** A health metric is a saved investigation: scope to its findings and show them. */
  const applyMetric = (metric: GovHealthMetric) => {
    const already = activeMetric === metric.id;
    setActiveMetric(already ? null : metric.id);
    setFilters((f) => ({ ...f, findingKinds: already ? [] : metric.kinds }));
    if (!already) {
      setScopeKind(null);
      setView('explorer');
      setExplorerTab('findings');
    }
  };

  const updateFilters = (next: GovFilterState) => {
    setFilters(next);
    // The metric chip is a shorthand for one filter set; editing it by hand clears it.
    setActiveMetric((current) => {
      const metric = metrics.find((m) => m.id === current);
      if (!metric) return current;
      const same = metric.kinds.length === next.findingKinds.length && metric.kinds.every((k) => next.findingKinds.includes(k));
      return same ? current : null;
    });
  };

  const clearAll = () => {
    setFilters(emptyFilters());
    setScopeKind(null);
    setActiveMetric(null);
  };

  const activeFilterCount = filterCount(filters) + (scopeKind ? 1 : 0);

  /** Every active constraint as a removable chip — filters you can't see are traps. */
  const chips: { key: string; label: string; onRemove: () => void }[] = [
    ...(scopeKind ? [{ key: `kind:${scopeKind}`, label: KIND_LABEL[scopeKind].many, onRemove: () => setScopeKind(null) }] : []),
    ...filters.kinds.map((k) => ({ key: `k:${k}`, label: KIND_LABEL[k].many, onRemove: () => updateFilters({ ...filters, kinds: filters.kinds.filter((x) => x !== k) }) })),
    ...filters.departmentIds.map((d) => ({ key: `d:${d}`, label: displayName(d), onRemove: () => updateFilters({ ...filters, departmentIds: filters.departmentIds.filter((x) => x !== d) }) })),
    ...filters.locationIds.map((l) => ({ key: `l:${l}`, label: displayName(l), onRemove: () => updateFilters({ ...filters, locationIds: filters.locationIds.filter((x) => x !== l) }) })),
    ...filters.riskTiers.map((t) => ({ key: `r:${t}`, label: `${RISK_TIER_LABEL[t]} risk`, onRemove: () => updateFilters({ ...filters, riskTiers: filters.riskTiers.filter((x) => x !== t) }) })),
    ...filters.findingKinds.map((f) => ({ key: `f:${f}`, label: FINDING_LABEL[f], onRemove: () => updateFilters({ ...filters, findingKinds: filters.findingKinds.filter((x) => x !== f) }) })),
    ...filters.relationTypes.map((t) => ({ key: `t:${t}`, label: RELATION_META[t].label, onRemove: () => updateFilters({ ...filters, relationTypes: filters.relationTypes.filter((x) => x !== t) }) })),
  ];

  return (
    <div className="-mx-8 -my-6 flex h-[calc(100%+3rem)] flex-col">
      {/* header band */}
      <header className="flex shrink-0 flex-wrap items-center gap-3 border-b border-border bg-canvas px-5 py-2.5">
        {/* Greyscale, not brand: orange on this page means selection, and a page
            mark is not one of the six things the colour budget reserves it for. */}
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-subtle text-icon">
          <SchemaOutlined sx={{ fontSize: 20 }} />
        </span>
        {/* The title never yields to the toolbar: the lead sentence is the first
            thing to go when width is short, then the search narrows. */}
        <div className="min-w-[140px] flex-1">
          <h1 className="truncate text-h5 text-text-primary">Governance Model</h1>
          <p className="hidden truncate text-body-sm text-text-secondary xl:block">
            Centralized view of how organizational structure, access, policies, ownership, and governance controls are
            connected.
          </p>
        </div>

        <GovernanceSearch onSelect={focusEntity} />

        <Button
          variant="secondary"
          startIcon={<FilterListOutlined />}
          onClick={() => setFiltersOpen(true)}
          aria-label={activeFilterCount > 0 ? `Filters, ${activeFilterCount} active` : 'Filters'}
        >
          Filters{activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}
        </Button>

        <SegmentedControl<ViewMode>
          size="sm"
          ariaLabel="Governance view"
          value={view}
          onChange={setView}
          options={[
            { value: 'map', label: 'Map' },
            { value: 'explorer', label: 'Explorer' },
          ]}
        />

        <Menu
          items={[
            { label: 'Model summary', onClick: () => setSummaryOpen(true) },
            { label: 'Export governance model (soon)', onClick: () => toast.info('Export is planned — the model is read-only today.') },
            { label: 'Export findings (soon)', onClick: () => toast.info('Export is planned — the model is read-only today.') },
          ]}
        />
      </header>

      <GovernanceHealthBar metrics={metrics} activeId={activeMetric} onSelect={applyMetric} />

      {chips.length > 0 && (
        <div className="flex shrink-0 flex-wrap items-center gap-1.5 border-b border-border bg-sunken px-5 py-2">
          <span className="text-caption text-text-tertiary">Scoped to</span>
          {chips.map((c) => (
            <button
              key={c.key}
              type="button"
              onClick={c.onRemove}
              className="inline-flex items-center gap-1 rounded-pill border border-border bg-surface px-2 py-0.5 text-caption text-text-secondary transition-colors hover:border-border-strong hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-subtle"
              aria-label={`Remove filter ${c.label}`}
            >
              {c.label}
              <CloseIcon sx={{ fontSize: 13 }} aria-hidden />
            </button>
          ))}
          <button
            type="button"
            onClick={clearAll}
            className="ml-1 text-caption-strong text-text-link transition-colors hover:text-text-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-subtle"
          >
            Clear all
          </button>
        </div>
      )}

      {/*
        body: scope rail · content · details

        The details surface changes role with the view, because the protagonist
        does. On the map it is a persistent context rail beside the graph; in the
        Explorer the table is the protagonist and inspection overlays it, so the
        relationship matrix keeps the width its six columns need.
      */}
      <div className="relative flex min-h-0 flex-1">
        <GovernanceScopeRail
          counts={counts}
          activeKind={scopeKind}
          onSelectKind={setScopeKind}
          collapsed={railCollapsed[view]}
          onToggleCollapsed={() => setRailCollapsed((c) => ({ ...c, [view]: !c[view] }))}
          onOpenSummary={() => setSummaryOpen(true)}
        />

        <div className="min-w-0 flex-1">
          {view === 'map' ? (
            <GovernanceMap
              graph={graph}
              rootId={rootId}
              selectedId={selectedId}
              selectedEdgeId={selectedEdgeId}
              expanded={expanded}
              riskView={riskView}
              focusMode={focusMode}
              findingCount={(id) => findingsFor(id).length}
              onSelectNode={selectEntity}
              onSelectEdge={(id) => {
                setSelectedEdgeId(id);
                setSelectedId(null);
              }}
              onToggleExpand={toggleExpand}
              onClearSelection={() => {
                setSelectedId(null);
                setSelectedEdgeId(null);
              }}
              onToggleRiskView={() => setRiskView((r) => !r)}
              onToggleFocusMode={() => setFocusMode((f) => !f)}
              onExpandAll={() => setExpanded(new Set(graph.nodes.map((n) => n.entity.id)))}
              onCollapseAll={() => setExpanded(new Set())}
            />
          ) : (
            <GovernanceExplorer
              tab={explorerTab}
              onTabChange={setExplorerTab}
              rows={rows}
              findings={findings}
              filters={filters}
              scopeKind={scopeKind}
              onSelect={selectEntity}
            />
          )}
        </div>

        {/*
          Overlay by default, a column only when there is room. In the Explorer it
          always overlays (the table is the protagonist); on the map it becomes a
          context rail from 1280px up, below which a 340px column would leave the
          graph too narrow to read.
        */}
        <div
          className={
            view === 'explorer'
              ? 'absolute inset-y-0 right-0 z-20 shadow-lg'
              : 'absolute inset-y-0 right-0 z-20 shadow-lg xl:static xl:z-auto xl:shrink-0 xl:shadow-none'
          }
        >
          {selectedRelationship ? (
            <RelationshipCard
              relationship={selectedRelationship}
              onSelectEntity={selectEntity}
              onClose={() => setSelectedEdgeId(null)}
            />
          ) : selectedEntity ? (
            <GovernanceDetailsPanel
              entity={selectedEntity}
              isRoot={selectedEntity.id === rootId}
              onSelectEntity={selectEntity}
              onFocus={focusEntity}
              onClose={() => setSelectedId(null)}
            />
          ) : view === 'map' ? (
            <aside className="hidden w-[340px] shrink-0 flex-col border-l border-border bg-surface 2xl:flex" aria-label="Governance details">
              <div className="grid h-full place-items-center px-6">
                <div className="text-center">
                  <span className="mx-auto mb-2 grid h-11 w-11 place-items-center rounded-full bg-subtle text-icon">
                    <SchemaOutlined sx={{ fontSize: 22 }} />
                  </span>
                  <div className="text-body-strong text-text-primary">Nothing selected</div>
                  <p className="mx-auto mt-1 max-w-[260px] text-caption text-text-secondary">
                    Select a node to see who governs it, or a line to see why the two are connected. The map is centred
                    on {rootEntity?.name ?? 'the model'}.
                  </p>
                </div>
              </div>
            </aside>
          ) : null}
        </div>
      </div>

      <GovernanceFiltersDrawer open={filtersOpen} onClose={() => setFiltersOpen(false)} value={filters} onChange={updateFilters} />

      <Drawer
        open={summaryOpen}
        onClose={() => setSummaryOpen(false)}
        title="Governance model summary"
        subtitle="What the model currently covers, and where responsibility is complete."
        icon={<SummarizeOutlined sx={{ fontSize: 22, color: 'var(--ds-color-brand-primary)' }} />}
      >
        <div className="space-y-5">
          {summary.map((group) => (
            <section key={group.title}>
              <h3 className="text-overline uppercase text-text-tertiary">{group.title}</h3>
              <dl className="mt-2 divide-y divide-border rounded-lg border border-border">
                {group.rows.map((r) => (
                  <div key={r.label} className="flex items-center justify-between gap-3 px-3 py-2">
                    <dt className="min-w-0 truncate text-body-sm text-text-secondary">{r.label}</dt>
                    <dd className="shrink-0 text-body-sm-strong tabular-nums text-text-primary">{r.value}</dd>
                  </div>
                ))}
              </dl>
            </section>
          ))}
          <section>
            <h3 className="text-overline uppercase text-text-tertiary">Coverage</h3>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {metrics.map((m) => (
                <StatusChip
                  key={m.id}
                  intent={m.tone === 'success' ? 'success' : m.tone === 'danger' ? 'danger' : m.tone === 'warning' ? 'warning' : 'neutral'}
                  label={`${m.label}: ${m.value}`}
                />
              ))}
            </div>
          </section>
        </div>
      </Drawer>
    </div>
  );
}
