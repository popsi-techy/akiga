'use client';

import * as React from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import EditOutlined from '@mui/icons-material/EditOutlined';
import ContentCopyOutlined from '@mui/icons-material/ContentCopyOutlined';
import DeleteOutline from '@mui/icons-material/DeleteOutline';
import CheckCircleOutlined from '@mui/icons-material/CheckCircleOutlined';
import WatchLater from '@mui/icons-material/WatchLater';
import { Avatar, Button, Card, Dialog, InfoRow, InfoRowGroup, Menu, StatusChip, Tabs, useToast } from '@ds/components';
import { infoIcon } from '@/components/product/directory';
import { getApprovalPolicy, deleteApprovalPolicy, updateApprovalPolicy } from '@/data/approval-policies';
import { allNodes, isNodeComplete } from '@/lib/policy-tree';
import type { ApprovalPolicy } from '@/data/automation-types';
import { PolicyStagesPreview } from '@/components/product/automation/PolicyStagesPreview';
import { ExecutionHistoryTab } from '@/components/product/automation/ExecutionHistoryTab';
import { runStats } from '@/data/approval-runs';
import { useSetBreadcrumbs } from '@/lib/breadcrumb';

const LIST_HREF = '/iga/automation/approval-policies';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
/** Deterministic UTC date format — same as the list, so a row and its detail agree
    (and no SSR/client hydration drift from the viewer's timezone). */
function formatDate(iso: string): string {
  const d = new Date(iso);
  return `${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}, ${d.getUTCFullYear()}`;
}

const TABS = [
  { value: 'workflow', label: 'Workflow' },
  { value: 'history', label: 'Execution History' },
];

/**
 * The stage list is the whole tab. The summary strip that used to sit above it
 * (steps · branches · longest SLA · configuration) is gone: every one of those
 * facts is now legible in the stages themselves — count them, read the SLA chip,
 * see the Incomplete badge — so the strip was restating the list above the list.
 * The Edit action stays in the page header, where it holds across both tabs.
 */
function WorkflowTab({ policy }: { policy: ApprovalPolicy }) {
  return (
    <div className="ds-scroll h-full min-h-0 overflow-y-auto pb-6">
      {/* Route left, record facts right — the padded-detail rail from SoD V3.
          The rail is context you consult; it never out-weighs the route. */}
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0">
          <PolicyStagesPreview policy={policy} />
        </div>
        <aside className="lg:sticky lg:top-0 lg:self-start">
          <Card title="Timeline" icon={<WatchLater />} padding="none">
            <InfoRowGroup>
              <InfoRow icon={infoIcon.updated} label="Last Updated On" value={formatDate(policy.updatedAt)} />
              <InfoRow icon={infoIcon.created} label="Created On" value={formatDate(policy.createdAt)} />
            </InfoRowGroup>
          </Card>
        </aside>
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
