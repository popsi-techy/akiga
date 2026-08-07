'use client';

import * as React from 'react';
import ZoomInIcon from '@mui/icons-material/ZoomInOutlined';
import ZoomOutIcon from '@mui/icons-material/ZoomOutOutlined';
import FitScreenIcon from '@mui/icons-material/FitScreenOutlined';

/**
 * AccessGraph — the drill-down drawn as a node graph instead of a stack of lists.
 *
 * The columns view answers "what is in this level"; the graph answers "how does this
 * connect". Same selections, same data, different question — so this component owns
 * no selection state: the page passes the same handlers it gives ColumnBrowser, and
 * switching views keeps the reader's place.
 *
 * ## Layout
 * Positions are computed, not measured. Every node declares its height, so the whole
 * scene is arithmetic — no refs, no ResizeObserver, no post-paint reflow to line the
 * edges up with the cards, and the server and client agree on the geometry.
 *
 * The fan-out column (index 1) anchors at the top. The subject card before it centres
 * on that stack, and each later column centres on the parent it hangs off. That makes
 * an edge read as "this one thing opens into these", which is the whole point of
 * drawing it.
 *
 * ## Zoom and pan
 * The scene is a plain `overflow-auto` viewport, so two-finger scrolling pans in both
 * axes with no code and no gesture of ours to fight. Zoom is a CSS transform on the
 * stage; the wrapper is sized to the *scaled* extent so the scrollbars stay honest at
 * every scale. Trackpad pinch (a `wheel` event with `ctrlKey`) zooms about the
 * pointer, so the thing under the fingers is the thing that stays put.
 *
 * The column headings deliberately sit OUTSIDE the transform: their positions scale
 * with the columns, but their type does not. Annotation should stay legible when you
 * zoom out to see the shape of someone's access — that is exactly when you still need
 * to know which column is which.
 */
export interface GraphNode {
  id: string;
  label: string;
  sublabel?: string;
  /** Leading visual — avatar, app badge, icon tile, or a risk dot. */
  leading?: React.ReactNode;
  /** Right-aligned figure, e.g. how many children this node has. */
  count?: number;
  /** Right-aligned content. Takes precedence over `count`. */
  trailing?: React.ReactNode;
  /** Small pills under the body. Only the subject card has room for these. */
  tags?: string[];
}

export interface GraphColumn {
  id: string;
  /** Column heading, rendered above the canvas in small caps. */
  label: string;
  nodes: GraphNode[];
  selectedId?: string | null;
  onSelect?: (id: string) => void;
}

export interface AccessGraphProps {
  columns: GraphColumn[];
  /** Shown centred when there is nothing to draw yet. */
  emptyMessage?: string;
}

const COL_W = 240;
const COL_GAP = 84;
const NODE_GAP = 12;
const PAD_X = 32;
const PAD_Y = 24;
const ROW_H = 62; //       label + sublabel card
const TAG_H = 26; //       extra height when a node carries tags
const HEAD_STRIP = 34; //  heading row — unscaled chrome above the stage

const MIN_ZOOM = 0.5; // below this the 13px sublabels stop being words
const MAX_ZOOM = 2;
const clampZoom = (z: number) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, +z.toFixed(3)));

const nodeHeight = (n: GraphNode) => ROW_H + (n.tags?.length ? TAG_H : 0);
const stackHeight = (nodes: GraphNode[]) =>
  nodes.reduce((sum, n) => sum + nodeHeight(n), 0) + Math.max(0, nodes.length - 1) * NODE_GAP;

type Placed = { node: GraphNode; col: number; x: number; y: number; h: number };

