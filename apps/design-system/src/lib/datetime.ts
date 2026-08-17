/**
 * Deterministic date formatting, in UTC.
 *
 * UTC on purpose, and never `toLocaleString`: the server renders in the host's
 * zone and the browser in the reader's, so any local format produces a different
 * string on each side and React reports a hydration mismatch. Reading the UTC
 * parts gives one answer everywhere.
 *
 * The product had four copies of this pair before it existed. New code imports
 * from here; the copies still in `app/iga/automation/*` are older and unmoved.
 */
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** e.g. "Apr 20, 2026". Falls back to an em dash rather than "Invalid Date". */
export function formatDate(iso?: string): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return `${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}, ${d.getUTCFullYear()}`;
}

/** e.g. "Apr 20, 2026, 2:32 PM". */
export function formatDateTime(iso?: string): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  const hours = d.getUTCHours();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const hour12 = hours % 12 || 12;
  const minutes = String(d.getUTCMinutes()).padStart(2, '0');
  return `${formatDate(iso)}, ${hour12}:${minutes} ${ampm}`;
}
