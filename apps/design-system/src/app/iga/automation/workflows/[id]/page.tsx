'use client';

import * as React from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import EditOutlined from '@mui/icons-material/EditOutlined';
import ContentCopyOutlined from '@mui/icons-material/ContentCopyOutlined';
import DeleteOutline from '@mui/icons-material/DeleteOutline';
import CheckCircleOutlined from '@mui/icons-material/CheckCircleOutlined';
import WatchLater from '@mui/icons-material/WatchLater';
import Bolt from '@mui/icons-material/Bolt';
import { Avatar, Button, Card, Dialog, InfoRow, InfoRowGroup, Menu, StatusChip, Tabs, useToast } from '@ds/components';
import { infoIcon } from '@/components/product/directory';
import { getWorkflow, deleteWorkflow, updateWorkflow, WORKFLOW_EVENT_META } from '@/data/workflows';
import { allBlocks, isBlockComplete } from '@/lib/workflow-tree';
import type { AutomationWorkflow } from '@/data/automation-types';
import { WorkflowFlowPreview } from '@/components/product/automation/WorkflowFlowPreview';
import { ExecutionHistoryTab } from '@/components/product/automation/ExecutionHistoryTab';
import { workflowRunStats } from '@/data/workflow-runs';
import { useSetBreadcrumbs } from '@/lib/breadcrumb';

const LIST_HREF = '/iga/automation/workflows';

const TABS = [
  { value: 'workflow', label: 'Workflow' },
  { value: 'history', label: 'Execution History' },
];

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
/** Deterministic UTC date format — same as the list, so a row and its detail agree. */
function formatDate(iso: string): string {
  const d = new Date(iso);
  return `${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}, ${d.getUTCFullYear()}`;
}

/**
 * Workflow detail — the read-only counterpart to the builder, matching the
 * approval-policy detail shell.
 *
 * One deliberate difference from that page: the flow is shown as the **branching
 * canvas**, not a stage list. An approval policy answers a linear question (who
 * approves, in what order), so it flattens well. A workflow's branching is the
 * substance — a Multisplit fanning a joiner population into per-department lanes
 * cannot be described as a sequence without losing what it does.
 *
 */
