'use client';

import * as React from 'react';
import CloseOutlined from '@mui/icons-material/CloseOutlined';

/**
 * The slide-in slot a peek panel occupies.
 *
 * Animates **width**, not a transform: the panel takes space from the table
 * beside it rather than covering it, so the table reflows as it opens and stays
 * usable while it is open. `overflow-hidden` clips the fixed-width contents
 * while the wrapper is still narrower, which is what makes it read as a slide
 * rather than a squeeze.
 *
 * 320px. Narrow enough that the table beside it stays the protagonist; wide
 * enough for an entitlement peek (type, application, risk). Longer identity
 * emails in other peeks truncate — that is the trade, not a measurement error.
 */
export interface PeekSlotProps {
  open: boolean;
  width?: number;
  children: React.ReactNode;
}

export function PeekSlot({ open, width = 320, children }: PeekSlotProps) {
  return (
    <div
      className={`shrink-0 overflow-hidden transition-[width,margin] duration-200 ease-out ${open ? 'ml-5' : 'ml-0'}`}
      style={{ width: open ? width : 0 }}
      aria-hidden={!open}
    >
      <div className="h-full" style={{ width }}>
        {children}
      </div>
    </div>
  );
}

/**
 * The panel itself — one border, a fixed header and footer, a scrolling middle.
 *
 * Shared by every peek so the chrome cannot drift between them; the body is
 * whatever the caller passes. Callers render their rows `bare` (no card of their
 * own) — this panel is already the box.
 *
 * Why MUI was insufficient: Drawer covers the page; this takes width from the
 * table beside it. Dialog is a decision, not a side-read.
 */
export interface PeekPanelProps {
  avatar?: React.ReactNode;
  title: string;
  subtitle?: string;
  onClose: () => void;
  footer?: React.ReactNode;
  children: React.ReactNode;
}

export function PeekPanel({
  avatar,
  title,
  subtitle,
  onClose,
  footer,
  children,
}: PeekPanelProps) {
  return (
    <div className="flex h-full flex-col rounded-xl border border-border bg-surface">
      <header className="flex items-start gap-3 border-b border-border px-5 py-4">
        {avatar}
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-h5 text-text-primary">{title}</h3>
          {subtitle && <p className="mt-0.5 text-caption text-text-secondary">{subtitle}</p>}
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close panel"
          className="-mr-1 shrink-0 rounded-md p-1 text-icon hover:bg-surface-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-subtle"
        >
          <CloseOutlined sx={{ fontSize: 18 }} />
        </button>
      </header>

      {/* The gutter lives here, not on the rows — one inset, so the dividers stop
          where the content does. */}
      <div className="ds-scroll min-h-0 flex-1 overflow-y-auto px-5 py-1">{children}</div>

      {footer && <footer className="border-t border-border px-5 py-3">{footer}</footer>}
    </div>
  );
}
