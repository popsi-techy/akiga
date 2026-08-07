'use client';

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import ArrowBackOutlined from '@mui/icons-material/ArrowBackOutlined';
import CheckCircleOutlined from '@mui/icons-material/CheckCircleOutlined';
import WarningAmberOutlined from '@mui/icons-material/WarningAmberOutlined';
import LockOutlined from '@mui/icons-material/LockOutlined';
import { Avatar, Button, Stepper, Meter, RichTextEditor, StatusChip, plainText, useToast } from '@ds/components';
import { getReview, getAccess, progressOf, riskReduction, submitReview } from '@/data/sod';
import type { SodReview } from '@/data/sod-types';
import { SeverityChip, AppBadge, ACCESS_TYPE_LABEL, isRole, formatDate } from '@/components/product/sod/labels';

function Stat({ label, value, tone }: { label: string; value: React.ReactNode; tone?: 'default' | 'success' | 'brand' | 'warning' }) {
  const color = tone === 'success' ? 'text-[var(--ds-color-status-success-fg)]' : tone === 'warning' ? 'text-[var(--ds-color-status-warning-fg)]' : tone === 'brand' ? 'text-brand-active' : 'text-text-primary';
  return (
    <div>
      <div className={['text-stat font-semibold tabular-nums', color].join(' ')}>{value}</div>
      <div className="mt-0.5 text-caption text-text-secondary">{label}</div>
    </div>
  );
}
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-t border-border py-6 first:border-t-0 first:pt-0">
      <h2 className="mb-4 text-caption font-semibold uppercase tracking-[0.07em] text-text-tertiary">{title}</h2>
      {children}
    </section>
  );
}

