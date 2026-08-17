'use client';

import * as React from 'react';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import ListSubheader from '@mui/material/ListSubheader';
import AddIcon from '@mui/icons-material/Add';
import RadioButtonUnchecked from '@mui/icons-material/RadioButtonUnchecked';
import Segment from '@mui/icons-material/Segment';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import ZoomOutIcon from '@mui/icons-material/ZoomOut';
import FitScreenIcon from '@mui/icons-material/FitScreen';
import UndoIcon from '@mui/icons-material/Undo';
import RedoIcon from '@mui/icons-material/Redo';
import styles from './flow-canvas.module.css';
import { buildEdgeModel, buildSimTrace, type EdgeModel } from './flowEdges';
import { FlowStem } from './FlowStem';

export { FlowStem } from './FlowStem';
export { buildSimTrace } from './flowEdges';

export type SimNodeState = 'pending' | 'active' | 'passed' | 'failed' | 'skipped';

/** Live Test Run visuals — owned by the canvas so zoom/measure stay correct. */
export interface FlowSimulation {
  active: boolean;
  nodeStates: Record<string, SimNodeState>;
  /** Ordered marker ids (`__start__`, node ids, `__end__`) for the animated trace. */
  traceNodeIds: string[];
  traceTone: 'success' | 'danger';
}

/**
 * FlowCanvas — the Automation builders' derived-layout graph (ADR-0007: custom,
 * zero-dependency). Cards and lanes lay out in the DOM; connectors are a
 * measured SVG overlay (ResizeObserver → orthogonal paths), so fan-out / merge
 * attaches to real anchors rather than CSS bus borders. It owns layout, zoom
 * and insertion affordances; the consumer owns node data, cards, and selection.
 */
export type FlowPathStep = { nodeId: string; branchId: string };
export type FlowInsertLoc = { path: FlowPathStep[]; index: number };

export interface FlowBranchLike {
  id: string;
  label: string;
  seq: FlowNodeLike[];
  /** Sealed lanes (e.g. parallel approver slots) accept no inserted components. */
  sealed?: boolean;
  /**
   * Semantic role of the lane. Merge behaviour is decided by whether every lane
   * of the tier ends the flow (`tierTerminates`), not by this flag alone.
   */
  kind?: string;
}
export interface FlowNodeLike {
  id: string;
  branches?: FlowBranchLike[];
  /** Optional second-tier fan-out rendered after `branches` merge. */
  outcomeBranches?: FlowBranchLike[];
}

export interface PaletteEntry {
  kind: string;
  label: string;
  icon?: React.ReactNode;
  /**
   * Group heading, e.g. `'Tasks'`. Entries sharing a section are listed together
   * under one overline; sections appear in the order they are first seen, so the
   * quick-insert menu reads in the same order as the sidebar palette. Omit on
   * every entry for a flat list.
   */
  section?: string;
  /** Icon-tile colours, so an item looks the same here as in the sidebar. */
  tile?: { bg: string; fg: string };
}

const NEUTRAL_TILE = { bg: 'var(--ds-color-surface-hover)', fg: 'var(--ds-color-icon-default)' };

/**
 * The quick-insert list, shared by the connector "+" and the empty-state card so
 * the two can never drift. Items carry the same icon tile as the sidebar palette:
 * the menu is a shortcut to the same components, and it should look like it.
 */