export default function WorkflowDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const toast = useToast();
  const [workflow, setWorkflow] = React.useState<AutomationWorkflow | null>(null);
  const [loaded, setLoaded] = React.useState(false);
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [tab, setTab] = React.useState('workflow');

  const stats = React.useMemo(() => workflowRunStats(params.id), [params.id]);

  React.useEffect(() => {
    setWorkflow(getWorkflow(params.id));
    setLoaded(true);
  }, [params.id]);

  useSetBreadcrumbs(workflow ? [{ label: 'Workflows', href: LIST_HREF }, { label: workflow.name }] : null);

  const openBuilder = () => router.push(`${LIST_HREF}/${params.id}/builder`);

  const incomplete = workflow
    ? allBlocks(workflow.root).filter((n) => !isBlockComplete(n)).length
    : 0;

  if (loaded && !workflow) {
    return (
      <div className="mx-auto max-w-2xl py-16 text-center">
        <h1 className="text-h3 text-text-primary">Workflow not found</h1>
        <p className="mt-2 text-body text-text-secondary">This workflow doesn’t exist or was deleted.</p>
        <div className="mt-4 flex justify-center">
          <Link href={LIST_HREF}>
            <Button variant="secondary">Back to Workflows</Button>
          </Link>
        </div>
      </div>
    );
  }
  if (!workflow) return null;

  const activate = () => {
    if (!workflow.event) {
      toast.error('Choose a trigger event first');
      return;
    }
    if (incomplete > 0) {
      toast.error(`${incomplete} step${incomplete === 1 ? '' : 's'} still incomplete`);
      return;
    }
    const saved = updateWorkflow({ ...workflow, status: 'active' });
    setWorkflow(saved);
    toast.success(`“${saved.name}” activated`);
  };

  const event = workflow.event;

  return (
    <div className="flex h-full flex-col">
      {/* Sticky top: identity + actions, matching the approval-policy detail shell */}
      {/* No bottom padding: the tab underline has to land ON the header's bottom
          border, the way the approval-policy header does. A `pb` here floats the
          tabs above the rule and reads as a gap. */}
      <div className="-mx-8 -mt-6 shrink-0 border-b border-border bg-canvas px-8 pt-3">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Avatar name={workflow.name} initials={workflow.name.charAt(0).toUpperCase()} size="md" />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-h4 text-text-primary">{workflow.name}</h1>
                <StatusChip
                  intent={workflow.status === 'active' ? 'success' : 'neutral'}
                  label={workflow.status === 'active' ? 'Active' : 'Draft'}
                />
                {incomplete > 0 && <StatusChip intent="warning" label={`${incomplete} incomplete`} />}
              </div>
              <p className="mt-px max-w-2xl text-body-sm text-text-secondary">
                {workflow.description || 'No description.'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {workflow.status === 'draft' && (
              <Button
                variant="secondary"
                startIcon={<CheckCircleOutlined />}
                onClick={activate}
                disabled={incomplete > 0 || !workflow.event}
                title={
                  !workflow.event
                    ? 'Choose a trigger event first'
                    : incomplete > 0
                      ? `${incomplete} step${incomplete === 1 ? '' : 's'} must be configured first`
                      : undefined
                }
              >
                Activate
              </Button>
            )}
            <Button startIcon={<EditOutlined />} onClick={openBuilder}>
              Edit workflow
            </Button>
            <Menu
              items={[
                {
                  label: 'Duplicate',
                  icon: <ContentCopyOutlined sx={{ fontSize: 18 }} />,
                  onClick: () => toast.info('Duplicate coming soon'),
                  divider: true,
                },
                {
                  label: 'Delete',
                  icon: <DeleteOutline sx={{ fontSize: 18 }} />,
                  danger: true,
                  onClick: () => setDeleteOpen(true),
                },
              ]}
            />
          </div>
        </div>
        <Tabs
          items={TABS.map((t) => (t.value === 'history' ? { ...t, count: stats.total } : t))}
          value={tab}
          onChange={setTab}
          noBorder
          aria-label="Workflow details"
        />
      </div>

      {/* Tab content — fills the remaining height */}
      <div className="min-h-0 flex-1 pt-5">
        {tab === 'workflow' && (
          /* Flow left, record facts right — the same rail as the approval policy. */
          <div className="grid h-full min-h-0 gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div className="min-h-0 min-w-0 overflow-hidden rounded-lg border border-border">
              <WorkflowFlowPreview workflow={workflow} />
            </div>
            <aside className="ds-scroll min-h-0 space-y-5 overflow-y-auto pb-6">
              <Card title="Trigger" icon={<Bolt />} padding="none">
                <InfoRowGroup>
                  <InfoRow icon={infoIcon.trigger} label="Event" value={event ? event.label : 'Not set'} />
                  <InfoRow
                    icon={infoIcon.type}
                    label="Runs on"
                    value={event ? WORKFLOW_EVENT_META[event.type].label : '—'}
                  />
                </InfoRowGroup>
              </Card>

              <Card title="Timeline" icon={<WatchLater />} padding="none">
                <InfoRowGroup>
                  <InfoRow icon={infoIcon.updated} label="Last Updated On" value={formatDate(workflow.updatedAt)} />
                  <InfoRow icon={infoIcon.created} label="Created On" value={formatDate(workflow.createdAt)} />
                </InfoRowGroup>
              </Card>
            </aside>
          </div>
        )}
        {tab === 'history' && <ExecutionHistoryTab workflowId={workflow.id} />}
      </div>

      <Dialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title="Delete this workflow?"
        tone="danger"
        confirmLabel="Delete"
        onConfirm={() => {
          deleteWorkflow(workflow.id);
          toast.success(`“${workflow.name}” deleted`);
          router.push(LIST_HREF);
        }}
      >
        <strong className="text-text-primary">{workflow.name}</strong> will be permanently removed,
        along with everything it automates. Identities already processed keep the access it granted.
        This cannot be undone.
      </Dialog>
    </div>
  );
}
