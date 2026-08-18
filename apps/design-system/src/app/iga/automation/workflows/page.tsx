'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import SearchOutlined from '@mui/icons-material/SearchOutlined';
import AddIcon from '@mui/icons-material/Add';
import AccountTreeOutlined from '@mui/icons-material/AccountTreeOutlined';
import EditOutlined from '@mui/icons-material/EditOutlined';
import VisibilityOutlined from '@mui/icons-material/VisibilityOutlined';
import DeleteOutline from '@mui/icons-material/DeleteOutline';
import {
  DataTable,
  StatusChip,
  Button,
  Input,
  Select,
  Menu,
  Drawer,
  Dialog,
  useToast,
  type Column,
} from '@ds/components';
import { listWorkflows, createWorkflow, deleteWorkflow, WORKFLOW_EVENT_META } from '@/data/workflows';
import type { WorkflowRow, WorkflowStatus, WorkflowEventType } from '@/data/automation-types';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
function formatDate(iso: string): string {
  const d = new Date(iso);
  return `${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}, ${d.getUTCFullYear()}`;
}
const STATUS_META: Record<WorkflowStatus, { intent: 'success' | 'neutral'; label: string }> = {
  active: { intent: 'success', label: 'Active' },
  draft: { intent: 'neutral', label: 'Draft' },
};
const EVENT_LABEL: Record<WorkflowEventType, string> = {
  joiner: WORKFLOW_EVENT_META.joiner.label,
  mover: WORKFLOW_EVENT_META.mover.label,
  leaver: WORKFLOW_EVENT_META.leaver.label,
};

