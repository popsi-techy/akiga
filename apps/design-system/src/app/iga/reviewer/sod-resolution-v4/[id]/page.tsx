'use client';

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import PolicyOutlined from '@mui/icons-material/PolicyOutlined';
import ShieldOutlined from '@mui/icons-material/ShieldOutlined';
import DeleteOutline from '@mui/icons-material/DeleteOutline';
import CheckCircleOutlined from '@mui/icons-material/CheckCircleOutlined';
import ScheduleOutlined from '@mui/icons-material/ScheduleOutlined';
import SearchOutlined from '@mui/icons-material/SearchOutlined';
import ArrowBackOutlined from '@mui/icons-material/ArrowBackOutlined';
import ChevronRightOutlined from '@mui/icons-material/ChevronRightOutlined';
import CloseIcon from '@mui/icons-material/Close';
import LightbulbOutlined from '@mui/icons-material/LightbulbOutlined';
import { Avatar, Button, Input, QuickFilter, Meter, RadioCardGroup, SelectableList, useToast } from '@ds/components';
import { getReview, getAccess, submitReview, clearedByRemoval } from '@/data/sod';
import { policyById } from '@/data/sod-seed';
import type { SodReview, SodAccess, SodRule } from '@/data/sod-types';
import { SeverityChip, AppBadge } from '@/components/product/sod/labels';
import { DueCountdown, RuleStatusPill, ruleAccessText, type RuleUiStatus } from '@/components/product/sod/resolution-ui';
import { RiskScoreChip } from '@/components/product/directory';
import { UserDetailsDrawer } from '@/components/product/sod/UserDetailsDrawer';

// V4 mirrors V3's rule-level, multi-action resolution model, but drives the whole
// workflow from a single "Start resolution" slider (chooser → drill-in action →
// back to chooser) instead of a bottom action bar + always-on panels.
const STORE_KEY = 'iga.sodResolutionV4.v1';
type RemoveAction = { kind: 'remove'; removedAccessIds: string[]; justification: string; at: string };
type AcceptAction = { kind: 'accept'; scope: 'all' | 'custom'; ruleIds: string[]; justification: string; days: number; at: string };
type V4Action = RemoveAction | AcceptAction;
type AcceptPerRule = Record<string, { justification: string; days: string }>;
const emptyAcceptDetail = (): { justification: string; days: string } => ({ justification: '', days: '90' });
const acceptDetailValid = (d?: { justification: string; days: string }) =>
  Boolean(d && d.justification.trim().length >= 10 && Number(d.days) > 0);

