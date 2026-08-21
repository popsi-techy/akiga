'use client';

import * as React from 'react';
import { useParams, usePathname, useRouter, useSearchParams } from 'next/navigation';
import Policy from '@mui/icons-material/Policy';
import ShieldOutlined from '@mui/icons-material/ShieldOutlined';
import DeleteOutline from '@mui/icons-material/DeleteOutline';
import CheckCircleOutlined from '@mui/icons-material/CheckCircleOutlined';
import SearchOutlined from '@mui/icons-material/SearchOutlined';
import AutoAwesomeOutlined from '@mui/icons-material/AutoAwesomeOutlined';
import Person from '@mui/icons-material/Person';
import WatchLater from '@mui/icons-material/WatchLater';
import InfoOutlined from '@mui/icons-material/InfoOutlined';
import EditOutlined from '@mui/icons-material/EditOutlined';
import WarningAmberOutlined from '@mui/icons-material/WarningAmberOutlined';
import AssignmentInd from '@mui/icons-material/AssignmentInd';
import PersonAddAltOutlined from '@mui/icons-material/PersonAddAltOutlined';
import ManageAccountsOutlined from '@mui/icons-material/ManageAccountsOutlined';
import PersonRemoveOutlined from '@mui/icons-material/PersonRemoveOutlined';
import IconButton from '@mui/material/IconButton';
import CircularProgress from '@mui/material/CircularProgress';
import { Avatar, Button, Card, Checkbox, DatePicker, Dialog, InfoRow, InfoRowGroup, Input, Menu, QuickFilter, SelectableList, StatusChip, Stepper, Tabs, TimePicker, Tooltip, useToast } from '@ds/components';
import {
  getReview,
  getAccess,
  saveReviewState,
  submitReview,
  assignReviewer,
  unassignReviewer,
  sodReviewers,
  fastestPath,
  clearedByRemoval,
} from '@/data/sod';
import { TableSelectDrawer } from '@/components/product/automation/TableSelectDrawer';
import { V3_STORE_KEY, V3_STEP_KEY, v3ReviewerStatus } from '@/data/sod-resolution-v3-store';
import { policyById } from '@/data/sod-seed';
import type { SodReview, SodAccess, SodRule, AcceptedRisk, Severity } from '@/data/sod-types';
import { SeverityChip, AppBadge, ACCESS_TYPE_LABEL, ReviewerStatusPillV3, formatDateTime, formatUntil } from '@/components/product/sod/labels';
import { RiskScoreChip } from '@/components/product/directory';
import { RuleStatusPill, ruleAccessText, type RuleUiStatus } from '@/components/product/sod/resolution-ui';
import { UserDetailsDrawer } from '@/components/product/sod/UserDetailsDrawer';
import { DecisionHistoryTimeline } from '@/components/product/sod/DecisionHistory';
import { useSetBreadcrumbs } from '@/lib/breadcrumb';
import { infoIcon } from '@/components/product/directory';

// V3 keeps its policy-level resolution in its own store, decoupled from the shared
// access-centric sod review store. Resolution is RULE-LEVEL and accumulates across
// actions; V3 guides the reviewer through it as a linear stepper. Step 2 (Remove
// access) uses a two-column layout: action + justification | violated policy (60/40).
const STORE_KEY = V3_STORE_KEY;
type RemoveAction = { kind: 'remove'; removedAccessIds: string[]; justification: string; at: string };
/** `untilAt` is optional so drafts persisted before time-of-day existed still load. */
type AcceptAction = { kind: 'accept'; scope: 'all' | 'custom'; ruleIds: string[]; justification: string; days: number; at: string; untilAt?: string };
type V3Action = RemoveAction | AcceptAction;
type AcceptPerRule = Record<string, { justification: string; untilDate: string; untilTime: string }>;

/**
 * "Valid until <date>" reads as through the end of that day, so default to the last
 * slot the picker offers. On-step (10-minute) on purpose: an off-step default would
 * show one time in the field and highlight a different one in the picker.
 */
const END_OF_DAY = '23:50';
/**
 * YYYY-MM-DD + HH:MM → `YYYY-MM-DDTHH:MM`, a local wall-clock string.
 *
 * Deliberately not `toISOString()`. The reviewer picks a wall-clock time, and the
 * product's date formatters read UTC for hydration determinism — so an instant
 * would render at a shifted hour (09:30 chosen, 4:00 AM displayed). Storing the
 * wall clock keeps input and display identical and timezone-free.
 */
function combineDateTime(date: string, time: string): string {
  if (!date) return '';
  const hhmm = (time || END_OF_DAY).slice(0, 5);
  return /^\d{2}:\d{2}$/.test(hhmm) ? `${date}T${hhmm}` : `${date}T${END_OF_DAY}`;
}
/** HH:MM out of a stored `untilAt`, for seeding the time input on edit. */
function timeFromUntil(untilAt?: string): string {
  const hhmm = untilAt?.split('T')[1]?.slice(0, 5);
  return hhmm && /^\d{2}:\d{2}$/.test(hhmm) ? hhmm : END_OF_DAY;
}
/** YYYY-MM-DD for today + N days (local). */
function dateFromDays(days: number): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + Math.max(1, Math.floor(days)));
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
/** Whole days from today to YYYY-MM-DD (0 if missing/past). */
function daysFromDate(iso: string): number {
  if (!iso) return 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(target.getTime())) return 0;
  return Math.max(0, Math.round((target.getTime() - today.getTime()) / 86_400_000));
}
const minAcceptUntilDate = () => dateFromDays(1);
/** The date input's `min` is tomorrow, so the time never decides validity — it only
 *  has to be present and parseable. */
const acceptDetailValid = (d?: { justification: string; untilDate: string; untilTime?: string }) =>
  Boolean(
    d &&
      d.justification.trim().length >= 10 &&
      daysFromDate(d.untilDate) > 0 &&
      combineDateTime(d.untilDate, d.untilTime ?? END_OF_DAY) !== '',
  );

/** Audit-ready starter copy when the reviewer first selects access to revoke (step 1). */
function defaultRemoveJustification(review: SodReview): string {
  const policy = review.policyNames[0] ?? 'the applicable SoD policy';
  const role = review.userTitle?.trim();
  if (role) {
    return (
      `This access is not required for ${review.userName}'s role as ${role}. ` +
      `Revocation resolves the SoD violation under ${policy}.`
    );
  }
  return (
    `This access is not required for ${review.userName}'s current role. ` +
    `Revocation resolves the SoD violation under ${policy}.`
  );
}

/** Audit-ready starter copy for step 2 risk acceptance (per combination). */
function defaultAcceptRiskJustification(review: SodReview): string {
  const policy = review.policyNames[0] ?? 'the applicable SoD policy';
  const role = review.userTitle?.trim();
  if (role) {
    return (
      `This combination is required for ${review.userName}'s role as ${role}. ` +
      `Residual risk is accepted with compensating controls under ${policy}.`
    );
  }
  return (
    `This combination is required for ${review.userName}'s current duties. ` +
    `Residual risk is accepted with compensating controls under ${policy}.`
  );
}

function defaultAcceptDetail(review: SodReview): AcceptPerRule[string] {
  return {
    justification: defaultAcceptRiskJustification(review),
    untilDate: dateFromDays(90),
    untilTime: END_OF_DAY,
  };
}

/**
 * Accept-risk staging rebuilt from the decisions already on the review, so editing
 * a submitted resolution opens with the reviewer's own justification and duration.
 */
function acceptStagingFromReview(review: SodReview): AcceptPerRule {
  const per: AcceptPerRule = {};
  for (const rule of review.rules) {
    const accepted = review.acceptedRules[rule.id];
    if (!accepted?.justification?.trim()) continue;
    per[rule.id] = {
      justification: accepted.justification,
      // The accept step uses a date input, which cannot express "permanent" —
      // fall back to the longest bounded duration it can represent.
      untilDate: dateFromDays(accepted.duration === 'permanent' ? 180 : accepted.duration),
      // Exact time when one was recorded; otherwise end of day.
      untilTime: timeFromUntil(accepted.untilAt),
    };
  }
  return per;
}

type RuleFilter = 'pending' | 'will-resolve' | 'will-accept' | 'resolved' | 'risk-accepted' | null;

type RuleResolutionDetail =
  | { kind: 'removed'; names: string[]; justification: string }
  | { kind: 'accepted'; days: number; justification: string; untilAt?: string };

function ruleResolutionActionLabel(detail: RuleResolutionDetail): string {
  if (detail.kind === 'removed') {
    if (detail.names.length === 0) return 'Access will be revoked';
    return detail.names.length === 1
      ? `${detail.names[0]} will be revoked`
      : `${detail.names.join(', ')} will be revoked`;
  }
  // Preview the exact expiry that will be stored, not the rounded day count.
  if (detail.untilAt) return `Risk will be accepted until ${formatUntil(detail.untilAt)}`;
  return detail.days === 0
    ? 'Risk will be accepted permanently'
    : `Risk will be accepted for ${detail.days} day${detail.days === 1 ? '' : 's'}`;
}

type StatusCounts = {
  pending: number;
  willResolve: number;
  willAccept: number;
  resolved?: number;
  riskAccepted?: number;
};

function loadActions(id: string): V3Action[] {
  if (typeof window === 'undefined') return [];
  try {
    const all = JSON.parse(localStorage.getItem(STORE_KEY) || '{}');
    return Array.isArray(all[id]) ? (all[id] as V3Action[]) : [];
  } catch {
    return [];
  }
}
/**
 * Which step a draft was left on, kept beside the staged actions so "Continue
 * resolution" resumes where the reviewer stopped instead of restarting at step 1.
 * Separate key from `STORE_KEY` so an older draft without a step still loads.
 */
const STEP_KEY = V3_STEP_KEY;
function loadDraftStep(id: string): number | null {
  if (typeof window === 'undefined') return null;
  try {
    const all = JSON.parse(localStorage.getItem(STEP_KEY) || '{}');
    const step = all[id];
    return typeof step === 'number' && step >= 1 && step <= 3 ? step : null;
  } catch {
    return null;
  }
}
/** Pass `null` (or step 1) to forget it — step 1 is the default, so it needs no entry. */
function persistDraftStep(id: string, step: number | null) {
  if (typeof window === 'undefined') return;
  try {
    const all = JSON.parse(localStorage.getItem(STEP_KEY) || '{}');
    if (step && step > 1) all[id] = step;
    else delete all[id];
    localStorage.setItem(STEP_KEY, JSON.stringify(all));
  } catch {
    /* ignore */
  }
}
function persistActions(id: string, actions: V3Action[]) {
  if (typeof window === 'undefined') return;
  try {
    const all = JSON.parse(localStorage.getItem(STORE_KEY) || '{}');
    if (actions.length) all[id] = actions;
    else delete all[id];
    localStorage.setItem(STORE_KEY, JSON.stringify(all));
  } catch {
    /* ignore */
  }
}

/** Resolution workspace stepper (Revoke → Accept → Preview). Main page is outside this. */
const RESOLUTION_STEPS = [{ label: 'Revoke Access' }, { label: 'Accept risk' }, { label: 'Preview & submit' }];

/** Main-page tabs, mirroring the emergency-access detail layout. */
type MainTab = 'details' | 'history';
const MAIN_TABS = [
  { value: 'details', label: 'Violation Details' },
  { value: 'history', label: 'Review Timeline' },
];

/**
 * Header sub-line. The heading already names the policy and the user, and the
 * cards below repeat the counts, so this states what the reviewer is expected to
 * DO rather than restating facts.
 */
