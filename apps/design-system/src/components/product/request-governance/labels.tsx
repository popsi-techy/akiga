'use client';

import * as React from 'react';
import { StatusChip, type StatusIntent } from '@ds/components';
import { EntityAvatar, infoIcon } from '@/components/product/directory';
import {
  type ResourceType,
  type SlaStatus,
} from '@/data/request-governance';

const TYPE_TILE: Record<
  Exclude<ResourceType, 'application'>,
  { icon: React.ReactNode; bg: string; fg: string }
> = {
  entitlement: {
    icon: infoIcon.entitlement,
    bg: 'var(--ds-color-status-info-subtle)',
    fg: 'var(--ds-color-status-info-solid)',
  },
  role: {
    icon: infoIcon.technicalRole,
    bg: 'var(--ds-color-status-warning-subtle)',
    fg: 'var(--ds-color-status-warning-fg)',
  },
};

/**
 * The mark for a requested resource, on its own.
 *
 * Split out of `ResourceTypeMark` so the page header and the body row show the same
 * thing at two sizes — a request whose title mark disagreed with its own resource row
 * would look like two different requests.
 */
export function ResourceTypeAvatar({
  type,
  name,
  appType,
  size = 'sm',
}: {
  type: ResourceType;
  name: string;
  appType?: string;
  size?: 'sm' | 'md';
}) {
  if (type === 'application') {
    return <EntityAvatar kind="application" name={name} appType={appType} size={size} />;
  }
  const box = size === 'md' ? 'h-9 w-9' : 'h-7 w-7';
  return (
    <span
      className={`flex ${box} shrink-0 items-center justify-center rounded-md`}
      style={{ background: TYPE_TILE[type].bg, color: TYPE_TILE[type].fg }}
      aria-hidden
    >
      {TYPE_TILE[type].icon}
    </span>
  );
}

export function ResourceTypeMark({
  type,
  name,
  appType,
}: {
  type: ResourceType;
  name: string;
  appType?: string;
}) {
  return (
    <div className="flex min-w-0 items-center gap-2.5">
      <ResourceTypeAvatar type={type} name={name} appType={appType} />
      <span className="truncate text-body-sm-strong text-text-primary" title={name}>
        {name}
      </span>
    </div>
  );
}

const SLA_META: Record<SlaStatus, { label: string; intent: StatusIntent }> = {
  on_track: { label: 'On track', intent: 'success' },
  at_risk: { label: 'At risk', intent: 'warning' },
  breached: { label: 'Breached', intent: 'danger' },
  closed: { label: 'Closed', intent: 'neutral' },
};

export function SlaStatusChip({
  status,
  label,
}: {
  status: SlaStatus;
  /** Overrides the status word. The identity band prints the clock here. */
  label?: string;
}) {
  const m = SLA_META[status];
  return <StatusChip intent={m.intent} label={label ?? m.label} />;
}
