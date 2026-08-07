/**
 * V3 resolution draft store — the localStorage keys and the one rule for turning
 * draft state into a reviewer status.
 *
 * V3 keeps its in-progress resolution in its own store rather than in the shared SoD
 * review (a draft must not look like access that was actually revoked). The
 * consequence is that `reviewerStatusOf()`, which reads the shared review, cannot see
 * a V3 draft — so a saved draft reported "Pending" in both the list and the detail
 * header, and "In Progress" was unreachable.
 *
 * This module exists so the list row and the page it opens derive that status from
 * the same rule instead of each guessing. The keys live here too: they were declared
 * inside the workspace page, where nothing else could reach them without copying the
 * strings.
 */
import type { ReviewerStatus } from './sod-types';

export const V3_STORE_KEY = 'iga.sodResolutionV3.v2';
/** Separate key from the store so an older draft without a step still loads. */
export const V3_STEP_KEY = 'iga.sodResolutionV3.step.v1';

/**
 * Has the reviewer saved V3 work for this review? Either committed actions or a
 * remembered step counts — saving at step 2 with nothing yet valid still means
 * started.
 */
export function hasV3Draft(id: string): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const actions = JSON.parse(localStorage.getItem(V3_STORE_KEY) || '{}');
    if (Array.isArray(actions[id]) && actions[id].length > 0) return true;
    const steps = JSON.parse(localStorage.getItem(V3_STEP_KEY) || '{}');
    return typeof steps[id] === 'number';
  } catch {
    return false;
  }
}

/**
 * The three states V3 reports: Pending → In Progress → Completed.
 *
 * Pure, so each caller supplies `hasDraft` from whatever it already holds — the
 * workspace has the actions in memory, the list snapshots storage once in its load
 * effect rather than re-parsing per row.
 *
 * A submitted resolution stays `completed` even while it is being amended; the
 * header's sub-line is what says it is under revision.
 */
export function v3ReviewerStatus({
  submitted,
  hasDraft,
}: {
  submitted: boolean;
  hasDraft: boolean;
}): ReviewerStatus {
  if (submitted) return 'completed';
  return hasDraft ? 'inProgress' : 'notStarted';
}
