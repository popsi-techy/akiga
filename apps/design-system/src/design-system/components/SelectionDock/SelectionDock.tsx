'use client';

import * as React from 'react';
import CloseOutlined from '@mui/icons-material/CloseOutlined';
import DoneAllOutlined from '@mui/icons-material/DoneAllOutlined';
import DragIndicator from '@mui/icons-material/DragIndicator';
import RemoveDoneOutlined from '@mui/icons-material/RemoveDoneOutlined';
import { spacing, zIndex } from '../../tokens/tokens';
import { Button } from '../Button/Button';

/** How close the dragged pill may get to the edge of the area it can be seen in. */
const DRAG_INSET = Number.parseInt(spacing[2], 10);

/**
 * How far the pill may be dragged: the nearest ancestor that clips, which is
 * the page's scroll container in every current use.
 *
 * Not the `relative` parent it is positioned against — that parent is usually
 * the table, and stopping there means the toolbar and the whitespace around the
 * table are unreachable even though the pill would paint there perfectly well.
 * Not the viewport either: past a clipping ancestor the pill is simply cut off,
 * so a wider limit would let you drag it out of existence.
 */
function boundsFor(node: HTMLElement): HTMLElement {
  for (let el = node.parentElement; el; el = el.parentElement) {
    const { overflow, overflowX, overflowY } = getComputedStyle(el);
    if ([overflow, overflowX, overflowY].some((v) => v !== 'visible')) return el;
  }
  return document.documentElement;
}

/**
 * SelectionDock — a floating card for bulk work.
 *
 * DataTable's first-row banner is the first “something is selected”: it lives
 * inside the table, so it steals a row and hides the moment you page away.
 * This card sits on the page and holds the count, select-all, and the actions
 * that apply to the selection.
 *
 * `bottom` (default) — inverse toolbar, bottom-center. Access Certification V2.
 * `header` — Notion-style: a light pill that overlays the table header, a
 * drag handle, count, Select all N (Clear all when the set is full) as a
 * link, icon actions, and a close. Access Certification V1. The handle moves
 * the pill anywhere on the page area it can be seen — it starts over the table
 * header, where it is in the way of the rows you are about to act on, so it has
 * to be able to leave the table (see {@link boundsFor}).
 *
 * Overlay only: `absolute` + out of flow, so it never grows or shrinks the
 * table. Sit it in a `relative` ancestor that is the work surface (not the
 * viewport), so the sidebar is never covered.
 */
export interface SelectionDockProps {
  open: boolean;
  /** How many rows in the current set are selected. */
  count: number;
  /** How many rows the current set has — used for “Select all”. */
  total: number;
  noun: string;
  nounPlural?: string;
  allSelected: boolean;
  /**
   * `bottom` — inverse card, bottom-center, named Select all.
   * `header` — light pill on the table header, Select all N (Clear all when full).
   * @default 'bottom'
   */
  placement?: 'bottom' | 'header';
  onSelectAll: () => void;
  onClear: () => void;
  /** Bulk actions — typically tertiary `xs` `Button`s, or icon buttons on `header`. */
  children?: React.ReactNode;
}

function Separator({ onInverse }: { onInverse?: boolean }) {
  return (
    <span
      className={`h-4 border-l ${onInverse ? 'border-border-strong' : 'border-border'}`}
      aria-hidden
    />
  );
}

/** Text controls on the inverse chrome — tertiary Button defaults assume a light surface. */
const inverseControlSx = {
  color: 'var(--ds-color-text-inverse)',
  '& .MuiButton-startIcon': { color: 'var(--ds-color-text-inverse)' },
  '&:hover': {
    color: 'var(--ds-color-text-inverse)',
    backgroundColor: 'var(--ds-color-surface-inverse)',
  },
} as const;

function invertActions(node: React.ReactNode): React.ReactNode {
  return React.Children.map(node, (child) => {
    if (!React.isValidElement(child)) return child;
    if (child.type === React.Fragment) {
      return invertActions((child.props as { children?: React.ReactNode }).children);
    }
    const props = child.props as { sx?: object };
    return React.cloneElement(child as React.ReactElement<{ sx?: object }>, {
      sx: { ...props.sx, ...inverseControlSx },
    });
  });
}

