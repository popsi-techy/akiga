'use client';

import * as React from 'react';
import MuiDialog from '@mui/material/Dialog';
import { Button } from '../Button/Button';

/**
 * Dialog — a focused modal for confirmations and short decisions. Extends MUI
 * Dialog (overlay, focus trap, Esc). Follows the product's copy rules: the title
 * states the action/question, the body states the consequence, and buttons are
 * verbs. Use tone="danger" for destructive confirmations.
 */
export interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: React.ReactNode;
  children?: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm?: () => void;
  /** 'danger' renders a red confirm for destructive actions. @default 'default' */
  tone?: 'default' | 'danger';
  loading?: boolean;
  hideCancel?: boolean;
  /** Optional leading icon (e.g. a warning) shown above the title. */
  icon?: React.ReactNode;
}

export function Dialog({
  open,
  onClose,
  title,
  children,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  tone = 'default',
  loading = false,
  hideCancel = false,
  icon,
}: DialogProps) {
  const titleId = React.useId();
  const bodyId = React.useId();
  return (
    <MuiDialog
      open={open}
      onClose={onClose}
      aria-labelledby={titleId}
      aria-describedby={children ? bodyId : undefined}
      PaperProps={{ sx: { borderRadius: 'var(--ds-radius-xl)', width: 440, maxWidth: '92vw' } }}
    >
      <div className="p-6">
        {icon && <div className="mb-3">{icon}</div>}
        <h2 id={titleId} className="text-h4 leading-6 text-text-primary">
          {title}
        </h2>
        {children && (
          <div id={bodyId} className="mt-2 text-body leading-6 text-text-secondary">
            {children}
          </div>
        )}
        <div className="mt-6 flex items-center justify-end gap-2">
          {!hideCancel && (
            <Button variant="secondary" onClick={onClose}>
              {cancelLabel}
            </Button>
          )}
          <Button variant={tone === 'danger' ? 'danger' : 'primary'} onClick={onConfirm} loading={loading}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </MuiDialog>
  );
}

export default Dialog;
