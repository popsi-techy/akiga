'use client';

import * as React from 'react';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import ZoomOutIcon from '@mui/icons-material/ZoomOut';
import FitScreenIcon from '@mui/icons-material/FitScreen';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import FullscreenIcon from '@mui/icons-material/Fullscreen';
import FullscreenExitIcon from '@mui/icons-material/FullscreenExit';
import styles from './relationship-canvas.module.css';

/**
 * RelationshipCanvas — a layered relationship graph for entity models.
 *
 * The complementary piece to `FlowCanvas`: that one renders a *sequence* (a policy
 * or workflow executing top-down); this one renders a *network* (how a set of
 * entities relate) as left-to-right columns. Both are custom and dependency-free
 * for the same reason (ADR-0007) — the layouts we need are derived, not
 * user-positioned, so a general graph library would be weight without leverage.
 *
 * What the component owns: column layout, crossing reduction, edge routing and
 * labelling, zoom / pan / fit, selection and dimming, and keyboard operation.
 * What the consumer owns: the node's card (`renderNode`), what a column means, and
 * every decision about which nodes and edges exist.
 *
 * Layout is fully derived from `node.column`, so the same node set always produces
 * the same picture — a graph that reshuffles between renders cannot be read.
 */

export interface CanvasNode {
  id: string;
  /** Column index. Columns are compacted: gaps in the numbering close up. */
  column: number;
  /** Overrides the shared node height for a taller card. */
  height?: number;
}

export interface CanvasEdge {
  id: string;
  source: string;
  target: string;
  /** The verb drawn at the midpoint — what makes the line mean something. */
  label: string;
  /** Renders the line as provisional (dashed) without changing its colour. */
  inactive?: boolean;
}

export interface RelationshipCanvasProps {
  nodes: CanvasNode[];
  edges: CanvasEdge[];
  /** Column heading by column index, e.g. `['Organization', 'Roles', …]`. */
  columnLabels: string[];
  /** Renders one node's card at the size the canvas reserved for it. */
  renderNode: (node: CanvasNode, ctx: { selected: boolean; dimmed: boolean; hovered: boolean }) => React.ReactNode;
  selectedNodeId?: string | null;
  selectedEdgeId?: string | null;
  /** Nodes to push back visually — focus mode, risk mode, an active filter. */
  dimmedNodeIds?: ReadonlySet<string>;
  /**
   * The node the opening view is built around. When the graph is too wide to show
   * legibly, this is what stays on screen — without it a wide graph opens on
   * whichever column happens to be leftmost, which may not contain the subject at all.
   */
  frameNodeId?: string | null;
  onNodeClick?: (id: string) => void;
  onEdgeClick?: (id: string) => void;
  onBackgroundClick?: () => void;
  /** Product controls placed to the left of the built-in view controls. */
  toolbarExtras?: React.ReactNode;
  /** Node card width. Every node shares it so columns align. @default 232 */
  nodeWidth?: number;
  /** Node card height, unless a node overrides it. @default 76 */
  nodeHeight?: number;
  emptyTitle?: string;
  emptyMessage?: string;
  /** Accessible name for the graph region. */
  ariaLabel?: string;
}

const COLUMN_GAP = 104;
const ROW_GAP = 14;
const PADDING = 40;
const HEADER_H = 28;
const MIN_SCALE = 0.3;
const MAX_SCALE = 1.6;
/**
 * Below this, a 13px node title renders under 9px and the map stops being
 * readable. A six-column governance graph is simply wider than a console pane, so
 * the opening view frames the root at a legible size and lets the user pan —
 * shrinking the whole model to fit would technically "show everything" and
 * practically show nothing. Fit-to-view stays one click away in the toolbar.
 */
const LEGIBLE_SCALE = 0.72;
/** Barycenter sweeps. Two each way settles these graph sizes; more never moved a node. */
const ORDERING_PASSES = 4;