function PaletteMenu({
  anchor,
  onClose,
  palette,
  onPick,
}: {
  anchor: HTMLElement | null;
  onClose: () => void;
  palette: PaletteEntry[];
  onPick: (kind: string) => void;
}) {
  // Preserve first-seen order rather than sorting: the consumer's palette order is
  // the authored order, and the sidebar already presents it that way.
  const sections: { title: string | null; items: PaletteEntry[] }[] = [];
  for (const entry of palette) {
    const title = entry.section ?? null;
    const last = sections[sections.length - 1];
    if (last && last.title === title) last.items.push(entry);
    else sections.push({ title, items: [entry] });
  }

  return (
    <Menu
      anchorEl={anchor}
      open={Boolean(anchor)}
      onClose={onClose}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      transformOrigin={{ vertical: 'top', horizontal: 'center' }}
      MenuListProps={{ dense: true, sx: { py: 0.5 } }}
      PaperProps={{ sx: { minWidth: 248, borderRadius: 'var(--ds-radius-md)' } }}
    >
      {sections.flatMap((section, si) => [
        section.title ? (
          <ListSubheader
            key={`h-${section.title}`}
            disableSticky
            // `overline` is the taxonomy token (§4 rule 4) — it names what kind of
            // components these are, and carries no meaning you'd lose by removing it.
            className="text-overline uppercase text-text-tertiary"
            sx={{ lineHeight: '16px', px: 1.75, pt: si === 0 ? 1 : 1.5, pb: 0.75, bgcolor: 'transparent' }}
          >
            {section.title}
          </ListSubheader>
        ) : null,
        ...section.items.map((p) => {
          const tile = p.tile ?? NEUTRAL_TILE;
          return (
            <MenuItem
              key={p.kind}
              onClick={(e) => {
                // Portals bubble through the React tree — stop this click from
                // reaching the canvas viewport's clear-selection handler.
                e.stopPropagation();
                onPick(p.kind);
                onClose();
              }}
              sx={{ gap: 1.25, px: 1.75, py: 0.75, borderRadius: 'var(--ds-radius-sm)', mx: 0.5 }}
            >
              <span
                className="grid h-7 w-7 shrink-0 place-items-center rounded-md"
                style={{ backgroundColor: tile.bg, color: tile.fg }}
              >
                {p.icon}
              </span>
              <span className="text-body-sm-strong text-text-primary">{p.label}</span>
            </MenuItem>
          );
        }),
      ])}
    </Menu>
  );
}

export interface FlowCanvasProps {
  root: FlowNodeLike[];
  /** Render a node's card (fully interactive — the consumer wires selection/delete). */
  renderCard: (node: FlowNodeLike, ctx: { dense: boolean }) => React.ReactNode;
  /** Optional fixed card between Start and the root sequence (e.g. the Policy card). */
  headerCard?: (ctx: { dense: boolean }) => React.ReactNode;
  palette: PaletteEntry[];
  onInsert: (loc: FlowInsertLoc, kind: string) => void;
  /** Custom lane-label content (e.g. condition summaries). Defaults to `branch.label`.
      Receives the owning node so a lane chip can select its parent. */
  renderBranchLabel?: (branch: FlowBranchLike, node: FlowNodeLike) => React.ReactNode;
  /** Custom content under a lane label (e.g. Auto Approve pill, fallback email).
      Shown for sealed empty lanes, and as a prefix above inserts/seq when the
      lane is open (e.g. Fallback SLA path under Approver Not Found). */
  renderSealedBody?: (branch: FlowBranchLike, node: FlowNodeLike) => React.ReactNode;
  /** Content between the first branch tier and outcomeBranches (e.g. Parallel's
      Fallback chip between approver lanes and Approved/Rejected). The canvas
      owns the stem above this content — do not draw one in the consumer. */
  renderBetweenTiers?: (node: FlowNodeLike) => React.ReactNode;
  onClearSelection?: () => void;
  view?: 'outline' | 'detailed';
  onViewChange?: (v: 'outline' | 'detailed') => void;
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  /** Shown as a dashed ghost when the root sequence is empty. */
  emptyHint?: string;
  /** Kind currently being dragged from the palette — drives the drop ghost. */
  draggingKind?: string | null;
  /** Marks a node as flow-terminating (e.g. Exit): nothing connects below it. */
  isTerminal?: (node: FlowNodeLike) => boolean;
  /**
   * Render the flow without any authoring affordances — no quick-insert "+",
   * no drop targets, no empty-state add card. The same layout, zoom and cards as
   * the builder, so a preview and its editor are the same picture.
   */
  readOnly?: boolean;
  /** Dummy / live Test Run visuals (dim edges, node rings, animated trace). */
  simulation?: FlowSimulation;
}

interface Ctx {
  renderCard: FlowCanvasProps['renderCard'];
  palette: PaletteEntry[];
  onInsert: FlowCanvasProps['onInsert'];
  renderBranchLabel?: FlowCanvasProps['renderBranchLabel'];
  renderSealedBody?: FlowCanvasProps['renderSealedBody'];
  renderBetweenTiers?: FlowCanvasProps['renderBetweenTiers'];
  dense: boolean;
  dragKind: string | null;
  isTerminal?: (node: FlowNodeLike) => boolean;
  readOnly: boolean;
  /** Bump the edge remeasure after DOM that affects anchors mounts. */
  requestMeasure: () => void;
  simulation?: FlowSimulation;
}

