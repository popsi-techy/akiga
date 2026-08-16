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

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** Deterministic UTC formatting — a local-time format drifts between server and client. */
export function formatDateTime(iso: string): string {
  const d = new Date(iso);
  const h = d.getUTCHours();
  const m = String(d.getUTCMinutes()).padStart(2, '0');
  const suffix = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}, ${d.getUTCFullYear()}, ${String(hour12).padStart(2, '0')}:${m} ${suffix}`;
}

export function formatDate(iso: string): string {
  const d = new Date(iso);
  return `${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}, ${d.getUTCFullYear()}`;
}