interface Placed {
  node: CanvasNode;
  col: number;
  x: number;
  y: number;
  w: number;
  h: number;
}

/**
 * Assigns coordinates: compact the columns, order each column by the mean position
 * of its neighbours (the barycenter heuristic — cheap, deterministic, and enough to
 * remove most crossings at this scale), then centre each column vertically.
 */
function layout(nodes: CanvasNode[], edges: CanvasEdge[], nodeWidth: number, nodeHeight: number) {
  const usedColumns = [...new Set(nodes.map((n) => n.column))].sort((a, b) => a - b);
  const slotOf = new Map(usedColumns.map((c, i) => [c, i]));

  const columns: CanvasNode[][] = usedColumns.map(() => []);
  for (const n of nodes) columns[slotOf.get(n.column)!].push(n);

  const indexOf = new Map<string, number>();
  const columnOf = new Map<string, number>();
  const reindex = () => {
    columns.forEach((col, ci) =>
      col.forEach((n, i) => {
        indexOf.set(n.id, i);
        columnOf.set(n.id, ci);
      }),
    );
  };
  reindex();

  const neighbours = new Map<string, string[]>();
  for (const e of edges) {
    if (!neighbours.has(e.source)) neighbours.set(e.source, []);
    if (!neighbours.has(e.target)) neighbours.set(e.target, []);
    neighbours.get(e.source)!.push(e.target);
    neighbours.get(e.target)!.push(e.source);
  }

  for (let pass = 0; pass < ORDERING_PASSES; pass++) {
    const order = pass % 2 === 0 ? columns.map((_, i) => i) : columns.map((_, i) => columns.length - 1 - i);
    for (const ci of order) {
      const col = columns[ci];
      const key = new Map<string, number>();
      col.forEach((n, i) => {
        const others = (neighbours.get(n.id) ?? []).filter((o) => columnOf.get(o) !== ci);
        // No cross-column neighbour: hold position rather than drift to the top.
        const bary = others.length === 0 ? i : others.reduce((s, o) => s + (indexOf.get(o) ?? 0), 0) / others.length;
        key.set(n.id, bary);
      });
      col.sort((a, b) => (key.get(a.id) ?? 0) - (key.get(b.id) ?? 0) || a.id.localeCompare(b.id));
      reindex();
    }
  }

  const heights = columns.map((col) => col.reduce((s, n, i) => s + (n.height ?? nodeHeight) + (i > 0 ? ROW_GAP : 0), 0));
  const tallest = Math.max(0, ...heights);

  const placed: Placed[] = [];
  columns.forEach((col, ci) => {
    let y = PADDING + HEADER_H + (tallest - heights[ci]) / 2;
    for (const n of col) {
      const h = n.height ?? nodeHeight;
      placed.push({ node: n, col: ci, x: PADDING + ci * (nodeWidth + COLUMN_GAP), y, w: nodeWidth, h });
      y += h + ROW_GAP;
    }
  });

  return {
    placed,
    usedColumns,
    width: PADDING * 2 + columns.length * nodeWidth + Math.max(0, columns.length - 1) * COLUMN_GAP,
    height: PADDING * 2 + HEADER_H + tallest,
    nodeWidth,
  };
}

/**
 * Routes one edge. Forward edges leave the right face and enter the left; an edge
 * that points back up the model (a policy scoping down to a department) leaves the
 * left face and sweeps around, so direction is legible from the shape alone.
 */
