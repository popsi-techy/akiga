'use client';

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import PersonAddAltOutlined from '@mui/icons-material/PersonAddAltOutlined';
import LinkOffOutlined from '@mui/icons-material/LinkOffOutlined';
import InfoOutlined from '@mui/icons-material/InfoOutlined';
import SendOutlined from '@mui/icons-material/SendOutlined';
import InsightsOutlined from '@mui/icons-material/InsightsOutlined';
import PersonOutline from '@mui/icons-material/PersonOutline';
import ScheduleOutlined from '@mui/icons-material/ScheduleOutlined';
import PolicyOutlined from '@mui/icons-material/PolicyOutlined';
import WarningAmberOutlined from '@mui/icons-material/WarningAmberOutlined';
import FactCheckOutlined from '@mui/icons-material/FactCheckOutlined';
import EventOutlined from '@mui/icons-material/EventOutlined';
import CheckCircleOutlined from '@mui/icons-material/CheckCircleOutlined';
import SearchOutlined from '@mui/icons-material/SearchOutlined';
import VpnKeyOutlined from '@mui/icons-material/VpnKeyOutlined';
import ShieldOutlined from '@mui/icons-material/ShieldOutlined';
import BadgeOutlined from '@mui/icons-material/BadgeOutlined';
import { Avatar, Button, InfoRow, InfoRowGroup, Input, Meter, StatusChip, Tabs, DataTable, useToast, type Column } from '@ds/components';
import { getReview, getAccess, progressOf, riskReduction, effectiveStatus, ruleState, logDecision, unassignReviewer } from '@/data/sod';
import type { SodReview, SodAccess, AuditEntry } from '@/data/sod-types';
import { SeverityChip, StatusPill, AppBadge, STATUS_META, isRole, formatDateTime } from '@/components/product/sod/labels';
import { AssignReviewerDrawer } from '@/components/product/sod/AssignReviewerDrawer';

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <div className="text-stat font-semibold tabular-nums text-text-primary">{value}</div>
      <div className="mt-0.5 text-caption text-text-secondary">{label}</div>
    </div>
  );
}
function Card({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-surface">
      <div className="flex items-center gap-2 border-b border-border px-4 py-3">
        <span className="text-icon-brand">{icon}</span>
        <span className="text-body font-semibold text-text-primary">{title}</span>
      </div>
      {children}
    </div>
  );
}
function ReviewerPill({ review, onLink, onUnlink }: { review: SodReview; onLink: () => void; onUnlink: () => void }) {
  const assigned = Boolean(review.assignedReviewerId);
  return (
    <div className="inline-flex h-9 items-stretch overflow-hidden rounded-md border border-border">
      <span className="flex items-center gap-1.5 border-r border-border bg-subtle px-3 text-caption font-medium text-text-secondary">
        Reviewer <InfoOutlined sx={{ fontSize: 14, color: 'var(--ds-color-icon-default)' }} />
      </span>
      <span className="flex items-center gap-2 bg-surface px-3 text-caption">
        {assigned ? (
          <>
            <span className="font-medium text-text-primary">{review.assignedReviewerName}</span>
            <button type="button" onClick={onUnlink} aria-label="Unlink reviewer" className="text-icon transition-colors hover:text-danger">
              <LinkOffOutlined sx={{ fontSize: 15 }} />
            </button>
          </>
        ) : (
          <>
            <span className="font-medium text-danger">No reviewer assigned</span>
            <button type="button" onClick={onLink} aria-label="Link reviewer" className="text-icon transition-colors hover:text-brand">
              <PersonAddAltOutlined sx={{ fontSize: 15 }} />
            </button>
          </>
        )}
      </span>
    </div>
  );
}