export default function WorkflowsListPage() {
  const router = useRouter();
  const toast = useToast();
  const [rows, setRows] = React.useState<WorkflowRow[] | null>(null);
  const [search, setSearch] = React.useState('');
  const [status, setStatus] = React.useState<'all' | WorkflowStatus>('all');
  const [createOpen, setCreateOpen] = React.useState(false);
  const [name, setName] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [deleteTarget, setDeleteTarget] = React.useState<WorkflowRow | null>(null);

  const refresh = React.useCallback(() => setRows(listWorkflows()), []);
  React.useEffect(() => {
    refresh();
  }, [refresh]);

  const filtered = (rows ?? []).filter(
    (r) => r.name.toLowerCase().includes(search.trim().toLowerCase()) && (status === 'all' || r.status === status),
  );

  const openBuilder = (id: string) => router.push(`/iga/automation/workflows/${id}/builder`);
  /** A row opens the read-only detail, not the editor — the same as Approval
      Policies. Creating a workflow still goes straight to the builder, since a
      brand-new one has nothing to read. */
  const openDetail = (id: string) => router.push(`/iga/automation/workflows/${id}`);

  const resetCreate = () => {
    setName('');
    setDescription('');
  };

  const handleCreate = () => {
    const wf = createWorkflow({ name, description });
    setCreateOpen(false);
    resetCreate();
    openBuilder(wf.id);
  };
  const confirmDelete = () => {
    if (!deleteTarget) return;
    deleteWorkflow(deleteTarget.id);
    toast.success(`“${deleteTarget.name}” deleted`);
    setDeleteTarget(null);
    refresh();
  };

  const columns: Column<WorkflowRow>[] = [
    {
      id: 'name',
      header: 'Workflow Name',
      sortable: true,
      value: (r) => r.name,
      render: (r) => (
        <div className="flex items-center gap-3">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-brand-subtle text-icon-brand">
            <AccountTreeOutlined sx={{ fontSize: 18 }} />
          </span>
          <span className="text-body-sm-strong text-text-primary">{r.name}</span>
        </div>
      ),
    },
    {
      id: 'eventType',
      header: 'Event Type',
      sortable: true,
      value: (r) => r.eventType ?? '',
      render: (r) => (r.eventType ? EVENT_LABEL[r.eventType] : <span className="text-text-disabled">—</span>),
    },
    {
      id: 'status',
      header: 'Status',
      sortable: true,
      value: (r) => r.status,
      render: (r) => <StatusChip intent={STATUS_META[r.status].intent} label={STATUS_META[r.status].label} />,
    },
    { id: 'createdAt', header: 'Created On', sortable: true, value: (r) => r.createdAt, render: (r) => <span className="text-text-secondary">{formatDate(r.createdAt)}</span> },
    { id: 'updatedAt', header: 'Last Updated', sortable: true, value: (r) => r.updatedAt, render: (r) => <span className="text-text-secondary">{formatDate(r.updatedAt)}</span> },
    {
      id: 'actions',
      header: 'Actions',
      align: 'right',
      width: 80,
      render: (r) => (
        <Menu
          items={[
            { label: 'View details', icon: <VisibilityOutlined sx={{ fontSize: 18 }} />, onClick: () => openDetail(r.id) },
            { label: 'Edit workflow', icon: <EditOutlined sx={{ fontSize: 18 }} />, onClick: () => openBuilder(r.id) },
            { label: 'Delete', icon: <DeleteOutline sx={{ fontSize: 18 }} />, danger: true, divider: true, onClick: () => setDeleteTarget(r) },
          ]}
        />
      ),
    },
  ];

  return (
    <div className="flex h-full flex-col">
      <div className="mb-5 shrink-0">
        <h1 className="text-h2 text-text-primary">Workflows</h1>
        <p className="mt-1 text-body text-text-secondary">
          Event-driven lifecycle automation — compose filters, entity assignment, notifications, and
          branching to automate identity onboarding.
        </p>
      </div>

      <div className="mb-4 flex shrink-0 flex-wrap items-center gap-3">
        <div className="w-full max-w-sm">
          <Input placeholder="Search by name" value={search} onChange={(e) => setSearch(e.target.value)} startAdornment={<SearchOutlined sx={{ fontSize: 18 }} />} />
        </div>
        <div className="w-[160px]">
          <Select
            options={[
              { value: 'all', label: 'All statuses' },
              { value: 'active', label: 'Active' },
              { value: 'draft', label: 'Draft' },
            ]}
            value={status}
            onChange={(v) => setStatus(v as 'all' | WorkflowStatus)}
          />
        </div>
        <div className="ml-auto">
          {/* Straight to the template gallery, not a name-and-description dialog.
              Naming a thing before deciding what it does is the wrong order, and a
              blank builder was the only outcome the dialog could produce — the
              gallery offers eleven lifecycle processes and the empty canvas in one
              place, previewing each before anything is created. */}
          <Button
            startIcon={<AddIcon />}
            onClick={() => router.push('/iga/automation/workflows/templates')}
          >
            Create Workflow
          </Button>
        </div>
      </div>

      <div className="min-h-0 flex-1">
        <DataTable<WorkflowRow>
          columns={columns}
          rows={filtered}
          loading={rows === null}
          onRowClick={(r) => openDetail(r.id)}
          fillHeight
          defaultRowsPerPage={8}
          rowsPerPageOptions={[8, 16, 24]}
          emptyTitle="No workflows yet"
          emptyMessage="Start from a lifecycle template — employee onboarding, a mover, an offboarding — or build one from scratch."
        />
      </div>

      <Drawer
        open={createOpen}
        onClose={() => {
          setCreateOpen(false);
          resetCreate();
        }}
        title="Create Workflow"
        subtitle="Name the workflow, then place a lifecycle event from the Events palette in the builder."
        icon={<AccountTreeOutlined sx={{ fontSize: 22, color: 'var(--ds-color-brand-primary)' }} />}
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => {
                setCreateOpen(false);
                resetCreate();
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleCreate}>Create &amp; Open Builder</Button>
          </>
        }
      >
        <div className="space-y-5">
          <Input
            label="Workflow name"
            placeholder="e.g. Engineering Onboarding"
            size="sm"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
          />
          <Input
            label="Description"
            placeholder="What this workflow automates (optional)"
            size="sm"
            multiline
            minRows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
      </Drawer>

      <Dialog
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        title="Delete this workflow?"
        tone="danger"
        confirmLabel="Delete"
        onConfirm={confirmDelete}
      >
        <strong className="text-text-primary">{deleteTarget?.name}</strong> will be permanently removed. This cannot be undone.
      </Dialog>
    </div>
  );
}