function edgePath(a: Placed, b: Placed): { d: string; mid: { x: number; y: number } } {
  const ay = a.y + a.h / 2;
  const by = b.y + b.h / 2;

  if (a.col === b.col) {
    // Same column: a lobe off the right face, sized to the vertical gap.
    const x = a.x + a.w;
    const bow = Math.min(96, 40 + Math.abs(by - ay) * 0.35);
    return {
      d: `M ${x} ${ay} C ${x + bow} ${ay}, ${x + bow} ${by}, ${x} ${by}`,
      mid: { x: x + bow * 0.75, y: (ay + by) / 2 },
    };
  }

  const forward = b.col > a.col;
  const sx = forward ? a.x + a.w : a.x;
  const tx = forward ? b.x : b.x + b.w;
  const dx = Math.abs(tx - sx);

  if (forward) {
    const c = Math.max(48, dx * 0.45);
    return {
      d: `M ${sx} ${ay} C ${sx + c} ${ay}, ${tx - c} ${by}, ${tx} ${by}`,
      mid: { x: (sx + tx) / 2, y: (ay + by) / 2 },
    };
  }

  // Backward: drop below both cards so the return path never hides behind a column.
  const drop = Math.max(a.y + a.h, b.y + b.h) + 44;
  const c = Math.max(56, dx * 0.18);
  return {
    d: `M ${sx} ${ay} C ${sx - c} ${ay}, ${tx + c} ${drop}, ${(sx + tx) / 2} ${drop} C ${tx - c} ${drop}, ${tx + c} ${by}, ${tx} ${by}`,
    mid: { x: (sx + tx) / 2, y: drop },
  };
}

/** Suppresses labels that would overlap, on a coarse grid. Nearest-first wins. */
function visibleLabels(items: { id: string; x: number; y: number; width: number }[]): Set<string> {
  const taken: { x1: number; x2: number; y1: number; y2: number }[] = [];
  const out = new Set<string>();
  for (const it of items) {
    const box = { x1: it.x - it.width / 2, x2: it.x + it.width / 2, y1: it.y - 10, y2: it.y + 10 };
    if (taken.some((t) => box.x1 < t.x2 && box.x2 > t.x1 && box.y1 < t.y2 && box.y2 > t.y1)) continue;
    taken.push(box);
    out.add(it.id);
  }
  return out;
}

function ToolButton({
  label,
  onClick,
  children,
  disabled,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      disabled={disabled}
      className="grid h-8 w-8 place-items-center rounded-md text-icon transition-colors hover:bg-surface-hover hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-subtle disabled:cursor-not-allowed disabled:text-text-disabled disabled:hover:bg-transparent"
    >
      {children}
    </button>
  );
}

