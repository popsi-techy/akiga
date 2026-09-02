'use client';

import * as React from 'react';
import MuiDrawer from '@mui/material/Drawer';
import CloseIcon from '@mui/icons-material/Close';

/**
 * Drawer — a right-side panel for create/edit flows (matches the product's
 * "basic details" panel). Extends MUI Drawer, which provides the overlay, focus
 * trap, and Esc-to-close. Header (icon tile + title + subtitle + close), an
 * optional pinned subheader (mode switcher), an optional pinned toolbar (tabs
 * for facets of the chosen form), a scrollable body, and a right-aligned
 * footer for actions.
 */
export interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  /** Leading icon rendered in a brand-tint tile (e.g. a MUI icon). */
  icon?: React.ReactNode;
  /** Leading mark without the brand tile — e.g. an {@link AppIcon} logo. */
  leading?: React.ReactNode;
  /** Right-aligned footer actions (e.g. Cancel + primary Button). */
  footer?: React.ReactNode;
  /** Panel width in px. @default 480 */
  width?: number;
  /**
   * Pinned band between the header and the scrolling body — a ModeBar when
   * the body is a different form per choice. Not inside the scroll region:
   * sticky inside a padded scroller is how a switcher leaves the viewport.
   */
  subheader?: React.ReactNode;
  /**
   * Pinned band under the subheader — Tabs when the chosen form has facets
   * (Request / Response). Own border from Tabs; this slot only pads and stays
   * out of the scroll region.
   */
  toolbar?: React.ReactNode;
  /** Drop the body's padding so content can run edge-to-edge (e.g. a full-height
   *  master/detail split with a divider that meets the header and footer). */
  disablePadding?: boolean;
  children?: React.ReactNode;
}

export function Drawer({
  open,
  onClose,
  title,
  subtitle,
  icon,
  leading,
  footer,
  subheader,
  toolbar,
  width = 480,
  disablePadding = false,
  children,
}: DrawerProps) {
  const titleId = React.useId();
  return (
    <MuiDrawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: { width, maxWidth: '100vw' },
        'aria-labelledby': titleId,
      }}
    >
      <div className="flex h-full flex-col">
        <header className="flex items-center gap-4 border-b border-border px-6 py-6">
          {leading ? (
            <span className="shrink-0">{leading}</span>
          ) : (
            icon && (
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-avatar bg-brand-subtle text-icon-brand">
                {icon}
              </span>
            )
          )}
          <div className="min-w-0 flex-1">
            <h2 id={titleId} className="text-h4 leading-tight text-text-primary">
              {title}
            </h2>
            {subtitle && (
              <p className="mt-0.5 text-body leading-tight text-text-secondary">{subtitle}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="-mr-1 shrink-0 rounded-md p-1.5 text-icon hover:bg-surface-hover"
          >
            <CloseIcon sx={{ fontSize: 20 }} />
          </button>
        </header>

        {subheader ? (
          <div className="shrink-0 border-b border-border bg-surface px-6 py-3">{subheader}</div>
        ) : null}

        {/* 8px above, none below: Tabs bring their own baseline rule, and a tab
            strip flush against the header's border reads as one thick divider. */}
        {toolbar ? <div className="shrink-0 bg-surface px-6 pt-2">{toolbar}</div> : null}

        <div className={`ds-scroll flex-1 overflow-y-auto ${disablePadding ? 'min-h-0' : 'px-6 py-5'}`}>
          {children}
        </div>

        {footer && (
          <footer className="flex items-center justify-end gap-2 border-t border-border px-6 py-4">
            {footer}
          </footer>
        )}
      </div>
    </MuiDrawer>
  );
}

export default Drawer;
