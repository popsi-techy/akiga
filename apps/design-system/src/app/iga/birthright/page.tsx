'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import SearchOutlined from '@mui/icons-material/SearchOutlined';
import AddIcon from '@mui/icons-material/Add';
import VerifiedOutlined from '@mui/icons-material/VerifiedOutlined';
import VisibilityOutlined from '@mui/icons-material/VisibilityOutlined';
import DeleteOutline from '@mui/icons-material/DeleteOutline';
import {
  Avatar,
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
  listBirthrightPolicies,
  createBirthrightPolicy,
  deleteBirthrightPolicy,
  type BirthrightPolicyRow,
  type BirthrightStatus,
} from '@/data/birthright';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
/** Deterministic UTC format — a row and the detail it opens must agree. */
function formatDate(iso: string): string {
  const d = new Date(iso);
  return `${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}, ${d.getUTCFullYear()}`;
}

const STATUS_META: Record<BirthrightStatus, { intent: 'success' | 'neutral'; label: string }> = {
  active: { intent: 'success', label: 'Active' },
  draft: { intent: 'neutral', label: 'Draft' },
};

export default function BirthrightPoliciesPage() {
  const router = useRouter();
  const toast = useToast();
  const [rows, setRows] = React.useState<BirthrightPolicyRow[] | null>(null);
  const [search, setSearch] = React.useState('');
  const [status, setStatus] = React.useState<'all' | BirthrightStatus>('all');
  const [createOpen, setCreateOpen] = React.useState(false);
  const [name, setName] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [deleteTarget, setDeleteTarget] = React.useState<BirthrightPolicyRow | null>(null);

  const refresh = React.useCallback(() => setRows(listBirthrightPolicies()), []);
  React.useEffect(() => {
    refresh();
  }, [refresh]);

  const filtered = (rows ?? []).filter(
    (r) =>
      r.name.toLowerCase().includes(search.trim().toLowerCase()) &&
      (status === 'all' || r.status === status),
  );

  const openDetail = (id: string) => router.push(`/iga/birthright/${id}`);

  const resetCreate = () => {
    setName('');
    setDescription('');
  };
  const handleCreate = () => {
    const p = createBirthrightPolicy({ name, description });
    setCreateOpen(false);
    resetCreate();
    // Straight to the detail: a policy that grants nothing is not finished, and
    // the assignment sections are the next thing to do.
    openDetail(p.id);
  };
  const confirmDelete = () => {
    if (!deleteTarget) return;
    deleteBirthrightPolicy(deleteTarget.id);
    toast.success(`“${deleteTarget.name}” deleted`);
    setDeleteTarget(null);
    refresh();
  };

  const columns: Column<BirthrightPolicyRow>[] = [
    {
      id: 'name',
      header: 'Policy Name',
      sortable: true,
      value: (r) => r.name,
      // The policy's initial, not a fixed icon: one glyph repeated down the
      // column is decoration, and the letter at least varies by row.
      render: (r) => (
        <div className="flex items-center gap-3">
          <Avatar name={r.name} size="sm" />
          <div className="min-w-0">
            <div className="truncate text-body-sm-strong text-text-primary">{r.name}</div>
            <div className="truncate text-caption text-text-secondary">{r.description || 'No description'}</div>
          </div>
        </div>
      ),
    },
    {
      id: 'grants',
      header: 'Grants',
      sortable: true,
      align: 'right',
      width: 110,
      value: (r) => r.grants,
      render: (r) =>
        r.grants === 0 ? (
          <span className="text-text-disabled">—</span>
        ) : (
          <span className="text-body-sm tabular-nums text-text-primary">{r.grants}</span>
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
            { label: 'View details', icon: <VisibilityOutlined sx={{ fontSize: 18 }} />, onClick: () => openDetail(r.id) },
            { label: 'Delete', icon: <DeleteOutline sx={{ fontSize: 18 }} />, danger: true, divider: true, onClick: () => setDeleteTarget(r) },
          ]}
        />
      ),
    },
  ];

  return (
    <div className="flex h-full flex-col">
      <div className="mb-5 shrink-0">
        <h1 className="text-h2 text-text-primary">Birthright Policies</h1>
        <p className="mt-1 text-body text-text-secondary">
          Access granted automatically by virtue of who someone is — no request, no approval. Each
          policy is a named bundle of entitlements and roles.
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
            onChange={(v) => setStatus(v as 'all' | BirthrightStatus)}
          />
        </div>
        <div className="ml-auto">
          <Button startIcon={<AddIcon />} onClick={() => setCreateOpen(true)}>
            Create Policy
          </Button>
        </div>
      </div>

      <div className="min-h-0 flex-1">
        <DataTable<BirthrightPolicyRow>
          columns={columns}
          rows={filtered}
          loading={rows === null}
          onRowClick={(r) => openDetail(r.id)}
          fillHeight
          defaultRowsPerPage={8}
          rowsPerPageOptions={[8, 16, 24]}
          emptyTitle="No birthright policies yet"
          emptyMessage="Create one to grant a baseline set of access to every identity that matches it."
        />
      </div>

      <Drawer
        open={createOpen}
        onClose={() => {
          setCreateOpen(false);
          resetCreate();
        }}
        title="Create Birthright Policy"
        subtitle="Name it now; choose what it grants on the next screen."
        icon={<VerifiedOutlined sx={{ fontSize: 22, color: 'var(--ds-color-brand-primary)' }} />}
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
            <Button disabled={!name.trim()} onClick={handleCreate}>
              Create &amp; Assign Access
            </Button>
          </>
        }
      >
        <div className="space-y-5">
          <Input
            label="Policy name"
            placeholder="e.g. All Employees"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          {/* Multiline Input, matching the Workflows create drawer — a description
              here is one or two plain sentences, not formatted copy. */}
          <Input
            label="Description"
            placeholder="What this policy grants, and who it is for (optional)"
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
        title="Delete this birthright policy?"
        tone="danger"
        confirmLabel="Delete"
        onConfirm={confirmDelete}
      >
        <strong className="text-text-primary">{deleteTarget?.name}</strong> will be permanently
        removed. Identities keep access it already granted — this stops future grants only. This
        cannot be undone.
      </Dialog>
    </div>
  );
}