function headerDescription({
  isSubmitted,
  canEdit,
  isEditing,
  allAddressed,
}: {
  isSubmitted: boolean;
  canEdit: boolean;
  isEditing: boolean;
  /** Nothing left pending — the reviewer only has to submit. */
  allAddressed: boolean;
}): string {
  if (isEditing) {
    return 'Revising a submitted resolution — your changes replace the current decisions when you submit.';
  }
  if (canEdit) {
    return 'Risk accepted on this policy — edit the resolution to change the justification, shorten the duration, or revoke instead.';
  }
  if (isSubmitted) return 'Submitted — decisions below are read-only.';
  if (allAddressed) return 'Every violated access combination has been addressed. Review and submit.';
  return 'Resolve violated access combinations by revoking access or accepting the risk.';
}
const LIST_HREF = '/iga/reviewer/sod-resolution-v3';

export default function SodResolutionV3WorkspacePage() {
  return (
    <React.Suspense
      fallback={<div className="-mx-8 -my-6 h-[calc(100%+3rem)] bg-subtle" aria-hidden />}
    >
      <SodResolutionV3WorkspacePageInner />
    </React.Suspense>
  );
}

function SodResolutionV3WorkspacePageInner() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const toast = useToast();
  const params = useParams<{ id: string }>();

  const [review, setReview] = React.useState<SodReview | null>(null);
  const [loaded, setLoaded] = React.useState(false);
  const [detailsOpen, setDetailsOpen] = React.useState(false);
  const [cancelOpen, setCancelOpen] = React.useState(false);
  const [actions, setActions] = React.useState<V3Action[]>([]);
  const isSubmitted = Boolean(review?.submission);
  /**
   * Accepted risk is a standing, time-bound decision, so a submitted resolution
   * that carries one can be revised — the duration lapses, compensating controls
   * change, or the reviewer decides to revoke after all. A resolution settled
   * purely by revoking access has nothing left to amend (the access is gone), so
   * it stays read-only. That is exactly the split the list's Accepted Risk and
   * History tabs already make.
   */
  const canEdit =
    isSubmitted &&
    Object.values(review?.acceptedRules ?? {}).some((a) => a.justification?.trim());
  /** Guided resolution workspace — mirrored in `?view=workspace` for breadcrumbs. */
  const workspaceOpen = (!isSubmitted || canEdit) && searchParams.get('view') === 'workspace';
  /** Revising an already-submitted resolution rather than resolving a fresh one. */
  const isEditing = canEdit && workspaceOpen;
  const [workspaceLoading, setWorkspaceLoading] = React.useState(false);
  const [step, setStep] = React.useState(1);
  const [ruleFilter, setRuleFilter] = React.useState<RuleFilter>(null);

  // Remove-access staging stays editable until preview/submit (no mid-step Save).
  const [removalSelection, setRemovalSelection] = React.useState<Set<string>>(new Set());
  const [removeJustification, setRemoveJustification] = React.useState('');
  // Accept-risk staging — per-combination justification + until-date.
  const [acceptPerRule, setAcceptPerRule] = React.useState<AcceptPerRule>({});
  /** When set, that rule's justification + until date are synced to all pending combinations. */
  const [applyTemplateRuleId, setApplyTemplateRuleId] = React.useState<string | null>(null);
  /** Per-rule — apply-to-all only after the reviewer edits both fields (not defaults). */
  const [acceptFieldEdited, setAcceptFieldEdited] = React.useState<
    Record<string, Partial<{ until: boolean; justification: boolean }>>
  >({});
  const [mainTab, setMainTab] = React.useState<MainTab>('details');

  useSetBreadcrumbs(
    review
      ? workspaceOpen || workspaceLoading
        ? [
            { label: 'SoD Policy Violation V3', href: LIST_HREF },
            { label: 'Details', href: pathname },
            { label: 'Resolution workspace' },
          ]
        : [
            { label: 'SoD Policy Violation V3', href: LIST_HREF },
            { label: 'Details' },
          ]
      : null,
  );

  // Clear the transition loader only once the URL reflects the workspace.
  React.useEffect(() => {
    if (workspaceOpen) setWorkspaceLoading(false);
  }, [workspaceOpen]);

  /**
   * Set when submit navigates away. Submitting flips `isSubmitted` while the URL still
   * carries `?view=workspace`, which makes the guard below fire on the very next
   * render and rewrite the URL back to this page — clobbering the navigation to the
   * queue. The flag says "leaving on purpose, leave the URL alone".
   */
  const leavingRef = React.useRef(false);

  // History items never open the guided workspace — drop a stale `?view=workspace`.
  React.useEffect(() => {
    if (leavingRef.current) return;
    if (!isSubmitted || canEdit || searchParams.get('view') !== 'workspace') return;
    router.replace(pathname, { scroll: false });
  }, [isSubmitted, canEdit, searchParams, pathname, router]);

  React.useEffect(() => {
    const r = getReview(params.id);
    if (r) {
      setReview(r);
      const loaded = loadActions(r.id);
      setActions(loaded);
      const rem = loaded.find((a): a is RemoveAction => a.kind === 'remove');
      if (rem) {
        setRemovalSelection(new Set(rem.removedAccessIds));
        setRemoveJustification(
          rem.justification.trim() || defaultRemoveJustification(r),
        );
      } else if (r.removeJustification?.trim()) {
        setRemoveJustification(r.removeJustification);
      }
      const acceptActions = loaded.filter((a): a is AcceptAction => a.kind === 'accept');
      if (acceptActions.length > 0) {
        const remIds = rem?.removedAccessIds ?? [];
        const stillPending = r.rules.filter((rule) => !clearedByRemoval(rule.accessIds, remIds));
        const per: AcceptPerRule = {};
        const allAccept = acceptActions.find((a) => a.scope === 'all');
        if (allAccept) {
          const detail = {
            justification:
              allAccept.justification.trim() || defaultAcceptRiskJustification(r),
            untilDate: dateFromDays(allAccept.days),
            untilTime: timeFromUntil(allAccept.untilAt),
          };
          for (const rule of stillPending) per[rule.id] = { ...detail };
        } else {
          for (const a of acceptActions) {
            if (a.scope !== 'custom') continue;
            for (const id of a.ruleIds) {
              const rule = r.rules.find((x) => x.id === id);
              per[id] = {
                justification:
                  a.justification.trim() ||
                  (rule ? defaultAcceptRiskJustification(r) : ''),
                untilDate: dateFromDays(a.days),
                untilTime: timeFromUntil(a.untilAt),
              };
            }
          }
        }
        setAcceptPerRule(per);
      }
    }
    setLoaded(true);
  }, [params.id]);

  React.useEffect(() => {
    if (!review || step !== 2) return;
    const activeRules = review.submission ? review.rules : review.rules.slice(0, 3);
    const pending = activeRules.filter((r) => !clearedByRemoval(r.accessIds, removalSelection));
    if (pending.length === 0) return;
    setAcceptPerRule((prev) => {
      const next = { ...prev };
      let changed = false;
      for (const rule of pending) {
        if (next[rule.id]) continue;
        next[rule.id] = defaultAcceptDetail(review);
        changed = true;
      }
      return changed ? next : prev;
    });
  }, [review, step, removalSelection]);

  React.useEffect(() => {
    if (step !== 2) {
      setApplyTemplateRuleId(null);
      setAcceptFieldEdited({});
    }
  }, [step]);

  const updateRemovalSelection = React.useCallback(
    (updater: Set<string> | ((prev: Set<string>) => Set<string>)) => {
      setRemovalSelection((prev) => {
        const next = typeof updater === 'function' ? updater(prev) : updater;
        if (next.size > 0 && review) {
          setRemoveJustification((current) =>
            current.trim() ? current : defaultRemoveJustification(review),
          );
        }
        return next;
      });
    },
    [review],
  );

  if (loaded && !review) {
    return (
      <div className="-mx-8 -my-6 grid h-[calc(100%+3rem)] place-items-center bg-subtle">
        <div className="text-center">
          <div className="text-h5 text-text-primary">Violation not found</div>
          <div className="mt-4">
            <Button variant="secondary" onClick={() => router.push(LIST_HREF)}>Back</Button>
          </div>
        </div>
      </div>
    );
  }
  if (!review) return <div className="-mx-8 -my-6 h-[calc(100%+3rem)] bg-subtle" />;

  const policy = policyById[review.policyIds[0]];
  const policyName = policy?.name ?? review.policyNames[0] ?? 'SoD Policy';
  /** Combinations carrying an accepted-risk decision — what an edit may revise. */
  const acceptedRiskRules = review.rules.filter((r) =>
    review.acceptedRules[r.id]?.justification?.trim(),
  );
  /**
   * Active demos use three combinations; a submitted review shows its full set.
   * An edit is scoped to the accepted-risk combinations only — anything resolved by
   * revoking access is already gone and cannot be re-decided.
   */
  const rules = isEditing
    ? acceptedRiskRules
    : isSubmitted
      ? review.rules
      : review.rules.slice(0, 3);
  const accessList = Array.from(new Set(rules.flatMap((r) => r.accessIds)))
    .map(getAccess)
    .filter(Boolean) as SodAccess[];

  const removedAccessIds = new Set(actions.flatMap((a) => (a.kind === 'remove' ? a.removedAccessIds : [])));
  const acceptCoversAll = actions.some((a) => a.kind === 'accept' && a.scope === 'all');
  const acceptedRuleIds = new Set(actions.flatMap((a) => (a.kind === 'accept' && a.scope === 'custom' ? a.ruleIds : [])));

  /** Final resolution from committed actions (preview / submit only). */
  const ruleResolution = (rule: SodRule): 'removed' | 'accepted' | null => {
    if (clearedByRemoval(rule.accessIds, removedAccessIds)) return 'removed';
    if (acceptCoversAll || acceptedRuleIds.has(rule.id)) return 'accepted';
    return null;
  };
  /** Returns `RuleResolutionDetail` rather than re-declaring the shape inline, so
   *  the summary/preview components and this stay in step. */
  const ruleDetail = (rule: SodRule): RuleResolutionDetail | null => {
    if (clearedByRemoval(rule.accessIds, removedAccessIds)) {
      const rem = actions.find((a) => a.kind === 'remove');
      const names = rule.accessIds
        .filter((id) => removedAccessIds.has(id))
        .map((id) => getAccess(id)?.name)
        .filter(Boolean) as string[];
      return { kind: 'removed', names, justification: rem?.kind === 'remove' ? rem.justification : '' };
    }
    const acc = actions.find((a) => a.kind === 'accept' && (a.scope === 'all' || a.ruleIds.includes(rule.id)));
    if (acc?.kind === 'accept')
      return { kind: 'accepted', days: acc.days, justification: acc.justification, untilAt: acc.untilAt };
    return null;
  };
  /** Live coverage in the workspace — AND combination clears only when ≤1 access remains. */
  const coveredByRemoval = (rule: SodRule) => clearedByRemoval(rule.accessIds, removalSelection);
  /** On accept step, every combination not cleared by removal is staged for risk acceptance. */
  const coveredByAccept = (rule: SodRule) => step >= 2 && !coveredByRemoval(rule);
  /** Workspace (live staging) status for Impact on policy. */
  const ruleUiStatus = (rule: SodRule): RuleUiStatus => {
    if (coveredByRemoval(rule)) return 'will-resolve';
    if (coveredByAccept(rule)) return 'will-accept';
    /**
     * When revising, an untouched combination keeps the decision it already
     * carries. Showing "Pending" would claim it is undecided, when in fact risk
     * was accepted on it — the reviewer just hasn't changed it yet.
     */
    return isEditing ? 'risk-accepted' : 'pending';
  };
  /**
   * Main page status — final review decisions only (submitted / seed), never V3 draft actions.
   * Combinations cleared by access removal are omitted from the list (they live in audit).
   */
  const finalRemovedIds = new Set(review.removedAccessIds);
  const mainRuleClearedByRemoval = (rule: SodRule) => clearedByRemoval(rule.accessIds, finalRemovedIds);
  const mainRuleUiStatus = (rule: SodRule): RuleUiStatus => {
    const acceptance = review.acceptedRules[rule.id];
    if (acceptance?.justification?.trim()) return 'risk-accepted';
    if (mainRuleClearedByRemoval(rule)) return 'resolved';
    return 'pending';
  };
  /**
   * Main list: pending + final risk accepted (removals live in audit).
   * History: risk accepted only — no pending; removals stay in audit.
   * Accepted-risk decisions take precedence over shared removal IDs on other rules.
   */
  const mainListRules = rules.filter((r) => {
    if (isSubmitted) return mainRuleUiStatus(r) === 'risk-accepted';
    if (mainRuleClearedByRemoval(r)) return false;
    return true;
  });
  const willResolveCount = rules.filter((r) => ruleUiStatus(r) === 'will-resolve').length;
  const willAcceptCount = rules.filter((r) => ruleUiStatus(r) === 'will-accept').length;
  const workspaceStatusCounts: StatusCounts = {
    pending: rules.filter((r) => ruleUiStatus(r) === 'pending').length,
    willResolve: willResolveCount,
    willAccept: willAcceptCount,
    // Non-zero only while revising — see `ruleUiStatus`.
    riskAccepted: rules.filter((r) => ruleUiStatus(r) === 'risk-accepted').length,
  };
  const mainRiskAcceptedCount = mainListRules.filter((r) => mainRuleUiStatus(r) === 'risk-accepted').length;
  const mainStatusCounts: StatusCounts = {
    pending: isSubmitted ? 0 : mainListRules.filter((r) => mainRuleUiStatus(r) === 'pending').length,
    willResolve: 0,
    willAccept: 0,
    riskAccepted: mainRiskAcceptedCount,
  };
  const pendingRules = rules.filter((r) => !coveredByRemoval(r));
  const resolvedCount = rules.filter((r) => ruleResolution(r) !== null).length;
  const allResolved = resolvedCount === rules.length;

  const commit = (next: V3Action[]) => {
    setActions(next);
    persistActions(review.id, next);
  };
  /** Write staging into actions for preview/submit (overwrites prior remove/accept). */
  const flushStagingToActions = () => {
    const next: V3Action[] = [];
    if (removalSelection.size > 0) {
      next.push({
        kind: 'remove',
        removedAccessIds: [...removalSelection],
        justification: removeJustification.trim(),
        at: new Date().toISOString(),
      });
    }
    const stillPending = rules.filter((r) => !clearedByRemoval(r.accessIds, removalSelection));
    if (stillPending.length > 0) {
      const at = new Date().toISOString();
      for (const rule of stillPending) {
        const detail = acceptPerRule[rule.id] ?? defaultAcceptDetail(review);
        next.push({
          kind: 'accept',
          scope: 'custom',
          ruleIds: [rule.id],
          justification: detail.justification.trim(),
          days: daysFromDate(detail.untilDate),
          untilAt: combineDateTime(detail.untilDate, detail.untilTime),
          at,
        });
      }
    }
    commit(next);
    return next;
  };
  /** Persist in-progress work and return to the main page (committed state only). */
  const saveAsDraft = () => {
    const next: V3Action[] = [];
    if (removalSelection.size > 0) {
      next.push({
        kind: 'remove',
        removedAccessIds: [...removalSelection],
        justification: removeJustification.trim(),
        at: new Date().toISOString(),
      });
    }
    const stillPending = rules.filter((r) => !clearedByRemoval(r.accessIds, removalSelection));
    if (stillPending.length > 0 && step >= 2) {
      const at = new Date().toISOString();
      for (const rule of stillPending) {
        const detail = acceptPerRule[rule.id] ?? defaultAcceptDetail(review);
        if (!acceptDetailValid(detail)) continue;
        next.push({
          kind: 'accept',
          scope: 'custom',
          ruleIds: [rule.id],
          justification: detail.justification.trim(),
          days: daysFromDate(detail.untilDate),
          untilAt: combineDateTime(detail.untilDate, detail.untilTime),
          at,
        });
      }
    }
    commit(next);
    // Remember the step so Continue resolution returns here, not to step 1.
    persistDraftStep(review.id, step);
    setRuleFilter(null);
    router.replace(pathname, { scroll: false });
    toast.success('Draft saved');
  };
  /** Discard staged work and return to the violation detail (main) page. */
  /**
   * True when the workspace holds anything the reviewer would lose: saved draft
   * actions, a staged removal, a drafted acceptance, or simply having advanced
   * past step 1. Drives whether Cancel needs confirming.
   */
  const hasStagedWork =
    actions.length > 0 ||
    removalSelection.size > 0 ||
    Object.keys(acceptPerRule).length > 0 ||
    step > 1;

  const cancelDraft = () => {
    persistActions(review.id, []);
    persistDraftStep(review.id, null);
    setActions([]);
    setRemovalSelection(new Set());
    setRemoveJustification(defaultRemoveJustification(review));
    setAcceptPerRule({});
    setAcceptFieldEdited({});
    setApplyTemplateRuleId(null);
    setRuleFilter(null);
    setStep(1);
    setCancelOpen(false);
    router.replace(pathname, { scroll: false });
    toast.success('Draft discarded');
  };
  const openWorkspace = () => {
    if ((isSubmitted && !canEdit) || workspaceLoading || workspaceOpen) return;
    setWorkspaceLoading(true);
    window.setTimeout(() => {
      // Resume a draft where it was left. Modifying a submitted resolution always
      // restarts at step 1, since its staging is reseeded from the record.
      setStep(canEdit ? 1 : (loadDraftStep(review.id) ?? 1));
      setRuleFilter(null);
      if (canEdit) {
        /**
         * Editing starts from what was actually submitted, not the blank template —
         * otherwise "edit" would silently discard the reviewer's own wording. Nothing
         * is staged for removal, so a reviewer can walk straight through and keep the
         * current decisions, or change only what they mean to.
         */
        setRemovalSelection(new Set());
        setRemoveJustification(defaultRemoveJustification(review));
        setAcceptPerRule(acceptStagingFromReview(review));
        setAcceptFieldEdited({});
      }
      router.replace(`${pathname}?view=workspace`, { scroll: false });
    }, 1000);
  };
  const canSubmit = allResolved;
  const submit = () => {
    if (!canSubmit) return;
    const flushed = flushStagingToActions();
    const removed = new Set(flushed.flatMap((a) => (a.kind === 'remove' ? a.removedAccessIds : [])));
    const acceptAll = flushed.some((a) => a.kind === 'accept' && a.scope === 'all');
    const accepted = new Set(flushed.flatMap((a) => (a.kind === 'accept' && a.scope === 'custom' ? a.ruleIds : [])));
    const complete = rules.every(
      (r) => clearedByRemoval(r.accessIds, removed) || acceptAll || accepted.has(r.id),
    );
    if (!complete) return;

    const at = new Date().toISOString();
    const acceptedRules: Record<string, AcceptedRisk> = {};
    for (const rule of rules) {
      if (clearedByRemoval(rule.accessIds, removed)) continue;
      const acc = flushed.find(
        (a) => a.kind === 'accept' && (a.scope === 'all' || a.ruleIds.includes(rule.id)),
      );
      if (acc?.kind !== 'accept') continue;
      const days = acc.days;
      const duration: AcceptedRisk['duration'] =
        days <= 0 ? 'permanent' : days >= 180 ? 180 : days >= 90 ? 90 : 30;
      acceptedRules[rule.id] = {
        justification: acc.justification,
        duration,
        approverId: 'apr-rachel',
        approverName: 'Rachel Kim',
        at,
        // Keep the exact instant — `duration` alone rounds to 30/90/180 and drops
        // the time of day the reviewer chose.
        untilAt: acc.untilAt,
      };
    }

    const rem = flushed.find((a): a is RemoveAction => a.kind === 'remove');

    /**
     * `saveReviewState` shallow-merges, so passing only the newly staged removals
     * would erase access the original submission already revoked. A revision can
     * only ever add revocations — that access is gone — so union with the record.
     */
    const removedForSave = isEditing
      ? new Set<string>([...review.removedAccessIds, ...removed])
      : removed;

    saveReviewState(review.id, {
      removedAccessIds: [...removedForSave],
      acceptedRules,
      removeJustification: rem?.justification ?? review.removeJustification,
    });
    persistActions(review.id, []);
    persistDraftStep(review.id, null);
    setActions([]);
    const submitted = submitReview(review.id, '');
    if (submitted) setReview(submitted);
    toast.success(isEditing ? 'Resolution updated' : 'Resolution submitted');
    /*
     * Submitting ends the task, so it returns to the queue rather than leaving the
     * reviewer on a page that has just gone read-only. The list opens on Active — the
     * work still to do — which is why the row just submitted will not be in it; the
     * toast is the confirmation, and the resolution now lives under Accepted Risk or
     * Resolved. `replace`, not `push`: `openWorkspace` replaced the detail entry with
     * the workspace URL, so pushing would leave Back pointing at the workspace of an
     * already-submitted review.
     */
    leavingRef.current = true;
    router.replace(LIST_HREF, { scroll: false });
  };

  const toggleRemoval = (id: string) =>
    updateRemovalSelection((s) => {
      const n = new Set(s);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  const stageRemoval = (id: string) =>
    updateRemovalSelection((s) => {
      if (s.has(id)) return s;
      return new Set(s).add(id);
    });
  const stageFastest = (ids: string[]) =>
    updateRemovalSelection((s) => new Set([...s, ...ids]));
  /**
   * Offer "Apply to all" once the reviewer has deliberately edited *either* field
   * and the result is a valid detail worth copying.
   *
   * It used to require `until && justification`, but the date is pre-filled with a
   * valid default — so a reviewer happy with that date never satisfied `until` and
   * the option stayed hidden however much justification they wrote.
   */
  const acceptReadyForApplyAll = (id: string) =>
    Boolean(acceptFieldEdited[id]?.justification || acceptFieldEdited[id]?.until) &&
    acceptDetailValid(acceptPerRule[id]);

  const updateAcceptPerRule = (
    id: string,
    patch: Partial<{ justification: string; untilDate: string; untilTime: string }>,
  ) => {
    // Date and time are one decision ("valid until"), so either counts as editing it.
    if (patch.untilDate !== undefined || patch.untilTime !== undefined) {
      setAcceptFieldEdited((prev) => ({
        ...prev,
        [id]: { ...prev[id], until: true },
      }));
    }
    if (patch.justification !== undefined) {
      setAcceptFieldEdited((prev) => ({
        ...prev,
        [id]: { ...prev[id], justification: true },
      }));
    }
    setAcceptPerRule((prev) => {
      const updated = { ...(prev[id] ?? defaultAcceptDetail(review)), ...patch };
      const next = { ...prev, [id]: updated };
      if (applyTemplateRuleId === id) {
        for (const rule of pendingRules) {
          if (rule.id === id) continue;
          next[rule.id] = { ...updated };
        }
      }
      return next;
    });
  };
  const setApplyTemplate = (sourceRuleId: string, enabled: boolean) => {
    if (!enabled) {
      setApplyTemplateRuleId(null);
      return;
    }
    const source = acceptPerRule[sourceRuleId] ?? defaultAcceptDetail(review);
    setApplyTemplateRuleId(sourceRuleId);
    setAcceptPerRule((prev) => {
      const next = { ...prev };
      for (const rule of pendingRules) {
        next[rule.id] = {
          justification: source.justification,
          untilDate: source.untilDate,
          untilTime: source.untilTime,
        };
      }
      return next;
    });
  };

  const fp = fastestPath({
    ...review,
    rules,
    removedAccessIds: [],
    acceptedRules: {} as Record<string, AcceptedRisk>,
  }).filter((f) => accessList.some((a) => a.id === f.accessId));

  const acceptReady =
    pendingRules.length === 0 || pendingRules.every((r) => acceptDetailValid(acceptPerRule[r.id]));
  const removeStaged = removalSelection.size > 0;
  const canNext =
    step === 1
      ? !removeStaged || removeJustification.trim().length >= 10
      : step === 2
        ? acceptReady
        : false;
  const primaryLabel =
    step === 1
      ? 'Continue'
      : pendingRules.length === 0
        ? 'Continue to preview'
        : 'Accept risk & continue';

  const next = () => {
    if (step === 1) {
      if (removeStaged && removeJustification.trim().length < 10) return;
      return setStep(2);
    }
    if (step === 2) {
      if (!acceptReady) return;
      if (removeStaged && removeJustification.trim().length < 10) return;
      flushStagingToActions();
      return setStep(3);
    }
  };

  if (workspaceLoading) {
    return (
      <div
        className="-mx-8 -my-6 grid h-[calc(100%+3rem)] place-items-center bg-subtle/40"
        role="status"
        aria-live="polite"
      >
        <div className="flex flex-col items-center gap-3 text-center">
          <CircularProgress size={32} thickness={4} />
          <p className="text-body-sm text-text-secondary">Opening resolution workspace…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="-mx-8 -my-6 flex h-[calc(100%+3rem)] flex-col bg-canvas">
      {/* Header — heading + sub-line, with tabs below on the main page (same
          shape as the emergency-access detail page). The workspace drops the
          sub-line and tabs so the stepper keeps the vertical space. */}
      <div
        className={[
          'shrink-0 border-b border-border bg-canvas px-5',
          workspaceOpen ? 'py-2.5' : 'pt-5',
        ].join(' ')}
      >
        <div
          className={[
            'flex flex-wrap items-start justify-between gap-4',
            workspaceOpen ? '' : 'mb-4',
          ].join(' ')}
        >
          {/* `items-center` (not start) so the avatar centres against the whole
              name + sub-line block, as on the emergency-access header. */}
          <div className="flex min-w-0 items-center gap-3">
            <Avatar
              name={policyName}
              initials={policyName.trim().charAt(0).toUpperCase()}
              size={workspaceOpen ? 'sm' : 'md'}
            />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-3">
                <span className="min-w-0 truncate text-h5 text-text-primary">
                  {policyName}
                  <span className="font-normal text-text-secondary"> – Violated by </span>
                  {review.userName}
                </span>
                {/* Same pill and the same derivation the list's Status column uses, so a
                    row and the page it opens can never disagree. `actions` is this
                    review's saved V3 work, which is what makes In Progress reachable —
                    `reviewerStatusOf` alone cannot see a V3 draft. */}
                <ReviewerStatusPillV3
                  status={v3ReviewerStatus({ submitted: isSubmitted, hasDraft: actions.length > 0 })}
                />
              </div>
              {!workspaceOpen && (
                <p className="mt-0.5 truncate text-body-sm text-text-secondary">
                  {headerDescription({
                    isSubmitted,
                    canEdit,
                    isEditing,
                    allAddressed: mainStatusCounts.pending === 0,
                  })}
                </p>
              )}
            </div>
          </div>
          {!workspaceOpen && (
            <Button disabled={isSubmitted && !canEdit} onClick={openWorkspace}>
              {canEdit
                ? 'Modify Resolution'
                : actions.length > 0
                  ? 'Continue resolution'
                  : `Resolve violation${mainListRules.length === 1 ? '' : 's'}`}
            </Button>
          )}
        </div>
        {!workspaceOpen && (
          <Tabs
            items={MAIN_TABS}
            value={mainTab}
            onChange={(v) => setMainTab(v as MainTab)}
            noBorder
            aria-label="Violation details"
          />
        )}
      </div>

      {/* Workspace stepper bar */}
      {workspaceOpen && (
        <div className="flex shrink-0 items-center gap-4 border-b border-border bg-subtle px-5 py-3">
          <div className="min-w-0 flex-1 overflow-hidden">
            <Stepper
              steps={RESOLUTION_STEPS}
              current={step - 1}
              onStepClick={(i) => i < step - 1 && setStep(i + 1)}
              // Preview owns its own way back — an explicit Edit action sits with the
              // resolution being reviewed, so the arrow here would be a second answer
              // to the same question.
              showBack={step < 3}
            />
          </div>
          <div className="flex shrink-0 items-center gap-3">
            {/* Edit lives on the Preview section's own heading, not here: it acts on
                what that section shows, and this bar is for advancing or leaving the
                flow. See PreviewSubmitColumns. */}
            {/* Confirm only when there is something to lose. Cancelling an
                untouched workspace destroys nothing, and a dialog there is pure
                friction — the guard is for work, not for the click. */}
            <Button
              variant="tertiary"
              onClick={() => (hasStagedWork ? setCancelOpen(true) : cancelDraft())}
            >
              Cancel
            </Button>
            <Button variant="secondary" onClick={saveAsDraft}>
              Save as draft
            </Button>
            {step < 3 ? (
              <Tooltip title={!canNext ? 'Provide justification, then you can continue' : ''} placement="bottom">
                <span className="inline-flex">
                  <Button disabled={!canNext} onClick={next}>
                    {primaryLabel}
                  </Button>
                </span>
              </Tooltip>
            ) : (
              <Tooltip
                title={!canSubmit ? 'Resolve every access combination before submitting' : ''}
                placement="bottom"
              >
                <span className="inline-flex">
                  <Button disabled={!canSubmit} onClick={submit}>
                    Submit resolution
                  </Button>
                </span>
              </Tooltip>
            )}
          </div>
        </div>
      )}

      {!workspaceOpen ? (
        <MainViolationPage
          review={review}
          onAssignReviewer={(reviewer) => {
            const updated = assignReviewer(review.id, reviewer);
            if (!updated) return;
            setReview(updated);
            toast.success(`Assigned to ${reviewer.name}`);
          }}
          onRemoveReviewer={() => {
            const removed = review.assignedReviewerName;
            const updated = unassignReviewer(review.id);
            if (!updated) return;
            setReview(updated);
            toast.success(removed ? `${removed} removed` : 'Reviewer removed');
          }}
          policyName={policyName}
          description={policy?.description}
          rules={mainListRules}
          ruleUiStatus={mainRuleUiStatus}
          filter={ruleFilter}
          onFilter={setRuleFilter}
          counts={mainStatusCounts}
          readOnly={isSubmitted}
          tab={mainTab}
          onTab={setMainTab}
          onViewDetails={() => setDetailsOpen(true)}
        />
      ) : step === 1 ? (
        <RemoveAccessColumns
          rules={rules}
          ruleUiStatus={ruleUiStatus}
          removalSelection={removalSelection}
          onToggle={toggleRemoval}
          onStage={stageRemoval}
          onStageAll={() => stageFastest(fp.map((f) => f.accessId))}
          onSetSelection={updateRemovalSelection}
          fastest={fp}
          accessList={accessList}
          justification={removeJustification}
          onJustification={setRemoveJustification}
          filter={ruleFilter}
          onFilter={setRuleFilter}
          counts={workspaceStatusCounts}
        />
      ) : step === 2 ? (
        <AcceptRiskColumns
          review={review}
          rules={rules}
          ruleUiStatus={ruleUiStatus}
          removalSelection={removalSelection}
          filter={ruleFilter}
          onFilter={setRuleFilter}
          counts={workspaceStatusCounts}
          pendingRules={pendingRules}
          perRule={acceptPerRule}
          applyTemplateRuleId={applyTemplateRuleId}
          acceptReadyForApplyAll={acceptReadyForApplyAll}
          onPerRuleChange={updateAcceptPerRule}
          onApplyTemplateChange={setApplyTemplate}
        />
      ) : (
        <PreviewSubmitColumns
          rules={rules}
          ruleResolution={ruleResolution}
          ruleDetail={ruleDetail}
          removedAccessIds={removedAccessIds}
          allResolved={allResolved}
          onEdit={() => setStep(1)}
        />
      )}

      <UserDetailsDrawer open={detailsOpen} onClose={() => setDetailsOpen(false)} review={review} />

      {/* Cancel is destructive here: it does not just close the workspace, it clears
          the saved draft from the store. The dialog names what is lost and what it
          costs to recover, so "Cancel" cannot be read as "go back". */}
      <Dialog
        open={cancelOpen}
        onClose={() => setCancelOpen(false)}
        title="Discard this resolution?"
        tone="danger"
        icon={<WarningAmberOutlined sx={{ fontSize: 22 }} />}
        confirmLabel="Discard and restart"
        cancelLabel="Keep working"
        onConfirm={cancelDraft}
      >
        Every decision you have staged — access marked for removal, risk acceptances and
        their justifications — will be <strong className="text-text-primary">permanently deleted</strong>,
        including anything already saved as a draft. The review returns to step 1 and you
        will have to start again from the beginning.
        <span className="mt-3 block">
          To come back to this later instead, choose{' '}
          <strong className="text-text-primary">Save as draft</strong>.
        </span>
      </Dialog>
    </div>
  );
}

function ViolatedPolicyHeading({
  action,
  title = 'Preview Impact on Policy',
  willResolve = 0,
  willAccept = 0,
  total = 0,
}: {
  action?: React.ReactNode;
  title?: string;
  willResolve?: number;
  willAccept?: number;
  total?: number;
}) {
  const covered = willResolve + willAccept;
  const allCovered = total > 0 && covered >= total;
  const parts: string[] = [];
  if (willResolve > 0) {
    parts.push(`${willResolve} will resolve`);
  }
  if (willAccept > 0) {
    parts.push(
      `${willAccept} will be accepted as risk`,
    );
  }
  const progressLabel =
    parts.length > 0
      ? parts.join(' · ')
      : `0 of ${total} access combinations will resolve`;

  return (
    <div className="shrink-0 space-y-3 px-5 pb-4 pt-5">
      <div className="flex items-start justify-between gap-3">
        <h2 className="text-h5 text-text-primary">{title}</h2>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
      {total > 0 && (
        <div className="rounded-lg border border-border bg-surface px-3 py-3">
          <div className="mb-2 flex items-center gap-2">
            <span
              className={[
                'inline-flex items-center gap-1.5 text-caption-strong',
                allCovered
                  ? 'text-[var(--ds-color-status-success-fg)]'
                  : 'text-text-secondary',
              ].join(' ')}
            >
              {allCovered ? (
                <CheckCircleOutlined sx={{ fontSize: 15 }} />
              ) : (
                <WatchLater sx={{ fontSize: 15 }} />
              )}
              {progressLabel}
            </span>
          </div>
          <div
            className="flex h-1 w-full gap-0.5 overflow-hidden rounded-pill bg-subtle"
            role="img"
            aria-label={`${willResolve} will resolve, ${willAccept} will be accepted as risk`}
          >
            {willResolve > 0 && (
              <div
                className="h-full rounded-pill transition-[width] duration-300 ease-out"
                style={{
                  width: `${(willResolve / total) * 100}%`,
                  background: 'var(--ds-color-status-success-fill)',
                }}
              />
            )}
            {willAccept > 0 && (
              <div
                className="h-full rounded-pill transition-[width] duration-300 ease-out"
                style={{
                  width: `${(willAccept / total) * 100}%`,
                  background: 'var(--ds-color-status-danger-fill)',
                }}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Access chip — app tile + app name + access name, as it appears inside an
 * access combination.
 *
 * Pill outer instead of `rounded-md`: the chip and the tile both used the same
 * 8px radius, which on a 24px chip and a 16px tile read as two competing
 * squircles with no hierarchy. A pill outer keeps the round/square contrast
 * unambiguous and matches the removal-step chip.
 *
 * `pl-1.5` is load-bearing: with a pill, the tile's top-left corner lands only
 * 0.4px inside the curve at `pl-1`, so it reads as touching the edge.
 */
function AccessChip({ access, danger = false }: { access: SodAccess; danger?: boolean }) {
  return (
    <span
      className={[
        'inline-flex items-center gap-1.5 rounded-pill bg-subtle py-1 pl-1.5 pr-2 text-caption',
        danger ? 'text-[var(--ds-color-status-danger-fg)]' : '',
      ].join(' ')}
    >
      <AppBadge app={access.appName} size={18} variant="surface" appearance="logo" />
      <span className={danger ? '' : 'text-text-tertiary'}>{access.appName}</span>
      <span className={['font-emphasis', danger ? '' : 'text-text-primary'].join(' ')}>
        {access.name}
      </span>
      <AccessDetailsTip access={access} />
    </span>
  );
}

/**
 * Info affordance living inside the access pill, opening the access details card.
 *
 * A `span` with `tabIndex`, not a button: the chip appears inside rows that are
 * themselves clickable, and nesting a button inside one breaks both semantics and
 * keyboard order. `tabIndex` still lets the card open on focus, since MUI Tooltip
 * responds to focus as well as hover.
 */
function AccessDetailsTip({
  access,
  insideControl = false,
}: {
  access: SodAccess;
  /**
   * Set when the icon sits within another control — a `SelectableList` row is a
   * `<button>`, and a button may not contain focusable content. The trigger then
   * drops `tabIndex` (hover still opens the card) and swallows the click so tapping
   * the icon doesn't toggle the row it lives in.
   *
   * The same details stay keyboard-reachable from the impact-panel chips, whose
   * triggers sit outside any control.
   */
  insideControl?: boolean;
}) {
  return (
    <Tooltip variant="card" placement="top" title={<AccessDetailsCard access={access} />}>
      <span
        tabIndex={insideControl ? undefined : 0}
        aria-label={insideControl ? undefined : `Details for ${access.name}`}
        onClick={insideControl ? (e) => e.stopPropagation() : undefined}
        className="inline-grid shrink-0 cursor-help place-items-center rounded-full align-middle text-icon-subtle transition-colors hover:text-icon focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-subtle"
      >
        <InfoOutlined sx={{ fontSize: 14 }} />
      </span>
    </Tooltip>
  );
}

/**
 * Compact details card for one access, shown from the chip's info affordance.
 *
 * Three tiers, so the eye lands in order: the name is the heading, the description
 * is secondary prose, and the facts below are label/value pairs with the label
 * recessed. The divider separates identity from attributes.
 */
function AccessDetailsCard({ access }: { access: SodAccess }) {
  return (
    <div className="w-[292px] text-left">
      <div className="flex items-center gap-2.5 px-3.5 pb-3 pt-3.5">
        {/* Initial of the access name, not a type glyph — the type is already named
            in the line below, so a letter identifies *this* access instead of
            repeating its category. `soft` keeps circles reserved for people. */}
        <Avatar
          name={access.name}
          initials={access.name.trim().charAt(0).toUpperCase()}
          size="md"
         
        />
        <span className="min-w-0">
          <span className="block truncate text-h5 leading-tight text-text-primary">
            {access.name}
          </span>
          <span className="block text-caption text-text-tertiary">
            {ACCESS_TYPE_LABEL[access.type]}
          </span>
        </span>
      </div>
      <div className="space-y-3 border-t border-border-subtle px-3.5 py-3">
        {access.description && (
          <p className="text-body-sm leading-5 text-text-secondary">{access.description}</p>
        )}
        <dl className="grid grid-cols-2 gap-x-3 gap-y-1">
          <dt className="text-caption text-text-tertiary">Risk Score</dt>
          <dt className="text-caption text-text-tertiary">Application</dt>
          <dd className="min-w-0">
            {typeof access.risk === 'number' ? (
              <RiskScoreChip score={access.risk} />
            ) : (
              <span className="text-body-sm text-text-tertiary">—</span>
            )}
          </dd>
          <dd className="flex min-w-0 items-center gap-1.5">
            <AppBadge app={access.appName} size={18} variant="subtle" appearance="logo" />
            <span className="min-w-0 truncate text-body-sm-strong text-text-primary">
              {access.appName}
            </span>
          </dd>
        </dl>
      </div>
    </div>
  );
}

function RuleCard({
  rule,
  status,
  stagedAccessIds,
  acceptance,
}: {
  rule: SodRule;
  status: RuleUiStatus;
  stagedAccessIds?: Set<string>;
  /** Final risk-acceptance details (main / history page). */
  acceptance?: AcceptedRisk;
}) {
  /**
   * Prefer the exact expiry the reviewer chose over the coarse duration bucket —
   * "until Nov 4, 2026, 9:30 AM" is actionable in a way "90 days" is not, since it
   * says when the exception actually lapses. Seeded acceptances have no `untilAt`,
   * so they keep the duration.
   */
  const expiryLabel =
    acceptance == null
      ? null
      : acceptance.untilAt
        ? `until ${formatUntil(acceptance.untilAt)}`
        : acceptance.duration === 'permanent'
          ? 'Permanent'
          : `${acceptance.duration} days`;

  return (
    <div className="rounded-lg border border-border bg-surface p-3">
      <div className="mb-2 flex items-center gap-2 text-caption">
        <span className="font-emphasis text-text-primary">{rule.code}</span>
        <span className="ml-auto shrink-0">
          <RuleStatusPill status={status} />
        </span>
      </div>
      <div className="flex flex-wrap items-center gap-1.5">
        {rule.accessIds.map((aid, idx) => {
          const a = getAccess(aid);
          if (!a) return null;
          const danger = Boolean(stagedAccessIds?.has(aid));
          return (
            <React.Fragment key={aid}>
              {idx > 0 && <span className="text-caption-strong text-text-tertiary">AND</span>}
              <AccessChip access={a} danger={danger} />
            </React.Fragment>
          );
        })}
      </div>

      {acceptance ? (
        <div className="mt-2.5 rounded-md bg-subtle px-2.5 py-2.5">
          <div className="flex items-start gap-2">
            <span className="mt-0.5 shrink-0 text-[var(--ds-color-status-warning-fg)]">
              <ShieldOutlined sx={{ fontSize: 16 }} />
            </span>
            <div className="min-w-0 flex-1 space-y-1.5">
              <p className="text-body-sm-strong leading-5 text-text-primary">
                Risk accepted
                {expiryLabel ? ` · ${expiryLabel}` : ''}
                {acceptance.approverName ? ` · ${acceptance.approverName}` : ''}
              </p>
              {acceptance.justification.trim() && (
                <p className="border-t border-border-subtle pt-1.5 text-caption leading-5 text-text-secondary">
                  {acceptance.justification}
                </p>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

/**
 * Violated-policy summary — sidebar card, same anatomy as `MainUserCard`:
 * titled header, a subject row (mark + name + secondary line), then labelled
 * facts in an `InfoRowGroup`.
 *
 * The mark is a `soft` avatar, not the `circle` the user cards use: circles read
 * as people, so the squarer shape keeps a policy from being mistaken for one.
 * Risk moves into a labelled row — "Risk score: High (89)" says more than a bare
 * chip floating beside the name.
 */
function MainPolicyCard({
  policyName,
  description,
  severity,
  riskScore,
}: {
  policyName: string;
  description?: string;
  severity: Severity;
  riskScore: number;
}) {
  return (
    <Card title="Violated policy" icon={<Policy />} padding="none">
      <div className="min-w-0 py-3">
        <div className="truncate text-body-strong text-text-primary">{policyName}</div>
        {description && (
          /* Two lines, then clamp — enough for a full policy sentence in a 320px
             rail without letting a long one push the card open. `title` keeps the
             remainder reachable when it does clip. */
          <p
            className="mt-0.5 line-clamp-2 text-caption leading-5 text-text-secondary"
            title={description}
          >
            {description}
          </p>
        )}
      </div>
      <InfoRowGroup>
        <InfoRow icon={infoIcon.risk} label="Risk score" value={<SeverityChip severity={severity} score={riskScore} />} />
      </InfoRowGroup>
    </Card>
  );
}

function PolicyRulesPanel({
  rules,
  ruleUiStatus,
  stagedAccessIds,
  filter,
  onFilter,
  counts,
}: {
  rules: SodRule[];
  ruleUiStatus: (r: SodRule) => RuleUiStatus;
  stagedAccessIds?: Set<string>;
  filter: RuleFilter;
  onFilter: (f: RuleFilter) => void;
  counts: StatusCounts;
}) {
  const [search, setSearch] = React.useState('');
  const filterOptions = [
    ...(counts.pending > 0 ? [{ value: 'pending' as const, label: 'Pending', count: counts.pending }] : []),
    ...(counts.willResolve > 0
      ? [{ value: 'will-resolve' as const, label: 'Will resolve', count: counts.willResolve }]
      : []),
    ...(counts.willAccept > 0
      ? [{ value: 'will-accept' as const, label: 'Will accept', count: counts.willAccept }]
      : []),
    ...(counts.resolved && counts.resolved > 0
      ? [{ value: 'resolved' as const, label: 'Resolved', count: counts.resolved }]
      : []),
    ...(counts.riskAccepted && counts.riskAccepted > 0
      ? [{ value: 'risk-accepted' as const, label: 'Risk accepted', count: counts.riskAccepted }]
      : []),
  ];
  const active = filter && filterOptions.some((o) => o.value === filter) ? filter : null;
  const q = search.trim().toLowerCase();
  const matchesSearch = (r: SodRule) =>
    !q || r.code.toLowerCase().includes(q) || r.label.toLowerCase().includes(q) || ruleAccessText(r).toLowerCase().includes(q);
  const visible = rules.filter((r) => {
    if (!matchesSearch(r)) return false;
    if (active === null) return true;
    return ruleUiStatus(r) === active;
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="min-w-0 flex-1">
          <Input
            size="sm"
            placeholder="Search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            startAdornment={<SearchOutlined sx={{ fontSize: 18 }} />}
            inputProps={{
              // Through `inputProps` so it reaches the <input> — a bare `aria-label`
              // on the DS Input lands on the MUI wrapper. Now that the placeholder is
              // only "Search", this is the sole thing naming the field.
              'aria-label': 'Search violated access combinations',
              style: { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
            }}
          />
        </div>
        {filterOptions.length > 0 && (
          <QuickFilter
            size="sm"
            ariaLabel="Filter violated access combinations by status"
            value={active}
            onChange={onFilter}
            options={filterOptions}
          />
        )}
      </div>

      {visible.length === 0 ? (
        <p className="py-6 text-center text-caption text-text-secondary">
          No access combinations match your search or filter.
        </p>
      ) : (
        <div className="space-y-2">
          {visible.map((rule) => (
            <RuleCard
              key={rule.id}
              rule={rule}
              status={ruleUiStatus(rule)}
              stagedAccessIds={stagedAccessIds}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/** Main page — policy summary + combinations (left); user + audit (right). No identity top bar. */
function MainViolationPage({
  review,
  policyName,
  description,
  rules,
  ruleUiStatus,
  filter,
  onFilter,
  counts,
  readOnly = false,
  tab,
  onTab,
  onViewDetails,
  onAssignReviewer,
  onRemoveReviewer,
}: {
  review: SodReview;
  policyName: string;
  description?: string;
  rules: SodRule[];
  ruleUiStatus: (r: SodRule) => RuleUiStatus;
  filter: RuleFilter;
  onFilter: (f: RuleFilter) => void;
  counts: StatusCounts;
  /** History (submitted) — list is risk-accepted only, with a read-only empty state. */
  readOnly?: boolean;
  tab: MainTab;
  onTab: (t: MainTab) => void;
  onViewDetails: () => void;
  onAssignReviewer: (reviewer: { id: string; name: string }) => void;
  onRemoveReviewer: () => void;
}) {
  const [search, setSearch] = React.useState('');
  const pending = counts.pending;
  const accepted = counts.riskAccepted ?? 0;
  const filterOptions = [
    ...(pending > 0 ? [{ value: 'pending' as const, label: 'Pending', count: pending }] : []),
    ...(accepted > 0
      ? [{ value: 'risk-accepted' as const, label: 'Risk accepted', count: accepted }]
      : []),
  ];
  const active = filter && filterOptions.some((o) => o.value === filter) ? filter : null;
  const q = search.trim().toLowerCase();
  const visible = rules.filter((r) => {
    if (active !== null && ruleUiStatus(r) !== active) return false;
    if (!q) return true;
    return (
      r.code.toLowerCase().includes(q) ||
      r.label.toLowerCase().includes(q) ||
      ruleAccessText(r).toLowerCase().includes(q)
    );
  });

  if (tab === 'history') {
    return (
      <div className="ds-scroll min-h-0 flex-1 overflow-y-auto bg-subtle/40">
        <div className="px-5 py-5">
          <section>
            <DecisionHistoryTimeline review={review} />
          </section>
        </div>
      </div>
    );
  }

  return (
    <div className="ds-scroll min-h-0 flex-1 overflow-y-auto bg-subtle/40">
      <div className="grid w-full gap-5 px-5 py-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0">
          {/* Active: pending + risk accepted. History: risk accepted only. Removals → audit. */}
          <section>
            <h2 className="mb-3 text-h5 text-text-primary">
              Violated Access Combinations Within the Policy{' '}
              <span className="font-normal tabular-nums text-text-tertiary">
                ({rules.length})
              </span>
            </h2>

            {/* Search capped at `max-w-sm` (same as the list page) so it reads as
                a control, not a full-width field. No `justify-between`: the filter
                sits directly beside the search as one left-aligned control group. */}
            <div className="mb-3 flex items-center gap-2">
              <div className="min-w-0 max-w-sm flex-1">
                <Input
                  size="sm"
                  placeholder="Search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  startAdornment={<SearchOutlined sx={{ fontSize: 18 }} />}
                  inputProps={{
                    // See the note on the main list's search: the name has to go
                    // through `inputProps` to land on the <input>.
                    'aria-label': 'Search violated access combinations',
                    style: { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
                  }}
                />
              </div>
              {filterOptions.length > 0 && (
                <QuickFilter
                  size="sm"
                  ariaLabel="Filter violated access combinations by status"
                  value={active}
                  onChange={onFilter}
                  options={filterOptions}
                />
              )}
            </div>

            {rules.length === 0 ? (
              readOnly ? (
                <div
                  role="status"
                  className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-border px-4 py-8 text-center"
                >
                  <span className="grid h-10 w-10 place-items-center rounded-full bg-[var(--ds-color-status-success-subtle)] text-[var(--ds-color-status-success-fg)]">
                    <CheckCircleOutlined sx={{ fontSize: 22 }} />
                  </span>
                  <p className="text-body-sm-strong text-text-primary">
                    All Access Combination Violations Resolved
                  </p>
                  <p className="max-w-md text-caption leading-5 text-text-secondary">
                    Resolved by revoking access, not by accepting risk. Revocation details and the
                    full submission history are in the review timeline.
                  </p>
                  <button
                    type="button"
                    onClick={() => onTab('history')}
                    className="mt-1 text-caption-strong text-text-link hover:underline"
                  >
                    View review timeline
                  </button>
                </div>
              ) : (
                <p className="rounded-lg border border-dashed border-border px-4 py-8 text-center text-caption text-text-secondary">
                  No pending or risk-accepted violated access combinations.
                </p>
              )
            ) : visible.length === 0 ? (
              <p className="py-6 text-center text-caption text-text-secondary">
                No access combinations match your search or filter.
              </p>
            ) : (
              <div className="space-y-2">
                {visible.map((rule) => (
                  <RuleCard
                    key={rule.id}
                    rule={rule}
                    status={ruleUiStatus(rule)}
                    acceptance={review.acceptedRules[rule.id]}
                  />
                ))}
              </div>
            )}
          </section>
        </div>

        <aside className="space-y-5 lg:sticky lg:top-5 lg:self-start">
          <MainPolicyCard
            policyName={policyName}
            description={description}
            severity={review.severity}
            riskScore={review.riskScore}
          />
          <MainUserCard review={review} onViewDetails={onViewDetails} />
          <MainReviewerCard
            review={review}
            readOnly={readOnly}
            onAssign={onAssignReviewer}
            onRemove={onRemoveReviewer}
          />
        </aside>
      </div>
    </div>
  );
}

function MainUserCard({
  review,
  onViewDetails,
}: {
  review: SodReview;
  onViewDetails: () => void;
}) {
  return (
    <Card
      title="Violated by"
      icon={<Person />}
      action={
        <button
          type="button"
          onClick={onViewDetails}
          className="text-caption-strong text-text-link hover:underline"
        >
          User details
        </button>
      }
      padding="none"
    >
      <div className="flex items-center gap-3 py-3">
        <Avatar name={review.userName} size="md" kind="person" />
        <div className="min-w-0 flex-1">
          <div className="truncate text-body-strong text-text-primary">{review.userName}</div>
          <div className="truncate text-caption text-text-secondary">{review.userEmail}</div>
        </div>
      </div>
      <InfoRowGroup>
        <InfoRow icon={infoIcon.jobTitle} label="Job title" value={review.userTitle ?? '—'} />
        <InfoRow icon={infoIcon.department} label="Department" value={review.userDepartment ?? '—'} />
      </InfoRowGroup>
    </Card>
  );
}

/**
 * Rail card naming the reviewer who owns this violation.
 *
 * Assignment is real routing, not a label: `listMyReviews` filters on
 * `assignedReviewerId`, so picking someone here puts the violation in their SoD
 * queue. Unassigned is therefore a state worth showing loudly — an unowned
 * violation is one nobody is working — so the empty state is a prompt to act
 * rather than a dash. Once the review is submitted the card goes read-only:
 * reassigning finished work would rewrite who is accountable for it.
 */
function MainReviewerCard({
  review,
  readOnly,
  onAssign,
  onRemove,
}: {
  review: SodReview;
  readOnly: boolean;
  onAssign: (reviewer: { id: string; name: string }) => void;
  onRemove: () => void;
}) {
  const [open, setOpen] = React.useState(false);
  const assigned = review.assignedReviewerId
    ? sodReviewers.find((r) => r.id === review.assignedReviewerId)
    : undefined;
  // Fall back to the stored name: a reviewer could be assigned and later leave
  // the roster, and the card must still say who owns the review.
  const name = assigned?.name ?? review.assignedReviewerName;
  // You cannot review your own violation — segregation of duties applies to the
  // resolution too, not just the access being resolved.
  const candidates = sodReviewers.filter((r) => r.email !== review.userEmail);

  return (
    <>
      <Card
        title="Assigned reviewer"
        icon={<AssignmentInd />}
        action={
          // Reassign is the common action, so it gets its own one-click button.
          // Remove is destructive and rare, so it stays behind the ⋮ — one
          // deliberate extra step, and it keeps the two from being a mis-click
          // apart. The button mirrors Menu's own trigger (MUI IconButton size
          // "small", 18px icon in icon.default) so the pair matches exactly.
          !readOnly && name ? (
            <div className="flex items-center">
              <Tooltip title="Reassign reviewer">
                <IconButton size="small" aria-label="Reassign reviewer" onClick={() => setOpen(true)}>
                  <ManageAccountsOutlined sx={{ fontSize: 18, color: 'var(--ds-color-icon-default)' }} />
                </IconButton>
              </Tooltip>
              <Menu
                ariaLabel="More reviewer actions"
                items={[
                  {
                    // Menu renders icons with `color: inherit`, so this picks up
                    // the danger tone from the item rather than needing its own.
                    label: 'Remove reviewer',
                    icon: <PersonRemoveOutlined sx={{ fontSize: 18 }} />,
                    danger: true,
                    onClick: onRemove,
                  },
                ]}
              />
            </div>
          ) : undefined
        }
        padding="none"
      >
        {name ? (
          <div className="flex items-center gap-3 py-3">
            <Avatar name={name} size="md" kind="person" />
            <div className="min-w-0 flex-1">
              <div className="truncate text-body-strong text-text-primary">{name}</div>
              <div className="truncate text-caption text-text-secondary">{assigned?.email ?? '—'}</div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center py-6 text-center">
            {/* Explicit steps rather than one `gap`: the heading and its sub-line are
                a pair (§6.3 — 2–4px, anything more breaks the pair), while the icon
                above and the action below are separate and want more air. */}
            <span className="mb-2 grid h-10 w-10 place-items-center rounded-full bg-subtle text-icon">
              <PersonAddAltOutlined sx={{ fontSize: 20 }} />
            </span>
            <p className="text-body-sm-strong text-text-primary">No reviewer assigned</p>
            <p className="mt-1 text-caption leading-5 text-text-secondary">
              {readOnly
                ? 'This review was completed without a named reviewer.'
                : 'Assign a user to review this SoD Violation.'}
            </p>
            {!readOnly && (
              <div className="mt-3">
                <Button size="sm" variant="secondary" onClick={() => setOpen(true)}>
                  Assign reviewer
                </Button>
              </div>
            )}
          </div>
        )}
      </Card>

      <TableSelectDrawer
        open={open}
        onClose={() => setOpen(false)}
        title={name ? 'Reassign reviewer' : 'Assign reviewer'}
        subtitle={`Violations for ${review.userName}`}
        icon={<PersonAddAltOutlined sx={{ fontSize: 22, color: 'var(--ds-color-brand-primary)' }} />}
        selectionMode="single"
        nameHeader="Name"
        descriptionHeader="Email"
        entity="reviewer"
        showRisk={false}
        rows={candidates.map((r) => ({ id: r.id, name: r.name, description: r.email ?? '—' }))}
        selectedIds={review.assignedReviewerId ? [review.assignedReviewerId] : []}
        onApply={(ids) => {
          const picked = candidates.find((r) => r.id === ids[0]);
          if (picked) onAssign({ id: picked.id, name: picked.name });
        }}
        confirmLabel={name ? 'Reassign' : 'Assign'}
      />
    </>
  );
}

/** Step 1 — two columns: access to revoke with justification | impact (Continue is in the top bar). */
function RemoveAccessColumns({
  rules,
  ruleUiStatus,
  removalSelection,
  onToggle,
  onStage,
  onStageAll,
  onSetSelection,
  fastest,
  accessList,
  justification,
  onJustification,
  filter,
  onFilter,
  counts,
}: {
  rules: SodRule[];
  ruleUiStatus: (r: SodRule) => RuleUiStatus;
  removalSelection: Set<string>;
  onToggle: (id: string) => void;
  onStage: (id: string) => void;
  onStageAll: () => void;
  onSetSelection: (next: Set<string>) => void;
  fastest: { accessId: string; count: number }[];
  accessList: SodAccess[];
  justification: string;
  onJustification: (v: string) => void;
  filter: RuleFilter;
  onFilter: (f: RuleFilter) => void;
  counts: StatusCounts;
}) {
  /** Snapshot taken before Apply all — enables Undo. */
  const [preApplySelection, setPreApplySelection] = React.useState<Set<string> | null>(null);
  const suggestionFullyApplied =
    fastest.length > 0 && fastest.every((f) => removalSelection.has(f.accessId));
  const canUndo = preApplySelection != null && suggestionFullyApplied;

  React.useEffect(() => {
    if (preApplySelection != null && !suggestionFullyApplied) {
      setPreApplySelection(null);
    }
  }, [preApplySelection, suggestionFullyApplied]);

  const handleApplyAll = () => {
    setPreApplySelection(new Set(removalSelection));
    onStageAll();
  };

  const handleUndoApplyAll = () => {
    if (!preApplySelection) return;
    onSetSelection(new Set(preApplySelection));
    setPreApplySelection(null);
  };

  return (
    <div className="flex min-h-0 flex-1">
      <section className="flex min-h-0 min-w-0 w-[60%] flex-col bg-subtle/40">
        <div className="mb-0 shrink-0 px-5 pb-4 pt-5">
          <h2 className="text-h5 text-text-primary">
            Select Access to revoke{' '}
            <span className="font-normal tabular-nums text-text-tertiary">
              ({removalSelection.size}/{accessList.length} selected)
            </span>
          </h2>
        </div>

        <div className="ds-scroll min-h-0 flex-1 overflow-y-auto px-5 pb-5">
          {fastest.length > 0 && (
            <div className="mb-5 rounded-xl border border-[#90CAF9] bg-[var(--ds-color-status-info-subtle)] p-4">
              <div className="flex items-start gap-3">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-surface text-[var(--ds-color-status-info-fg)]">
                  <AutoAwesomeOutlined sx={{ fontSize: 20 }} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-body-strong text-text-primary">Smart Suggestion</div>
                      <p className="mt-0.5 text-caption leading-5 text-text-secondary">
                        {/* Verb agrees with the count: "1 revocation resolves" / "2 revocations resolve". */}
                        {fastest.length} revocation{fastest.length === 1 ? '' : 's'}{' '}
                        {fastest.length === 1 ? 'resolves' : 'resolve'} every open violation
                      </p>
                    </div>
                    {canUndo ? (
                      <button
                        type="button"
                        onClick={handleUndoApplyAll}
                        className="shrink-0 rounded-md px-2 py-1 text-body-sm-strong text-[var(--ds-color-status-info-fg)] transition-colors hover:bg-surface"
                      >
                        Undo
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={handleApplyAll}
                        disabled={suggestionFullyApplied}
                        className="shrink-0 rounded-md px-2 py-1 text-body-sm-strong text-[var(--ds-color-status-info-fg)] transition-colors hover:bg-surface disabled:cursor-default disabled:opacity-50"
                      >
                        Apply all
                      </button>
                    )}
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {fastest.map((f) => {
                      const access = getAccess(f.accessId);
                      const chipStaged = removalSelection.has(f.accessId);
                      return (
                        <button
                          key={f.accessId}
                          type="button"
                          onClick={() => onStage(f.accessId)}
                          title={`Remove ${access?.name ?? f.accessId}`}
                          className={[
                            'inline-flex items-center gap-1.5 rounded-pill border bg-surface py-1 pl-1 pr-2.5 text-caption transition-colors',
                            chipStaged
                              ? 'border-brand text-brand-active'
                              : 'border-border text-text-primary hover:border-[var(--ds-color-status-info-solid)]',
                          ].join(' ')}
                        >
                          <AppBadge
                            app={access?.appName ?? ''}
                            size={18}
                            variant="subtle"
                            appearance="logo"
                          />
                          <span className="font-emphasis">{access?.name ?? f.accessId}</span>
                          <span
                            className={[
                              'tabular-nums',
                              chipStaged ? 'text-brand-active/70' : 'text-text-tertiary',
                            ].join(' ')}
                          >
                            ×{f.count}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          <SelectableList
            ariaLabel="Access to remove"
            tone="brand"
            variant="plain"
            selected={removalSelection}
            onToggle={onToggle}
            emptyMessage="No access under review."
            items={accessList.map((a) => {
              const n = rules.filter((r) => r.accessIds.includes(a.id)).length;
              return {
                id: a.id,
                leading: <AppBadge app={a.appName} size={24} appearance="logo" />,
                label: (
                  <>
                    <span className="text-text-tertiary">{a.appName}</span>{' '}
                    <span className="font-emphasis text-text-primary">{a.name}</span>{' '}
                    {/* Beside the entitlement, so it reads as belonging to the name
                        rather than to the row. */}
                    <AccessDetailsTip access={a} insideControl />
                  </>
                ),
                trailing:
                  n > 0 ? (
                    <span className="shrink-0 text-caption text-text-tertiary">
                      Violating {n} access combination{n === 1 ? '' : 's'}
                    </span>
                  ) : undefined,
              };
            })}
          />
        </div>

        {removalSelection.size > 0 && (
          <div className="relative shrink-0 px-5 pb-4 pt-1">
            {/* Continuous fade so the list merges into the justification footer. */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-0 bottom-full h-14 bg-gradient-to-b from-transparent to-subtle/40"
            />
            <div className="mb-1.5 text-body-sm-strong text-text-primary">
              Justification{' '}
              <span className="font-normal text-text-tertiary">(min. 10 words)</span>
            </div>
            <Input
              aria-label="Justification (min. 10 words)"
              size="sm"
              multiline
              minRows={2}
              placeholder="Edit as needed — why is this access not required?"
              value={justification}
              onChange={(e) => onJustification(e.target.value)}
            />
          </div>
        )}
      </section>

      <section className="flex min-h-0 min-w-0 w-[40%] flex-col border-l border-border">
        <ViolatedPolicyHeading
          willResolve={counts.willResolve}
          willAccept={counts.willAccept}
          total={rules.length}
        />
        <div className="ds-scroll min-h-0 flex-1 overflow-y-auto px-5 pb-5">
          <PolicyRulesPanel
            rules={rules}
            ruleUiStatus={ruleUiStatus}
            stagedAccessIds={removalSelection}
            filter={filter}
            onFilter={onFilter}
            counts={counts}
          />
        </div>
      </section>
    </div>
  );
}

/** Step 2 — two columns: accept risk | violated policy (Continue is in the top bar). */
function AcceptRiskColumns({
  review,
  rules,
  ruleUiStatus,
  removalSelection,
  filter,
  onFilter,
  counts,
  pendingRules,
  perRule,
  applyTemplateRuleId,
  acceptReadyForApplyAll,
  onPerRuleChange,
  onApplyTemplateChange,
}: {
  review: SodReview;
  rules: SodRule[];
  ruleUiStatus: (r: SodRule) => RuleUiStatus;
  removalSelection: Set<string>;
  filter: RuleFilter;
  onFilter: (f: RuleFilter) => void;
  counts: StatusCounts;
  pendingRules: SodRule[];
  perRule: AcceptPerRule;
  applyTemplateRuleId: string | null;
  acceptReadyForApplyAll: (ruleId: string) => boolean;
  onPerRuleChange: (id: string, patch: Partial<{ justification: string; untilDate: string }>) => void;
  onApplyTemplateChange: (sourceRuleId: string, enabled: boolean) => void;
}) {
  const minUntil = minAcceptUntilDate();
  return (
    <div className="flex min-h-0 flex-1">
      <section className="flex min-h-0 min-w-0 w-[60%] flex-col bg-subtle/40">
        <div className="shrink-0 px-5 pb-4 pt-5">
          <h2 className="text-h5 text-text-primary">
            Justify risk acceptance for pending access combinations{' '}
            <span className="font-normal tabular-nums text-text-tertiary">({pendingRules.length})</span>
          </h2>
        </div>

        <div className="ds-scroll min-h-0 flex-1 overflow-y-auto px-5 pb-5">
          {pendingRules.length === 0 ? (
            <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border px-4 py-10 text-center">
              <span className="grid h-11 w-11 place-items-center rounded-full bg-[var(--ds-color-status-success-subtle)] text-[var(--ds-color-status-success-fg)]">
                <CheckCircleOutlined sx={{ fontSize: 24 }} />
              </span>
              <div className="text-body-strong text-text-primary">No further action needed here</div>
              <p className="text-body-sm text-text-secondary">
                Every violated access combination will resolve by removing access. Continue to preview and submit.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
                {pendingRules.map((rule) => {
                  const detail = perRule[rule.id] ?? defaultAcceptDetail(review);
                  return (
                    <AcceptRiskRuleCard
                      key={rule.id}
                      rule={rule}
                      detail={detail}
                      minUntil={minUntil}
                      showApplyToAll={pendingRules.length > 1 && acceptReadyForApplyAll(rule.id)}
                      applyToAllChecked={applyTemplateRuleId === rule.id}
                      stagedAccessIds={removalSelection}
                      onDetailChange={(patch) => onPerRuleChange(rule.id, patch)}
                      onApplyToAllChange={(checked) => onApplyTemplateChange(rule.id, checked)}
                    />
                  );
                })}
            </div>
          )}
        </div>
      </section>

      <section className="flex min-h-0 min-w-0 w-[40%] flex-col border-l border-border">
        <ViolatedPolicyHeading
          willResolve={counts.willResolve}
          willAccept={counts.willAccept}
          total={rules.length}
        />
        <div className="ds-scroll min-h-0 flex-1 overflow-y-auto px-5 pb-5">
          <PolicyRulesPanel
            rules={rules}
            ruleUiStatus={ruleUiStatus}
            stagedAccessIds={removalSelection}
            filter={filter}
            onFilter={onFilter}
            counts={counts}
          />
        </div>
      </section>
    </div>
  );
}

function AcceptRiskRuleCard({
  rule,
  detail,
  minUntil,
  showApplyToAll,
  applyToAllChecked,
  stagedAccessIds,
  onDetailChange,
  onApplyToAllChange,
}: {
  rule: SodRule;
  detail: AcceptPerRule[string];
  minUntil: string;
  showApplyToAll: boolean;
  applyToAllChecked: boolean;
  stagedAccessIds: Set<string>;
  onDetailChange: (patch: Partial<AcceptPerRule[string]>) => void;
  onApplyToAllChange: (checked: boolean) => void;
}) {
  return (
    <div className="rounded-lg border border-border bg-surface">
      <div className="px-3.5 pt-3.5 pb-3">
        <div className="mb-2 flex items-center gap-2 text-caption">
          <span className="font-emphasis text-text-primary">{rule.code}</span>
          <span className="ml-auto shrink-0">
            <RuleStatusPill status="will-accept" />
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {rule.accessIds.map((aid, idx) => {
            const a = getAccess(aid);
            if (!a) return null;
            const staged = stagedAccessIds.has(aid);
            return (
              <React.Fragment key={`${aid}-${idx}`}>
                {idx > 0 && <span className="text-caption-strong text-text-tertiary">AND</span>}
                <AccessChip access={a} danger={staged} />
              </React.Fragment>
            );
          })}
        </div>
      </div>

      <div className="mx-3.5 mb-3.5 space-y-3 rounded-lg bg-subtle p-3.5">
        {/* Date + time are one decision, so they share a single label. The time is
            fixed-width — it never needs to grow — and the date takes the slack. */}
        <div>
          <div className="mb-1.5 text-body-sm-strong text-text-primary">Valid until</div>
          <div className="flex items-start gap-2">
            {/* The shared heading above is not a `<label for>`, so each control
                carries its own accessible name. */}
            <div className="min-w-0 flex-1">
              <DatePicker
                value={detail.untilDate}
                onChange={(v) => onDetailChange({ untilDate: v })}
                min={minUntil}
                ariaLabel={`Valid until date for ${rule.code}`}
              />
            </div>
            {/* One field, three columns inside the picker. */}
            <div className="w-[132px] shrink-0">
              <TimePicker
                value={detail.untilTime}
                onChange={(v) => onDetailChange({ untilTime: v })}
                ariaLabel={`Valid until time for ${rule.code}`}
              />
            </div>
          </div>
        </div>
        <div>
          <div className="mb-1.5 text-body-sm-strong text-text-primary">
            Justification{' '}
            <span className="font-normal text-text-tertiary">(min. 10 words)</span>
          </div>
          <Input
            aria-label={`Justification for ${rule.code} (min. 10 words)`}
            size="sm"
            multiline
            minRows={2}
            placeholder="Edit as needed — why is this risk acceptable?"
            value={detail.justification}
            onChange={(e) => onDetailChange({ justification: e.target.value })}
          />
        </div>
        {showApplyToAll && (
          <div className="pt-0.5">
            <Checkbox
              checked={applyToAllChecked}
              onChange={onApplyToAllChange}
              label={<span className="text-body-sm text-text-secondary">Apply to all</span>}
            />
          </div>
        )}
      </div>
    </div>
  );
}

type RuleDetail =
  | { kind: 'removed'; names: string[]; justification: string }
  | { kind: 'accepted'; days: number; justification: string };

/** Step 3 — full-width plan (left) + summary card (right); submit lives in the stepper bar. */
function PreviewSubmitColumns({
  rules,
  ruleResolution,
  ruleDetail,
  removedAccessIds,
  allResolved,
  onEdit,
}: {
  rules: SodRule[];
  ruleResolution: (r: SodRule) => 'removed' | 'accepted' | null;
  ruleDetail: (r: SodRule) => RuleDetail | null;
  removedAccessIds: Set<string>;
  allResolved: boolean;
  /** Reopen the flow at step 1, so the whole resolution is editable — not just its tail. */
  onEdit: () => void;
}) {
  const accessToRemove = Array.from(removedAccessIds)
    .map(getAccess)
    .filter(Boolean) as SodAccess[];
  const removedRules = rules.filter((r) => ruleResolution(r) === 'removed');
  const acceptedRules = rules.filter((r) => ruleResolution(r) === 'accepted');
  const pendingRules = rules.filter((r) => ruleResolution(r) === null);
  const resolvedCount = removedRules.length + acceptedRules.length;

  const renderPreviewRuleCard = (rule: SodRule) => {
    const detail = ruleDetail(rule);
    const accepted = detail?.kind === 'accepted' || ruleResolution(rule) === 'accepted';
    const actionLabel =
      detail?.kind === 'removed'
        ? detail.names.length === 1
          ? `${detail.names[0]} will be revoked`
          : `${detail.names.join(', ')} will be revoked`
        : detail?.kind === 'accepted'
          ? ruleResolutionActionLabel(detail)
          : null;

    return (
      <div key={rule.id} className="rounded-lg border border-border bg-surface p-3">
        <div className="mb-2 flex items-center gap-2 text-caption">
          <span className="font-emphasis text-text-primary">{rule.code}</span>
          <span className="ml-auto shrink-0">
            <RuleStatusPill status={accepted ? 'will-accept' : 'will-resolve'} />
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {rule.accessIds.map((aid, idx) => {
            const a = getAccess(aid);
            if (!a) return null;
            const revoking = removedAccessIds.has(aid);
            return (
              <React.Fragment key={aid}>
                {idx > 0 && (
                  <span className="text-caption-strong text-text-tertiary">AND</span>
                )}
                <AccessChip access={a} danger={revoking} />
              </React.Fragment>
            );
          })}
        </div>

        {detail && actionLabel && (
          <div className="mt-2.5 rounded-md bg-subtle px-2.5 py-2.5">
            <div className="flex items-start gap-2">
              <span
                className={[
                  'mt-0.5 shrink-0',
                  detail.kind === 'removed'
                    ? 'text-[var(--ds-color-status-danger-fg)]'
                    : 'text-[var(--ds-color-status-warning-fg)]',
                ].join(' ')}
              >
                {detail.kind === 'removed' ? (
                  <DeleteOutline sx={{ fontSize: 16 }} />
                ) : (
                  <ShieldOutlined sx={{ fontSize: 16 }} />
                )}
              </span>
              <div className="min-w-0 flex-1 space-y-1.5">
                <p className="text-body-sm-strong leading-5 text-text-primary">{actionLabel}</p>
                {detail.justification.trim() && (
                  <p className="border-t border-border-subtle pt-1.5 text-caption leading-5 text-text-secondary">
                    {detail.justification}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const resolvedByRevoke = removedRules.length;
  const resolvedByAccept = acceptedRules.length;
  const resolutionMixTotal = resolvedByRevoke + resolvedByAccept;

  return (
    <div className="flex min-h-0 flex-1">
      {/* Plan — same action-column chrome as steps 1–2 */}
      <section className="flex min-h-0 min-w-0 flex-1 flex-col bg-subtle/40">
        {/* Titled strip matching steps 1–2, and the home for Edit: the action belongs
            beside the thing it edits. `shrink-0` keeps it above the scroll area, so it
            stays reachable no matter how long the plan runs. */}
        <div className="flex shrink-0 items-center justify-between gap-3 px-5 pb-4 pt-5">
          <h2 className="text-h5 text-text-primary">Preview</h2>
          <Button variant="secondary" startIcon={<EditOutlined />} onClick={onEdit}>
            Edit
          </Button>
        </div>

        <div className="ds-scroll min-h-0 flex-1 overflow-y-auto px-5 pb-6">
          {!allResolved && (
            <div
              role="status"
              className="mb-5 rounded-xl border border-[var(--ds-color-status-warning-border)] bg-[var(--ds-color-status-warning-subtle)] px-4 py-3 text-body-sm-strong text-[var(--ds-color-status-warning-fg)]"
            >
              {pendingRules.length} access combination{pendingRules.length === 1 ? '' : 's'} still
              pending. Go back to resolve {pendingRules.length === 1 ? 'it' : 'them'} before
              submitting.
            </div>
          )}

          <div className="mb-6">
            <h3 className="mb-3 text-overline uppercase text-text-tertiary">
              User access that will be revoked{' '}
              <span className="tabular-nums">({accessToRemove.length})</span>
            </h3>
            {accessToRemove.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border bg-surface px-4 py-8 text-center">
                <p className="text-body-sm-strong text-text-primary">No access will be removed</p>
                <p className="mt-1 text-caption text-text-secondary">
                  Remaining combinations are resolved by accepting risk.
                </p>
              </div>
            ) : (
              <ul className="space-y-2">
                {accessToRemove.map((a) => {
                  const n = rules.filter((r) => r.accessIds.includes(a.id)).length;
                  return (
                    <li
                      key={a.id}
                      className="flex items-center gap-3 rounded-lg border border-border bg-surface px-3 py-2.5"
                    >
                      <AppBadge app={a.appName} size={24} appearance="logo" />
                      {/* Beside the entitlement, so it reads as belonging to the name
                          rather than to the row — and outside the truncating span, so a
                          long name clips its own text instead of eating the icon. No
                          `insideControl` here: this row is an `li`, not a button, so the
                          trigger can stay focusable and keyboard-reachable. */}
                      <div className="flex min-w-0 flex-1 items-center gap-1.5 text-body-sm">
                        <span className="min-w-0 truncate">
                          <span className="text-text-tertiary">{a.appName}</span>{' '}
                          <span className="font-emphasis text-text-primary">{a.name}</span>
                        </span>
                        <AccessDetailsTip access={a} />
                        {/* Danger intent, matching how this access is marked everywhere
                            else on this step. The section heading carries the tense —
                            this is the plan, nothing is revoked until submit. */}
                        <span className="ml-1 shrink-0">
                          <StatusChip intent="danger" label="Revoked" />
                        </span>
                      </div>
                      {n > 0 && (
                        <div className="shrink-0 text-right text-caption text-text-tertiary">
                          Resolves {n} Access combination{n === 1 ? '' : 's'}
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <div>
            {removedRules.length > 0 && (
              <div className="mb-5">
                <h4 className="mb-3 text-overline uppercase text-text-tertiary">
                  Will resolve by revoking access{' '}
                  <span className="tabular-nums">({removedRules.length})</span>
                </h4>
                <div className="space-y-2">{removedRules.map(renderPreviewRuleCard)}</div>
              </div>
            )}

            {acceptedRules.length > 0 && (
              <div className="mb-5">
                <h4 className="mb-3 text-overline uppercase text-text-tertiary">
                  Will resolve by accepting risk{' '}
                  <span className="tabular-nums">({acceptedRules.length})</span>
                </h4>
                <div className="space-y-2">{acceptedRules.map(renderPreviewRuleCard)}</div>
              </div>
            )}

            {removedRules.length === 0 && acceptedRules.length === 0 && (
              <div className="rounded-xl border border-dashed border-border bg-surface px-4 py-8 text-center text-caption text-text-secondary">
                No access combinations are resolved yet.
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Summary — flat plan readout, no card chrome */}
      <aside className="flex w-[320px] shrink-0 flex-col border-l border-border bg-canvas">
        <div className="ds-scroll min-h-0 flex-1 overflow-y-auto px-5 py-5">
          <div className="space-y-6">
            <div>
              <h2 className="text-h5 text-text-primary">
                Resolution overview{' '}
                <span className="font-normal tabular-nums text-text-tertiary">
                  ({resolvedCount}/{rules.length})
                </span>
              </h2>
              <p className="mt-1 text-caption leading-5 text-text-secondary">
                {allResolved
                  ? 'Every violated access combination has a resolution, ready to submit.'
                  : `${pendingRules.length} combination${pendingRules.length === 1 ? '' : 's'} still need a decision.`}
              </p>
            </div>

            {accessToRemove.length > 0 && (
              <dl className="rounded-lg border border-border-subtle bg-surface px-3">
                <div className="flex items-baseline justify-between gap-3 py-3">
                  <dt className="min-w-0 text-body-sm text-text-secondary">Access to revoke</dt>
                  <dd className="text-body-strong tabular-nums text-text-primary">
                    {accessToRemove.length}
                  </dd>
                </div>
              </dl>
            )}

            {resolutionMixTotal > 0 && (
              <section
                className="rounded-lg border border-border-subtle bg-surface px-3 py-3"
                aria-label="Resolution mix"
              >
                <h3 className="text-body-sm-strong text-text-primary">
                  Resolution methods
                </h3>
                <div
                  className="mt-3 flex h-1 w-full gap-0.5 overflow-hidden rounded-pill bg-subtle"
                  role="img"
                  aria-label={`${resolvedByRevoke} resolved by revoking access, ${resolvedByAccept} resolved by accepting risk`}
                >
                  {resolvedByRevoke > 0 && (
                    <div
                      className="h-full rounded-pill transition-[width] duration-300 ease-out"
                      style={{
                        width: `${(resolvedByRevoke / resolutionMixTotal) * 100}%`,
                        background: 'var(--ds-color-status-success-fill)',
                      }}
                    />
                  )}
                  {resolvedByAccept > 0 && (
                    <div
                      className="h-full rounded-pill transition-[width] duration-300 ease-out"
                      style={{
                        width: `${(resolvedByAccept / resolutionMixTotal) * 100}%`,
                        background: 'var(--ds-color-status-danger-fill)',
                      }}
                    />
                  )}
                </div>

                <dl className="mt-3 divide-y divide-border-subtle">
                  {resolvedByRevoke > 0 && (
                    <div className="flex items-baseline justify-between gap-3 py-3">
                      <dt className="flex min-w-0 items-center gap-2 text-body-sm text-text-secondary">
                        <span
                          className="h-2 w-2 shrink-0 rounded-full bg-[var(--ds-color-status-success-fill)]"
                          aria-hidden
                        />
                        Will resolve by revoking access
                      </dt>
                      <dd className="text-body-strong tabular-nums text-text-primary">
                        {resolvedByRevoke}
                      </dd>
                    </div>
                  )}
                  {resolvedByAccept > 0 && (
                    <div className="flex items-baseline justify-between gap-3 py-3">
                      <dt className="flex min-w-0 items-center gap-2 text-body-sm text-text-secondary">
                        <span
                          className="h-2 w-2 shrink-0 rounded-full bg-[var(--ds-color-status-danger-fill)]"
                          aria-hidden
                        />
                        Will accept as risk
                      </dt>
                      <dd className="text-body-strong tabular-nums text-text-primary">
                        {resolvedByAccept}
                      </dd>
                    </div>
                  )}
                </dl>
              </section>
            )}

            {pendingRules.length > 0 && (
              <dl>
                <div className="flex items-baseline justify-between gap-3 border-b border-border-subtle py-3">
                  <dt className="min-w-0 text-body-sm text-text-secondary">Still pending</dt>
                  <dd className="text-body-strong tabular-nums text-text-primary">
                    {pendingRules.length}
                  </dd>
                </div>
              </dl>
            )}
          </div>
        </div>
      </aside>
    </div>
  );
}
