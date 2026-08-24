'use client';

import * as React from 'react';
import InfoOutlined from '@mui/icons-material/InfoOutlined';
import { Tooltip } from '@ds/components';

/**
 * One setting: name and why on the left, the control on the right.
 *
 * The same row the admin screens already use for requestable / on-behalf /
 * timezone — a title the reader can scan, a caption they can skip, and a
 * control that does not compete with either.
 */
export function SettingsRow({
  title,
  description,
  hint,
  children,
}: {
  title: string;
  description?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-6 py-3.5 first:pt-0 last:pb-0">
      <div className="min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="text-body-sm-strong text-text-primary">{title}</p>
          {hint ? (
            <Tooltip title={hint} placement="top">
              <span
                tabIndex={0}
                aria-label={`${title} information`}
                className="inline-flex shrink-0 text-icon-subtle hover:text-icon"
              >
                <InfoOutlined sx={{ fontSize: 16 }} />
              </span>
            </Tooltip>
          ) : null}
        </div>
        {description ? <p className="mt-0.5 text-caption text-text-secondary">{description}</p> : null}
      </div>
      <div className="flex shrink-0 items-center gap-2 pt-0.5">{children}</div>
    </div>
  );
}

export function SettingsInfoBanner({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2 rounded-md border border-[var(--ds-color-status-info-border)] bg-[var(--ds-color-status-info-subtle)] px-3 py-2.5">
      <InfoOutlined
        sx={{ fontSize: 18, color: 'var(--ds-color-status-info-fg)', marginTop: '1px' }}
        aria-hidden
      />
      <p className="text-caption leading-5 text-[var(--ds-color-status-info-fg)]">{children}</p>
    </div>
  );
}
