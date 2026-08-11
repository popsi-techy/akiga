'use client';

import * as React from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import EditOutlined from '@mui/icons-material/EditOutlined';
import RuleOutlined from '@mui/icons-material/RuleOutlined';
import ContentCopyOutlined from '@mui/icons-material/ContentCopyOutlined';
import DeleteOutline from '@mui/icons-material/DeleteOutline';
import CheckCircleOutlined from '@mui/icons-material/CheckCircleOutlined';
import WarningAmberOutlined from '@mui/icons-material/WarningAmberOutlined';
import PersonOutline from '@mui/icons-material/PersonOutline';
import TimerOutlined from '@mui/icons-material/TimerOutlined';
import AccountTreeOutlined from '@mui/icons-material/AccountTreeOutlined';
import { Avatar, Button, Dialog, Menu, StatusChip, Tabs, useToast } from '@ds/components';
import { getApprovalPolicy, deleteApprovalPolicy, updateApprovalPolicy } from '@/data/approval-policies';
import { allNodes, isNodeComplete } from '@/lib/policy-tree';
import type { ApprovalPolicy, ApprovalLevelConfig, ParallelConfig, PolicyNode } from '@/data/automation-types';
import { PolicyFlowPreview } from '@/components/product/automation/PolicyFlowPreview';
import { ExecutionHistoryTab } from '@/components/product/automation/ExecutionHistoryTab';
import { runStats } from '@/data/approval-runs';
import { useSetBreadcrumbs } from '@/lib/breadcrumb';

const LIST_HREF = '/iga/automation/approval-policies';

const TABS = [
  { value: 'workflow', label: 'Workflow' },
  { value: 'history', label: 'Execution History' },
];

/** Longest SLA anywhere in the flow, humanised — "how long can this take?". */
function longestSla(root: PolicyNode[]): string {
  let best = 0;
  let label = '—';
  for (const n of allNodes(root)) {
    const sla =
      n.type === 'approvalLevel'
        ? (n.config as ApprovalLevelConfig | undefined)?.sla
        : n.type === 'parallelBranch'
          ? (n.config as ParallelConfig | undefined)?.sla
          : undefined;
    if (!sla) continue;
    const mins = (sla.days ?? 0) * 1440 + (sla.hours ?? 0) * 60 + (sla.minutes ?? 0);
    if (mins <= best) continue;
    best = mins;
    const parts: string[] = [];
    if (sla.days) parts.push(`${sla.days}d`);
    if (sla.hours) parts.push(`${sla.hours}h`);
    if (sla.minutes) parts.push(`${sla.minutes}m`);
    label = parts.join(' ');
  }
  return label;
}

/** A compact fact about the flow — the answers you want before opening the canvas. */
function SummaryCell({ icon, label, value, tone }: { icon: React.ReactNode; label: string; value: string; tone?: 'warning' }) {
  return (
    <div className="flex min-w-0 items-center gap-2.5 border-r border-border px-4 py-2.5 last:border-r-0">
      <span className="shrink-0 text-icon">{icon}</span>
      <span className="min-w-0">
        <span className="block truncate text-caption text-text-secondary">{label}</span>
        <span
          className="block truncate text-body-sm-strong tabular-nums"
          style={{ color: tone === 'warning' ? 'var(--ds-color-status-warning-fg)' : 'var(--ds-color-text-primary)' }}
        >
          {value}
        </span>
      </span>
    </div>
  );
}

function WorkflowTab({ policy }: { policy: ApprovalPolicy }) {
  const nodes = allNodes(policy.root);
  const incomplete = nodes.filter((n) => !isNodeComplete(n));
  const levels = nodes.filter((n) => n.type === 'approvalLevel' || n.type === 'parallelBranch').length;
  const branches = nodes.filter((n) => n.type === 'conditionalBranch').length;

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* What the flow amounts to, before you read it step by step. */}
      <div className="mb-4 flex shrink-0 flex-wrap items-stretch overflow-hidden rounded-lg border border-border bg-surface">
        <SummaryCell icon={<PersonOutline sx={{ fontSize: 18 }} />} label="Approval steps" value={String(levels)} />
        <SummaryCell icon={<AccountTreeOutlined sx={{ fontSize: 18 }} />} label="Condition branches" value={String(branches)} />
        <SummaryCell icon={<TimerOutlined sx={{ fontSize: 18 }} />} label="Longest SLA" value={longestSla(policy.root)} />
        <SummaryCell
          icon={incomplete.length > 0 ? <WarningAmberOutlined sx={{ fontSize: 18 }} /> : <CheckCircleOutlined sx={{ fontSize: 18 }} />}
          label="Configuration"
          value={incomplete.length > 0 ? `${incomplete.length} step${incomplete.length === 1 ? '' : 's'} incomplete` : 'Complete'}
          tone={incomplete.length > 0 ? 'warning' : undefined}
        />
        {/* No Edit button here: the header already carries it as the page's one
            primary action, and it stays put across both tabs. */}
      </div>

      {/* The flow itself — the protagonist of this tab. */}
      <div className="min-h-0 flex-1 overflow-hidden rounded-lg border border-border">
        <PolicyFlowPreview policy={policy} />
      </div>
    </div>
  );
}

