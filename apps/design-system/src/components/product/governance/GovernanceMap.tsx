'use client';

import * as React from 'react';
import WarningAmberOutlined from '@mui/icons-material/WarningAmberOutlined';
import CenterFocusStrongOutlined from '@mui/icons-material/CenterFocusStrongOutlined';
import ShieldOutlined from '@mui/icons-material/ShieldOutlined';
import UnfoldMoreOutlined from '@mui/icons-material/UnfoldMoreOutlined';
import UnfoldLessOutlined from '@mui/icons-material/UnfoldLessOutlined';
import { RelationshipCanvas, Tooltip, type CanvasEdge, type CanvasNode } from '@ds/components';
import { RiskDot } from '@/components/product/directory/RiskScoreChip';
import { GovEntityIcon } from './entity-visuals';
import { KIND_LABEL, LAYER_LABEL, LAYER_ORDER, RELATION_META, type GovEntity } from '@/data/governance-types';
import type { GovGraph } from '@/data/governance';

const COLUMN_LABELS = LAYER_ORDER.map((l) => LAYER_LABEL[l]);

const NODE_W = 216;
const NODE_H = 82;

/** A toggle in the canvas toolbar. Same height and hit area as the built-in buttons. */
function ModeToggle({
  label,
  active,
  onClick,
  children,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Tooltip title={label}>
      <button
        type="button"
        aria-pressed={active}
        aria-label={label}
        onClick={onClick}
        className={[
          'grid h-8 w-8 place-items-center rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-subtle',
          active ? 'bg-surface-selected text-brand' : 'text-icon hover:bg-surface-hover hover:text-text-primary',
        ].join(' ')}
      >
        {children}
      </button>
    </Tooltip>
  );
}

export interface GovernanceMapProps {
  graph: GovGraph;
  rootId: string;
  selectedId: string | null;
  selectedEdgeId: string | null;
  expanded: Set<string>;
  riskView: boolean;
  focusMode: boolean;
  findingCount: (id: string) => number;
  onSelectNode: (id: string) => void;
  onSelectEdge: (id: string) => void;
  onToggleExpand: (id: string) => void;
  onClearSelection: () => void;
  onToggleRiskView: () => void;
  onToggleFocusMode: () => void;
  onExpandAll: () => void;
  onCollapseAll: () => void;
}

/**
 * View A — the Governance Map.
 *
 * The canvas is a rendering of the model, never the model itself: everything it
 * draws comes from `buildGraph`, and every interaction it offers changes that
 * query rather than the picture. Focus and Risk are the two lenses the brief asks
 * for and both work the same way — they *de-emphasise*, never recolour, because a
 * map that turns red when you ask about risk stops being readable at the moment it
 * matters most.
 */
