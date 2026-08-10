'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import SearchOutlined from '@mui/icons-material/SearchOutlined';
import AddIcon from '@mui/icons-material/Add';
import RuleOutlined from '@mui/icons-material/RuleOutlined';
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
import {
  listApprovalPolicies,
  createApprovalPolicy,
  deleteApprovalPolicy,
} from '@/data/approval-policies';
import type { ApprovalPolicyRow, PolicyStatus } from '@/data/automation-types';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
/** Deterministic UTC date format (avoids SSR/client hydration drift). */
function formatDate(iso: string): string {
  const d = new Date(iso);
  return `${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}, ${d.getUTCFullYear()}`;
}

const STATUS_META: Record<PolicyStatus, { intent: 'success' | 'neutral'; label: string }> = {
  active: { intent: 'success', label: 'Active' },
  draft: { intent: 'neutral', label: 'Draft' },
};

export default function ApprovalPoliciesListPage() {
  const router = useRouter();
  const toast = useToast();
  const [rows, setRows] = React.useState<ApprovalPolicyRow[] | null>(null);
  const [search, setSearch] = React.useState('');
  const [status, setStatus] = React.useState<'all' | PolicyStatus>('all');
  const [createOpen, setCreateOpen] = React.useState(false);
  const [name, setName] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [deleteTarget, setDeleteTarget] = React.useState<ApprovalPolicyRow | null>(null);

  const refresh = React.useCallback(() => setRows(listApprovalPolicies()), []);
  React.useEffect(() => {
    refresh();
  }, [refresh]);

  const filtered = (rows ?? []).filter(
    (r) =>
      r.policyName.toLowerCase().includes(search.trim().toLowerCase()) &&
      (status === 'all' || r.status === status),
  );

  /** A policy opens on its detail page — flow preview + run history. Editing is
      a deliberate second step from there, not what a row click means. */
  const openDetail = (id: string) => router.push(`/iga/automation/approval-policies/${id}`);
  const openBuilder = (id: string) => router.push(`/iga/automation/approval-policies/${id}/builder`);

  const handleCreate = () => {
    const policy = createApprovalPolicy({ policyName: name, description });
    setCreateOpen(false);
    setName('');
    setDescription('');
    openBuilder(policy.id);
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    deleteApprovalPolicy(deleteTarget.id);
    toast.success(`“${deleteTarget.policyName}” deleted`);
    setDeleteTarget(null);
    refresh();
  };

  const columns: Column<ApprovalPolicyRow>[] = [
    {
      id: 'policyName',
      header: 'Policy Name',
      sortable: true,
      value: (r) => r.policyName,
      render: (r) => (
        <div className="flex items-center gap-3">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-brand-subtle text-icon-brand">
            <RuleOutlined sx={{ fontSize: 18 }} />
          </span>
          <span className="text-body-sm-strong text-text-primary">{r.policyName}</span>
        </div>
      ),
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
            { label: 'Open', icon: <VisibilityOutlined sx={{ fontSize: 18 }} />, onClick: () => openDetail(r.id) },
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
        <h1 className="text-h2 text-text-primary">Approval Policies</h1>
        <p className="mt-1 text-body text-text-secondary">
          Reusable approval workflows for access requests — compose approval levels, parallel
          approvals, notifications, and conditional routing.
        </p>
      </div>

      <div className="mb-4 flex shrink-0 flex-wrap items-center gap-3">
        <div className="w-full max-w-sm">
          <Input
            placeholder="Search by name"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            startAdornment={<SearchOutlined sx={{ fontSize: 18 }} />}
          />
        </div>
        <div className="w-[160px]">
          <Select
            options={[
              { value: 'all', label: 'All statuses' },
              { value: 'active', label: 'Active' },
              { value: 'draft', label: 'Draft' },
            ]}
            value={status}
            onChange={(v) => setStatus(v as 'all' | PolicyStatus)}
          />
        </div>
        <div className="ml-auto">
          <Button startIcon={<AddIcon />} onClick={() => setCreateOpen(true)}>
            Create Approval Policy
          </Button>
        </div>
      </div>

      <div className="min-h-0 flex-1">
        <DataTable<ApprovalPolicyRow>
          columns={columns}
          rows={filtered}
          loading={rows === null}
          onRowClick={(r) => openDetail(r.id)}
          fillHeight
          defaultRowsPerPage={8}
          rowsPerPageOptions={[8, 16, 24]}
          emptyTitle="No approval policies found"
          emptyMessage="Create an approval policy to define how access requests are reviewed and approved."
        />
      </div>

      {/* Create drawer */}
      <Drawer
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Create Approval Policy"
        subtitle="Name it, then build the approval flow."
        icon={<RuleOutlined sx={{ fontSize: 22, color: 'var(--ds-color-brand-primary)' }} />}
        footer={
          <>
            <Button variant="secondary" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate}>Create &amp; Open Builder</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="Policy name"
            placeholder="e.g. Privileged Access Review"
            size="sm"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleCreate();
            }}
          />
          <Input
            label="Description"
            placeholder="What this policy governs (optional)"
            size="sm"
            multiline
            minRows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
      </Drawer>

      {/* Delete confirm */}
      <Dialog
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        title="Delete this approval policy?"
        tone="danger"
        confirmLabel="Delete"
        onConfirm={confirmDelete}
      >
        <strong className="text-text-primary">{deleteTarget?.policyName}</strong> will be permanently
        removed. This cannot be undone.
      </Dialog>
    </div>
  );
}
