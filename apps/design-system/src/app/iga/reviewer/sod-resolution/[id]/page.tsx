'use client';

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import SearchOutlined from '@mui/icons-material/SearchOutlined';
import AutoAwesomeOutlined from '@mui/icons-material/AutoAwesomeOutlined';
import ShieldOutlined from '@mui/icons-material/ShieldOutlined';
import BadgeOutlined from '@mui/icons-material/BadgeOutlined';
import CloseIcon from '@mui/icons-material/Close';
import CheckCircleOutlined from '@mui/icons-material/CheckCircleOutlined';
import UndoOutlined from '@mui/icons-material/UndoOutlined';
import RedoOutlined from '@mui/icons-material/RedoOutlined';
import { Avatar, Button, Input, Meter, StatusChip, useToast } from '@ds/components';
import { getReview, getAccess, saveReviewState, progressOf, riskReduction, fastestPath, impactOf, ruleState, clearedByRemoval } from '@/data/sod';
import type { SodReview, SodRule, AcceptedRisk, SodAccess } from '@/data/sod-types';
import { SeverityChip, AppBadge, ACCESS_TYPE_LABEL, formatDateTime } from '@/components/product/sod/labels';
import { AcceptRiskModal } from '@/components/product/sod/AcceptRiskModal';
import { UserDetailsDrawer } from '@/components/product/sod/UserDetailsDrawer';

type Snap = { removed: string[]; accepted: Record<string, AcceptedRisk> };