export default function ApprovalPolicyDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const toast = useToast();
  const [policy, setPolicy] = React.useState<ApprovalPolicy | null>(null);
  const [loaded, setLoaded] = React.useState(false);
  const [tab, setTab] = React.useState('workflow');
  const [deleteOpen, setDeleteOpen] = React.useState(false);

  React.useEffect(() => {
    setPolicy(getApprovalPolicy(params.id));
    setLoaded(true);
  }, [params.id]);

  useSetBreadcrumbs(
    policy ? [{ label: 'Approval Policies', href: LIST_HREF }, { label: policy.policyName }] : null,
  );

  const openBuilder = () => router.push(`${LIST_HREF}/${params.id}/builder`);

  const stats = React.useMemo(() => runStats(params.id), [params.id]);
  const incomplete = policy ? allNodes(policy.root).filter((n) => !isNodeComplete(n)).length : 0;

  if (loaded && !policy) {
    return (
      <div className="mx-auto max-w-2xl py-16 text-center">
        <h1 className="text-h3 text-text-primary">Approval policy not found</h1>
        <p className="mt-2 text-body text-text-secondary">This policy doesn’t exist or was deleted.</p>
        <div className="mt-4 flex justify-center">
          <Link href={LIST_HREF}>
            <Button variant="secondary">Back to Approval Policies</Button>
          </Link>
        </div>
      </div>
    );
  }
  if (!policy) return null;

  const activate = () => {
    if (incomplete > 0) {
      toast.error(`${incomplete} step${incomplete === 1 ? '' : 's'} still incomplete`);
      return;
    }
    const saved = updateApprovalPolicy({ ...policy, status: 'active' });
    setPolicy(saved);
    toast.success(`“${saved.policyName}” activated`);
  };

  return (
    <div className="flex h-full flex-col">
      {/* Sticky top: identity + tabs, matching the emergency-access detail shell */}
      <div className="-mx-8 -mt-6 shrink-0 border-b border-border bg-canvas px-8 pt-3">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Avatar name={policy.policyName} initials={policy.policyName.charAt(0).toUpperCase()} size="md" />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-h4 text-text-primary">{policy.policyName}</h1>
                <StatusChip intent={policy.status === 'active' ? 'success' : 'neutral'} label={policy.status === 'active' ? 'Active' : 'Draft'} />
                {incomplete > 0 && <StatusChip intent="warning" label={`${incomplete} incomplete`} />}
              </div>
              <p className="mt-px max-w-2xl text-body-sm text-text-secondary">
                {policy.description || 'No description.'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {policy.status === 'draft' && (
              <Button
                variant="secondary"
                startIcon={<CheckCircleOutlined />}
                onClick={activate}
                disabled={incomplete > 0}
                title={incomplete > 0 ? `${incomplete} step${incomplete === 1 ? '' : 's'} must be configured first` : undefined}
              >
                Activate
              </Button>
            )}
            <Button startIcon={<EditOutlined />} onClick={openBuilder}>
              Edit workflow
            </Button>
            <Menu
              items={[
                { label: 'Duplicate', icon: <ContentCopyOutlined sx={{ fontSize: 18 }} />, onClick: () => toast.info('Duplicate coming soon'), divider: true },
                { label: 'Delete', icon: <DeleteOutline sx={{ fontSize: 18 }} />, danger: true, onClick: () => setDeleteOpen(true) },
              ]}
            />
          </div>
        </div>
        <Tabs
          items={TABS.map((t) => (t.value === 'history' ? { ...t, count: stats.total } : t))}
          value={tab}
          onChange={setTab}
          noBorder
          aria-label="Approval policy details"
        />
      </div>

      {/* Tab content — fills the remaining height */}
      <div className="min-h-0 flex-1 pt-5">
        {tab === 'workflow' && <WorkflowTab policy={policy} />}
        {tab === 'history' && <ExecutionHistoryTab policyId={policy.id} />}
      </div>

      <Dialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title="Delete this approval policy?"
        tone="danger"
        confirmLabel="Delete"
        onConfirm={() => {
          deleteApprovalPolicy(policy.id);
          toast.success(`“${policy.policyName}” deleted`);
          router.push(LIST_HREF);
        }}
      >
        <strong className="text-text-primary">{policy.policyName}</strong> will be permanently removed,
        along with the approval route it defines. Requests already in flight keep the route they
        started on. This cannot be undone.
      </Dialog>
    </div>
  );
}