export function GovernanceMap({
  graph,
  rootId,
  selectedId,
  selectedEdgeId,
  expanded,
  riskView,
  focusMode,
  findingCount,
  onSelectNode,
  onSelectEdge,
  onToggleExpand,
  onClearSelection,
  onToggleRiskView,
  onToggleFocusMode,
  onExpandAll,
  onCollapseAll,
}: GovernanceMapProps) {
  const nodes: CanvasNode[] = React.useMemo(
    () => graph.nodes.map((n) => ({ id: n.entity.id, column: n.column })),
    [graph],
  );

  const edges: CanvasEdge[] = React.useMemo(
    () =>
      graph.edges.map((r) => ({
        id: r.id,
        source: r.source,
        target: r.target,
        label: RELATION_META[r.type].label,
        inactive: r.effective !== 'active',
      })),
    [graph],
  );

  const entityById = React.useMemo(() => new Map(graph.nodes.map((n) => [n.entity.id, n])), [graph]);

  /**
   * What recedes. Focus keeps the selection and everything one relationship away
   * from it; Risk keeps High and Critical. They compose — a node has to survive
   * both active lenses to stay prominent.
   */
  const dimmed = React.useMemo(() => {
    const out = new Set<string>();
    let neighbours: Set<string> | null = null;
    if (focusMode && selectedId) {
      neighbours = new Set([selectedId]);
      for (const e of graph.edges) {
        if (e.source === selectedId) neighbours.add(e.target);
        if (e.target === selectedId) neighbours.add(e.source);
      }
    }
    for (const n of graph.nodes) {
      if (neighbours && !neighbours.has(n.entity.id)) out.add(n.entity.id);
      if (riskView && n.entity.risk < 50 && n.entity.id !== rootId && findingCount(n.entity.id) === 0) out.add(n.entity.id);
    }
    return out;
  }, [focusMode, riskView, selectedId, rootId, graph, findingCount]);

  const renderNode = (node: CanvasNode, ctx: { selected: boolean; dimmed: boolean; hovered: boolean }) => {
    const model = entityById.get(node.id);
    if (!model) return null;
    const { entity, hiddenCount, isRoot } = model;
    const findings = findingCount(entity.id);
    const isExpanded = expanded.has(entity.id);

    return (
      <div
        className={[
          'group relative flex h-full w-full flex-col justify-center rounded-lg border bg-surface px-3 py-2 transition-all',
          ctx.selected ? 'border-brand shadow-sm ring-2 ring-brand-subtle' : 'border-border hover:border-border-strong hover:shadow-sm',
        ].join(' ')}
      >
        <button
          type="button"
          onClick={() => onSelectNode(entity.id)}
          className="flex min-w-0 items-center gap-2.5 text-left focus-visible:outline-none"
          aria-label={`${entity.name}, ${KIND_LABEL[entity.kind].one}`}
        >
          <GovEntityIcon entity={entity} size={28} accent={ctx.selected} />
          <span className="min-w-0 flex-1">
            <span className="flex items-center gap-1.5">
              <span className="min-w-0 truncate text-body-sm-strong text-text-primary">{entity.name}</span>
              {entity.risk > 0 && <RiskDot score={entity.risk} />}
            </span>
            <span className="mt-0.5 block truncate text-caption text-text-tertiary">
              {KIND_LABEL[entity.kind].one}
              {entity.metrics[0] ? ` · ${entity.metrics[0].label} ${entity.metrics[0].value}` : ''}
            </span>
          </span>
        </button>

        <div className="mt-1.5 flex min-w-0 items-center gap-2">
          {isRoot && <span className="shrink-0 text-overline uppercase text-text-tertiary">Root</span>}
          {findings > 0 && (
            <span className="flex min-w-0 items-center gap-1 truncate text-caption" style={{ color: 'var(--ds-color-status-danger-fg)' }}>
              <WarningAmberOutlined sx={{ fontSize: 13 }} aria-hidden />
              {findings} governance {findings === 1 ? 'gap' : 'gaps'}
            </span>
          )}
          {findings === 0 && !isRoot && entity.metrics[1] && (
            <span className="min-w-0 truncate text-caption text-text-tertiary">
              {entity.metrics[1].label} {entity.metrics[1].value}
            </span>
          )}
          {/* px-2 py-1 puts the chip at 24px — the WCAG 2.5.8 target-size floor.
              A 16px expander is the right size for the layout and the wrong size
              for a finger. */}
          {(hiddenCount > 0 || isExpanded) && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggleExpand(entity.id);
              }}
              className="ml-auto shrink-0 rounded-pill border border-border bg-canvas px-2 py-1 text-caption text-text-secondary transition-colors hover:border-border-strong hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-subtle"
              title={isExpanded ? 'Collapse this entity’s relationships' : `Show ${hiddenCount} more related ${hiddenCount === 1 ? 'entity' : 'entities'}`}
            >
              {isExpanded ? 'Collapse' : `+${hiddenCount}`}
            </button>
          )}
        </div>
      </div>
    );
  };

  /**
   * The root is always drawn, so the canvas's own empty state can never fire here.
   * A lone node with nothing around it is the state that actually happens — and on
   * its own it looks like a bug rather than a filter. Say what happened.
   */
  const isolated = graph.nodes.length <= 1 && graph.edges.length === 0;
  const rootName = graph.nodes[0]?.entity.name ?? 'this entity';

  return (
    <div className="relative h-full w-full">
      {isolated && (
        <div className="pointer-events-none absolute inset-x-0 top-4 z-10 flex justify-center px-4">
          <div className="pointer-events-auto max-w-[420px] rounded-lg border border-border bg-surface px-4 py-3 text-center shadow-md">
            <div className="text-body-sm-strong text-text-primary">Nothing related is in scope</div>
            <p className="mt-1 text-caption text-text-secondary">
              {rootName} has no relationships that match the active filters. Clear a filter, or choose a governance
              domain {rootName} actually connects to.
            </p>
          </div>
        </div>
      )}
      <RelationshipCanvas
        nodes={nodes}
        edges={edges}
        columnLabels={COLUMN_LABELS}
        renderNode={renderNode}
        selectedNodeId={selectedId}
        selectedEdgeId={selectedEdgeId}
        dimmedNodeIds={dimmed}
        frameNodeId={rootId}
        onNodeClick={onSelectNode}
        onEdgeClick={onSelectEdge}
        onBackgroundClick={onClearSelection}
        nodeWidth={NODE_W}
        nodeHeight={NODE_H}
        ariaLabel="Governance map"
        emptyTitle="No entities match this scope"
        emptyMessage="Clear a filter, or pick a different governance domain to see how it connects."
        toolbarExtras={
          <>
            <ModeToggle label="Focus mode — dim everything not connected to the selection" active={focusMode} onClick={onToggleFocusMode}>
              <CenterFocusStrongOutlined sx={{ fontSize: 18 }} />
            </ModeToggle>
            <ModeToggle label="Risk view — bring high and critical risk forward" active={riskView} onClick={onToggleRiskView}>
              <ShieldOutlined sx={{ fontSize: 18 }} />
            </ModeToggle>
            <ModeToggle label="Expand all relationships" active={false} onClick={onExpandAll}>
              <UnfoldMoreOutlined sx={{ fontSize: 18 }} />
            </ModeToggle>
            <ModeToggle label="Collapse to the root" active={false} onClick={onCollapseAll}>
              <UnfoldLessOutlined sx={{ fontSize: 18 }} />
            </ModeToggle>
          </>
        }
      />
    </div>
  );
}

export type { GovEntity };
