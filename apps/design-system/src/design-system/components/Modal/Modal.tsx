'use client';

import * as React from 'react';
import MuiDialog from '@mui/material/Dialog';
import CloseIcon from '@mui/icons-material/Close';

/**
 * Modal — a centered dialog shell for short forms and rich decisions (the
 * counterpart to Drawer, which anchors right). Header (optional brand icon tile +
 * title + subtitle + close), a scrollable body, and a right-aligned footer for
 * actions. Use `Dialog` instead for a simple confirm/consequence prompt.
 */
export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  /** Leading icon rendered in a brand-tint tile. */
  icon?: React.ReactNode;
  /**
   * Leading mark *without* the brand tile — an {@link AppIcon} logo, a product mark.
   * The tile is right for a generic MUI glyph, which needs a ground to sit on; it is
   * wrong for a logo, which arrives with its own colour and would be washed orange by
   * it. Same slot and same reasoning as `Drawer.leading` and `PeekPanel.leading`.
   */
  leading?: React.ReactNode;
  /** Right-aligned footer actions (e.g. Cancel + primary Button). */
  footer?: React.ReactNode;
  /** Panel width in px. @default 480 */
  width?: number;
  /**
   * Panel height. When set, the body fills whatever is left under the header
   * and footer and does not scroll — for a canvas or preview that pans itself.
   * Omit it for short forms: the panel sizes to content and caps at 85vh, and
   * the body scrolls.
   */
  height?: number | string;
  /**
   * Drop the body's padding so content can run edge to edge — a split whose divider has
   * to meet the header and footer rules, rather than stopping short of them in the
   * gutter. The body then owns its own insets. Same prop, same job, as `Drawer`'s.
   */
  disablePadding?: boolean;
  /** Show the header close (✕) button. @default true */
  showClose?: boolean;
  /**
   * `header` — ✕ sits in the header band beside the title (default).
   * `floating` — no header band; ✕ is pinned to the panel's top-right corner.
   * Use when the body carries a centered hero and a header strip would only
   * leave awkward whitespace above the close control.
   */
  closePlacement?: 'header' | 'floating';
  /**
   * When false the panel sizes to its content instead of growing to 85vh with a
   * scrolling body. Use for compact decision modals that should not scroll.
   * @default true
   */
  scrollBody?: boolean;
  children?: React.ReactNode;
}

const closeButtonClass =
  'grid h-8 w-8 shrink-0 place-items-center rounded-md text-icon hover:bg-surface-hover';

export function Modal({
  open,
  onClose,
  title,
  subtitle,
  icon,
  leading,
  footer,
  width = 480,
  height,
  disablePadding = false,
  showClose = true,
  closePlacement = 'header',
  scrollBody = true,
  children,
}: ModalProps) {
  const titleId = React.useId();
  const filled = height != null;
  const floating = closePlacement === 'floating';
  /**
   * A filled panel is a shell of regions — a header, a body that may be split, a footer —
   * so its header closes with a rule, giving the footer's rule a partner and any divider
   * inside the body something to meet at the top. A content-sized modal is one block and
   * needs no such seam.
   */
  const headerClass = `flex items-start gap-3 px-5 pt-4 ${
    filled ? 'shrink-0 border-b border-border pb-4' : 'pb-1'
  }`;
  const shellClass = filled
    ? 'flex h-full flex-col'
    : scrollBody
      ? 'flex max-h-[85vh] flex-col'
      : 'flex flex-col';

  return (
    <MuiDialog
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          width,
          maxWidth: '94vw',
          borderRadius: 'var(--ds-radius-xl)',
          ...(filled ? { height, maxHeight: height } : {}),
        },
        'aria-labelledby': titleId,
      }}
    >
      <div className={`relative ${shellClass}`}>
        {floating ? (
          <>
            <h2 id={titleId} className="sr-only">
              {title}
            </h2>
            {showClose && (
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className={`absolute right-4 top-4 z-10 ${closeButtonClass}`}
              >
                <CloseIcon sx={{ fontSize: 20 }} />
              </button>
            )}
          </>
        ) : (
          <header className={headerClass}>
            {leading ? (
              <span className="mt-0.5 shrink-0">{leading}</span>
            ) : (
              icon && (
                <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-subtle text-icon-brand">
                  {icon}
                </span>
              )
            )}
            <div className="min-w-0 flex-1">
              <h2 id={titleId} className="text-h5 leading-tight text-text-primary">
                {title}
              </h2>
              {subtitle != null && <div className="mt-0.5 text-caption text-text-secondary">{subtitle}</div>}
            </div>
            {showClose && (
              <button type="button" onClick={onClose} aria-label="Close" className={`-mr-1 ${closeButtonClass}`}>
                <CloseIcon sx={{ fontSize: 20 }} />
              </button>
            )}
          </header>
        )}

        <div
          className={[
            filled
              ? 'min-h-0 flex-1 overflow-hidden'
              : scrollBody
                ? 'ds-scroll min-h-0 flex-1 overflow-y-auto'
                : 'shrink-0',
            disablePadding ? '' : 'px-5 py-4',
          ].join(' ')}
        >
          {children}
        </div>

        {footer && (
          <footer className="flex items-center justify-end gap-2 border-t border-border px-5 py-3">{footer}</footer>
        )}
      </div>
    </MuiDialog>
  );
}

export default Modal;
