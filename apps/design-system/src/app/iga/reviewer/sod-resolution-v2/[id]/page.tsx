'use client';

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import SearchOutlined from '@mui/icons-material/SearchOutlined';
import ShieldOutlined from '@mui/icons-material/ShieldOutlined';
import BadgeOutlined from '@mui/icons-material/BadgeOutlined';
import VpnKeyOutlined from '@mui/icons-material/VpnKeyOutlined';
import WarningAmberOutlined from '@mui/icons-material/WarningAmberOutlined';
import DeleteOutline from '@mui/icons-material/DeleteOutline';
import CheckCircleOutlined from '@mui/icons-material/CheckCircleOutlined';
import ChevronRightOutlined from '@mui/icons-material/ChevronRightOutlined';
import UndoOutlined from '@mui/icons-material/UndoOutlined';
import RedoOutlined from '@mui/icons-material/RedoOutlined';
import { Avatar, Button, Input, Meter, Drawer, StatusChip, useToast } from '@ds/components';
import { getReview, getAccess, saveReviewState, submitReview } from '@/data/sod';
import type { SodReview, SodAccess, AccessType } from '@/data/sod-types';
import { SeverityChip, AppBadge, ACCESS_TYPE_LABEL, formatDateTime } from '@/components/product/sod/labels';
import { RiskScoreChip } from '@/components/product/directory';
import { UserDetailsDrawer } from '@/components/product/sod/UserDetailsDrawer';

const accessIcon = (t: AccessType, size = 16) =>
  t === 'technicalRole' ? <ShieldOutlined sx={{ fontSize: size }} /> : t === 'businessRole' ? <BadgeOutlined sx={{ fontSize: size }} /> : <VpnKeyOutlined sx={{ fontSize: size }} />;

/** Undo/redo snapshot of the per-access decisions. */
type Snap = { removed: string[]; kept: string[] };