export function AccessGraph({ columns, emptyMessage }: AccessGraphProps) {
  const live = columns.filter((c) => c.nodes.length > 0);

  const placed: Placed[] = [];
  const colX = (i: number) => PAD_X + i * (COL_W + COL_GAP);

  // The fan-out column sets the vertical rhythm; everything else hangs off a centre.
  const anchorCol = Math.min(1, live.length - 1);
  const tops = new Array<number>(live.length).fill(PAD_Y);
  const centreOf = (col: number, id?: string | null) => {
    const hit = placed.find((p) => p.col === col && p.node.id === id) ?? placed.find((p) => p.col === col);
    return hit ? hit.y + hit.h / 2 : PAD_Y;
  };
  const place = (i: number, top: number) => {
    let y = Math.max(PAD_Y, top);
    tops[i] = y;
    for (const node of live[i].nodes) {
      const h = nodeHeight(node);
      placed.push({ node, col: i, x: colX(i), y, h });
      y += h + NODE_GAP;
    }
  };

  if (live.length > 0) {
    place(anchorCol, PAD_Y);
    // Columns before the anchor (the subject) centre on the anchor's stack.
    for (let i = anchorCol - 1; i >= 0; i--) {
      const centre = tops[i + 1] + stackHeight(live[i + 1].nodes) / 2;
      place(i, centre - stackHeight(live[i].nodes) / 2);
    }
    // Columns after it centre on the parent node they descend from.
    for (let i = anchorCol + 1; i < live.length; i++) {
      const centre = centreOf(i - 1, live[i - 1].selectedId);
      place(i, centre - stackHeight(live[i].nodes) / 2);
    }
  }

  // Edges run from the selected node of a column to every node of the next one —
  // the only relationship the data actually asserts.
  const edges: { from: Placed; to: Placed; active: boolean }[] = [];
  for (let i = 1; i < live.length; i++) {
    const parentId = live[i - 1].selectedId ?? live[i - 1].nodes[0]?.id;
    const from = placed.find((p) => p.col === i - 1 && p.node.id === parentId);
    if (!from) continue;
    for (const to of placed.filter((p) => p.col === i)) {
      edges.push({ from, to, active: to.node.id === live[i].selectedId });
    }
  }

  const width = Math.max(colX(Math.max(live.length - 1, 0)) + COL_W + PAD_X, 0);
  const height = Math.max(...placed.map((p) => p.y + p.h), PAD_Y) + PAD_Y;

  const scrollRef = React.useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = React.useState(1);
  const zoomRef = React.useRef(zoom);
  zoomRef.current = zoom;

  /*
   * Zooming about a point means the content under that point must not move. Capture
   * where it is in stage coordinates before the scale changes, then put it back once
   * the DOM has resized — hence a layout effect rather than doing it inline.
   */
  const anchorRef = React.useRef<{ vx: number; vy: number; sx: number; sy: number } | null>(null);
  /**
   * `next` may be a function so that two clicks landing in one React batch step
   * twice — reading the rendered `zoom` would make the second click recompute from
   * the value the first one already replaced.
   */
  const zoomTo = React.useCallback((next: number | ((z: number) => number), at?: { clientX: number; clientY: number }) => {
    const el = scrollRef.current;
    if (el) {
      const rect = el.getBoundingClientRect();
      const vx = at ? at.clientX - rect.left : el.clientWidth / 2;
      const vy = at ? at.clientY - rect.top : el.clientHeight / 2;
      anchorRef.current = {
        vx,
        vy,
        sx: (el.scrollLeft + vx) / zoomRef.current,
        sy: (el.scrollTop + vy - HEAD_STRIP) / zoomRef.current,
      };
    }
    setZoom((z) => clampZoom(typeof next === 'function' ? next(z) : next));
  }, []);

  React.useLayoutEffect(() => {
    const el = scrollRef.current;
    const a = anchorRef.current;
    if (!el || !a) return;
    anchorRef.current = null;
    el.scrollLeft = a.sx * zoom - a.vx;
    el.scrollTop = a.sy * zoom + HEAD_STRIP - a.vy;
  }, [zoom]);

  /*
   * Trackpad pinch arrives as a wheel event with ctrlKey — which the browser would
   * otherwise turn into full-page zoom. React's onWheel is passive, so preventDefault
   * there is ignored; the listener has to be attached natively as non-passive. Plain
   * two-finger scrolling falls through untouched and the viewport pans it.
   */
  React.useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if (!e.ctrlKey) return;
      e.preventDefault();
      // Multiplicative, so a pinch feels the same at 60% as at 160%.
      zoomTo(zoomRef.current * (1 - e.deltaY * 0.0025), e);
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [zoomTo]);

  const fit = React.useCallback(() => {
    const el = scrollRef.current;
    if (!el || width === 0 || height === 0) return;
    const z = Math.min(el.clientWidth / width, (el.clientHeight - HEAD_STRIP) / height, 1);
    anchorRef.current = null;
    setZoom(clampZoom(z));
    el.scrollTo({ left: 0, top: 0, behavior: 'smooth' });
  }, [width, height]);

  /*
   * Four columns of cards cannot fit the width a page like this has left over, so the
   * canvas pans — and it pans itself. Revealing a level the reader cannot see is the
   * same as not revealing it, so each new selection brings the newest column's stack
   * into view. Only ever forward: yanking the view back when the target is already
   * visible would fight the reader's own panning.
   */
  const lastCol = live.length - 1;
  const lastStack = placed.filter((p) => p.col === lastCol);
  const lastRight = colX(Math.max(lastCol, 0)) + COL_W + PAD_X;
  const lastBottom = lastStack.length ? Math.max(...lastStack.map((p) => p.y + p.h)) + PAD_Y : 0;
  const signature = live.map((c) => `${c.id}:${c.selectedId ?? ''}`).join('|');
  React.useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const z = zoomRef.current;
    const right = lastRight * z;
    const bottom = lastBottom * z + HEAD_STRIP;
    const left = right > el.scrollLeft + el.clientWidth ? right - el.clientWidth : el.scrollLeft;
    const top = bottom > el.scrollTop + el.clientHeight ? bottom - el.clientHeight : el.scrollTop;
    if (left !== el.scrollLeft || top !== el.scrollTop) el.scrollTo({ left, top, behavior: 'smooth' });
  }, [signature, lastRight, lastBottom]);

  const empty = live.length === 0;

  return (
    <div className="relative h-full">
      <div
        ref={scrollRef}
        className="ds-scroll h-full overflow-auto bg-subtle"
        style={{
          backgroundImage: 'radial-gradient(var(--ds-color-border-strong) 1px, transparent 1px)',
          // The texture tracks the zoom, so scaling reads as moving closer rather
          // than as the cards changing size against a fixed backdrop.
          backgroundSize: `${20 * zoom}px ${20 * zoom}px`,
        }}
      >
        {empty ? (
          <p className="flex h-full items-center justify-center px-8 text-center text-body-sm text-text-tertiary">
            {emptyMessage}
          </p>
        ) : (
          <div
            className="relative"
            style={{ width: width * zoom, height: height * zoom + HEAD_STRIP, minWidth: '100%', minHeight: '100%' }}
          >
            {/* Headings: unscaled type at scaled positions. Sticky so they survive a
                vertical pan; they move sideways with their columns. */}
            <div
              className="sticky top-0 z-10 border-b border-border bg-subtle"
              style={{ height: HEAD_STRIP }}
            >
              {live.map((c, i) => (
                <span
                  key={c.id}
                  className="absolute bottom-1.5 truncate pr-3 text-caption font-semibold uppercase tracking-wider text-text-tertiary"
                  style={{ left: colX(i) * zoom, maxWidth: COL_W * zoom }}
                >
                  {c.label}
                </span>
              ))}
            </div>

            <div
              className="absolute left-0"
              style={{ top: HEAD_STRIP, width, height, transform: `scale(${zoom})`, transformOrigin: 'top left' }}
            >
              <svg aria-hidden className="absolute left-0 top-0" width={width} height={height} fill="none">
                {edges.map(({ from, to, active }) => {
                  const x1 = from.x + COL_W;
                  const y1 = from.y + from.h / 2;
                  const x2 = to.x;
                  const y2 = to.y + to.h / 2;
                  const dx = COL_GAP * 0.55;
                  return (
                    <path
                      key={`${from.node.id}->${to.node.id}`}
                      d={`M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`}
                      stroke={active ? 'var(--ds-color-brand-primary)' : 'var(--ds-color-border-strong)'}
                      strokeWidth={active ? 2 : 1.5}
                    />
                  );
                })}
              </svg>

              {placed.map((p) => {
                const col = live[p.col];
                const on = col.selectedId === p.node.id;
                const interactive = Boolean(col.onSelect);
                const Tag = interactive ? 'button' : 'div';
                return (
                  <Tag
                    key={`${col.id}:${p.node.id}`}
                    {...(interactive
                      ? { type: 'button' as const, onClick: () => col.onSelect?.(p.node.id), 'aria-pressed': on }
                      : {})}
                    className={[
                      'absolute flex items-center gap-2.5 rounded-lg border bg-surface px-3 text-left transition-all',
                      p.node.tags?.length ? 'flex-wrap content-center' : '',
                      on ? 'border-brand shadow-sm' : 'border-border',
                      interactive ? 'hover:border-border-strong hover:shadow-sm' : '',
                    ].join(' ')}
                    style={{ left: p.x, top: p.y, width: COL_W, height: p.h }}
                  >
                    <span className="flex w-full items-center gap-2.5">
                      {p.node.leading}
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-body font-semibold text-text-primary">{p.node.label}</span>
                        {p.node.sublabel && (
                          <span className="block truncate text-body-sm text-text-secondary">{p.node.sublabel}</span>
                        )}
                      </span>
                      {p.node.trailing ??
                        (p.node.count != null ? (
                          <span className="shrink-0 text-body-sm font-semibold tabular-nums text-text-secondary">
                            {p.node.count}
                          </span>
                        ) : null)}
                    </span>
                    {p.node.tags?.length ? (
                      <span className="flex w-full flex-wrap items-center gap-1.5">
                        {p.node.tags.map((t) => (
                          <span
                            key={t}
                            className="rounded border border-border bg-subtle px-1.5 py-0.5 text-caption font-medium text-text-secondary"
                          >
                            {t}
                          </span>
                        ))}
                      </span>
                    ) : null}
                  </Tag>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {!empty && (
        <div className="absolute bottom-3 right-3 z-20 flex items-center rounded-lg border border-border bg-surface p-1 shadow-sm">
          <ToolButton label="Zoom out" onClick={() => zoomTo((z) => z - 0.1)} disabled={zoom <= MIN_ZOOM}>
            <ZoomOutIcon sx={{ fontSize: 18 }} />
          </ToolButton>
          <span className="w-11 text-center text-caption tabular-nums text-text-secondary">
            {Math.round(zoom * 100)}%
          </span>
          <ToolButton label="Zoom in" onClick={() => zoomTo((z) => z + 0.1)} disabled={zoom >= MAX_ZOOM}>
            <ZoomInIcon sx={{ fontSize: 18 }} />
          </ToolButton>
          <span aria-hidden className="mx-1 h-5 w-px bg-border" />
          <ToolButton label="Fit to view" onClick={fit} title="Fit to view — pinch or Ctrl + scroll to zoom">
            <FitScreenIcon sx={{ fontSize: 18 }} />
          </ToolButton>
        </div>
      )}
    </div>
  );
}

function ToolButton({
  label,
  title,
  onClick,
  disabled,
  children,
}: {
  label: string;
  title?: string;
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={title ?? label}
      onClick={onClick}
      disabled={disabled}
      className="grid h-7 w-7 place-items-center rounded-md text-icon transition-colors hover:bg-surface-hover hover:text-text-primary disabled:pointer-events-none disabled:text-text-disabled"
    >
      {children}
    </button>
  );
}

export default AccessGraph;