function simClass(state: SimNodeState | undefined, active: boolean): string {
  if (!active || !state) return '';
  const map: Record<SimNodeState, string> = {
    pending: styles.simPending,
    active: styles.simActive,
    passed: styles.simPassed,
    failed: styles.simFailed,
    skipped: styles.simSkipped,
  };
  return `${styles.simNode} ${map[state]}`;
}
const CanvasContext = React.createContext<Ctx | null>(null);
const useCtx = () => {
  const c = React.useContext(CanvasContext);
  if (!c) throw new Error('FlowCanvas subtree used outside provider');
  return c;
};

/** True when EVERY lane ends the flow (an empty lane "falls through" and continues, so
    it does not count). Such a tier has no merge/continuation below it. */
function allLanesEnd(branches: FlowBranchLike[] | undefined, isTerminal?: (n: FlowNodeLike) => boolean): boolean {
  return !!branches && branches.length > 0 && branches.every((l) => l.seq.length > 0 && endsFlow(l.seq[l.seq.length - 1], isTerminal));
}
/** A branch tier fans out but never merges back ONLY when every one of its lanes
    terminates (ends in an Exit). Outcome lanes (Approved / Rejected) otherwise merge
    back and continue to the End terminal, exactly like conditional / parallel tiers. */
function tierTerminates(branches: FlowBranchLike[] | undefined, isTerminal?: (n: FlowNodeLike) => boolean): boolean {
  return allLanesEnd(branches, isTerminal);
}
/** A node ends its flow only when it's explicitly terminal (Exit) or every lane of a
    branch tier it owns terminates — otherwise its lanes merge and the flow continues
    down to the End terminal. */
function endsFlow(node: FlowNodeLike, isTerminal?: (n: FlowNodeLike) => boolean): boolean {
  return (isTerminal?.(node) ?? false) || tierTerminates(node.branches, isTerminal) || tierTerminates(node.outcomeBranches, isTerminal);
}

/** Start / End terminal markers — soft-blue pills with a leading glyph. */
function Pill({
  label,
  icon,
  simId,
}: {
  label: string;
  icon: React.ReactNode;
  simId?: string;
}) {
  const { simulation } = useCtx();
  const state = simId && simulation?.active ? simulation.nodeStates[simId] : undefined;
  return (
    <div
      data-flow-sim-node={simId}
      className={['inline-flex items-center gap-2 rounded-pill bg-[#CFE5FC] px-4 py-2 text-body-sm-strong text-text-primary shadow-xs', simClass(state, !!simulation?.active)].filter(Boolean).join(' ')}
    >
      <span className="flex text-[var(--ds-color-status-info-solid)]">{icon}</span>
      {label}
    </div>
  );
}

/**
 * Large empty-state prompt shown when the root sequence has no steps yet — a
 * dashed drop target that also opens the quick-insert menu on click.
 */
function AddComponentCard({ loc, hint }: { loc: FlowInsertLoc; hint?: string }) {
  const { palette, onInsert, readOnly } = useCtx();
  const [over, setOver] = React.useState(false);
  const [anchor, setAnchor] = React.useState<HTMLElement | null>(null);

  // A read-only canvas with nothing to show says so, rather than inviting an
  // insertion it cannot accept.
  if (readOnly) {
    return (
      <div className="ds-node-in flex w-[320px] flex-col items-center gap-1 rounded-xl border border-dashed border-border bg-surface px-8 py-7 text-center">
        <span className="text-body-strong text-text-primary">No steps yet</span>
        <span className="text-caption text-text-tertiary">{hint ?? 'This flow has not been built.'}</span>
      </div>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          if (palette.length) setAnchor(e.currentTarget);
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setOver(false);
          const kind = e.dataTransfer.getData('text/kind');
          if (kind) onInsert(loc, kind);
        }}
        className={[
          'ds-node-in flex w-[320px] flex-col items-center gap-2 rounded-xl border-2 border-dashed px-8 py-7 text-center transition-colors',
          over ? 'border-brand bg-brand-subtle' : 'border-border bg-surface hover:border-border-strong',
        ].join(' ')}
      >
        <span className="grid h-11 w-11 place-items-center rounded-full bg-brand-subtle text-brand">
          <AddIcon sx={{ fontSize: 22 }} />
        </span>
        <span className="text-body-strong text-text-primary">{hint ?? 'Add component'}</span>
        <span className="text-caption text-text-tertiary">Drag from the sidebar or click to insert</span>
      </button>
      <PaletteMenu anchor={anchor} onClose={() => setAnchor(null)} palette={palette} onPick={(kind) => onInsert(loc, kind)} />
    </>
  );
}

