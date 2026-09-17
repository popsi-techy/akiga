import type { StatusIntent } from '@ds/components';
import type { IdentityStatus } from '@/data/seed';

/** How identity status is labelled — list, detail, and peeks share this. */
export const IDENTITY_STATUS: Record<IdentityStatus, { label: string; intent: StatusIntent }> = {
  active: { label: 'Active', intent: 'success' },
  inactive: { label: 'Inactive', intent: 'neutral' },
  'leaver-pending': { label: 'Leaver Pending', intent: 'warning' },
  terminated: { label: 'Terminated', intent: 'danger' },
  'pending-sponsor': { label: 'No sponsor assigned', intent: 'warning' },
  'pending-approval': { label: 'Pending approval', intent: 'warning' },
  suspended: { label: 'Suspended', intent: 'neutral' },
};