export default function AdminReviewDetailPage() {
  const router = useRouter();
  const toast = useToast();
  const params = useParams<{ id: string }>();
  const [review, setReview] = React.useState<SodReview | null>(null);
  const [loaded, setLoaded] = React.useState(false);
  const [assignOpen, setAssignOpen] = React.useState(false);
  const [tab, setTab] = React.useState('overview');

  React.useEffect(() => {
    setReview(getReview(params.id));
    setLoaded(true);
  }, [params.id]);

  if (loaded && !review) {
    return (
      <div className="mx-auto max-w-3xl py-16 text-center">
        <div className="text-h5 font-semibold text-text-primary">Violation not found</div>
        <div className="mt-4"><Button variant="secondary" onClick={() => router.push('/iga/risk')}>Back to violations</Button></div>
      </div>
    );
  }
  if (!review) return null;

  const status = effectiveStatus(review);
  const prog = progressOf(review);
  const risk = riskReduction(review);
  const removedAccess = review.removedAccessIds.map(getAccess).filter(Boolean);
  const removedEnt = removedAccess.filter((a) => a.type === 'entitlement').length;
  const removedRoles = removedAccess.filter((a) => isRole(a.type)).length;
  const acceptedCount = Object.keys(review.acceptedRules).length;
  const completed = status === 'completed';
  const assigned = Boolean(review.assignedReviewerId);
  const sent = review.audit.some((a) => a.action === 'Sent for resolution');

  const sendForResolution = () => {
    logDecision(review.id, 'Sent for resolution', `Dispatched to ${review.assignedReviewerName}`);
    setReview(getReview(review.id));
    toast.success(`Sent to ${review.assignedReviewerName}`);
  };
  const unlink = () => {
    const r = unassignReviewer(review.id);
    if (r) {
      setReview(r);
      toast.info('Reviewer unlinked — assign someone to continue');
    }
  };

  return (
    <div className="flex h-full flex-col">
      {/* header */}
      <div className="-mx-8 -mt-6 shrink-0 border-b border-border bg-canvas px-8 pt-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <Avatar name={review.userName} initials={review.userName.trim().charAt(0).toUpperCase()} size="md" />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-h3 font-bold text-text-primary">{review.userName}</h1>
                <SeverityChip severity={review.severity} score={review.riskScore} />
                <StatusPill status={status} />
              </div>
              <p className="mt-0.5 text-body-sm text-text-secondary">{review.userEmail} · {review.policyNames[0]}</p>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <ReviewerPill review={review} onLink={() => setAssignOpen(true)} onUnlink={unlink} />
            <Button startIcon={<SendOutlined />} onClick={sendForResolution} disabled={!assigned || sent || completed}>
              {sent ? 'Sent for resolution' : 'Send for resolution'}
            </Button>
          </div>
        </div>
        <div className="mt-4">
          <Tabs
            items={[
              { value: 'overview', label: 'Overview' },
              { value: 'conflicts', label: 'Conflicts', count: review.rules.length },
              { value: 'access', label: 'Access', count: review.accessHeldIds.length },
              { value: 'audit', label: 'Audit Timeline' },
            ]}
            value={tab}
            onChange={setTab}
            noBorder
          />
        </div>
      </div>

      <div className="ds-scroll min-h-0 flex-1 overflow-y-auto pt-6">
        {tab === 'overview' && (
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_340px]">
            {/* left */}
            <div className="space-y-5">
              <Card title="Summary" icon={<InsightsOutlined sx={{ fontSize: 20 }} />}>
                <div className="grid grid-cols-2 gap-x-6 gap-y-5 p-5 sm:grid-cols-4">
                  <Stat label="Total conflicts" value={prog.total} />
                  <Stat label="Resolved" value={prog.resolved} />
                  <Stat label="Accepted as risk" value={acceptedCount} />
                  <Stat label="Remaining" value={prog.pending} />
                </div>
                {!completed && (
                  <div className="border-t border-border px-5 py-4">
                    <Meter value={prog.pct} label="Progress" valueLabel={`${prog.pct}%`} />
                  </div>
                )}
              </Card>

              {completed && (
                <Card title="Outcome" icon={<CheckCircleOutlined sx={{ fontSize: 20 }} />}>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-5 p-5 sm:grid-cols-3">
                    <Stat label="Entitlements removed" value={removedEnt} />
                    <Stat label="Roles removed" value={removedRoles} />
                    <div><div className="text-stat font-semibold tabular-nums text-text-primary">−{risk.reducedPct}%</div><div className="mt-0.5 text-caption text-text-secondary">Risk reduction</div></div>
                  </div>
                  <div className="border-t border-border px-5 py-4">
                    <Meter tone="success" value={risk.reducedPct} label={`Risk score ${risk.original} → ${risk.projected}`} valueLabel={`−${risk.reducedPct}%`} />
                  </div>
                </Card>
              )}

              {completed && (
                <Card title="Business justification" icon={<FactCheckOutlined sx={{ fontSize: 20 }} />}>
                  <div className="p-5">
                    {review.overallJustification ? (
                      <div className="text-body-sm leading-6 text-text-primary [&_a]:text-text-link [&_blockquote]:border-l-2 [&_blockquote]:border-border-strong [&_blockquote]:pl-3 [&_blockquote]:text-text-secondary" dangerouslySetInnerHTML={{ __html: review.overallJustification }} />
                    ) : (
                      <p className="text-body-sm text-text-tertiary">No justification recorded.</p>
                    )}
                  </div>
                </Card>
              )}
            </div>

            {/* right */}
            <div className="space-y-5">
              <Card title="Information" icon={<InfoOutlined sx={{ fontSize: 20 }} />}>
                <InfoRowGroup>
                  <InfoRow className="px-4" icon={<PolicyOutlined sx={{ fontSize: 17 }} />} label="SoD Policy" value={review.policyNames[0]} />
                  <InfoRow className="px-4" icon={<WarningAmberOutlined sx={{ fontSize: 17 }} />} label="Risk score" value={<SeverityChip severity={review.severity} score={review.riskScore} />} />
                  <InfoRow className="px-4" icon={<FactCheckOutlined sx={{ fontSize: 17 }} />} label="Total conflicts" value={<span className="tabular-nums">{review.rules.length}</span>} />
                  <InfoRow className="px-4" icon={<PersonOutline sx={{ fontSize: 17 }} />} label="Reviewer" value={review.assignedReviewerName ?? <span className="text-text-tertiary">Unassigned</span>} />
                  <InfoRow className="px-4" icon={<span className="grid place-items-center"><span className="h-2 w-2 rounded-full" style={{ background: `var(--ds-color-status-${STATUS_META[status].intent}-fg)` }} /></span>} label="Status" value={STATUS_META[status].label} />
                </InfoRowGroup>
              </Card>
              <Card title="Timeline" icon={<ScheduleOutlined sx={{ fontSize: 20 }} />}>
                <InfoRowGroup>
                  <InfoRow className="px-4" icon={<EventOutlined sx={{ fontSize: 17 }} />} label="Assigned On" value={formatDateTime(review.assignedAt)} />
                  <InfoRow className="px-4" icon={<ScheduleOutlined sx={{ fontSize: 17 }} />} label="Due" value={formatDateTime(review.dueDate)} />
                  {completed && <InfoRow className="px-4" icon={<CheckCircleOutlined sx={{ fontSize: 17 }} />} label="Submitted On" value={formatDateTime(review.submission?.at)} />}
                </InfoRowGroup>
              </Card>
            </div>
          </div>
        )}

        {tab === 'conflicts' && <ConflictsTab review={review} />}
        {tab === 'access' && <AccessTab review={review} />}
        {tab === 'audit' && <AuditTab audit={review.audit} />}
      </div>

      <AssignReviewerDrawer open={assignOpen} review={review} onClose={() => setAssignOpen(false)} onAssigned={(r) => setReview(r)} />
    </div>
  );
}