/** Connector between two positions — hit target + quick-insert "+". The vertical
    stroke is drawn by the SVG overlay via `data-flow-vseg`. */
function Connector({ loc }: { loc: FlowInsertLoc }) {
  const { palette, onInsert, dragKind, readOnly, requestMeasure } = useCtx();
  const [over, setOver] = React.useState(false);
  const [anchor, setAnchor] = React.useState<HTMLElement | null>(null);

  const open = Boolean(anchor);
  const ghost = dragKind ? palette.find((p) => p.kind === dragKind) : undefined;

  // Ghost open/close changes connector height — remeasure edges.
  React.useEffect(() => {
    requestMeasure();
  }, [over, ghost, requestMeasure]);

  // Read-only: the connector still reserves the join height, but it stops being
  // a target. Keeping the same height means a preview and its builder render at
  // identical geometry — the flow does not reflow when you switch between
  // reading it and editing it.
  if (readOnly) {
    return <div data-flow-vseg className={`relative flex h-9 min-w-[40px] items-center justify-center ${styles.vseg}`} />;
  }
  // Only the hovered slot opens to receive the drop — dragging never shifts the
  // whole canvas, so there's no jump when a drag begins.
  return (
    <div
      data-flow-vseg
      className={[
        'group/conn relative flex min-w-[40px] items-center justify-center transition-[height] duration-150',
        over && ghost ? 'h-[68px]' : 'h-9',
        styles.vseg,
      ].join(' ')}
      onDragOver={(e) => {
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        const kind = e.dataTransfer.getData('text/kind');
        if (kind) onInsert(loc, kind);
      }}
    >
      {over && ghost ? (
        // Drop ghost — a dashed preview of the component being dragged.
        <div className="ds-node-in pointer-events-none flex w-[320px] items-center gap-2.5 rounded-xl border-2 border-dashed border-border-strong bg-subtle px-4 py-3 text-text-secondary">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center">{ghost.icon}</span>
          {/* Matches a node card's title weight — this is a preview of that card. */}
          <span className="text-body-medium">{ghost.label}</span>
        </div>
      ) : (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setAnchor(e.currentTarget);
          }}
          aria-label="Insert component"
          className={[
            'absolute grid h-[22px] w-[22px] place-items-center rounded-full border bg-surface shadow-xs transition-all duration-150',
            open
              ? 'scale-100 border-brand text-brand opacity-100'
              : 'scale-90 border-border-strong text-icon opacity-0 hover:border-brand hover:text-brand group-hover/conn:scale-100 group-hover/conn:opacity-100',
          ].join(' ')}
        >
          <AddIcon sx={{ fontSize: 14 }} />
        </button>
      )}
      <PaletteMenu anchor={anchor} onClose={() => setAnchor(null)} palette={palette} onPick={(kind) => onInsert(loc, kind)} />
    </div>
  );
}

function SequenceView({
  seq,
  path,
  ghost,
  sealed,
  branch,
  node,
}: {
  seq: FlowNodeLike[];
  path: FlowPathStep[];
  ghost?: string;
  sealed?: boolean;
  /** Owning branch + node — only needed so a sealed, empty lane can ask
      `renderSealedBody` for fixed content (e.g. an "Auto Approve" pill). */
  branch?: FlowBranchLike;
  node?: FlowNodeLike;
}) {
  const { isTerminal, renderSealedBody } = useCtx();
  // Lane intro (email + auto-resolve pill, etc.) — shown for sealed lanes and as
  // a prefix above insert/seq when the lane is open (e.g. Fallback SLA path).
  const intro = path.length > 0 && branch && node ? renderSealedBody?.(branch, node) : undefined;

  if (seq.length === 0) {
    // Root empty → large "Add component" prompt with connecting stems to Start/End.
    if (path.length === 0) {
      return (
        <div className="flex flex-col items-center">
          <FlowStem height={28} />
          <AddComponentCard loc={{ path, index: 0 }} hint={ghost} />
          <FlowStem height={28} />
        </div>
      );
    }
    // Sealed lane → fixed content only (no insert).
    if (sealed) {
      return intro ? <div className="flex flex-col items-center">{intro}</div> : null;
    }
    // Open empty lane → optional intro (e.g. fallback email) then insert connector.
    return (
      <div className="flex flex-col items-center">
        {intro}
        <Connector loc={{ path, index: 0 }} />
      </div>
    );
  }
  const lastTerminal = seq.length > 0 && endsFlow(seq[seq.length - 1], isTerminal);
  return (
    <div className="flex flex-col items-center">
      {intro}
      {seq.map((n, i) => (
        <React.Fragment key={n.id}>
          <Connector loc={{ path, index: i }} />
          <NodeBlock node={n} path={path} />
        </React.Fragment>
      ))}
      {/* No trailing connector below a terminal (Exit) node — the flow ends there. */}
      {!lastTerminal && <Connector loc={{ path, index: seq.length }} />}
    </div>
  );
}