function loadActions(id: string): V4Action[] {
  if (typeof window === 'undefined') return [];
  try {
    const all = JSON.parse(localStorage.getItem(STORE_KEY) || '{}');
    return Array.isArray(all[id]) ? (all[id] as V4Action[]) : [];
  } catch {
    return [];
  }
}
function persistActions(id: string, actions: V4Action[]) {
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

type PanelMode = 'chooser' | 'remove' | 'accept';

export default function SodResolutionV4WorkspacePage() {
  const router = useRouter();
  const toast = useToast();
  const params = useParams<{ id: string }>();

  const [review, setReview] = React.useState<SodReview | null>(null);
  const [loaded, setLoaded] = React.useState(false);
  const [detailsOpen, setDetailsOpen] = React.useState(false);
  const [showPanel, setShowPanel] = React.useState(false);
  const [panelMode, setPanelMode] = React.useState<PanelMode>('chooser');
  const [removalSelection, setRemovalSelection] = React.useState<Set<string>>(new Set());
  const [acceptScope, setAcceptScope] = React.useState<'all' | 'custom'>('all');
  const [actions, setActions] = React.useState<V4Action[]>([]);
  const [search, setSearch] = React.useState('');
  const [ruleFilter, setRuleFilter] = React.useState<'pending' | 'will-resolve' | 'risk-accepted' | 'resolved' | null>(null);

  React.useEffect(() => {
    const r = getReview(params.id);
    if (r) {
      setReview(r);
      setActions(loadActions(r.id));
    }
    setLoaded(true);
  }, [params.id]);

  if (loaded && !review) {
    return (
      <div className="-mx-8 -my-6 grid h-[calc(100%+3rem)] place-items-center bg-subtle">
        <div className="text-center">
          <div className="text-h5 font-semibold text-text-primary">Violation not found</div>
          <div className="mt-4">
            <Button variant="secondary" onClick={() => router.push('/iga/reviewer/sod-resolution-v4')}>Back</Button>
          </div>
        </div>
      </div>
    );
  }
  if (!review) return <div className="-mx-8 -my-6 h-[calc(100%+3rem)] bg-subtle" />;

  const policy = policyById[review.policyIds[0]];
  const policyName = policy?.name ?? review.policyNames[0] ?? 'SoD Policy';
  const rules = review.rules.slice(0, 2);
  const accessList = Array.from(new Set(rules.flatMap((r) => r.accessIds)))
    .map(getAccess)
    .filter(Boolean) as SodAccess[];

  // ---- derived per-rule resolution -----------------------------------------
  const removedAccessIds = new Set(actions.flatMap((a) => (a.kind === 'remove' ? a.removedAccessIds : [])));
  const acceptCoversAll = actions.some((a) => a.kind === 'accept' && a.scope === 'all');
  const acceptedRuleIds = new Set(actions.flatMap((a) => (a.kind === 'accept' && a.scope === 'custom' ? a.ruleIds : [])));

  const ruleResolution = (rule: SodRule): 'removed' | 'accepted' | null => {
    if (clearedByRemoval(rule.accessIds, removedAccessIds)) return 'removed';
    if (acceptCoversAll || acceptedRuleIds.has(rule.id)) return 'accepted';
    return null;
  };
  // How a rule was resolved + the justification/duration given — for the rule card footer.
  const ruleDetail = (
    rule: SodRule,
  ):
    | { kind: 'removed'; names: string[]; justification: string }
    | { kind: 'accepted'; days: number; justification: string }
    | null => {
    if (clearedByRemoval(rule.accessIds, removedAccessIds)) {
      const rem = actions.find((a) => a.kind === 'remove' && a.removedAccessIds.some((id) => rule.accessIds.includes(id)));
      const names = rule.accessIds
        .filter((id) => removedAccessIds.has(id))
        .map((id) => getAccess(id)?.name)
        .filter(Boolean) as string[];
      return { kind: 'removed', names, justification: rem?.kind === 'remove' ? rem.justification : '' };
    }
    const acc = actions.find((a) => a.kind === 'accept' && (a.scope === 'all' || a.ruleIds.includes(rule.id)));
    if (acc?.kind === 'accept') return { kind: 'accepted', days: acc.days, justification: acc.justification };
    return null;
  };
  const resolvedCount = rules.filter((r) => ruleResolution(r) !== null).length;
  const allResolved = resolvedCount === rules.length;
  const hasActions = actions.length > 0;
  const pendingRules = rules.filter((r) => ruleResolution(r) === null);
  const removableAccess = accessList.filter((a) => !removedAccessIds.has(a.id));

  // ---- slider navigation ----------------------------------------------------
  const openPanel = () => {
    setPanelMode('chooser');
    setShowPanel(true);
  };
  const closePanel = () => {
    setShowPanel(false);
    setPanelMode('chooser');
    setRemovalSelection(new Set());
  };
  const backToChooser = () => {
    setPanelMode('chooser');
    setRemovalSelection(new Set());
  };
  const goRemove = () => {
    setRemovalSelection(new Set());
    setPanelMode('remove');
  };
  const goAccept = () => {
    setAcceptScope('all');
    setPanelMode('accept');
  };

  const toggleRemoval = (id: string) =>
    setRemovalSelection((s) => {
      const n = new Set(s);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });

  const commit = (next: V4Action[]) => {
    setActions(next);
    persistActions(review.id, next);
  };
  const applyRemove = (ids: string[], justification: string) => {
    commit([...actions, { kind: 'remove', removedAccessIds: ids, justification, at: new Date().toISOString() }]);
    backToChooser();
  };
  const applyAccept = (next: AcceptAction[]) => {
    commit([...actions, ...next]);
    backToChooser();
  };
  const resetResolution = () => {
    commit([]);
    backToChooser();
  };
  const submit = () => {
    if (!allResolved) return;
    const justification = actions.map((a) => a.justification).filter(Boolean).join(' ');
    submitReview(review.id, justification);
    toast.success('Resolution submitted');
    router.push('/iga/reviewer/sod-resolution-v4');
  };

  // Which rules the currently-open drill-in's staged selection would resolve.
  const isStaged = (rule: SodRule): boolean => {
    if (ruleResolution(rule) !== null || !showPanel) return false;
    if (panelMode === 'remove') {
      const trial = new Set([...removedAccessIds, ...removalSelection]);
      return clearedByRemoval(rule.accessIds, trial);
    }
    if (panelMode === 'accept') return true;
    return false;
  };

  const ruleUiStatus = (rule: SodRule): RuleUiStatus => {
    const res = ruleResolution(rule);
    if (res === 'accepted') return 'risk-accepted';
    if (res === 'removed') return 'resolved';
    if (isStaged(rule)) return panelMode === 'accept' ? 'risk-accepted' : 'will-resolve';
    return 'pending';
  };

  const statusCounts = {
    pending: rules.filter((r) => ruleUiStatus(r) === 'pending').length,
    'will-resolve': rules.filter((r) => ruleUiStatus(r) === 'will-resolve').length,
    'risk-accepted': rules.filter((r) => ruleUiStatus(r) === 'risk-accepted').length,
    resolved: rules.filter((r) => ruleUiStatus(r) === 'resolved').length,
  };
  const filterOptions = [
    ...(statusCounts.pending > 0 ? [{ value: 'pending' as const, label: 'Pending', count: statusCounts.pending }] : []),
    ...(statusCounts['will-resolve'] > 0 ? [{ value: 'will-resolve' as const, label: 'Will resolve', count: statusCounts['will-resolve'] }] : []),
    ...(statusCounts['risk-accepted'] > 0 ? [{ value: 'risk-accepted' as const, label: 'Risk accepted', count: statusCounts['risk-accepted'] }] : []),
    ...(statusCounts.resolved > 0 ? [{ value: 'resolved' as const, label: 'Resolved', count: statusCounts.resolved }] : []),
  ];
  // Selected filter, or null (= show all). Falls back to null if its chip disappears.
  const activeFilter = ruleFilter && filterOptions.some((o) => o.value === ruleFilter) ? ruleFilter : null;

  const q = search.trim().toLowerCase();
  const matchesSearch = (r: SodRule) =>
    !q || r.code.toLowerCase().includes(q) || r.label.toLowerCase().includes(q) || ruleAccessText(r).toLowerCase().includes(q);
  const visibleRules = rules.filter((r) => matchesSearch(r) && (activeFilter === null || ruleUiStatus(r) === activeFilter));

  const startLabel = allResolved ? 'Review & submit' : hasActions ? 'Continue resolution' : 'Start resolution';

  return (
    <div className="-mx-8 -my-6 flex h-[calc(100%+3rem)] flex-col bg-canvas">
      {/* header — same cluster as V3 */}
      <div className="flex shrink-0 items-center justify-between gap-4 border-b border-border bg-canvas px-5 py-3">
        <div className="flex min-w-0 items-center gap-3">
          <Avatar name={review.userName} initials={review.userName.trim().charAt(0).toUpperCase()} size="sm" />
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="truncate text-h5 font-semibold text-text-primary">{review.userName}</span>
              <SeverityChip severity={review.severity} score={review.riskScore} />
            </div>
            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-caption text-text-secondary">
              <span className="min-w-0 truncate" title={[review.userEmail, review.userTitle, review.userDepartment].filter(Boolean).join(' · ')}>
                {review.userEmail}
                {review.userTitle ? ` · ${review.userTitle}` : ''}
                {review.userDepartment ? ` · ${review.userDepartment}` : ''}
              </span>
              <button type="button" onClick={() => setDetailsOpen(true)} className="shrink-0 font-medium text-text-link hover:underline">
                View more users details
              </button>
            </div>
          </div>
        </div>
        <DueCountdown dueDate={review.dueDate} assignedAt={review.assignedAt} />
      </div>

      <div className="flex min-h-0 flex-1">
        {/* main workspace */}
        <section className="flex min-h-0 min-w-0 flex-1 flex-col">
          <div className="shrink-0 px-4 pb-2 pt-3">
            <h2 className="text-body-sm font-semibold text-text-primary">Violated Policy</h2>
          </div>
          <div className="ds-scroll min-h-0 flex-1 overflow-y-auto px-4 pb-4">
            <div className="overflow-hidden rounded-xl border border-border bg-surface">
              {/* policy header */}
              <div className="flex items-center gap-3 border-b border-border bg-subtle px-4 py-4">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-surface text-icon">
                  <PolicyOutlined sx={{ fontSize: 22 }} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-h5 font-semibold text-text-primary">{policyName}</h2>
                    <RiskScoreChip score={review.riskScore} />
                  </div>
                  {policy?.description && <p className="mt-1 truncate text-body-sm leading-5 text-text-secondary">{policy.description}</p>}
                </div>
              </div>

              {/* rules toolbar — search + quick filters + Start resolution */}
              <div className="space-y-3 px-4 py-4">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="w-[220px] shrink-0">
                    <Input
                      size="sm"
                      placeholder="Search access combinations…"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      startAdornment={<SearchOutlined sx={{ fontSize: 18 }} />}
                    />
                  </div>
                  {filterOptions.length > 0 && (
                    <QuickFilter
                      size="sm"
                      ariaLabel="Filter violated access combinations by status"
                      value={activeFilter}
                      onChange={setRuleFilter}
                      options={filterOptions}
                    />
                  )}
                  <Button className="ml-auto" onClick={openPanel}>{startLabel}</Button>
                </div>

                {/* rule list */}
                {visibleRules.length === 0 ? (
                  <p className="py-6 text-center text-caption text-text-secondary">No access combinations match your search or filter.</p>
                ) : (
                  visibleRules.map((rule) => {
                    const status = ruleUiStatus(rule);
                    const border =
                      status === 'will-resolve' || status === 'resolved'
                        ? 'border-[var(--ds-color-status-success-border)]'
                        : status === 'risk-accepted'
                          ? 'border-[var(--ds-color-status-danger-border)]'
                          : 'border-border';
                    return (
                      <div key={rule.id} className={['rounded-lg border bg-surface p-3', border].join(' ')}>
                        <div className="mb-2 flex items-center gap-2 text-caption">
                          <span className="font-semibold text-text-primary">{rule.code}</span>
                          <span className="ml-auto shrink-0">
                            <RuleStatusPill status={status} />
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-1.5">
                          {rule.accessIds.map((aid, idx) => {
                            const a = getAccess(aid);
                            if (!a) return null;
                            const removed = removedAccessIds.has(aid);
                            const stagingRemoval = showPanel && panelMode === 'remove' && removalSelection.has(aid);
                            const danger = removed || stagingRemoval;
                            return (
                              <React.Fragment key={aid}>
                                {idx > 0 && <span className="text-caption font-semibold text-text-tertiary">AND</span>}
                                <span className={['inline-flex items-center gap-1.5 rounded-md border bg-subtle py-1 pl-1 pr-2 text-caption', danger ? 'border-[var(--ds-color-status-danger-fg)]' : 'border-border'].join(' ')}>
                                  <AppBadge app={a.appName} size={16} variant="surface" />
                                  <span className="text-text-tertiary">{a.appName}</span>
                                  <span className="font-medium text-text-primary">{a.name}</span>
                                </span>
                              </React.Fragment>
                            );
                          })}
                        </div>
                        {(status === 'resolved' || status === 'risk-accepted') && (() => {
                          const detail = ruleDetail(rule);
                          if (!detail) return null;
                          return (
                            <div className="mt-2.5 space-y-1.5 rounded-md bg-subtle px-2.5 py-2.5">
                              <div className="text-caption font-semibold uppercase tracking-[0.04em] text-text-tertiary">Resolution reason</div>
                              <div className="flex items-start gap-1.5 text-caption font-medium text-text-primary">
                                {detail.kind === 'removed' ? (
                                  <>
                                    <DeleteOutline sx={{ fontSize: 15 }} className="mt-px shrink-0 text-[var(--ds-color-status-danger-fg)]" />
                                    <span>
                                      {detail.names.length === 1
                                        ? `${detail.names[0]} was removed`
                                        : `${detail.names.join(', ')} were removed`}
                                    </span>
                                  </>
                                ) : (
                                  <>
                                    <ShieldOutlined sx={{ fontSize: 15 }} className="mt-px shrink-0 text-[var(--ds-color-status-danger-fg)]" />
                                    <span>
                                      Risk accepted for {detail.days} day{detail.days === 1 ? '' : 's'}
                                    </span>
                                  </>
                                )}
                              </div>
                              <p className="text-caption leading-5 text-text-secondary">{detail.justification}</p>
                            </div>
                          );
                        })()}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Resolution slider — one surface: chooser hub ↔ drill-in actions */}
        <div className={['shrink-0 overflow-hidden transition-[width] duration-300 ease-out', showPanel ? 'w-[380px] border-l border-border' : 'w-0'].join(' ')}>
          <section className="flex h-full w-[380px] flex-col bg-subtle/40">
            {panelMode === 'chooser' && (
              <ChooserPanel
                resolvedCount={resolvedCount}
                total={rules.length}
                allResolved={allResolved}
                hasActions={hasActions}
                hasPending={pendingRules.length > 0}
                onClose={closePanel}
                onRemove={goRemove}
                onAccept={goAccept}
                onReset={resetResolution}
                onSubmit={submit}
              />
            )}
            {panelMode === 'remove' && (
              <RemoveAccessPanel
                accessList={removableAccess}
                selected={removalSelection}
                onToggle={toggleRemoval}
                ruleCountFor={(id) => pendingRules.filter((r) => r.accessIds.includes(id)).length}
                onBack={backToChooser}
                onSave={applyRemove}
              />
            )}
            {panelMode === 'accept' && (
              <AcceptRiskPanel
                scope={acceptScope}
                onScope={setAcceptScope}
                pendingRules={pendingRules}
                onBack={backToChooser}
                onSave={applyAccept}
              />
            )}
          </section>
        </div>
      </div>

      <UserDetailsDrawer open={detailsOpen} onClose={() => setDetailsOpen(false)} review={review} />
    </div>
  );
}

/** The slider "hub": progress, the two resolution actions, and a note. Drill-in
    panels return here so a reviewer can mix actions. Per-rule resolution detail
    lives on the rule cards, not here. */
function ChooserPanel({
  resolvedCount,
  total,
  allResolved,
  hasActions,
  hasPending,
  onClose,
  onRemove,
  onAccept,
  onReset,
  onSubmit,
}: {
  resolvedCount: number;
  total: number;
  allResolved: boolean;
  hasActions: boolean;
  hasPending: boolean;
  onClose: () => void;
  onRemove: () => void;
  onAccept: () => void;
  onReset: () => void;
  onSubmit: () => void;
}) {
  const options = [
    { icon: <DeleteOutline sx={{ fontSize: 18 }} />, title: 'Remove access to resolve', desc: 'Remove conflicting access to break access combinations', onClick: onRemove, tone: 'danger' as const },
    { icon: <ShieldOutlined sx={{ fontSize: 18 }} />, title: 'Accept risk', desc: 'Accept all remaining access combinations or a custom subset', onClick: onAccept, tone: 'brand' as const },
  ];

  return (
    <>
      <div className="flex shrink-0 items-center gap-2 px-4 pb-2 pt-3">
        <h2 className="text-body-sm font-semibold text-text-primary">Start resolution</h2>
        <button type="button" onClick={onClose} aria-label="Close" className="ml-auto grid h-7 w-7 place-items-center rounded-md text-icon hover:bg-surface-hover hover:text-text-primary">
          <CloseIcon sx={{ fontSize: 18 }} />
        </button>
      </div>

      <div className="ds-scroll min-h-0 flex-1 space-y-4 overflow-y-auto px-4 pb-4">
        {/* progress */}
        <div className="rounded-lg border border-border bg-surface px-3 py-3">
          <div className="mb-2 flex items-center justify-between gap-2">
            <span className={['inline-flex items-center gap-1.5 text-caption font-medium', allResolved ? 'text-[var(--ds-color-status-success-fg)]' : 'text-text-secondary'].join(' ')}>
              {allResolved ? <CheckCircleOutlined sx={{ fontSize: 15 }} /> : <ScheduleOutlined sx={{ fontSize: 15 }} />}
              {allResolved ? 'All access combinations resolved' : `${resolvedCount} of ${total} access combinations resolved`}
            </span>
            {hasActions && (
              <button type="button" onClick={onReset} className="text-caption font-medium text-text-secondary hover:text-text-primary hover:underline">
                Reset
              </button>
            )}
          </div>
          <Meter tone="success" value={resolvedCount} max={total} size="sm" />
        </div>

        {/* actions */}
        {hasPending ? (
          <div className="space-y-2">
            <div className="px-0.5 text-caption font-semibold uppercase tracking-[0.06em] text-text-tertiary">Choose an action</div>
            {options.map((opt) => (
              <button
                key={opt.title}
                type="button"
                onClick={opt.onClick}
                className="flex w-full items-center gap-3 rounded-lg border border-border bg-surface px-3 py-2.5 text-left transition-colors hover:border-border-strong hover:shadow-sm"
              >
                <span className={['grid h-8 w-8 shrink-0 place-items-center rounded-md', opt.tone === 'danger' ? 'bg-[var(--ds-color-status-danger-subtle)] text-[var(--ds-color-status-danger-fg)]' : 'bg-brand-subtle text-icon-brand'].join(' ')}>
                  {opt.icon}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-body-sm font-medium text-text-primary">{opt.title}</span>
                  <span className="block truncate text-caption text-text-secondary">{opt.desc}</span>
                </span>
                <ChevronRightOutlined sx={{ fontSize: 18 }} className="shrink-0 text-icon" />
              </button>
            ))}
            {/* note: actions can be combined */}
            <div className="flex items-start gap-2 rounded-md bg-[var(--ds-color-status-info-subtle)] px-2.5 py-2 text-caption text-[var(--ds-color-status-info-fg)]">
              <LightbulbOutlined sx={{ fontSize: 15 }} className="mt-0.5 shrink-0" />
              <span>You can combine actions — remove some access and accept risk on the rest. Each access combination needs one resolution.</span>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-border py-6 text-center">
            <span className="grid h-10 w-10 place-items-center rounded-full bg-[var(--ds-color-status-success-subtle)] text-[var(--ds-color-status-success-fg)]">
              <CheckCircleOutlined sx={{ fontSize: 22 }} />
            </span>
            <div className="text-body-sm font-medium text-text-primary">Every access combination resolved</div>
            <p className="max-w-[240px] text-caption text-text-secondary">Each access combination shows how it was resolved. Submit when ready.</p>
          </div>
        )}
      </div>

      <div className="shrink-0 border-t border-border p-4">
        <Button fullWidth disabled={!allResolved} onClick={onSubmit}>Submit resolution</Button>
      </div>
    </>
  );
}

/** Drill-in slider header with a back arrow returning to the chooser. */
function PanelHeader({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <div className="flex shrink-0 items-center gap-1.5 px-3 pb-2 pt-3">
      <button type="button" onClick={onBack} aria-label="Back" className="grid h-7 w-7 place-items-center rounded-md text-icon hover:bg-surface-hover hover:text-text-primary">
        <ArrowBackOutlined sx={{ fontSize: 18 }} />
      </button>
      <h2 className="text-body-sm font-semibold text-text-primary">{title}</h2>
    </div>
  );
}

/** Drill-in: pick the access to remove + mandatory justification. */
function RemoveAccessPanel({
  accessList,
  selected,
  onToggle,
  ruleCountFor,
  onBack,
  onSave,
}: {
  accessList: SodAccess[];
  selected: Set<string>;
  onToggle: (id: string) => void;
  ruleCountFor: (id: string) => number;
  onBack: () => void;
  onSave: (ids: string[], justification: string) => void;
}) {
  const [justification, setJustification] = React.useState('');
  const valid = selected.size > 0 && justification.trim().length >= 10;

  return (
    <>
      <PanelHeader title="Remove access to resolve" onBack={onBack} />
      <div className="ds-scroll min-h-0 flex-1 overflow-y-auto px-4 pb-4">
        <SelectableList
          ariaLabel="Access to remove"
          tone="danger"
          selected={selected}
          onToggle={onToggle}
          emptyMessage="No removable access remaining."
          items={accessList.map((a) => {
            const n = ruleCountFor(a.id);
            return {
              id: a.id,
              leading: <AppBadge app={a.appName} size={24} />,
              label: (
                <>
                  <span className="text-text-tertiary">{a.appName}</span> <span className="font-medium text-text-primary">{a.name}</span>
                </>
              ),
              trailing: n > 0 ? (
                <span className="shrink-0 rounded-pill bg-subtle px-1.5 py-0.5 text-caption font-semibold text-text-secondary" title={`Affects ${n} access combination${n === 1 ? '' : 's'}`}>×{n}</span>
              ) : undefined,
            };
          })}
        />
      </div>
      <div className="shrink-0 space-y-3 border-t border-border p-4">
        <Input
          aria-label="Justification"
          size="sm"
          multiline
          minRows={2}
          placeholder="Why is removing this access the right resolution? (min. 10 characters)"
          value={justification}
          onChange={(e) => setJustification(e.target.value)}
        />
        <div className="flex items-center justify-end gap-2">
          <Button variant="secondary" onClick={onBack}>Back</Button>
          <Button disabled={!valid} onClick={() => valid && onSave([...selected], justification.trim())}>Save</Button>
        </div>
      </div>
    </>
  );
}

/** Drill-in: choose scope (all remaining rules or a custom subset) via two radio
    options, then justification + duration in the fixed footer (no labels). */
function AcceptRiskPanel({
  scope,
  onScope,
  pendingRules,
  onBack,
  onSave,
}: {
  scope: 'all' | 'custom';
  onScope: (s: 'all' | 'custom') => void;
  pendingRules: SodRule[];
  onBack: () => void;
  onSave: (actions: AcceptAction[]) => void;
}) {
  const [justification, setJustification] = React.useState('');
  const [days, setDays] = React.useState('90');
  const [perRule, setPerRule] = React.useState<AcceptPerRule>({});
  const pendingLabel = `${pendingRules.length} pending access combination${pendingRules.length === 1 ? '' : 's'}`;

  const setMode = (next: 'all' | 'custom') => {
    onScope(next);
    if (next === 'custom') {
      setPerRule((prev) => {
        const seeded: AcceptPerRule = { ...prev };
        for (const rule of pendingRules) {
          if (!seeded[rule.id]) seeded[rule.id] = emptyAcceptDetail();
        }
        return seeded;
      });
    }
  };
  const updatePerRule = (id: string, patch: Partial<{ justification: string; days: string }>) =>
    setPerRule((prev) => ({
      ...prev,
      [id]: { ...(prev[id] ?? emptyAcceptDetail()), ...patch },
    }));

  const daysNum = Number(days);
  const valid =
    pendingRules.length > 0 &&
    (scope === 'all'
      ? justification.trim().length >= 10 && daysNum > 0
      : pendingRules.every((r) => acceptDetailValid(perRule[r.id])));

  const save = () => {
    if (!valid) return;
    const at = new Date().toISOString();
    if (scope === 'all') {
      onSave([
        {
          kind: 'accept',
          scope: 'all',
          ruleIds: [],
          justification: justification.trim(),
          days: Math.floor(daysNum),
          at,
        },
      ]);
      return;
    }
    onSave(
      pendingRules.map((rule) => {
        const detail = perRule[rule.id] ?? emptyAcceptDetail();
        return {
          kind: 'accept' as const,
          scope: 'custom' as const,
          ruleIds: [rule.id],
          justification: detail.justification.trim(),
          days: Math.floor(Number(detail.days)),
          at,
        };
      }),
    );
  };

  return (
    <>
      <PanelHeader title="Accept risk" onBack={onBack} />
      <div className="ds-scroll min-h-0 flex-1 overflow-y-auto px-4 pb-4">
        {pendingRules.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border px-4 py-10 text-center">
            <span className="grid h-11 w-11 place-items-center rounded-full bg-[var(--ds-color-status-success-subtle)] text-[var(--ds-color-status-success-fg)]">
              <CheckCircleOutlined sx={{ fontSize: 24 }} />
            </span>
            <div className="text-body font-semibold text-text-primary">No access combinations left to accept</div>
            <p className="text-body-sm text-text-secondary">Every access combination is already resolved. Go back to review and submit.</p>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-caption text-text-secondary">
              Accept risk for {pendingLabel} that remain after removals.
            </p>

            <div>
              <div className="mb-2 px-0.5 text-caption font-semibold uppercase tracking-[0.06em] text-text-tertiary">
                Justification & timeline
              </div>
              <RadioCardGroup
                ariaLabel="Justification mode"
                value={scope}
                onChange={(v) => setMode(v as 'all' | 'custom')}
                options={[
                  {
                    value: 'all',
                    label: 'Same for all',
                    description: 'One justification and duration apply to every pending combination',
                  },
                  {
                    value: 'custom',
                    label: 'Custom per combination',
                    description: 'Provide a separate justification and duration for each',
                  },
                ]}
              />
            </div>

            {scope === 'all' && (
              <div className="space-y-2">
                <div className="px-0.5 text-caption font-semibold uppercase tracking-[0.06em] text-text-tertiary">
                  Applies to
                </div>
                <ul className="space-y-2">
                  {pendingRules.map((rule) => (
                    <li
                      key={rule.id}
                      className="rounded-lg border border-border bg-surface px-3 py-2 text-body-sm font-semibold text-text-primary"
                    >
                      {rule.code}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {scope === 'custom' && (
              <div className="space-y-2">
                <div className="px-0.5 text-caption font-semibold uppercase tracking-[0.06em] text-text-tertiary">
                  Per access combination
                </div>
                {pendingRules.map((rule) => {
                  const detail = perRule[rule.id] ?? emptyAcceptDetail();
                  return (
                    <div key={rule.id} className="rounded-lg border border-border bg-surface">
                      <div className="border-b border-border px-3 py-2">
                        <div className="text-body-sm font-semibold text-text-primary">{rule.code}</div>
                      </div>
                      <div className="space-y-2 px-3 py-3">
                        <Input
                          aria-label={`Justification for ${rule.code}`}
                          size="sm"
                          multiline
                          minRows={2}
                          placeholder="Why is this risk acceptable? (min. 10 characters)"
                          value={detail.justification}
                          onChange={(e) => updatePerRule(rule.id, { justification: e.target.value })}
                        />
                        <Input
                          aria-label={`Duration in days for ${rule.code}`}
                          type="number"
                          size="sm"
                          placeholder="Duration"
                          value={detail.days}
                          onChange={(e) => updatePerRule(rule.id, { days: e.target.value })}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
      <div className="shrink-0 space-y-2.5 border-t border-border p-4">
        {pendingRules.length > 0 && scope === 'all' && (
          <>
            <Input
              aria-label="Justification"
              size="sm"
              multiline
              minRows={2}
              placeholder="Why is this risk acceptable for this user? (min. 10 characters)"
              value={justification}
              onChange={(e) => setJustification(e.target.value)}
            />
            <Input
              aria-label="Risk acceptance duration"
              type="number"
              size="sm"
              placeholder="Duration"
              value={days}
              onChange={(e) => setDays(e.target.value)}
            />
          </>
        )}
        <div className="flex items-center justify-end gap-2">
          <Button variant="secondary" onClick={onBack}>Back</Button>
          <Button disabled={!valid} onClick={save}>Save</Button>
        </div>
      </div>
    </>
  );
}
