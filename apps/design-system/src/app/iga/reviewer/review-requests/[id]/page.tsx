'use client';

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import PersonOutline from '@mui/icons-material/PersonOutline';
import ShieldOutlined from '@mui/icons-material/ShieldOutlined';
import BadgeOutlined from '@mui/icons-material/BadgeOutlined';
import ScheduleOutlined from '@mui/icons-material/ScheduleOutlined';
import CheckCircleOutline from '@mui/icons-material/CheckCircleOutline';
import CancelOutlined from '@mui/icons-material/CancelOutlined';
import CheckOutlined from '@mui/icons-material/CheckOutlined';
import {
  Avatar,
  Button,
  Card,
  Input,
  AppIcon,
  Meter,
  StatusChip,
  useToast,
} from '@ds/components';
import { useSetBreadcrumbs } from '@/lib/breadcrumb';
import {
  decideReviewRequest,
  formatRequestDate,
  formatRequestDateTime,
  getReviewRequest,
  slaElapsedPercent,
  timeRemainingDetail,
} from '@/data/access-requests';
import type { AccessRequest, AccessRequestType } from '@/data/access-request-types';
import { SeverityChip } from '@/components/product/sod/labels';
import {
  RequestStatusChip,
  recommendationIntent,
  recommendationTitle,
} from '@/components/product/review-requests/labels';

const LIST_HREF = '/iga/reviewer/review-requests';

function itemSectionTitle(type: AccessRequestType): string {
  if (type === 'entitlement') return 'Requested Entitlement';
  if (type === 'application') return 'Requested Application';
  return 'Requested Role';
}

function durationLabel(request: AccessRequest): string {
  if (request.accessDurationKind === 'permanent') return 'Permanent';
  if (request.accessDurationUntil) return `Temporary (Until ${formatRequestDate(request.accessDurationUntil)})`;
  return 'Temporary';
}

