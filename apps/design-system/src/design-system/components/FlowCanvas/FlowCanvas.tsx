'use client';

import * as React from 'react';
import { typography } from '../../tokens/tokens';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import AddIcon from '@mui/icons-material/Add';
import RadioButtonUnchecked from '@mui/icons-material/RadioButtonUnchecked';
import Segment from '@mui/icons-material/Segment';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import ZoomOutIcon from '@mui/icons-material/ZoomOut';
import FitScreenIcon from '@mui/icons-material/FitScreen';
import UndoIcon from '@mui/icons-material/Undo';
import RedoIcon from '@mui/icons-material/Redo';
import styles from './flow-canvas.module.css';

/**
 * FlowCanvas — the Automation builders' derived-layout graph (ADR-0007: custom,
 * zero-dependency). It renders a recursive sequence/branch model as a top-down
 * tree with fan-out/merge connectors, connector drop-targets + quick-insert, and
 * a floating toolbar (density, zoom/fit, undo/redo). It owns layout, zoom and
 * insertion affordances; the consumer owns node data, cards, and selection.
 */
export type FlowPathStep = { nodeId: string; branchId: string };
export type FlowInsertLoc = { path: FlowPathStep[]; index: number };

export interface FlowBranchLike {
  id: string;
  label: string;
  seq: FlowNodeLike[];
  /** Sealed lanes (e.g. parallel approver slots) accept no inserted components. */
  sealed?: boolean;
  /** Semantic role of the lane. `'outcome'` lanes (e.g. Approved/Rejected) are
      terminal leaves: their tier fans out but does not merge/continue below. */
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
      Fallback chip between approver lanes and Approved/Rejected). */
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
function Pill({ label, icon }: { label: string; icon: React.ReactNode }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-pill bg-[#CFE5FC] px-4 py-2 text-body-sm-strong text-text-primary shadow-xs">
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
      <Menu
        anchorEl={anchor}
        open={Boolean(anchor)}
        onClose={() => setAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        transformOrigin={{ vertical: 'top', horizontal: 'center' }}
        MenuListProps={{ dense: true }}
        PaperProps={{ sx: { minWidth: 220, borderRadius: 'var(--ds-radius-md)' } }}
      >
        {palette.map((p) => (
          <MenuItem
            key={p.kind}
            onClick={(e) => {
              e.stopPropagation();
              onInsert(loc, p.kind);
              setAnchor(null);
            }}
            sx={{ fontSize: typography.bodySm.fontSize }}
          >
            {p.icon && <ListItemIcon sx={{ minWidth: 30, color: 'var(--ds-color-icon-default)' }}>{p.icon}</ListItemIcon>}
            {p.label}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}

/** Connector between two positions — vertical line + quick-insert "+" + drop target. */
function Connector({ loc }: { loc: FlowInsertLoc }) {
  const { palette, onInsert, dragKind, readOnly } = useCtx();
  const [over, setOver] = React.useState(false);
  const [anchor, setAnchor] = React.useState<HTMLElement | null>(null);

  const open = Boolean(anchor);
  const ghost = dragKind ? palette.find((p) => p.kind === dragKind) : undefined;

  // Read-only: the connector still draws the line that joins two steps, but it
  // stops being a target. Keeping the same height means a preview and its
  // builder render at identical geometry — the flow does not reflow when you
  // switch between reading it and editing it.
  if (readOnly) {
    return (
      <div className="relative flex h-9 min-w-[40px] items-center justify-center">
        <div className="h-full w-0.5 bg-border-strong" />
      </div>
    );
  }
  // Only the hovered slot opens to receive the drop — dragging never shifts the
  // whole canvas, so there's no jump when a drag begins.
  return (
    <div
      className={[
        'group/conn relative flex min-w-[40px] items-center justify-center transition-[height] duration-150',
        over && ghost ? 'h-[68px]' : 'h-9',
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
          <span className="text-body-strong">{ghost.label}</span>
        </div>
      ) : (
        <>
          <div className="h-full w-0.5 bg-border-strong transition-colors duration-150" />
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
        </>
      )}
      <Menu
        anchorEl={anchor}
        open={Boolean(anchor)}
        onClose={() => setAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        transformOrigin={{ vertical: 'top', horizontal: 'center' }}
        MenuListProps={{ dense: true }}
        PaperProps={{ sx: { minWidth: 220, borderRadius: 'var(--ds-radius-md)' } }}
      >
        {palette.map((p) => (
          <MenuItem
            key={p.kind}
            onClick={(e) => {
              // Portals bubble through the React tree — stop this click from
              // reaching the canvas viewport's clear-selection handler.
              e.stopPropagation();
              onInsert(loc, p.kind);
              setAnchor(null);
            }}
            sx={{ fontSize: typography.bodySm.fontSize }}
          >
            {p.icon && <ListItemIcon sx={{ minWidth: 30, color: 'var(--ds-color-icon-default)' }}>{p.icon}</ListItemIcon>}
            {p.label}
          </MenuItem>
        ))}
      </Menu>
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
          <div className={styles.stem} style={{ height: 28 }} />
          <AddComponentCard loc={{ path, index: 0 }} hint={ghost} />
          <div className={styles.stem} style={{ height: 28 }} />
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
      {seq.map((node, i) => (
        <React.Fragment key={node.id}>
          <Connector loc={{ path, index: i }} />
          <NodeBlock node={node} path={path} />
        </React.Fragment>
      ))}
      {/* No trailing connector below a terminal (Exit) node — the flow ends there. */}
      {!lastTerminal && <Connector loc={{ path, index: seq.length }} />}
    </div>
  );
}

/** One fan-out → lanes tier. `merges` (default) draws the bottom merge bus + stem so
    the flow reconverges and continues below (conditional / parallel / outcome tiers).
    Pass `merges={false}` only when every lane terminates (all lanes end in an Exit):
    the lanes are leaves, so no merge and no line continues below the fan-out. */
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
    <>
      <div className={styles.stem} style={{ height: 20 }} />
      <div className={styles.lanesRow}>
        {branches.map((br) => {
          // A lane doesn't merge back when the tier itself is terminal (outcomes) or
          // the lane ends in a flow-ending node (Exit / an approval's outcomes): it
          // drops its continuous line + merge elbow so nothing flows below it.
          const laneTerminal = !merges || (br.seq.length > 0 && endsFlow(br.seq[br.seq.length - 1], isTerminal));
          return (
            <div key={br.id} className={[styles.lane, laneTerminal ? styles.laneTerminal : ''].join(' ')}>
              <div className={styles.laneStemTop} />
              <div className="relative z-[1] mb-1.5 flex w-max max-w-full justify-center px-0.5">
                {renderBranchLabel ? (
                  renderBranchLabel(br, node)
                ) : (
                  <div className="rounded-pill bg-subtle px-3 py-1 text-caption-strong text-text-secondary">{br.label}</div>
                )}
              </div>
              <SequenceView seq={br.seq} path={[...path, { nodeId: node.id, branchId: br.id }]} sealed={br.sealed} branch={br} node={node} />
              <div className={styles.spacer} />
              {!laneTerminal && <div className={styles.laneStemBottom} />}
            </div>
          );
        })}
      </div>
      {merges && <div className={styles.stem} style={{ height: 20 }} />}
    </>
  );
}

function NodeBlock({ node, path }: { node: FlowNodeLike; path: FlowPathStep[] }) {
  const { renderCard, dense, isTerminal, renderBetweenTiers } = useCtx();
  const branches = node.branches ?? [];
  const outcomes = node.outcomeBranches ?? [];
  const between = outcomes.length > 0 ? renderBetweenTiers?.(node) : null;
  return (
    <div className="flex flex-col items-center">
      {renderCard(node, { dense })}
      {branches.length > 0 && <BranchTier node={node} branches={branches} path={path} merges={!tierTerminates(branches, isTerminal)} />}
      {between}
      {outcomes.length > 0 && <BranchTier node={node} branches={outcomes} path={path} merges={!tierTerminates(outcomes, isTerminal)} />}
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
}: FlowCanvasProps) {
  const [zoom, setZoom] = React.useState(1);
  const viewportRef = React.useRef<HTMLDivElement>(null);
  const stageRef = React.useRef<HTMLDivElement>(null);

  const dense = view === 'outline';

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

  const ctx: Ctx = { renderCard, palette, onInsert, renderBranchLabel, renderSealedBody, renderBetweenTiers, dense, dragKind: draggingKind ?? null, isTerminal, readOnly };
  // The flow ends (no End pill) only when the last root node is an Exit or every lane
  // of its branch tier exits — otherwise the branches merge and continue into End.
  const rootExits = root.length > 0 && endsFlow(root[root.length - 1], isTerminal);

  return (
    <div className="relative h-full">
      <div
        ref={viewportRef}
        className="ds-scroll h-full overflow-auto bg-subtle"
        style={{
          backgroundImage: 'radial-gradient(var(--ds-color-border-strong) 1px, transparent 1px)',
          backgroundSize: '20px 20px',
        }}
        onClick={() => onClearSelection?.()}
      >
        <div className="flex min-h-full w-full items-center justify-center py-10">
          <div
            ref={stageRef}
            style={{ transform: `scale(${zoom})`, transformOrigin: 'top center' }}
            className="flex flex-col items-center"
          >
            <CanvasContext.Provider value={ctx}>
              <Pill label="Start" icon={<RadioButtonUnchecked sx={{ fontSize: 15 }} />} />
              {headerCard && (
                <>
                  <div className={styles.stem} style={{ height: 28 }} />
                  {headerCard({ dense })}
                </>
              )}
              <SequenceView seq={root} path={[]} ghost={emptyHint} />
              {/* When the flow ends in an Exit, don't render the End terminal. */}
              {!rootExits && <Pill label="End" icon={<Segment sx={{ fontSize: 15 }} />} />}
            </CanvasContext.Provider>
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