/** One fan-out → lanes tier. Layout pads reserve elbow room; the SVG overlay
    draws the bus / stems from measured anchors. */
function BranchTier({
  node,
  branches,
  path,
  merges = true,
}: {
  node: FlowNodeLike;
  branches: FlowBranchLike[];
  path: FlowPathStep[];
  merges?: boolean;
}) {
  const { renderBranchLabel, isTerminal } = useCtx();
  return (
    <div data-flow-tier data-merges={merges ? 'true' : 'false'} className="flex flex-col items-center">
      <div data-flow-lanes className={styles.lanesRow}>
        {branches.map((br) => {
          // A lane doesn't merge back when the tier itself is terminal (outcomes) or
          // the lane ends in a flow-ending node (Exit / an approval's outcomes): it
          // drops its continuous line + merge elbow so nothing flows below it.
          const laneTerminal = !merges || (br.seq.length > 0 && endsFlow(br.seq[br.seq.length - 1], isTerminal));
          return (
            <div
              key={br.id}
              data-flow-lane
              data-terminal={laneTerminal ? 'true' : 'false'}
              className={styles.lane}
            >
              <div data-flow-lane-head className={styles.laneHead} />
              <div className="relative z-[1] mb-1.5 flex w-max max-w-full justify-center px-0.5">
                {renderBranchLabel ? (
                  renderBranchLabel(br, node)
                ) : (
                  <div className="rounded-pill bg-subtle px-3 py-1 text-caption-medium text-text-secondary">{br.label}</div>
                )}
              </div>
              <SequenceView seq={br.seq} path={[...path, { nodeId: node.id, branchId: br.id }]} sealed={br.sealed} branch={br} node={node} />
              {/* Equalizer stem: SVG strokes this when the lane merges. Without it,
                  empty/short lanes (e.g. ELSE) show only stubs under the label and
                  at the merge bus — the flex gap stays blank. Terminal lanes omit
                  the attribute so nothing hangs below a dead-end path. */}
              <div
                className={styles.spacer}
                {...(!laneTerminal ? { 'data-flow-vseg': true } : {})}
                aria-hidden
              />
              {!laneTerminal && <div data-flow-lane-foot className={styles.laneFoot} />}
            </div>
          );
        })}
      </div>
      {merges && <div data-flow-tier-exit className={styles.tierExit} />}
    </div>
  );
}

function NodeBlock({ node, path }: { node: FlowNodeLike; path: FlowPathStep[] }) {
  const { renderCard, dense, isTerminal, renderBetweenTiers, simulation } = useCtx();
  const branches = node.branches ?? [];
  const outcomes = node.outcomeBranches ?? [];
  const between = outcomes.length > 0 ? renderBetweenTiers?.(node) : null;
  const state = simulation?.active ? simulation.nodeStates[node.id] : undefined;
  return (
    <div className="flex flex-col items-center">
      <div data-flow-sim-node={node.id} className={simClass(state, !!simulation?.active)}>
        {renderCard(node, { dense })}
      </div>
      {branches.length > 0 && (
        <>
          <FlowStem height={20} />
          <BranchTier node={node} branches={branches} path={path} merges={!tierTerminates(branches, isTerminal)} />
        </>
      )}
      {between != null && between !== false && (
        <div className="flex flex-col items-center">
          {/* Canvas owns the stem into between-tier chrome (Fallback chip, etc.). */}
          <FlowStem height={20} />
          {between}
        </div>
      )}
      {outcomes.length > 0 && (
        <>
          <FlowStem height={20} />
          <BranchTier node={node} branches={outcomes} path={path} merges={!tierTerminates(outcomes, isTerminal)} />
        </>
      )}
    </div>
  );
}