export function SelectionDock({
  open,
  count,
  total,
  noun,
  nounPlural,
  allSelected,
  placement = 'bottom',
  onSelectAll,
  onClear,
  children,
}: SelectionDockProps) {
  const plural = nounPlural ?? `${noun}s`;
  const label = count === 1 ? noun : plural;
  const shown = allSelected ? total : count;
  const header = placement === 'header';
  const rootRef = React.useRef<HTMLDivElement>(null);
  const offsetRef = React.useRef({ x: 0, y: 0 });
  const dragRef = React.useRef<{
    id: number;
    startX: number;
    startY: number;
    originX: number;
    originY: number;
  } | null>(null);
  const [offset, setOffset] = React.useState({ x: 0, y: 0 });
  const [dragging, setDragging] = React.useState(false);

  /**
   * Measured off live rects rather than the parent's padding box, so the limit
   * holds whatever the pill is positioned against and wherever the page has
   * been scrolled to. `offsetRef` is subtracted to recover where the pill would
   * sit at rest, which is the origin the offsets are relative to.
   */
  const clampOffset = React.useCallback((x: number, y: number) => {
    const wrap = rootRef.current;
    const card = wrap?.firstElementChild as HTMLElement | null;
    if (!wrap || !card) return { x, y };
    const limit = boundsFor(wrap).getBoundingClientRect();
    const rect = card.getBoundingClientRect();
    const restLeft = rect.left - offsetRef.current.x;
    const restTop = rect.top - offsetRef.current.y;
    const minX = limit.left + DRAG_INSET - restLeft;
    const minY = limit.top + DRAG_INSET - restTop;
    // `Math.max(max, min)` so an area too small for the pill pins it to the
    // top-left corner instead of inverting the range and jumping it off-screen.
    const maxX = Math.max(limit.right - DRAG_INSET - rect.width - restLeft, minX);
    const maxY = Math.max(limit.bottom - DRAG_INSET - rect.height - restTop, minY);
    return {
      x: Math.min(Math.max(x, minX), maxX),
      y: Math.min(Math.max(y, minY), maxY),
    };
  }, []);

  const applyOffset = React.useCallback(
    (next: { x: number; y: number }) => {
      const clamped = clampOffset(next.x, next.y);
      offsetRef.current = clamped;
      setOffset(clamped);
    },
    [clampOffset],
  );

  React.useEffect(() => {
    if (open) return;
    offsetRef.current = { x: 0, y: 0 };
    setOffset({ x: 0, y: 0 });
    setDragging(false);
    dragRef.current = null;
  }, [open]);

  const onDragPointerDown = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (!header) return;
    event.preventDefault();
    event.stopPropagation();
    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      /* capture is optional — document listeners still drive the drag */
    }
    dragRef.current = {
      id: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originX: offsetRef.current.x,
      originY: offsetRef.current.y,
    };
    setDragging(true);
  };

  React.useEffect(() => {
    if (!dragging) return;
    const onMove = (event: PointerEvent) => {
      const drag = dragRef.current;
      if (!drag || drag.id !== event.pointerId) return;
      applyOffset({
        x: drag.originX + (event.clientX - drag.startX),
        y: drag.originY + (event.clientY - drag.startY),
      });
    };
    const onUp = (event: PointerEvent) => {
      const drag = dragRef.current;
      if (!drag || drag.id !== event.pointerId) return;
      dragRef.current = null;
      setDragging(false);
    };
    document.addEventListener('pointermove', onMove);
    document.addEventListener('pointerup', onUp);
    document.addEventListener('pointercancel', onUp);
    return () => {
      document.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerup', onUp);
      document.removeEventListener('pointercancel', onUp);
    };
  }, [dragging, applyOffset]);

  const onDragKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (!header) return;
    const step = Number.parseInt(spacing[2], 10);
    const map: Record<string, { x: number; y: number }> = {
      ArrowLeft: { x: -step, y: 0 },
      ArrowRight: { x: step, y: 0 },
      ArrowUp: { x: 0, y: -step },
      ArrowDown: { x: 0, y: step },
    };
    const delta = map[event.key];
    if (!delta) return;
    event.preventDefault();
    applyOffset({ x: offsetRef.current.x + delta.x, y: offsetRef.current.y + delta.y });
  };

  React.useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      const node = event.target;
      if (!(node instanceof Element)) return;
      if (rootRef.current?.contains(node)) return;
      if (
        node.closest(
          'table, [role="checkbox"], .MuiModal-root, .MuiDrawer-root, [role="dialog"]',
        )
      ) {
        return;
      }
      onClear();
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [open, onClear]);

  if (!open) return null;

  return (
    <div
      ref={rootRef}
      className={
        header
          ? 'pointer-events-none absolute left-12 top-2'
          : 'pointer-events-none absolute inset-x-0 bottom-6 flex justify-center px-4'
      }
      style={{
        zIndex: header ? zIndex.dropdown : zIndex.raised,
        transform: header ? `translate(${offset.x}px, ${offset.y}px)` : undefined,
      }}
      role="region"
      aria-label={`${shown} ${label} selected`}
    >
      <div
        className={
          header
            ? `pointer-events-auto flex items-center gap-0.5 rounded-md border border-border bg-surface px-1.5 py-1 shadow-md ${dragging ? 'select-none' : ''}`
            : 'pointer-events-auto flex max-w-full items-center gap-2 rounded-md bg-sidebar px-2 py-2 shadow-lg'
        }
      >
        {header && (
          <button
            type="button"
            aria-label="Move selection dock"
            onPointerDown={onDragPointerDown}
            onKeyDown={onDragKeyDown}
            className="grid h-8 w-6 shrink-0 cursor-grab touch-none place-items-center rounded-sm text-icon hover:bg-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-subtle active:cursor-grabbing"
          >
            <DragIndicator sx={{ fontSize: 16 }} aria-hidden />
          </button>
        )}
        {header ? (
          <p className="flex items-center gap-1.5 px-1.5" role="status">
            <span className="text-body-sm text-text-primary tabular-nums">{shown} selected</span>
            {total > 0 && (
              <button
                type="button"
                onClick={allSelected ? onClear : onSelectAll}
                className="text-body-sm-medium text-text-link hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-subtle"
              >
                {allSelected ? 'Clear all' : `Select all ${total}`}
              </button>
            )}
          </p>
        ) : (
          <p className="flex items-center gap-1 text-body-sm text-text-inverse" role="status">
            <span className="inline-flex min-h-5 items-center justify-center rounded-sm bg-surface px-2 text-caption-strong text-text-primary tabular-nums">
              {shown}
            </span>
            selected
          </p>
        )}
        {!header && (
          <Button
            variant="tertiary"
            size="xs"
            startIcon={allSelected ? <RemoveDoneOutlined /> : <DoneAllOutlined />}
            onClick={allSelected ? onClear : onSelectAll}
            sx={inverseControlSx}
          >
            {allSelected
              ? `Deselect all ${total} ${total === 1 ? noun : plural}`
              : `Select all ${total} ${total === 1 ? noun : plural}`}
          </Button>
        )}
        {children && (
          <>
            <Separator onInverse={!header} />
            <div className="flex shrink-0 items-center gap-0.5">
              {header ? children : invertActions(children)}
            </div>
          </>
        )}
        <Separator onInverse={!header} />
        <button
          type="button"
          onClick={onClear}
          aria-label="Clear selection"
          className={
            header
              ? 'grid h-8 w-8 shrink-0 place-items-center rounded-sm text-icon hover:bg-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-subtle'
              : 'grid h-8 w-8 shrink-0 place-items-center rounded-md text-icon-inverse hover:bg-surface-inverse focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-subtle'
          }
        >
          <CloseOutlined sx={{ fontSize: 16 }} aria-hidden />
        </button>
      </div>
    </div>
  );
}