export default function ReviewRequestDetailPage() {
  const router = useRouter();
  const toast = useToast();
  const params = useParams<{ id: string }>();
  const [request, setRequest] = React.useState<AccessRequest | null>(null);
  const [loaded, setLoaded] = React.useState(false);
  const [justification, setJustification] = React.useState('');

  React.useEffect(() => {
    setRequest(getReviewRequest(params.id));
    setLoaded(true);
  }, [params.id]);

  useSetBreadcrumbs([
    { label: 'Review Requests', href: LIST_HREF },
    { label: request?.reference ?? 'Access Request Details' },
  ]);

  const pending = request?.status === 'pending';

  const decide = (action: 'approved' | 'rejected') => {
    if (!request || !pending) return;
    if (justification.trim().length < 10) {
      toast.error('Provide a justification of at least 10 characters');
      return;
    }
    const updated = decideReviewRequest(request.id, action, justification.trim());
    if (!updated) return;
    toast.success(action === 'approved' ? 'Request approved' : 'Request rejected');
    setRequest(updated);
  };

  if (!loaded) {
    return <div className="-mx-8 -my-6 h-[calc(100%+3rem)] bg-canvas" aria-busy="true" />;
  }

  if (request === null) {
    return (
      <div className="-mx-8 -my-6 grid h-[calc(100%+3rem)] place-items-center bg-canvas">
        <div className="text-center">
          <div className="text-h5 text-text-primary">Request not found</div>
          <div className="mt-4">
            <Button variant="secondary" onClick={() => router.push(LIST_HREF)}>
              Back to Review Requests
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const slaPct = slaElapsedPercent(request.submittedAt, request.dueAt);
  const recIntent = recommendationIntent(request.recommendation);

  return (
    <div className="-mx-8 -my-6 flex h-[calc(100%+3rem)] flex-col bg-canvas">
      {/* Header — SoD Resolution V3 pattern */}
      <div className="flex shrink-0 items-center justify-between gap-4 border-b border-border bg-canvas px-5 py-4 shadow-xs">
        <div className="flex min-w-0 flex-wrap items-center gap-3">
          <Avatar name={request.reference} initials={request.reference.replace(/\D/g, '').slice(0, 2) || 'AR'} size="sm" />
          <span className="text-h5 text-text-primary">{request.reference}</span>
          <RequestStatusChip status={request.status} />
          <StatusChip intent="neutral" label={request.approvalStage ?? 'Manager Approval Stage'} />
        </div>
        {pending && (
          <div className="flex shrink-0 flex-col items-end gap-2">
            <span className="text-body-sm-strong text-text-primary">
              {timeRemainingDetail(request.dueAt)} Remaining
            </span>
            <div className="w-[140px]">
              <Meter
                value={slaPct}
                size="sm"
                tone={slaPct >= 85 ? 'warning' : 'success'}
              />
            </div>
          </div>
        )}
      </div>

      <div className="flex min-h-0 flex-1">
        {/* Main column */}
        <div className="ds-scroll min-w-0 flex-1 overflow-y-auto px-8 py-6">
          <div className="mx-auto flex max-w-[920px] flex-col gap-6">
            <RequestedForSection request={request} />
            <RequestedItemSection request={request} />
            {request.decision && <DecisionSummary request={request} />}
          </div>
        </div>

        {/* Review panel */}
        <aside className="flex w-[385px] shrink-0 flex-col gap-4 border-l border-border bg-subtle p-4">
          <RecommendationCard request={request} recIntent={recIntent} />

          {pending ? (
            <>
              <div className="flex min-h-0 flex-1 flex-col gap-1.5">
                <span className="text-caption-strong uppercase tracking-wide text-text-secondary">
                  Provide justification*
                </span>
                <Input
                  multiline
                  minRows={8}
                  value={justification}
                  onChange={(e) => setJustification(e.target.value)}
                  placeholder="Provide justification for the action"
                />
              </div>
              <div className="flex shrink-0 gap-3">
                <Button startIcon={<CheckCircleOutline />} className="!flex-1" onClick={() => decide('approved')}>
                  Approve
                </Button>
                <Button variant="danger" startIcon={<CancelOutlined />} className="!flex-1" onClick={() => decide('rejected')}>
                  Reject
                </Button>
              </div>
            </>
          ) : (
            <div className="rounded-xl border border-border bg-surface p-4 text-body-sm text-text-secondary">
              This request is closed. Review the decision summary on the left or return to the queue.
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

function RequestedForSection({ request }: { request: AccessRequest }) {
  return (
    <Card title="Requested For" icon={<PersonOutline />} padding="none">
      <div className="overflow-hidden rounded-lg border border-border-subtle bg-surface">
        <div className="flex items-center gap-3 px-4 py-4">
          <Avatar name={request.requestedForName} initials={request.requestedForName.charAt(0)} size="md" />
          <div className="min-w-0 flex-1">
            <div className="text-body-strong text-text-primary">{request.requestedForName}</div>
            <div className="text-body-sm text-text-secondary">{request.requestedForEmail}</div>
          </div>
          <button type="button" className="shrink-0 text-body-sm-strong text-brand hover:underline">
            User Details
          </button>
        </div>
        <div className="flex flex-wrap items-center gap-2 border-t border-border bg-subtle px-4 py-3 text-body-sm">
          <span className="text-text-secondary">Requested By:</span>
          <Avatar name={request.requestedByName} initials={request.requestedByName.charAt(0)} size="sm" />
          <span className="font-emphasis text-text-primary">{request.requestedByName}</span>
          {request.requestedByTitle && (
            <>
              <span className="text-text-tertiary">·</span>
              <span className="text-text-secondary">{request.requestedByTitle}</span>
            </>
          )}
        </div>
      </div>
    </Card>
  );
}

function RequestedItemSection({ request }: { request: AccessRequest }) {
  const sectionIcon =
    request.type === 'role' ? <BadgeOutlined sx={{ fontSize: 20 }} /> : <ShieldOutlined sx={{ fontSize: 20 }} />;
  const riskLabel = request.type === 'entitlement' ? 'Entitlement Risk:' : 'Access Risk:';

  return (
    <Card title={itemSectionTitle(request.type)} icon={sectionIcon} padding="none">
      <div className="overflow-hidden rounded-lg border border-border-subtle bg-surface">
        {request.type === 'entitlement' && request.appName && (
          <div className="flex items-center gap-3 border-b border-border bg-subtle px-4 py-4">
            <AppIcon app={request.appName} size={40} variant="surface" />
            <div className="min-w-0">
              <div className="text-body-strong text-text-primary">{request.appName}</div>
              {request.itemDescription && (
                <div className="text-body-sm text-text-secondary">{request.itemDescription}</div>
              )}
            </div>
          </div>
        )}

        <div className="p-4">
          <div className="rounded-[10px] border border-border-subtle p-3">
            <ItemPrimaryRow request={request} />

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {request.itemRiskScore != null && request.itemRiskSeverity && (
                <MetaInset label={riskLabel}>
                  <SeverityChip severity={request.itemRiskSeverity} score={request.itemRiskScore} />
                </MetaInset>
              )}
              <MetaInset label="Access Duration:">
                <span className="inline-flex items-center gap-1 text-body-sm-strong text-text-primary">
                  <ScheduleOutlined sx={{ fontSize: 18 }} className="text-icon" />
                  {durationLabel(request)}
                </span>
              </MetaInset>
            </div>

            <JustificationInset text={request.businessJustification} />
          </div>
        </div>
      </div>
    </Card>
  );
}

function ItemPrimaryRow({ request }: { request: AccessRequest }) {
  if (request.type === 'application' && request.appName) {
    return (
      <div className="flex items-start gap-3">
        <AppIcon app={request.appName} size={36} variant="surface" />
        <div className="min-w-0">
          <div className="text-body-strong text-text-primary">{request.itemName}</div>
          {request.itemDescription && (
            <p className="mt-1 text-body-sm text-text-secondary">{request.itemDescription}</p>
          )}
        </div>
      </div>
    );
  }

  const Icon = request.type === 'role' ? BadgeOutlined : ShieldOutlined;
  const tileClass =
    request.type === 'role'
      ? 'bg-[var(--ds-color-status-warning-subtle)] text-[var(--ds-color-status-warning-fg)]'
      : 'bg-brand-subtle text-brand';

  return (
    <div className="flex items-start gap-3">
      <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-md ${tileClass}`}>
        <Icon sx={{ fontSize: 18 }} />
      </span>
      <div className="min-w-0">
        <div className="text-body-strong text-text-primary">{request.itemName}</div>
        {request.itemDescription && (
          <p className="mt-1 text-body-sm text-text-secondary">{request.itemDescription}</p>
        )}
        {request.roleCode && (
          <span className="mt-1 inline-block rounded-md bg-subtle px-2 py-0.5 text-caption-strong text-text-secondary">
            {request.roleCode}
          </span>
        )}
      </div>
    </div>
  );
}

function MetaInset({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-md border border-border-subtle bg-subtle px-2.5 py-2">
      <span className="text-body-sm text-text-secondary">{label}</span>
      {children}
    </div>
  );
}

function JustificationInset({ text }: { text: string }) {
  const [expanded, setExpanded] = React.useState(false);
  const long = text.length > 220;
  const shown = long && !expanded ? `${text.slice(0, 220).trim()}…` : text;

  return (
    <div className="mt-4 rounded-md border border-border-subtle bg-subtle px-2.5 py-2">
      <div className="text-micro uppercase tracking-wide text-text-secondary">Justification</div>
      <p className="mt-1 text-body-sm leading-relaxed text-text-primary">{shown}</p>
      {long && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="mt-1 text-caption-strong text-brand hover:underline"
        >
          {expanded ? 'Show less' : 'Read more'}
        </button>
      )}
    </div>
  );
}

function RecommendationCard({
  request,
  recIntent,
}: {
  request: AccessRequest;
  recIntent: ReturnType<typeof recommendationIntent>;
}) {
  const borderTone =
    recIntent === 'success'
      ? 'border-[var(--ds-color-status-success-border)]'
      : recIntent === 'danger'
        ? 'border-[var(--ds-color-status-danger-border)]'
        : 'border-[var(--ds-color-status-warning-border)]';

  const iconBg =
    recIntent === 'success'
      ? 'bg-[var(--ds-color-status-success-fg)]'
      : recIntent === 'danger'
        ? 'bg-[var(--ds-color-status-danger-fg)]'
        : 'bg-[var(--ds-color-status-warning-fg)]';

  return (
    <div className={`rounded-xl border bg-surface p-3 ${borderTone}`}>
      <div className="flex items-start gap-3">
        <span className={`grid h-[18px] w-[18px] shrink-0 place-items-center rounded-full text-white ${iconBg}`}>
          <CheckOutlined sx={{ fontSize: 12 }} />
        </span>
        <div className="min-w-0">
          <div className="text-body-strong text-text-primary">{recommendationTitle(request.recommendation)}</div>
          <p className="mt-1 text-body-sm leading-relaxed text-text-secondary">{request.recommendationSummary}</p>
        </div>
      </div>
    </div>
  );
}

function DecisionSummary({ request }: { request: AccessRequest }) {
  if (!request.decision) return null;
  return (
    <Card title="Decision" padding="none">
      <div className="space-y-2 px-4 py-4 text-body-sm">
        <div className="flex items-center gap-2">
          <span className="text-text-secondary">Outcome</span>
          <RequestStatusChip status={request.status} />
        </div>
        <div>
          <span className="text-text-secondary">Decided by </span>
          <span className="font-emphasis text-text-primary">{request.decision.decidedBy}</span>
          <span className="text-text-secondary"> on {formatRequestDateTime(request.decision.decidedAt)}</span>
        </div>
        <p className="leading-relaxed text-text-primary">{request.decision.justification}</p>
      </div>
    </Card>
  );
}