export function FlowCanvas({
  root,
  renderCard,
  headerCard,
  palette,
  onInsert,
  renderBranchLabel,
  renderSealedBody,
  renderBetweenTiers,
  onClearSelection,
  view = 'detailed',
  onViewChange,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  emptyHint = 'Add component',
  draggingKind,
  isTerminal,
  readOnly = false,
  simulation,
}: FlowCanvasProps) {
  const [zoom, setZoom] = React.useState(1);
  const [edges, setEdges] = React.useState<EdgeModel>({ width: 0, height: 0, paths: [] });
  const [traceD, setTraceD] = React.useState('');
  const viewportRef = React.useRef<HTMLDivElement>(null);
  const stageRef = React.useRef<HTMLDivElement>(null);
  const rafRef = React.useRef(0);
  const dense = view === 'outline';
  const simActive = !!simulation?.active;
  const traceKey = simulation?.traceNodeIds?.join('|') ?? '';

  const measure = React.useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      setEdges(buildEdgeModel(stageRef.current, zoom));
      if (simulation?.active && simulation.traceNodeIds.length >= 2) {
        setTraceD(buildSimTrace(stageRef.current, zoom, simulation.traceNodeIds));
      } else {
        setTraceD('');
      }
    });
  }, [zoom, simulation?.active, traceKey]);

  const requestMeasure = React.useCallback(() => {
    measure();
  }, [measure]);

  // Remeasure whenever the tree, density, zoom, or simulation trace changes.
  React.useLayoutEffect(() => {
    measure();
  }, [measure, root, dense, headerCard, renderSealedBody, renderBetweenTiers, renderBranchLabel, draggingKind, simulation?.nodeStates]);

  React.useEffect(() => {
    const st = stageRef.current;
    if (!st || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(() => measure());
    ro.observe(st);
    // Also watch the viewport — fit/scroll can change visible geometry.
    const vp = viewportRef.current;
    if (vp) ro.observe(vp);
    return () => ro.disconnect();
  }, [measure]);

  const fit = React.useCallback(() => {
    const vp = viewportRef.current;
    const st = stageRef.current;
    if (!vp || !st) return;
    const z = Math.min((vp.clientWidth - 64) / st.scrollWidth, (vp.clientHeight - 64) / st.scrollHeight, 1);
    setZoom(Math.max(0.1, Number.isFinite(z) && z > 0 ? z : 1));
  }, []);

  // Trackpad pinch arrives as a `wheel` event with ctrlKey=true, which the
  // browser would otherwise turn into full-page zoom. React's onWheel is passive,
  // so preventDefault() there is ignored — we must attach a NON-passive native
  // listener to cancel the page zoom and scope it to the canvas instead.
  React.useEffect(() => {
    const vp = viewportRef.current;
    if (!vp) return;
    const handleWheel = (e: WheelEvent) => {
      if (!e.ctrlKey) return; // ctrl+wheel / trackpad pinch only; plain scroll passes through
      e.preventDefault();
      setZoom((z) => Math.min(2, Math.max(0.1, +(z - e.deltaY * 0.002).toFixed(2))));
    };
    vp.addEventListener('wheel', handleWheel, { passive: false });
    return () => vp.removeEventListener('wheel', handleWheel);
  }, []);

  const ctx: Ctx = {
    renderCard,
    palette,
    onInsert,
    renderBranchLabel,
    renderSealedBody,
    renderBetweenTiers,
    dense,
    dragKind: draggingKind ?? null,
    isTerminal,
    readOnly,
    requestMeasure,
    simulation,
  };
  // The flow ends (no End pill) only when the last root node is an Exit or every lane
  // of its branch tier exits — otherwise the branches merge and continue into End.
  const rootExits = root.length > 0 && endsFlow(root[root.length - 1], isTerminal);

  return (
    <div className="relative h-full">
      <div
        ref={viewportRef}
        className="ds-scroll h-full overflow-auto bg-subtle"
        style={{
          // The grain sits BEHIND the flow, so it uses `border-default` while the
          // connectors use `border-strong`. Sharing one token made a dot and a
          // connector the same value, and the plumbing stopped reading as structure.
          backgroundImage: 'radial-gradient(var(--ds-color-border-default) 1px, transparent 1px)',
          backgroundSize: '20px 20px',
        }}
        onClick={() => onClearSelection?.()}
      >
        <div className="flex min-h-full w-full items-center justify-center py-10">
          <div
            ref={stageRef}
            style={{ transform: `scale(${zoom})`, transformOrigin: 'top center' }}
            className={styles.stage}
          >
            <svg
              className={styles.edgeLayer}
              width={edges.width || 1}
              height={edges.height || 1}
              aria-hidden
            >
              {edges.paths.map((d, i) => (
                <path
                  key={i}
                  d={d}
                  className={[styles.edge, simActive ? styles.edgeDimmed : ''].filter(Boolean).join(' ')}
                />
              ))}
              {traceD ? (
                <path
                  d={traceD}
                  className={[
                    styles.edgeTrace,
                    simulation?.traceTone === 'danger' ? styles.edgeTraceDanger : styles.edgeTraceSuccess,
                  ].join(' ')}
                />
              ) : null}
            </svg>
            <div className={styles.stack}>
              <CanvasContext.Provider value={ctx}>
                <Pill label="Start" icon={<RadioButtonUnchecked sx={{ fontSize: 15 }} />} simId="__start__" />
                {headerCard && (
                  <>
                    <FlowStem height={28} />
                    {headerCard({ dense })}
                  </>
                )}
                <SequenceView seq={root} path={[]} ghost={emptyHint} />
                {/* When the flow ends in an Exit, don't render the End terminal. */}
                {!rootExits && <Pill label="End" icon={<Segment sx={{ fontSize: 15 }} />} simId="__end__" />}
              </CanvasContext.Provider>
            </div>
          </div>
        </div>
      </div>

      {/* floating toolbar */}
      <div className="absolute bottom-4 left-4 flex items-center gap-1 rounded-lg border border-border bg-surface px-2 py-1.5 shadow-md">
        {onViewChange && (
          <>
            <div className="flex items-center rounded-md bg-subtle p-0.5 text-caption-strong">
              {(['outline', 'detailed'] as const).map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => onViewChange(v)}
                  className={[
                    'rounded-[5px] px-2.5 py-1 capitalize transition-colors',
                    view === v ? 'bg-surface text-text-primary shadow-xs' : 'text-text-secondary',
                  ].join(' ')}
                >
                  {v}
                </button>
              ))}
            </div>
            <div className="mx-1 h-5 w-px bg-border" />
          </>
        )}
        <button type="button" onClick={() => setZoom((z) => Math.max(0.1, +(z - 0.1).toFixed(2)))} className="grid h-7 w-7 place-items-center rounded-md text-icon hover:bg-surface-hover" aria-label="Zoom out">
          <ZoomOutIcon sx={{ fontSize: 18 }} />
        </button>
        <span className="w-11 text-center text-caption tabular-nums text-text-secondary">{Math.round(zoom * 100)}%</span>
        <button type="button" onClick={() => setZoom((z) => Math.min(2, +(z + 0.1).toFixed(2)))} className="grid h-7 w-7 place-items-center rounded-md text-icon hover:bg-surface-hover" aria-label="Zoom in">
          <ZoomInIcon sx={{ fontSize: 18 }} />
        </button>
        <button type="button" onClick={fit} className="grid h-7 w-7 place-items-center rounded-md text-icon hover:bg-surface-hover" aria-label="Fit to view">
          <FitScreenIcon sx={{ fontSize: 18 }} />
        </button>
        {(onUndo || onRedo) && (
          <>
            <div className="mx-1 h-5 w-px bg-border" />
            <button type="button" onClick={onUndo} disabled={!canUndo} className="grid h-7 w-7 place-items-center rounded-md text-icon hover:bg-surface-hover disabled:opacity-40" aria-label="Undo">
              <UndoIcon sx={{ fontSize: 18 }} />
            </button>
            <button type="button" onClick={onRedo} disabled={!canRedo} className="grid h-7 w-7 place-items-center rounded-md text-icon hover:bg-surface-hover disabled:opacity-40" aria-label="Redo">
              <RedoIcon sx={{ fontSize: 18 }} />
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default FlowCanvas;
