/**
 * Deterministic date formatting, in UTC.
 *
 * UTC on purpose, and never `toLocaleString`: the server renders in the host's
 * zone and the browser in the reader's, so any local format produces a different
 * string on each side and React reports a hydration mismatch. Reading the UTC
 * parts gives one answer everywhere.
 *
 * The product had four copies of this pair before it existed, and had grown to six with
 * five different formats — two of them reading local time, which is the hydration bug this
 * module was written to stop. They all delegate here now, so "when did this happen" looks
 * the same everywhere and the house separator lives in exactly one place.
 */
export const MONTH_ABBR = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTHS = MONTH_ABBR;

/**
 * What separates a date from a time: a middot, not a comma.
 *
 * "Aug 9, 2026, 2:25 AM" has two commas doing different jobs, and the eye has to work out
 * which one splits the date from the clock. The middot splits them at a glance and leaves
 * the comma to the one job it is good at.
 */
export const DATE_TIME_SEP = ' · ';

/** e.g. "Apr 20, 2026". Falls back to an em dash rather than "Invalid Date". */
export function formatDate(iso?: string): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return `${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}, ${d.getUTCFullYear()}`;
}

/** e.g. "Apr 20, 2026 · 2:32 PM". */
export function formatDateTime(iso?: string): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  const hours = d.getUTCHours();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const hour12 = hours % 12 || 12;
  const minutes = String(d.getUTCMinutes()).padStart(2, '0');
  return `${formatDate(iso)}${DATE_TIME_SEP}${hour12}:${minutes} ${ampm}`;
}