export function RelationshipCanvas({
  nodes,
  edges,
  columnLabels,
  renderNode,
  selectedNodeId = null,
  selectedEdgeId = null,
  dimmedNodeIds,
  frameNodeId = null,
  onNodeClick,
  onEdgeClick,
  onBackgroundClick,
  toolbarExtras,
  nodeWidth = 216,
  nodeHeight = 74,
  emptyTitle = 'Nothing to map',
  emptyMessage = 'Choose an entity to see how it is governed.',
  ariaLabel = 'Relationship map',
}: RelationshipCanvasProps) {
  const viewportRef = React.useRef<HTMLDivElement>(null);
  const [view, setView] = React.useState({ scale: 1, x: 0, y: 0 });
  const [animated, setAnimated] = React.useState(true);
  const [panning, setPanning] = React.useState(false);
  const [hoveredEdge, setHoveredEdge] = React.useState<string | null>(null);
  const [hoveredNode, setHoveredNode] = React.useState<string | null>(null);
  const [fullscreen, setFullscreen] = React.useState(false);

  const model = React.useMemo(() => layout(nodes, edges, nodeWidth, nodeHeight), [nodes, edges, nodeWidth, nodeHeight]);
  const placedById = React.useMemo(() => new Map(model.placed.map((p) => [p.node.id, p])), [model]);

  const routed = React.useMemo(() => {
    return edges
      .map((e) => {
        const a = placedById.get(e.source);
        const b = placedById.get(e.target);
        if (!a || !b) return null;
        return { edge: e, ...edgePath(a, b) };
      })
      .filter((x): x is NonNullable<typeof x> => x !== null);
  }, [edges, placedById]);

  const labelsShown = React.useMemo(
    () => visibleLabels(routed.map((r) => ({ id: r.edge.id, x: r.mid.x, y: r.mid.y, width: r.edge.label.length * 6 + 16 }))),
    [routed],
  );

  /** Scales the plane so the whole graph fits, then centres it. */
  const fit = React.useCallback(() => {
    const vp = viewportRef.current;
    if (!vp || model.placed.length === 0) return;
    const { clientWidth: w, clientHeight: h } = vp;
    const scale = Math.max(MIN_SCALE, Math.min(1, Math.min(w / model.width, h / model.height)));
    setAnimated(true);
    setView({ scale, x: (w - model.width * scale) / 2, y: (h - model.height * scale) / 2 });
  }, [model]);

  /**
   * The opening view. Fits when the whole graph would still be legible; otherwise
   * holds a readable scale and anchors the framed node a third of the way in, so
   * what brought the user here is on screen with room for what it leads to.
   */
  const frame = React.useCallback(() => {
    const vp = viewportRef.current;
    if (!vp || model.placed.length === 0) return;
    const { clientWidth: w, clientHeight: h } = vp;
    const fitScale = Math.min(1, Math.min(w / model.width, h / model.height));
    setAnimated(true);
    if (fitScale >= LEGIBLE_SCALE) {
      setView({ scale: fitScale, x: (w - model.width * fitScale) / 2, y: (h - model.height * fitScale) / 2 });
      return;
    }
    const scale = LEGIBLE_SCALE;
    const anchor = (frameNodeId && placedById.get(frameNodeId)) || model.placed[0];
    const ax = anchor.x + anchor.w / 2;
    const ay = anchor.y + anchor.h / 2;
    // Clamp so anchoring never leaves empty plane on the leading edges.
    const x = Math.min(0, Math.max(w - model.width * scale, w / 3 - ax * scale));
    const y = model.height * scale <= h ? (h - model.height * scale) / 2 : Math.min(0, Math.max(h - model.height * scale, h / 2 - ay * scale));
    setView({ scale, x, y });
  }, [model, frameNodeId, placedById]);

  // Re-frame when the graph changes shape — a new root should arrive readable.
  React.useEffect(() => {
    frame();
  }, [frame]);

  React.useEffect(() => {
    const vp = viewportRef.current;
    if (!vp) return;
    const ro = new ResizeObserver(() => frame());
    ro.observe(vp);
    return () => ro.disconnect();
  }, [frame]);

  const zoomBy = (factor: number) => {
    const vp = viewportRef.current;
    if (!vp) return;
    setAnimated(true);
    setView((v) => {
      const scale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, v.scale * factor));
      // Zoom about the viewport centre, so the thing being read stays put.
      const cx = vp.clientWidth / 2;
      const cy = vp.clientHeight / 2;
      const k = scale / v.scale;
      return { scale, x: cx - (cx - v.x) * k, y: cy - (cy - v.y) * k };
    });
  };

  const reset = () => {
    setAnimated(true);
    setView({ scale: 1, x: 0, y: 0 });
  };

  // ---- pan -------------------------------------------------------------
  const drag = React.useRef<{ x: number; y: number; vx: number; vy: number; moved: boolean } | null>(null);
  const onPointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    const target = e.target as HTMLElement;
    if (target.closest('[data-canvas-node]') || target.closest('[data-canvas-edge]') || target.closest('[data-canvas-toolbar]')) return;
    drag.current = { x: e.clientX, y: e.clientY, vx: view.x, vy: view.y, moved: false };
    setAnimated(false);
    setPanning(true);
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d) return;
    const dx = e.clientX - d.x;
    const dy = e.clientY - d.y;
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) d.moved = true;
    setView((v) => ({ ...v, x: d.vx + dx, y: d.vy + dy }));
  };
  const endPan = (e: React.PointerEvent) => {
    const d = drag.current;
    drag.current = null;
    setPanning(false);
    if (d && !d.moved) onBackgroundClick?.();
    if ((e.currentTarget as HTMLElement).hasPointerCapture?.(e.pointerId)) {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    }
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    const step = 64;
    const moves: Record<string, [number, number]> = {
      ArrowLeft: [step, 0],
      ArrowRight: [-step, 0],
      ArrowUp: [0, step],
      ArrowDown: [0, -step],
    };
    if (moves[e.key]) {
      e.preventDefault();
      setAnimated(false);
      const [dx, dy] = moves[e.key];
      setView((v) => ({ ...v, x: v.x + dx, y: v.y + dy }));
    } else if (e.key === '+' || e.key === '=') {
      e.preventDefault();
      zoomBy(1.2);
    } else if (e.key === '-' || e.key === '_') {
      e.preventDefault();
      zoomBy(1 / 1.2);
    } else if (e.key === '0') {
      e.preventDefault();
      fit();
    } else if (e.key === 'Escape' && fullscreen) {
      setFullscreen(false);
    }
  };

  const isDimmed = (id: string) => Boolean(dimmedNodeIds?.has(id));

  const empty = nodes.length === 0;

  const toolbar = (
    <div
      data-canvas-toolbar
      className="pointer-events-auto absolute bottom-4 left-4 z-10 flex items-center gap-1 rounded-lg border border-border bg-surface px-1.5 py-1 shadow-md"
    >
      {toolbarExtras}
      {toolbarExtras && <span className="mx-0.5 h-5 w-px bg-border" aria-hidden />}
      <ToolButton label="Zoom out" onClick={() => zoomBy(1 / 1.2)} disabled={view.scale <= MIN_SCALE + 0.001}>
        <ZoomOutIcon sx={{ fontSize: 18 }} />
      </ToolButton>
      <span className="min-w-[42px] px-1 text-center text-caption tabular-nums text-text-secondary">
        {Math.round(view.scale * 100)}%
      </span>
      <ToolButton label="Zoom in" onClick={() => zoomBy(1.2)} disabled={view.scale >= MAX_SCALE - 0.001}>
        <ZoomInIcon sx={{ fontSize: 18 }} />
      </ToolButton>
      <ToolButton label="Fit to view" onClick={fit}>
        <FitScreenIcon sx={{ fontSize: 18 }} />
      </ToolButton>
      <ToolButton label="Reset view" onClick={reset}>
        <RestartAltIcon sx={{ fontSize: 18 }} />
      </ToolButton>
      <ToolButton label={fullscreen ? 'Exit fullscreen' : 'Fullscreen'} onClick={() => setFullscreen((f) => !f)}>
        {fullscreen ? <FullscreenExitIcon sx={{ fontSize: 18 }} /> : <FullscreenIcon sx={{ fontSize: 18 }} />}
      </ToolButton>
    </div>
  );

  const surface = (
    <div className="relative h-full w-full">
      <div
        ref={viewportRef}
        role="application"
        aria-label={ariaLabel}
        tabIndex={0}
        className={[styles.viewport, panning ? styles.panning : ''].filter(Boolean).join(' ')}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endPan}
        onPointerCancel={endPan}
        onKeyDown={onKeyDown}
      >
        {empty ? (
          <div className="grid h-full place-items-center px-6">
            <div className="max-w-[320px] text-center">
              <div className="text-body-strong text-text-primary">{emptyTitle}</div>
              <p className="mt-1 text-body-sm text-text-secondary">{emptyMessage}</p>
            </div>
          </div>
        ) : (
          <div
            className={[styles.plane, animated ? styles.planeAnimated : ''].filter(Boolean).join(' ')}
            style={{ width: model.width, height: model.height, transform: `translate(${view.x}px, ${view.y}px) scale(${view.scale})` }}
          >
            {/* column headings — taxonomy for the columns, not headings (§4 rule 4) */}
            {model.usedColumns.map((c, i) => (
              <div
                key={c}
                className="absolute text-overline uppercase text-text-tertiary"
                style={{ left: PADDING + i * (model.nodeWidth + COLUMN_GAP), top: PADDING, width: model.nodeWidth }}
              >
                {columnLabels[c] ?? ''}
              </div>
            ))}

            <svg className={styles.edgeLayer} width={model.width} height={model.height} aria-hidden={false}>
              {routed.map(({ edge, d }) => {
                const dim = isDimmed(edge.source) || isDimmed(edge.target);
                const active = selectedEdgeId === edge.id || hoveredEdge === edge.id || hoveredNode === edge.source || hoveredNode === edge.target;
                return (
                  <g key={edge.id}>
                    <path
                      d={d}
                      data-canvas-edge
                      role="button"
                      tabIndex={0}
                      aria-label={edge.label}
                      className={styles.edgeHit}
                      onClick={(ev) => {
                        ev.stopPropagation();
                        onEdgeClick?.(edge.id);
                      }}
                      onKeyDown={(ev) => {
                        if (ev.key === 'Enter' || ev.key === ' ') {
                          ev.preventDefault();
                          ev.stopPropagation();
                          onEdgeClick?.(edge.id);
                        }
                      }}
                      onMouseEnter={() => setHoveredEdge(edge.id)}
                      onMouseLeave={() => setHoveredEdge((h) => (h === edge.id ? null : h))}
                      onFocus={() => setHoveredEdge(edge.id)}
                      onBlur={() => setHoveredEdge((h) => (h === edge.id ? null : h))}
                    />
                    <path
                      d={d}
                      className={[
                        styles.edge,
                        active ? styles.edgeActive : '',
                        dim ? styles.edgeDimmed : '',
                        edge.inactive ? styles.edgeInactive : '',
                      ]
                        .filter(Boolean)
                        .join(' ')}
                    />
                  </g>
                );
              })}
            </svg>

            {/* edge labels sit above the lines but below the cards */}
            {routed.map(({ edge, mid }) => {
              const dim = isDimmed(edge.source) || isDimmed(edge.target);
              const active = selectedEdgeId === edge.id || hoveredEdge === edge.id || hoveredNode === edge.source || hoveredNode === edge.target;
              if (!active && !labelsShown.has(edge.id)) return null;
              return (
                <span
                  key={`label-${edge.id}`}
                  className={[
                    styles.edgeLabel,
                    'absolute -translate-x-1/2 -translate-y-1/2 whitespace-nowrap rounded-pill border px-2 py-0.5 text-caption',
                    active ? 'border-brand bg-surface text-text-brand' : 'border-border bg-canvas text-text-secondary',
                    dim ? styles.edgeLabelDimmed : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  style={{ left: mid.x, top: mid.y }}
                >
                  {edge.label}
                </span>
              );
            })}

            {model.placed.map((p) => {
              const selected = selectedNodeId === p.node.id;
              const dimmed = isDimmed(p.node.id);
              return (
                <div
                  key={p.node.id}
                  data-canvas-node
                  className={[styles.node, dimmed ? styles.nodeDimmed : ''].filter(Boolean).join(' ')}
                  style={{ left: p.x, top: p.y, width: p.w, height: p.h }}
                  onMouseEnter={() => setHoveredNode(p.node.id)}
                  onMouseLeave={() => setHoveredNode((h) => (h === p.node.id ? null : h))}
                  onClick={(e) => {
                    e.stopPropagation();
                    onNodeClick?.(p.node.id);
                  }}
                >
                  {renderNode(p.node, { selected, dimmed, hovered: hoveredNode === p.node.id })}
                </div>
              );
            })}
          </div>
        )}
        {!empty && toolbar}
      </div>
    </div>
  );

  if (!fullscreen) return surface;
  return (
    <div className="fixed inset-0 z-[1300] bg-canvas p-0" role="dialog" aria-modal="true" aria-label={`${ariaLabel} — fullscreen`}>
      {surface}
    </div>
  );
}

export default RelationshipCanvas;