export default function ReviewPreviewPage() {
  const router = useRouter();
  const toast = useToast();
  const params = useParams<{ id: string }>();
  const [review, setReview] = React.useState<SodReview | null>(null);
  const [loaded, setLoaded] = React.useState(false);
  const [justification, setJustification] = React.useState('');

  React.useEffect(() => {
    const r = getReview(params.id);
    setReview(r);
    if (r) setJustification(r.overallJustification);
    setLoaded(true);
  }, [params.id]);

  if (loaded && !review) {
    return (
      <div className="-mx-8 -my-6 grid h-[calc(100%+3rem)] place-items-center bg-subtle">
        <Button variant="secondary" onClick={() => router.push('/iga/reviewer/sod-resolution')}>Back to My Reviews</Button>
      </div>
    );
  }
  if (!review) return <div className="-mx-8 -my-6 h-[calc(100%+3rem)] bg-subtle" />;

  const prog = progressOf(review);
  const risk = riskReduction(review);
  const removedAccess = review.removedAccessIds.map(getAccess).filter(Boolean);
  const removedEnt = removedAccess.filter((a) => a.type === 'entitlement');
  const removedRoles = removedAccess.filter((a) => isRole(a.type));
  const appsAffected = Array.from(new Set(removedAccess.map((a) => a.appName)));
  const acceptedCount = Object.keys(review.acceptedRules).length;
  const submitted = Boolean(review.submission);
  const canSubmit = prog.pending === 0 && plainText(justification).trim().length >= 10;

  const doSubmit = () => {
    const updated = submitReview(review.id, justification);
    if (updated) {
      setReview(updated);
      toast.success('Review submitted');
    }
  };

  // ---- submitted (read-only) ----
  if (submitted) {
    return (
      <div className="-mx-8 -my-6 grid h-[calc(100%+3rem)] place-items-center bg-subtle px-6">
        <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-8 text-center shadow-sm">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[var(--ds-color-status-success-subtle)] text-[var(--ds-color-status-success-fg)]">
            <CheckCircleOutlined sx={{ fontSize: 30 }} />
          </span>
          <h1 className="mt-4 text-h4 font-semibold text-text-primary">Review submitted</h1>
          <p className="mt-1 text-body-sm text-text-secondary">Your SoD resolution for {review.userName} has been recorded and is now read-only.</p>
          <dl className="mt-5 divide-y divide-border rounded-lg border border-border text-left text-body-sm">
            <div className="flex justify-between px-3.5 py-2.5"><dt className="text-text-secondary">Reference</dt><dd className="font-medium tabular-nums text-text-primary">{review.submission!.reference}</dd></div>
            <div className="flex justify-between px-3.5 py-2.5"><dt className="text-text-secondary">Submitted</dt><dd className="text-text-primary">{formatDate(review.submission!.at)}</dd></div>
            <div className="flex justify-between px-3.5 py-2.5"><dt className="text-text-secondary">Status</dt><dd><StatusChip intent="success" label="Completed" /></dd></div>
            <div className="flex justify-between px-3.5 py-2.5"><dt className="text-text-secondary">Risk reduced</dt><dd className="font-medium tabular-nums text-text-primary">{risk.original} → {risk.projected}</dd></div>
          </dl>
          <div className="mt-5 flex items-center justify-center gap-2 text-caption text-text-tertiary"><LockOutlined sx={{ fontSize: 15 }} /> Read-only after submission</div>
          <div className="mt-4"><Button onClick={() => router.push('/iga/reviewer/sod-resolution')}>Back to My Reviews</Button></div>
        </div>
      </div>
    );
  }

  // ---- preview + submit ----
  return (
    <div className="-mx-8 -my-6 flex h-[calc(100%+3rem)] flex-col bg-subtle">
      <div className="flex shrink-0 items-center justify-between gap-4 border-b border-border bg-canvas px-5 py-3">
        <div className="flex min-w-0 items-center gap-3">
          <button type="button" onClick={() => router.push(`/iga/reviewer/sod-resolution/${review.id}`)} aria-label="Back to workspace" className="grid h-8 w-8 place-items-center rounded-md text-icon hover:bg-surface-hover">
            <ArrowBackOutlined sx={{ fontSize: 20 }} />
          </button>
          <Avatar name={review.userName} initials={review.userName.trim().charAt(0).toUpperCase()} size="sm" />
          <div className="min-w-0">
            <div className="flex items-center gap-2"><span className="truncate text-h5 font-semibold text-text-primary">{review.userName}</span><SeverityChip severity={review.severity} score={review.riskScore} /></div>
            <div className="truncate text-caption text-text-secondary">{review.policyNames.join(' · ')}</div>
          </div>
        </div>
        <div className="hidden lg:block"><Stepper steps={[{ label: 'Select access' }, { label: 'Preview & activate' }]} current={1} onStepClick={() => router.push(`/iga/reviewer/sod-resolution/${review.id}`)} /></div>
        <div className="w-8" />
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-[1fr_400px] divide-x divide-border">
        {/* left: summary + impact (scrolls) */}
        <div className="ds-scroll min-h-0 overflow-y-auto px-8 py-6">
          <div className="mx-auto max-w-2xl">
            {prog.pending > 0 && (
              <div className="mb-6 flex items-start gap-2.5 rounded-lg border border-[var(--ds-color-status-warning-border)] bg-[var(--ds-color-status-warning-subtle)] p-3.5">
                <WarningAmberOutlined sx={{ fontSize: 18, color: 'var(--ds-color-status-warning-fg)' }} />
                <div className="text-body-sm">
                  <div className="font-medium text-text-primary">{prog.pending} violation{prog.pending > 1 ? 's' : ''} still need a decision</div>
                  <button type="button" onClick={() => router.push(`/iga/reviewer/sod-resolution/${review.id}`)} className="mt-0.5 text-caption font-medium text-text-brand hover:underline">Return to the workspace</button>
                </div>
              </div>
            )}

            <Section title="Review summary">
              <div className="grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-4">
                <Stat label="Access combinations" value={prog.total} />
                <Stat label="Resolved" value={prog.resolved} tone="success" />
                <Stat label="Accepted as risk" value={acceptedCount} tone="brand" />
                <Stat label="Remaining" value={prog.pending} tone={prog.pending > 0 ? 'warning' : 'default'} />
              </div>
            </Section>

            <Section title="Overall impact">
              <div className="grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-4">
                <Stat label="Applications affected" value={appsAffected.length} />
                <Stat label="Roles removed" value={removedRoles.length} />
                <Stat label="Entitlements removed" value={removedEnt.length} />
                <div>
                  <div className="text-stat font-semibold tabular-nums text-text-primary">{risk.reducedPct}%</div>
                  <div className="mt-0.5 text-caption text-text-secondary">Risk reduction</div>
                </div>
              </div>
              <div className="mt-5"><Meter tone="success" value={risk.reducedPct} label={`Risk score ${risk.original} → ${risk.projected}`} valueLabel={`−${risk.reducedPct}%`} /></div>
            </Section>

            {(removedEnt.length > 0 || removedRoles.length > 0) && (
              <Section title="Removed access">
                <div className="flex flex-wrap gap-1.5">
                  {removedAccess.map((a) => (
                    <span key={a.id} className="inline-flex items-center gap-1.5 rounded-pill bg-surface px-2.5 py-1 text-caption text-text-primary">
                      {a.type === 'entitlement' && <AppBadge app={a.appName} size={16} />} {a.name}
                      <span className="text-text-tertiary">· {ACCESS_TYPE_LABEL[a.type].toLowerCase()}</span>
                    </span>
                  ))}
                </div>
              </Section>
            )}
          </div>
        </div>

        {/* right: fixed justification rail */}
        <aside className="flex min-h-0 flex-col bg-canvas">
          <div className="flex min-h-0 flex-1 flex-col px-5 py-5">
            <div className="mb-2 shrink-0 text-caption font-semibold uppercase tracking-[0.07em] text-text-tertiary">
              Provide justification<span className="text-danger"> *</span>
            </div>
            <div className="min-h-0 flex-1">
              <RichTextEditor
                value={justification}
                onChange={setJustification}
                placeholder="Explain the decisions made in this review — removals and any accepted risks — for the audit record."
                minHeight={220}
                ariaLabel="Overall business justification"
              />
            </div>
          </div>
          <div className="shrink-0 border-t border-border px-5 py-4">
            <Button fullWidth onClick={doSubmit} disabled={!canSubmit} title={prog.pending > 0 ? 'Resolve all violations first' : plainText(justification).trim().length < 10 ? 'Add a justification (min 10 characters)' : undefined}>
              Submit
            </Button>
            {prog.pending === 0 && plainText(justification).trim().length < 10 && (
              <p className="mt-2 text-center text-caption text-text-tertiary">A business justification is required to submit.</p>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
