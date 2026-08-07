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
  /** Right-aligned footer actions (e.g. Cancel + primary Button). */
  footer?: React.ReactNode;
  /** Panel width in px. @default 480 */
  width?: number;
  /** Show the header close (✕) button. @default true */
  showClose?: boolean;
  children?: React.ReactNode;
}

export function Modal({ open, onClose, title, subtitle, icon, footer, width = 480, showClose = true, children }: ModalProps) {
  const titleId = React.useId();
  return (
    <MuiDialog
      open={open}
      onClose={onClose}
      PaperProps={{ sx: { width, maxWidth: '94vw', borderRadius: 'var(--ds-radius-xl)' }, 'aria-labelledby': titleId }}
    >
      <div className="flex max-h-[85vh] flex-col">
        <header className="flex items-start gap-3 px-5 pb-1 pt-4">
          {icon && (
            <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-subtle text-icon-brand">
              {icon}
            </span>
          )}
          <div className="min-w-0 flex-1">
            <h2 id={titleId} className="text-h5 font-semibold leading-tight text-text-primary">
              {title}
            </h2>
            {subtitle != null && <div className="mt-0.5 text-caption text-text-secondary">{subtitle}</div>}
          </div>
          {showClose && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="-mr-1 grid h-8 w-8 shrink-0 place-items-center rounded-md text-icon hover:bg-surface-hover"
            >
              <CloseIcon sx={{ fontSize: 20 }} />
            </button>
          )}
        </header>

        <div className="ds-scroll min-h-0 flex-1 overflow-y-auto px-5 py-4">{children}</div>

        {footer && (
          <footer className="flex items-center justify-end gap-2 border-t border-border px-5 py-3">{footer}</footer>
        )}
      </div>
    </MuiDialog>
  );
}

export default Modal;