function ConflictsTab({ review }: { review: SodReview }) {
  return (
    <div className="pb-6">
      <p className="mb-4 text-body-sm text-text-secondary">
        {review.rules.length} conflicting access combinations under <span className="font-medium text-text-primary">{review.policyNames[0]}</span>.
      </p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {review.rules.map((rule) => {
          const st = ruleState(review, rule);
          const acc = review.acceptedRules[rule.id];
          const removedIn = rule.accessIds.map(getAccess).find((a) => review.removedAccessIds.includes(a.id));
          return (
            <div key={rule.id} className="rounded-xl border border-border bg-surface p-4">
              <div className="mb-2.5 flex items-center justify-end gap-2">
                <StatusChip
                  intent={st === 'resolved' ? 'success' : st === 'accepted' ? 'danger' : 'warning'}
                  label={st === 'resolved' ? 'Resolved' : st === 'accepted' ? 'Risk accepted' : 'Pending'}
                />
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                {rule.accessIds.map((aid, idx) => {
                  const a = getAccess(aid);
                  return (
                    <React.Fragment key={aid}>
                      {idx > 0 && <span className="text-caption font-semibold text-text-tertiary">AND</span>}
                      <span className="inline-flex items-center gap-1.5 rounded-md border border-border bg-surface px-2 py-1 text-caption text-text-primary">
                        <AppBadge app={a.appName} size={16} /> {a.name}
                      </span>
                    </React.Fragment>
                  );
                })}
              </div>
              {st === 'resolved' && removedIn && <div className="mt-2.5 text-caption text-text-secondary">Resolved by removing <span className="font-medium text-text-primary">{removedIn.name}</span></div>}
              {st === 'accepted' && acc && <div className="mt-2.5 text-caption text-text-secondary">{acc.duration === 'permanent' ? 'Permanent' : `${acc.duration} days`} · {acc.approverName}</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

type AccessRow = SodAccess & { removed: boolean };
type AccessView = SodAccess['type'];
const ACCESS_VIEWS: { id: AccessView; label: string; icon: React.ReactNode }[] = [
  { id: 'entitlement', label: 'Entitlements', icon: <VpnKeyOutlined sx={{ fontSize: 18 }} /> },
  { id: 'businessRole', label: 'Business Roles', icon: <BadgeOutlined sx={{ fontSize: 18 }} /> },
  { id: 'technicalRole', label: 'Technical Roles', icon: <ShieldOutlined sx={{ fontSize: 18 }} /> },
];

function AccessTab({ review }: { review: SodReview }) {
  const all: AccessRow[] = React.useMemo(
    () => review.accessHeldIds.map(getAccess).filter(Boolean).map((a) => ({ ...a, removed: review.removedAccessIds.includes(a.id) })),
    [review.accessHeldIds, review.removedAccessIds],
  );
  const counts: Record<AccessView, number> = {
    entitlement: all.filter((a) => a.type === 'entitlement').length,
    businessRole: all.filter((a) => a.type === 'businessRole').length,
    technicalRole: all.filter((a) => a.type === 'technicalRole').length,
  };
  const firstView = (ACCESS_VIEWS.find((v) => counts[v.id] > 0)?.id ?? 'entitlement') as AccessView;
  const [view, setView] = React.useState<AccessView>(firstView);
  const [search, setSearch] = React.useState('');
  const q = search.trim().toLowerCase();
  const isEnt = view === 'entitlement';
  const rows = all.filter((a) => a.type === view && (!q || a.name.toLowerCase().includes(q) || (a.detail ?? '').toLowerCase().includes(q) || a.appName.toLowerCase().includes(q)));

  const columns: Column<AccessRow>[] = [
    isEnt
      ? { id: 'app', header: 'Application', sortable: true, value: (r) => r.appName, render: (r) => (<span className="flex items-center gap-2"><AppBadge app={r.appName} size={18} /><span className="text-text-primary">{r.appName}</span></span>) }
      : { id: 'app', header: 'Applications', render: () => <span className="text-text-tertiary">Multiple apps</span> },
    { id: 'access', header: isEnt ? 'Entitlement' : 'Role', sortable: true, value: (r) => r.name, render: (r) => (<div><div className={['font-medium', r.removed ? 'text-text-tertiary' : 'text-text-primary'].join(' ')}>{r.name}</div><div className="text-caption text-text-tertiary">{r.detail}</div></div>) },
    { id: 'status', header: 'Status', align: 'right', render: (r) => (r.removed ? <StatusChip intent="danger" label="Removed" /> : <span className="text-text-tertiary">Held</span>) },
  ];

  const ToggleItem = ({ id, icon, label, count }: { id: AccessView; icon: React.ReactNode; label: string; count: number }) => {
    const active = view === id;
    return (
      <button
        type="button"
        onClick={() => setView(id)}
        className={['flex w-full items-center gap-2.5 rounded-md border px-3 py-2.5 text-left text-body-sm font-medium transition-colors', active ? 'border-brand bg-brand-subtle text-brand-active' : 'border-transparent text-text-primary hover:bg-surface-hover'].join(' ')}
      >
        <span className={active ? 'text-brand-active' : 'text-icon'}>{icon}</span>
        <span className="flex-1">{label}</span>
        <span className={['rounded-pill px-2 py-0.5 text-caption font-semibold', active ? 'bg-brand text-brand-on' : 'bg-subtle text-text-secondary'].join(' ')}>{count}</span>
      </button>
    );
  };

  return (
    <div className="grid h-full gap-5 lg:grid-cols-[248px_1fr]">
      {/* Left: category rail */}
      <div className="self-start rounded-xl border border-border bg-surface p-2 lg:self-auto lg:h-full">
        <div className="space-y-1">
          {ACCESS_VIEWS.map((v) => (
            <ToggleItem key={v.id} id={v.id} icon={v.icon} label={v.label} count={counts[v.id]} />
          ))}
        </div>
      </div>

      {/* Right: search + fill-height table */}
      <div className="flex h-full min-h-0 flex-col">
        <div className="mb-4 w-full max-w-sm shrink-0">
          <Input placeholder={`Search ${isEnt ? 'entitlements' : 'roles'}`} value={search} onChange={(e) => setSearch(e.target.value)} startAdornment={<SearchOutlined sx={{ fontSize: 18 }} />} />
        </div>
        <div className="min-h-0 flex-1">
          <DataTable<AccessRow> columns={columns} rows={rows} fillHeight emptyTitle="No access" emptyMessage={`This user holds no ${isEnt ? 'entitlements' : 'roles'} in this category.`} />
        </div>
      </div>
    </div>
  );
}

type AuditRow = AuditEntry & { id: string };
function AuditTab({ audit }: { audit: AuditEntry[] }) {
  const rows: AuditRow[] = audit.map((e, i) => ({ ...e, id: String(i) })).reverse();
  const columns: Column<AuditRow>[] = [
    { id: 'action', header: 'Action', render: (r) => <span className="font-medium text-text-primary">{r.action}</span> },
    { id: 'detail', header: 'Detail', render: (r) => <span className="text-text-secondary">{r.detail}</span> },
    { id: 'actor', header: 'Actor', render: (r) => <span className="text-text-secondary">{r.actor}</span> },
    { id: 'when', header: 'When', align: 'right', render: (r) => <span className="whitespace-nowrap text-text-secondary">{formatDateTime(r.at)}</span> },
  ];
  return (
    <div className="pb-6">
      <DataTable<AuditRow> columns={columns} rows={rows} defaultRowsPerPage={25} emptyTitle="No activity" emptyMessage="Actions on this review will appear here." />
    </div>
  );
}
