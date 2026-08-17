import type { Severity, SodPolicyStatus } from '@/data/sod-types';
import type { StatusIntent } from '@ds/components';

/**
 * One mapping from policy severity and status to how they are shown, so the
 * list, the detail header and anything downstream cannot colour the same word
 * differently.
 *
 * `rank` exists because sorting a severity column alphabetically produces
 * "Critical, High, Low, Medium" — an order that reads as broken.
 */
export const SEVERITY_META: Record<Severity, { label: string; intent: StatusIntent; rank: number }> = {
  critical: { label: 'Critical', intent: 'danger', rank: 4 },
  high: { label: 'High', intent: 'warning', rank: 3 },
  medium: { label: 'Medium', intent: 'caution', rank: 2 },
  low: { label: 'Low', intent: 'neutral', rank: 1 },
};

export const STATUS_META: Record<SodPolicyStatus, { label: string; intent: StatusIntent }> = {
  active: { label: 'Active', intent: 'success' },
  draft: { label: 'Draft', intent: 'warning' },
  // Not danger: switched off is a decision someone made, not a fault.
  inactive: { label: 'Inactive', intent: 'neutral' },
};

// Re-exported so SoD policy screens have one import for their labels and dates;
// the formatting itself lives in `lib/datetime` and is shared.
export { formatDate } from '@/lib/datetime';
