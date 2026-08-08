'use client';

import * as React from 'react';
import InfoOutlined from '@mui/icons-material/InfoOutlined';
import CheckCircleOutlined from '@mui/icons-material/CheckCircleOutlined';
import WarningAmberOutlined from '@mui/icons-material/WarningAmberOutlined';
import ErrorOutlineOutlined from '@mui/icons-material/ErrorOutlineOutlined';

/**
 * Callout — a persistent inline message that explains or qualifies the content
 * around it (not an event notification; use a Toast for those).
 *
 * Tinted from the `status` roles: `subtle` fill, `border` hairline, `fg` icon. The
 * body stays `text-secondary` rather than the tint colour, so a long sentence reads
 * as prose instead of as a coloured banner.
 */
export type CalloutTone = 'info' | 'success' | 'warning' | 'danger';

export interface CalloutProps {
  /** @default 'info' */
  tone?: CalloutTone;
  /** Optional bold lead-in above the body. */
  title?: React.ReactNode;
  children: React.ReactNode;
  /** Trailing action (e.g. a link or small button). */
  action?: React.ReactNode;
  /** Replace the default tone icon, or `false` for none. */
  icon?: React.ReactNode | false;
}

const TONE_ICON: Record<CalloutTone, React.ReactNode> = {
  info: <InfoOutlined sx={{ fontSize: 18 }} />,
  success: <CheckCircleOutlined sx={{ fontSize: 18 }} />,
  warning: <WarningAmberOutlined sx={{ fontSize: 18 }} />,
  danger: <ErrorOutlineOutlined sx={{ fontSize: 18 }} />,
};

export function Callout({ tone = 'info', title, children, action, icon }: CalloutProps) {
  return (
    <div
      role="note"
      className="flex items-start gap-2.5 rounded-lg border px-3.5 py-3"
      style={{
        backgroundColor: `var(--ds-color-status-${tone}-subtle)`,
        borderColor: `var(--ds-color-status-${tone}-border)`,
      }}
    >
      {icon !== false && (
        <span
          aria-hidden
          className="mt-px shrink-0"
          style={{ color: `var(--ds-color-status-${tone}-fg)` }}
        >
          {icon ?? TONE_ICON[tone]}
        </span>
      )}
      <div className="min-w-0 flex-1 text-body-sm leading-5">
        {title != null && <p className="font-emphasis text-text-primary">{title}</p>}
        <div className={['text-text-secondary', title != null ? 'mt-0.5' : ''].join(' ')}>
          {children}
        </div>
      </div>
      {action != null && <div className="shrink-0">{action}</div>}
    </div>
  );
}

export default Callout;
