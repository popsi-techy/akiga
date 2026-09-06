'use client';

import { StatusChip, type StatusIntent } from '@ds/components';
import type { EndUserRequestStatus } from '@/data/access-request-types';

const META: Record<EndUserRequestStatus, { label: string; intent: StatusIntent }> = {
  draft: { label: 'Draft', intent: 'warning' },
  pending: { label: 'Pending', intent: 'warning' },
  completed: { label: 'Completed', intent: 'success' },
  expired: { label: 'Expired', intent: 'neutral' },
  rejected: { label: 'Rejected', intent: 'danger' },
};

export function EndUserRequestStatusChip({ status }: { status: EndUserRequestStatus }) {
  const m = META[status];
  return <StatusChip intent={m.intent} label={m.label} />;
}
