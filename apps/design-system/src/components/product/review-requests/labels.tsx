'use client';

import * as React from 'react';
import { StatusChip, type StatusIntent } from '@ds/components';
import type { AccessRequestStatus, AccessRequestType, ReviewRecommendation } from '@/data/access-request-types';

/** The DS union, not a copy of it: a hand-maintained duplicate is how `caution`
    went missing for months and severity could not reach orange. */
type Intent = StatusIntent;

export const REQUEST_TYPE_META: Record<AccessRequestType, { label: string; intent: Intent }> = {
  entitlement: { label: 'Entitlement', intent: 'info' },
  application: { label: 'Application', intent: 'info' },
  role: { label: 'Role', intent: 'warning' },
};

export function RequestTypeChip({ type }: { type: AccessRequestType }) {
  const m = REQUEST_TYPE_META[type];
  return <StatusChip intent={m.intent} label={m.label} />;
}

export const REQUEST_STATUS_META: Record<AccessRequestStatus, { label: string; intent: Intent }> = {
  pending: { label: 'Pending', intent: 'warning' },
  approved: { label: 'Approved', intent: 'success' },
  rejected: { label: 'Rejected', intent: 'danger' },
};

export function RequestStatusChip({ status }: { status: AccessRequestStatus }) {
  const m = REQUEST_STATUS_META[status];
  return <StatusChip intent={m.intent} label={m.label} />;
}

export function recommendationTitle(rec: ReviewRecommendation): string {
  if (rec === 'approve') return 'Recommended to Approve';
  if (rec === 'reject') return 'Recommended to Reject';
  return 'Needs Review';
}

export function recommendationIntent(rec: ReviewRecommendation): Intent {
  if (rec === 'approve') return 'success';
  if (rec === 'reject') return 'danger';
  return 'warning';
}