export default function ResolutionWorkspacePage() {
  const router = useRouter();
  const toast = useToast();
  const params = useParams<{ id: string }>();

  const [review, setReview] = React.useState<SodReview | null>(null);
  const [loaded, setLoaded] = React.useState(false);
  const [removed, setRemoved] = React.useState<Set<string>>(new Set());
  const [accepted, setAccepted] = React.useState<Record<string, AcceptedRisk>>({});
  const [history, setHistory] = React.useState<{ past: Snap[]; future: Snap[] }>({ past: [], future: [] });
  const [staged, setStaged] = React.useState<Set<string>>(new Set());
  const [search, setSearch] = React.useState('');
  const [hover, setHover] = React.useState<string | null>(null);
  const [acceptTarget, setAcceptTarget] = React.useState<SodRule | null>(null);
  const [detailsOpen, setDetailsOpen] = React.useState(false);
  const firstRun = React.useRef(true);

  React.useEffect(() => {
    const r = getReview(params.id);
    if (r) {
      if (r.submission) {
        router.replace(`/iga/reviewer/sod-resolution/${params.id}/review`);
        return;
      }
      setReview(r);
      setRemoved(new Set(r.removedAccessIds));
      setAccepted(r.acceptedRules);
    }
    setLoaded(true);
  }, [params.id, router]);

  // autosave staged decisions
  React.useEffect(() => {
    if (!review || firstRun.current) {
      firstRun.current = false;
      return;
    }
    saveReviewState(review.id, { removedAccessIds: [...removed], acceptedRules: accepted });
  }, [removed, accepted, review]);

  const wr: SodReview | null = review ? { ...review, removedAccessIds: [...removed], acceptedRules: accepted } : null;
  const prog = wr ? progressOf(wr) : null;
  const risk = wr ? riskReduction(wr) : null;
  const fp = wr ? fastestPath(wr) : [];

  const snapshot = () => setHistory((h) => ({ past: [...h.past, { removed: [...removed], accepted: { ...accepted } }].slice(-50), future: [] }));
  const canUndo = history.past.length > 0;
  const canRedo = history.future.length > 0;
  const undo = () => {
    if (!canUndo) return;
    const prev = history.past[history.past.length - 1];
    setRemoved(new Set(prev.removed));
    setAccepted(prev.accepted);
    setHistory((h) => ({ past: h.past.slice(0, -1), future: [{ removed: [...removed], accepted: { ...accepted } }, ...h.future].slice(0, 50) }));
  };
  const redo = () => {
    if (!canRedo) return;
    const next = history.future[0];
    setRemoved(new Set(next.removed));
    setAccepted(next.accepted);
    setHistory((h) => ({ past: [...h.past, { removed: [...removed], accepted: { ...accepted } }].slice(-50), future: h.future.slice(1) }));
  };

  const toggleRemove = (accessId: string) => {
    snapshot();
    setRemoved((s) => {
      const n = new Set(s);
      n.has(accessId) ? n.delete(accessId) : n.add(accessId);
      return n;
    });
  };
  // Two-step removal: clicking access stages it (preview) — it commits only when
  // the reviewer confirms via the bottom bar, moving resolved rules to Actioned.
  const stageRemoval = (accessId: string) =>
    setStaged((s) => {
      const n = new Set(s);
      n.has(accessId) ? n.delete(accessId) : n.add(accessId);
      return n;
    });
  const stageFastest = () => setStaged((s) => new Set([...s, ...fp.map((f) => f.accessId)]));
  const clearStaged = () => setStaged(new Set());
  const commitStaged = () => {
    if (!review || !wr || staged.size === 0) return;
    const trial = new Set([...removed, ...staged]);
    const resolved = review.rules.filter(
      (r) => ruleState(wr, r) === 'pending' && clearedByRemoval(r.accessIds, trial),
    );
    snapshot();
    setRemoved((s) => new Set([...s, ...staged]));
    setStaged(new Set());
    toast.success(`Moved ${resolved.length} access combination${resolved.length === 1 ? '' : 's'} to Actioned`);
  };
  const acceptRule = (rule: SodRule, acceptance: AcceptedRisk) => {
    snapshot();
    setAccepted((a) => ({ ...a, [rule.id]: acceptance }));
  };
  const unaccept = (ruleId: string) => {
    snapshot();
    setAccepted((a) => {
      const n = { ...a };
      delete n[ruleId];
      return n;
    });
  };

  if (loaded && !review) {
    return (
      <div className="-mx-8 -my-6 grid h-[calc(100%+3rem)] place-items-center bg-subtle">
        <div className="text-center">
          <div className="text-h5 font-semibold text-text-primary">Review not found</div>
          <div className="mt-4"><Button variant="secondary" onClick={() => router.push('/iga/reviewer/sod-resolution')}>Back to My Reviews</Button></div>
        </div>
      </div>
    );
  }
  if (!review || !wr || !prog || !risk) return <div className="-mx-8 -my-6 h-[calc(100%+3rem)] bg-subtle" />;

  const q = search.trim().toLowerCase();
  // Entitlements are grouped by application (heading = app name); roles stay in
  // their own Business / Technical categories (a role isn't tied to one app).
  const accessList = review.accessHeldIds.map(getAccess).filter(Boolean);
  const matches = (a: SodAccess) => a.name.toLowerCase().includes(q) || (a.detail ?? '').toLowerCase().includes(q) || a.appName.toLowerCase().includes(q);
  const ents = accessList.filter((a) => a.type === 'entitlement' && matches(a));
  const appNames = Array.from(new Set(ents.map((a) => a.appName)));
  const groups: { key: string; label: string; kind: 'app' | 'businessRole' | 'technicalRole'; items: SodAccess[] }[] = [
    ...appNames.map((app) => ({ key: `app:${app}`, label: app, kind: 'app' as const, items: ents.filter((a) => a.appName === app) })),
    { key: 'biz', label: 'Business Roles', kind: 'businessRole' as const, items: accessList.filter((a) => a.type === 'businessRole' && matches(a)) },
    { key: 'tech', label: 'Technical Roles', kind: 'technicalRole' as const, items: accessList.filter((a) => a.type === 'technicalRole' && matches(a)) },
  ].filter((g) => g.items.length > 0);

  const pendingRules = review.rules.filter((r) => ruleState(wr, r) === 'pending');
  const actionedRules = review.rules.filter((r) => ruleState(wr, r) !== 'pending');
  const hoverRuleIds = hover ? new Set(impactOf(wr, hover).map((r) => r.id)) : new Set<string>();
  // Combinations the staged removals would fully clear (AND semantics).
  const trialRemoved = new Set([...removed, ...staged]);
  const stagedRuleIds = new Set(
    pendingRules.filter((r) => clearedByRemoval(r.accessIds, trialRemoved)).map((r) => r.id),
  );

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
          <Button variant="secondary" onClick={() => { saveReviewState(review.id, { removedAccessIds: [...removed], acceptedRules: accepted }); toast.success('Draft saved'); }}>
            Save draft
          </Button>
          <Button disabled={prog.pending > 0} title={prog.pending > 0 ? `${prog.pending} still pending` : undefined} onClick={() => router.push(`/iga/reviewer/sod-resolution/${review.id}/review`)}>
            Preview &amp; Submit
          </Button>
        </div>
      </div>

      {/* board */}
      <div className="grid min-h-0 flex-1 grid-cols-[minmax(300px,1fr)_minmax(340px,1.2fr)_minmax(280px,1fr)] divide-x divide-border">
        {/* Access under review */}
        <section className="flex min-h-0 flex-col">
          <div className="shrink-0 px-4 pb-2 pt-3">
            <div className="flex items-baseline gap-2">
              <h2 className="text-body-sm font-semibold text-text-primary">Access Under Review</h2>
              <span className="text-caption text-text-tertiary">{accessList.length}</span>
            </div>
            <div className="mt-2"><Input size="sm" placeholder="Filter access…" value={search} onChange={(e) => setSearch(e.target.value)} startAdornment={<SearchOutlined sx={{ fontSize: 18 }} />} /></div>
          </div>
          <div className="ds-scroll min-h-0 flex-1 overflow-y-auto px-4 pb-4">
            {fp.length > 0 && (
              <div className="mb-3 rounded-lg border border-[var(--ds-color-status-info-border)] bg-[var(--ds-color-status-info-subtle)] p-3">
                <div className="flex items-center gap-1.5 text-caption font-medium text-[var(--ds-color-status-info-fg)]">
                  <AutoAwesomeOutlined sx={{ fontSize: 15 }} /> Fastest path — {fp.length} removal{fp.length > 1 ? 's' : ''} clears every open violation
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {fp.map((f) => {
                    const chipStaged = staged.has(f.accessId);
                    return (
                      <button
                        key={f.accessId}
                        type="button"
                        onClick={() => stageRemoval(f.accessId)}
                        title={`Remove ${getAccess(f.accessId).name}`}
                        className={['inline-flex items-center gap-1 rounded-pill border px-2 py-0.5 text-caption shadow-[0_1px_1px_rgba(16,24,40,0.04)] transition-colors', chipStaged ? 'border-brand bg-brand-subtle text-brand-active' : 'border-border bg-canvas text-text-primary hover:border-[var(--ds-color-status-info-border)] hover:text-[var(--ds-color-status-info-fg)]'].join(' ')}
                      >
                        {getAccess(f.accessId).name} <span className={chipStaged ? 'text-brand-active/70' : 'text-text-tertiary'}>×{f.count}</span>
                      </button>
                    );
                  })}
                </div>
                <button type="button" onClick={stageFastest} className="mt-2 text-caption font-semibold text-[var(--ds-color-status-info-fg)] hover:underline">
                  Stage all
                </button>
              </div>
            )}
            {groups.map((g) => (
              <div key={g.key} className="mb-3">
                <div className="mb-1.5 flex items-center justify-between gap-2 px-1">
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
                <div className="space-y-1">
                  {g.items.map((a) => {
                    const isRemoved = removed.has(a.id);
                    const isStaged = staged.has(a.id);
                    const count = impactOf(wr, a.id).length;
                    return (
                      <button
                        key={a.id}
                        type="button"
                        onClick={() => (isRemoved ? toggleRemove(a.id) : stageRemoval(a.id))}
                        onMouseEnter={() => setHover(a.id)}
                        onMouseLeave={() => setHover((h) => (h === a.id ? null : h))}
                        className={['flex w-full items-center gap-2.5 rounded-md border px-2.5 py-2 text-left transition-colors', isRemoved ? 'border-border bg-subtle' : isStaged ? 'border-brand-border bg-brand-subtle' : 'border-border bg-surface hover:border-border-strong'].join(' ')}
                      >
                        <span className={['grid h-4 w-4 shrink-0 place-items-center rounded border', isRemoved ? 'border-brand bg-brand text-brand-on' : isStaged ? 'border-brand bg-brand-subtle text-brand' : 'border-border-strong'].join(' ')}>
                          {(isRemoved || isStaged) && <CheckCircleOutlined sx={{ fontSize: 12 }} />}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className={['block truncate text-body-sm font-medium', isRemoved ? 'text-text-tertiary' : 'text-text-primary'].join(' ')}>{a.name}</span>
                          <span className="block truncate text-caption text-text-tertiary">{a.detail}</span>
                        </span>
                        {count > 0 && <span className="shrink-0 rounded-pill bg-subtle px-1.5 py-0.5 text-caption font-semibold text-text-secondary">×{count}</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Needs decision */}
        <section className="flex min-h-0 flex-col bg-subtle/40">
          <div className="flex shrink-0 items-center gap-2 px-4 pb-2 pt-3">
            <h2 className="text-body-sm font-semibold text-text-primary">Needs Decision</h2>
            <span className="text-caption text-text-tertiary">{pendingRules.length}</span>
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
          <div className="ds-scroll min-h-0 flex-1 space-y-2.5 overflow-y-auto px-4 pb-4">
            {pendingRules.length === 0 && (
              <div className="mt-10 flex flex-col items-center gap-2 text-center">
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-subtle text-[var(--ds-color-status-success-fg)]"><CheckCircleOutlined sx={{ fontSize: 22 }} /></span>
                <div className="text-body-sm font-medium text-text-primary">Every violation addressed</div>
                <p className="max-w-[220px] text-caption text-text-secondary">Continue to review to submit your decisions.</p>
              </div>
            )}
            {pendingRules.map((rule) => {
              const willResolve = stagedRuleIds.has(rule.id);
              const isHover = hoverRuleIds.has(rule.id);
              return (
              <div key={rule.id} className={['rounded-lg border bg-surface p-3 transition-shadow', willResolve ? 'border-[var(--ds-color-status-success-border)] shadow-sm ring-1 ring-[var(--ds-color-status-success-subtle)]' : isHover ? 'border-brand-border shadow-sm ring-1 ring-brand-subtle' : 'border-border'].join(' ')}>
                {willResolve && (
                  <div className="mb-2">
                    <StatusChip intent="success" label="Will resolve" />
                  </div>
                )}
                <div className="flex flex-wrap items-center gap-1.5">
                  {rule.accessIds.map((aid, idx) => {
                    const a = getAccess(aid);
                    const stagedThis = staged.has(aid);
                    return (
                      <React.Fragment key={aid}>
                        {idx > 0 && <span className="text-caption font-semibold text-text-tertiary">AND</span>}
                        <span className={['inline-flex items-center gap-1.5 rounded-md border py-1 pl-1.5 pr-1 text-caption transition-shadow hover:shadow-sm', stagedThis ? 'border-[var(--ds-color-status-danger-border)] bg-[var(--ds-color-status-danger-subtle)]' : 'border-border bg-subtle'].join(' ')}>
                          <span className="grid h-4 w-4 shrink-0 place-items-center rounded bg-surface text-micro font-semibold text-text-secondary" title={a.type === 'entitlement' ? a.appName : ACCESS_TYPE_LABEL[a.type]}>
                            {a.type === 'entitlement' ? a.appName.charAt(0).toUpperCase() : a.type === 'technicalRole' ? <ShieldOutlined sx={{ fontSize: 11 }} /> : <BadgeOutlined sx={{ fontSize: 11 }} />}
                          </span>
                          <span className="text-text-tertiary">{a.type === 'entitlement' ? a.appName : ACCESS_TYPE_LABEL[a.type]}</span>
                          <span className="font-medium text-text-primary">{a.name}</span>
                          <button type="button" onClick={() => stageRemoval(aid)} aria-label={`Remove ${a.name}`} className={['grid h-5 w-5 place-items-center rounded', stagedThis ? 'text-[var(--ds-color-status-danger-fg)]' : 'text-icon hover:bg-surface-hover hover:text-danger'].join(' ')}>
                            <CloseIcon sx={{ fontSize: 14 }} />
                          </button>
                        </span>
                      </React.Fragment>
                    );
                  })}
                </div>
                <button type="button" onClick={() => setAcceptTarget(rule)} className="mt-2.5 inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1 text-caption font-medium text-text-secondary hover:border-border-strong hover:text-text-primary">
                  <ShieldOutlined sx={{ fontSize: 15 }} /> Accept risk
                </button>
              </div>
              );
            })}
          </div>
          {staged.size > 0 && (
            <div className="shrink-0 border-t border-border bg-surface px-4 py-3 shadow-[0_-2px_10px_rgba(16,24,40,0.06)]">
              <div className="flex items-center gap-3">
                <div className="min-w-0 flex-1">
                  <div className="text-body-sm font-semibold text-text-primary">
                    Affecting {stagedRuleIds.size} access combination{stagedRuleIds.size === 1 ? '' : 's'}
                  </div>
                  <div className="truncate text-caption text-text-secondary">{staged.size} access staged for removal</div>
                </div>
                <button type="button" onClick={clearStaged} className="shrink-0 text-caption font-medium text-text-secondary hover:text-text-primary">
                  Clear
                </button>
                <Button size="sm" onClick={commitStaged}>Move to actioned column</Button>
              </div>
            </div>
          )}
        </section>

        {/* Actioned + progress */}
        <section className="flex min-h-0 flex-col">
          <div className="shrink-0 space-y-3 border-b border-border px-4 py-3">
            <Meter tone="success" value={prog.resolved + prog.accepted} max={prog.total} label="Completion" valueLabel={`${prog.pct}%`} />
            <div className="flex gap-2 text-caption">
              <span className="rounded-pill bg-[var(--ds-color-status-success-subtle)] px-2 py-0.5 text-[var(--ds-color-status-success-fg)]">{prog.resolved} resolved</span>
              <span className="rounded-pill bg-brand-subtle px-2 py-0.5 text-brand-active">{prog.accepted} accepted</span>
            </div>
          </div>
          <div className="flex shrink-0 items-baseline gap-2 px-4 pb-2 pt-3">
            <h2 className="text-body-sm font-semibold text-text-primary">Actioned</h2>
            <span className="text-caption text-text-tertiary">{actionedRules.length}</span>
          </div>
          <div className="ds-scroll min-h-0 flex-1 space-y-2 overflow-y-auto px-4 pb-4">
            {actionedRules.map((rule) => {
              const st = ruleState(wr, rule);
              return (
                <div key={rule.id} className="rounded-lg border border-border bg-surface p-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-caption font-medium text-text-primary">{rule.code}</span>
                    <span className="shrink-0">
                      <StatusChip
                        intent={st === 'accepted' ? 'danger' : 'success'}
                        label={st === 'accepted' ? 'Risk accepted' : 'Resolved'}
                      />
                    </span>
                  </div>
                  {st === 'accepted' && (
                    <button type="button" onClick={() => unaccept(rule.id)} className="mt-1 text-caption text-text-tertiary hover:text-text-brand hover:underline">
                      Undo acceptance
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      </div>

      <AcceptRiskModal
        open={acceptTarget !== null}
        rule={acceptTarget}
        onClose={() => setAcceptTarget(null)}
        onAccept={(acceptance) => acceptTarget && acceptRule(acceptTarget, acceptance)}
      />

      <UserDetailsDrawer open={detailsOpen} onClose={() => setDetailsOpen(false)} review={review} />
    </div>
  );
}