export default function ResolutionWorkspaceV2Page() {
  const router = useRouter();
  const toast = useToast();
  const params = useParams<{ id: string }>();

  const [review, setReview] = React.useState<SodReview | null>(null);
  const [loaded, setLoaded] = React.useState(false);
  const [removed, setRemoved] = React.useState<Set<string>>(new Set());
  const [kept, setKept] = React.useState<Set<string>>(new Set());
  const [history, setHistory] = React.useState<{ past: Snap[]; future: Snap[] }>({ past: [], future: [] });
  const [search, setSearch] = React.useState('');
  const [rulesFor, setRulesFor] = React.useState<SodAccess | null>(null);
  const [detailsOpen, setDetailsOpen] = React.useState(false);
  const firstRun = React.useRef(true);

  React.useEffect(() => {
    const r = getReview(params.id);
    if (r) {
      setReview(r);
      setRemoved(new Set(r.removedAccessIds));
      setKept(new Set(r.keptAccessIds ?? []));
    }
    setLoaded(true);
  }, [params.id]);

  // autosave decisions
  React.useEffect(() => {
    if (!review || firstRun.current) {
      firstRun.current = false;
      return;
    }
    saveReviewState(review.id, { removedAccessIds: [...removed], keptAccessIds: [...kept] });
  }, [removed, kept, review]);

  if (loaded && !review) {
    return (
      <div className="-mx-8 -my-6 grid h-[calc(100%+3rem)] place-items-center bg-subtle">
        <div className="text-center">
          <div className="text-h5 font-semibold text-text-primary">Review not found</div>
          <div className="mt-4">
            <Button variant="secondary" onClick={() => router.push('/iga/reviewer/sod-resolution-v2')}>Back to My Reviews</Button>
          </div>
        </div>
      </div>
    );
  }
  if (!review) return <div className="-mx-8 -my-6 h-[calc(100%+3rem)] bg-subtle" />;

  // Undo/redo — snapshot the decision sets before each change, mirroring V1.
  const snapshot = () => setHistory((h) => ({ past: [...h.past, { removed: [...removed], kept: [...kept] }].slice(-50), future: [] }));
  const canUndo = history.past.length > 0;
  const canRedo = history.future.length > 0;
  const undo = () => {
    if (!canUndo) return;
    const prev = history.past[history.past.length - 1];
    setHistory((h) => ({ past: h.past.slice(0, -1), future: [{ removed: [...removed], kept: [...kept] }, ...h.future].slice(0, 50) }));
    setRemoved(new Set(prev.removed));
    setKept(new Set(prev.kept));
  };
  const redo = () => {
    if (!canRedo) return;
    const next = history.future[0];
    setHistory((h) => ({ past: [...h.past, { removed: [...removed], kept: [...kept] }].slice(-50), future: h.future.slice(1) }));
    setRemoved(new Set(next.removed));
    setKept(new Set(next.kept));
  };

  const decide = (accessId: string, as: 'removed' | 'kept') => {
    snapshot();
    setRemoved((s) => {
      const n = new Set(s);
      as === 'removed' ? n.add(accessId) : n.delete(accessId);
      return n;
    });
    setKept((s) => {
      const n = new Set(s);
      as === 'kept' ? n.add(accessId) : n.delete(accessId);
      return n;
    });
  };
  const undecide = (accessId: string) => {
    snapshot();
    setRemoved((s) => {
      const n = new Set(s);
      n.delete(accessId);
      return n;
    });
    setKept((s) => {
      const n = new Set(s);
      n.delete(accessId);
      return n;
    });
  };

  const accessList = review.accessHeldIds.map(getAccess).filter(Boolean) as SodAccess[];
  const isDecided = (a: SodAccess) => removed.has(a.id) || kept.has(a.id);
  const rulesOf = (a: SodAccess) => review.rules.filter((r) => r.accessIds.includes(a.id));
  // AND-combination clears only when at most one of its accesses remains.
  const ruleResolved = (rule: SodReview['rules'][number]) => {
    const remaining = rule.accessIds.filter((id) => !removed.has(id)).length;
    return remaining <= 1;
  };
  const activeRulesOf = (a: SodAccess) => rulesOf(a).filter((r) => !ruleResolved(r));
  const policyName = (pid: string) => review.policyNames[review.policyIds.indexOf(pid)] ?? review.policyNames[0] ?? 'SoD Policy';

  const total = accessList.length;
  const doneCount = accessList.filter(isDecided).length;
  const pct = total ? Math.round((doneCount / total) * 100) : 100;
  const pendingCount = total - doneCount;

  // Left column: undecided access, grouped by app (entitlements) + role categories.
  const q = search.trim().toLowerCase();
  const matches = (a: SodAccess) => a.name.toLowerCase().includes(q) || (a.detail ?? '').toLowerCase().includes(q) || a.appName.toLowerCase().includes(q);
  const pending = accessList.filter((a) => !isDecided(a) && matches(a));
  const ents = pending.filter((a) => a.type === 'entitlement');
  const appNames = Array.from(new Set(ents.map((a) => a.appName)));
  const groups: { key: string; label: string; kind: 'app' | 'businessRole' | 'technicalRole'; items: SodAccess[] }[] = [
    ...appNames.map((app) => ({ key: `app:${app}`, label: app, kind: 'app' as const, items: ents.filter((a) => a.appName === app) })),
    { key: 'biz', label: 'Business Roles', kind: 'businessRole' as const, items: pending.filter((a) => a.type === 'businessRole') },
    { key: 'tech', label: 'Technical Roles', kind: 'technicalRole' as const, items: pending.filter((a) => a.type === 'technicalRole') },
  ].filter((g) => g.items.length > 0);

  const actioned = accessList.filter(isDecided);

  const submit = () => {
    submitReview(review.id, review.overallJustification || 'Access reviewed — decisions recorded per entitlement.');
    toast.success('Review submitted');
    router.push('/iga/reviewer/sod-resolution-v2');
  };

  return (
    <div className="-mx-8 -my-6 flex h-[calc(100%+3rem)] flex-col bg-canvas">
      {/* header */}
      <div className="flex shrink-0 items-center justify-between gap-4 border-b border-border bg-canvas px-5 py-3">
        <div className="flex min-w-0 items-center gap-3">
          <Avatar name={review.userName} initials={review.userName.trim().charAt(0).toUpperCase()} size="sm" />
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="truncate text-h5 font-semibold text-text-primary">{review.userName}</span>
              <SeverityChip severity={review.severity} score={review.riskScore} />
            </div>
            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-caption text-text-secondary">
              <span className="truncate">{review.policyNames.join(' · ')} · Due {formatDateTime(review.dueDate)}</span>
              <button type="button" onClick={() => setDetailsOpen(true)} className="shrink-0 font-medium text-text-link hover:underline">
                View full details
              </button>
            </div>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Button variant="secondary" onClick={() => { saveReviewState(review.id, { removedAccessIds: [...removed], keptAccessIds: [...kept] }); toast.success('Draft saved'); }}>
            Save draft
          </Button>
          <Button disabled={pendingCount > 0} title={pendingCount > 0 ? `${pendingCount} still pending` : undefined} onClick={submit}>
            Preview &amp; Submit
          </Button>
        </div>
      </div>

      {/* board: two columns (Needs Decision removed in V2) */}
      <div className="grid min-h-0 flex-1 grid-cols-[minmax(360px,1.5fr)_minmax(300px,1fr)] divide-x divide-border">
        {/* Access under review */}
        <section className="flex min-h-0 flex-col">
          <div className="shrink-0 px-4 pb-2 pt-3">
            <div className="flex items-center gap-2">
              <div className="flex items-baseline gap-2">
                <h2 className="text-body-sm font-semibold text-text-primary">Access Under Review</h2>
                <span className="text-caption text-text-tertiary">{pendingCount}</span>
              </div>
              <div className="ml-auto flex items-center gap-0.5">
                <button
                  type="button"
                  onClick={undo}
                  disabled={!canUndo}
                  aria-label="Undo"
                  title="Undo"
                  className="grid h-7 w-7 place-items-center rounded-md text-icon transition-colors hover:bg-surface-hover hover:text-text-primary disabled:pointer-events-none disabled:opacity-35"
                >
                  <UndoOutlined sx={{ fontSize: 17 }} />
                </button>
                <button
                  type="button"
                  onClick={redo}
                  disabled={!canRedo}
                  aria-label="Redo"
                  title="Redo"
                  className="grid h-7 w-7 place-items-center rounded-md text-icon transition-colors hover:bg-surface-hover hover:text-text-primary disabled:pointer-events-none disabled:opacity-35"
                >
                  <RedoOutlined sx={{ fontSize: 17 }} />
                </button>
              </div>
            </div>
            <div className="mt-2"><Input size="sm" placeholder="Filter access…" value={search} onChange={(e) => setSearch(e.target.value)} startAdornment={<SearchOutlined sx={{ fontSize: 18 }} />} /></div>
          </div>
          <div className="ds-scroll min-h-0 flex-1 overflow-y-auto px-4 pb-4">
            {groups.length === 0 && (
              <div className="mt-10 flex flex-col items-center gap-2 text-center">
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-subtle text-[var(--ds-color-status-success-fg)]"><CheckCircleOutlined sx={{ fontSize: 22 }} /></span>
                <div className="text-body-sm font-medium text-text-primary">Every access reviewed</div>
                <p className="max-w-[240px] text-caption text-text-secondary">All access has been actioned. Preview &amp; Submit to finish.</p>
              </div>
            )}
            {groups.map((g) => (
              <div key={g.key} className="mb-4">
                <div className="mb-2 flex items-center justify-between gap-2 px-1">
                  <span className="flex min-w-0 items-center gap-2">
                    {g.kind === 'app' ? (
                      <AppBadge app={g.label} size={18} />
                    ) : (
                      <span className="grid h-[18px] w-[18px] shrink-0 place-items-center rounded-md bg-subtle text-icon">
                        {g.kind === 'technicalRole' ? <ShieldOutlined sx={{ fontSize: 12 }} /> : <BadgeOutlined sx={{ fontSize: 12 }} />}
                      </span>
                    )}
                    <span className="truncate text-caption font-semibold uppercase tracking-[0.06em] text-text-tertiary">{g.label}</span>
                  </span>
                  <span className="shrink-0 text-caption font-medium tabular-nums text-text-tertiary">{g.items.length}</span>
                </div>
                <div className="space-y-2">
                  {g.items.map((a) => {
                    const ruleCount = activeRulesOf(a).length;
                    return (
                      <div key={a.id} className="rounded-lg border border-border bg-surface p-3 transition-shadow hover:shadow-sm">
                        <div className="flex items-start gap-3">
                          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-subtle text-icon">{accessIcon(a.type, 17)}</span>
                          <div className="min-w-0 flex-1">
                            <div className="truncate text-body-sm font-medium text-text-primary">{a.name}</div>
                            {a.description && <div className="truncate text-caption text-text-secondary">{a.description}</div>}
                          </div>
                          {a.risk != null && <RiskScoreChip score={a.risk} />}
                        </div>

                        <button
                          type="button"
                          onClick={() => setRulesFor(a)}
                          className={[
                            'mt-2.5 inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-caption font-medium transition-shadow hover:shadow-sm',
                            ruleCount === 0
                              ? 'border-[var(--ds-color-status-success-border)] bg-[var(--ds-color-status-success-subtle)] text-[var(--ds-color-status-success-fg)]'
                              : 'border-[var(--ds-color-status-warning-border)] bg-[var(--ds-color-status-warning-subtle)] text-[var(--ds-color-status-warning-fg)]',
                          ].join(' ')}
                        >
                          {ruleCount === 0 ? <CheckCircleOutlined sx={{ fontSize: 14 }} /> : <WarningAmberOutlined sx={{ fontSize: 14 }} />}
                          {ruleCount === 0 ? 'No access combinations violating' : `Violates ${ruleCount} access combination${ruleCount === 1 ? '' : 's'}`}
                          <ChevronRightOutlined sx={{ fontSize: 15 }} />
                        </button>

                        <div className="mt-3 flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => decide(a.id, 'removed')}
                            className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-md border border-[var(--ds-color-status-danger-border)] bg-surface px-3 py-1.5 text-body-sm font-medium text-[var(--ds-color-status-danger-fg)] transition-colors hover:bg-[var(--ds-color-status-danger-subtle)]"
                          >
                            <DeleteOutline sx={{ fontSize: 16 }} /> Remove access
                          </button>
                          <button
                            type="button"
                            onClick={() => decide(a.id, 'kept')}
                            className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-md border border-border bg-surface px-3 py-1.5 text-body-sm font-medium text-text-secondary transition-colors hover:border-border-strong hover:text-text-primary"
                          >
                            <CheckCircleOutlined sx={{ fontSize: 16 }} /> Ignore
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Actioned + progress (access, not rules) */}
        <section className="flex min-h-0 flex-col bg-subtle/40">
          <div className="shrink-0 space-y-3 border-b border-border px-4 py-3">
            <Meter tone="success" value={doneCount} max={total} label="Completion" valueLabel={`${pct}%`} />
            <div className="flex gap-2 text-caption">
              <span className="rounded-pill bg-[var(--ds-color-status-danger-subtle)] px-2 py-0.5 text-[var(--ds-color-status-danger-fg)]">{removed.size} removed</span>
              <span className="rounded-pill bg-[var(--ds-color-status-success-subtle)] px-2 py-0.5 text-[var(--ds-color-status-success-fg)]">{kept.size} ignored</span>
            </div>
          </div>
          <div className="flex shrink-0 items-baseline gap-2 px-4 pb-2 pt-3">
            <h2 className="text-body-sm font-semibold text-text-primary">Actioned</h2>
            <span className="text-caption text-text-tertiary">{actioned.length}</span>
          </div>
          <div className="ds-scroll min-h-0 flex-1 space-y-2 overflow-y-auto px-4 pb-4">
            {actioned.length === 0 && (
              <p className="mt-8 px-1 text-center text-caption text-text-secondary">Remove or ignore access on the left and it appears here.</p>
            )}
            {actioned.map((a) => {
              const wasRemoved = removed.has(a.id);
              return (
                <div key={a.id} className="rounded-lg border border-border bg-surface p-2.5">
                  <div className="flex items-center gap-2.5">
                    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-md bg-subtle text-icon">{accessIcon(a.type, 15)}</span>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-caption font-medium text-text-primary">{a.name}</div>
                      <div className="truncate text-caption text-text-tertiary">{a.type === 'entitlement' ? a.appName : ACCESS_TYPE_LABEL[a.type]}</div>
                    </div>
                    <span className="shrink-0">
                      <StatusChip
                        intent={wasRemoved ? 'danger' : 'success'}
                        label={wasRemoved ? 'Removed' : 'Ignored'}
                      />
                    </span>
                  </div>
                  <button type="button" onClick={() => undecide(a.id)} className="mt-1 text-caption text-text-tertiary hover:text-text-brand hover:underline">
                    Undo
                  </button>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      {/* Rules drawer — the conflicts a given access participates in */}
      <Drawer
        open={rulesFor !== null}
        onClose={() => setRulesFor(null)}
        title={rulesFor ? `Access combinations — ${rulesFor.name}` : 'Access combinations'}
        subtitle="Separation-of-duties conflicts this access participates in."
        icon={<WarningAmberOutlined sx={{ fontSize: 22, color: 'var(--ds-color-status-warning-fg)' }} />}
        width={620}
      >
        <div className="space-y-3">
          {rulesFor &&
            rulesOf(rulesFor).map((rule) => {
              const resolved = ruleResolved(rule);
              return (
                <div key={rule.id} className={['rounded-lg border bg-surface p-3', resolved ? 'border-[var(--ds-color-status-success-border)]' : 'border-border'].join(' ')}>
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <span className="text-caption font-medium text-text-secondary">{policyName(rule.policyId)}</span>
                    <div className="flex items-center gap-2">
                      {resolved && <StatusChip intent="success" label="Resolved" />}
                      <span className="text-caption font-medium tabular-nums text-text-tertiary">{rule.code}</span>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {rule.accessIds.map((aid, i) => {
                      const x = getAccess(aid);
                      const isRemoved = removed.has(aid);
                      return (
                        <React.Fragment key={aid}>
                          {i > 0 && <span className="text-caption font-semibold text-text-tertiary">AND</span>}
                          <span className={['inline-flex items-center gap-1.5 rounded-md border bg-subtle py-1 pl-1.5 pr-2 text-caption', isRemoved ? 'border-[var(--ds-color-status-danger-fg)]' : 'border-border'].join(' ')}>
                            <span className="grid h-4 w-4 shrink-0 place-items-center rounded bg-surface text-micro font-semibold text-text-secondary">
                              {x.type === 'entitlement' ? x.appName.charAt(0).toUpperCase() : accessIcon(x.type, 11)}
                            </span>
                            <span className="text-text-tertiary">{x.type === 'entitlement' ? x.appName : ACCESS_TYPE_LABEL[x.type]}</span>
                            <span className="font-medium text-text-primary">{x.name}</span>
                          </span>
                        </React.Fragment>
                      );
                    })}
                  </div>
                </div>
              );
            })}
        </div>
      </Drawer>

      <UserDetailsDrawer open={detailsOpen} onClose={() => setDetailsOpen(false)} review={review} />
    </div>
  );
}
