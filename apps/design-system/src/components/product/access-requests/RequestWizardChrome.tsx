'use client';

import * as React from 'react';
import ArrowBackOutlined from '@mui/icons-material/ArrowBackOutlined';
import ArrowForwardOutlined from '@mui/icons-material/ArrowForwardOutlined';
import Assignment from '@mui/icons-material/Assignment';
import { Avatar, Button, StatusChip, Tooltip } from '@ds/components';

export function RequestWizardChrome({
  reference,
  step,
  stepCount,
  requestedForName,
  primaryLabel,
  primaryDisabled,
  primaryDisabledReason,
  primaryLoading,
  onBack,
  onPrimary,
  dock,
  children,
}: {
  reference: string;
  step?: number;
  stepCount?: number;
  requestedForName?: string;
  primaryLabel?: string;
  primaryDisabled?: boolean;
  primaryDisabledReason?: string;
  primaryLoading?: boolean;
  onBack: () => void;
  onPrimary?: () => void;
  /** Full-height right rail — justification, and anything else that must not scroll with the step. */
  dock?: React.ReactNode;
  children: React.ReactNode;
}) {
  const cta =
    primaryLabel && onPrimary ? (
      <Button
        variant="primary"
        endIcon={<ArrowForwardOutlined />}
        disabled={primaryDisabled}
        loading={primaryLoading}
        onClick={onPrimary}
      >
        {primaryLabel}
      </Button>
    ) : null;

  return (
    <div
      className={
        dock
          ? // 100% is main's content box. The header already eats the top py-6
            // (-mt-6); add the bottom py-6 back so the rail meets the viewport.
            'flex h-[calc(100%+var(--ds-space-6))] min-h-0 flex-col'
          : 'flex h-full min-h-0 flex-col'
      }
    >
      {/* Docked identity band: bleeds to the topbar the way DetailShell does,
          then a hairline so the steps below read as the page, not more chrome. */}
      <div className="-mx-8 -mt-6 flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-border bg-canvas px-8 py-3">
        <div className="flex min-w-0 items-center gap-3">
          <Tooltip title="Back">
            <Button variant="tertiary" iconOnly aria-label="Back" onClick={onBack}>
              <ArrowBackOutlined sx={{ fontSize: 20 }} />
            </Button>
          </Tooltip>
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-sm bg-brand-subtle text-icon-brand">
            <Assignment sx={{ fontSize: 18 }} />
          </span>
          <h1 className="truncate text-h4 text-text-primary">Request “{reference}”</h1>
          {step != null && stepCount != null && (
            <StatusChip intent="info" label={`Step ${step}/${stepCount}`} />
          )}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {requestedForName && (
            <div className="flex items-center gap-2">
              <span className="text-body-sm text-text-secondary">Requesting for:</span>
              {/* Asymmetric padding, because the contents are. A round 24px mark carries
                  its own optical inset, so an equal `px-2` left and right left a visible
                  gap before the avatar and none after the name — the pill read as sitting
                  off its contents rather than around them. 4px of inset all round the mark
                  against 10px after the text keeps the 1:2.5 ratio an avatar pill wants,
                  and 4px is the grid step rather than a hairline. */}
              <span className="inline-flex items-center gap-2 rounded-pill border border-border bg-surface py-1 pl-1 pr-2.5">
                <Avatar name={requestedForName} size="xs" kind="person" />
                <span className="text-body-sm text-text-primary">{requestedForName}</span>
              </span>
            </div>
          )}
          {cta && primaryDisabled && primaryDisabledReason ? (
            <Tooltip title={primaryDisabledReason}>{cta}</Tooltip>
          ) : (
            cta
          )}
        </div>
      </div>
      {dock ? (
        <div className="flex min-h-0 flex-1 -mx-8">
          <div className="ds-scroll min-h-0 flex-1 overflow-y-auto px-8 pt-6">{children}</div>
          {dock}
        </div>
      ) : (
        <div className="ds-scroll min-h-0 flex-1 overflow-y-auto pt-6">{children}</div>
      )}
    </div>
  );
}
