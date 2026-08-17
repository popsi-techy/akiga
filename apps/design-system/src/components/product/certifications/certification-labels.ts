import type { StatusIntent } from '@ds/components';
import type { CertificationStatus } from '@/data/certifications';

/**
 * One mapping from status to how it is shown, so the tiles, the table and the
 * wizard cannot colour the same word differently.
 *
 * `readyToLaunch` is the only warning: it is the one state waiting on a person.
 * Scheduled and launched are informational — something is happening and nobody
 * needs to do anything — and completed is the success end of the line.
 */
export const CERT_STATUS_META: Record<CertificationStatus, { label: string; intent: StatusIntent }> = {
  draft: { label: 'Draft', intent: 'neutral' },
  readyToLaunch: { label: 'Ready to Launch', intent: 'warning' },
  scheduled: { label: 'Scheduled', intent: 'info' },
  launched: { label: 'Launched', intent: 'info' },
  completed: { label: 'Completed', intent: 'success' },
};

// Re-exported so certification screens have one import for their labels and
// dates; the formatting itself lives in `lib/datetime` and is shared.
export { formatDate, formatDateTime } from '@/lib/datetime';
