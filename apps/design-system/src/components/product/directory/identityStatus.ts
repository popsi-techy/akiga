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

/**
 * Whether access is currently live — a different axis from identity status.
 * Pending onboardings have no access; rejected or ended access is revoked;
 * suspend pauses it without closing the identity.
 */
export function accessStatusOf(status: IdentityStatus): { label: string; intent: StatusIntent } {
  switch (status) {
    case 'active':
      return { label: 'Active', intent: 'success' };
    case 'suspended':
      return { label: 'Suspended', intent: 'neutral' };
    case 'terminated':
    case 'inactive':
      return { label: 'Revoked', intent: 'danger' };
    default:
      return { label: 'No access', intent: 'neutral' };
  }
}
