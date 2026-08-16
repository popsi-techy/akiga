'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import AddIcon from '@mui/icons-material/Add';
import EditOutlined from '@mui/icons-material/EditOutlined';
import DeleteOutline from '@mui/icons-material/DeleteOutline';
import VisibilityOutlined from '@mui/icons-material/VisibilityOutlined';
import {
  Button,
  Dialog,
  Menu,
  StatusChip,
  useToast,
  type Column,
  type FilterGroup,
  type FilterSelection,
} from '@ds/components';
import { DirectoryListPage } from '@/components/product/directory';
import { deleteSodPolicy, listSodPolicies, type SodPolicyRow } from '@/data/sod-policies';
import { SEVERITY_META, STATUS_META, formatDate } from '@/components/product/sod/policy-labels';
import { SodPolicyDetailsDrawer } from '@/components/product/sod/SodPolicyDetailsDrawer';
import type { Severity } from '@/data/sod-types';

const SEVERITY_OPTIONS = (['critical', 'high', 'medium', 'low'] as Severity[]).map((s) => ({
  value: s,
  label: SEVERITY_META[s].label,
}));

export default function SodPoliciesListPage() {
  const router = useRouter();
  const toast = useToast();

  // localStorage-backed: null until mounted, so the server and the client agree
  // on the first paint and the store is read only where it exists.
  const [rows, setRows] = React.useState<SodPolicyRow[] | null>(null);
  const refresh = React.useCallback(() => setRows(listSodPolicies()), []);
  React.useEffect(() => refresh(), [refresh]);

  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<SodPolicyRow | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<SodPolicyRow | null>(null);

  const openCreate = () => {
    setEditing(null);
    setDrawerOpen(true);
  };

  const openEdit = (row: SodPolicyRow) => {
    setEditing(row);
    setDrawerOpen(true);
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    deleteSodPolicy(deleteTarget.id);
    setDeleteTarget(null);
    refresh();
    toast.success(`“${deleteTarget.name}” deleted`);
  };

  const columns: Column<SodPolicyRow>[] = [
    {
      id: 'name',
      header: 'SoD Policy Name',
      sortable: true,
      value: (p) => p.name,
      render: (p) => (
        <div className="min-w-0">
          <div className="truncate text-body-sm-strong text-text-primary">{p.name}</div>
          <div className="truncate text-caption text-text-secondary">{p.description}</div>
        </div>
      ),
    },
    {
      id: 'created',
      header: 'Created Date',
      sortable: true,
      value: (p) => p.createdOn,
      render: (p) => <span className="whitespace-nowrap text-text-secondary">{formatDate(p.createdOn)}</span>,
    },
    {
      id: 'severity',
      header: 'Severity',
      sortable: true,
      // Sorted by how much it matters, not alphabetically — "Critical, High,
      // Low, Medium" is the sort nobody wants.
      value: (p) => SEVERITY_META[p.severity].rank,
      render: (p) => <StatusChip intent={SEVERITY_META[p.severity].intent} dot={false} label={SEVERITY_META[p.severity].label} />,
    },
    {
      id: 'updated',
      header: 'Last Updated',
      sortable: true,
      value: (p) => p.updatedOn,
      render: (p) => <span className="whitespace-nowrap text-text-secondary">{formatDate(p.updatedOn)}</span>,
    },
    {
      id: 'status',
      header: 'Status',
      sortable: true,
      value: (p) => p.status,
      render: (p) => <StatusChip intent={STATUS_META[p.status].intent} label={STATUS_META[p.status].label} />,
    },
    {
      id: 'actions',
      header: 'Actions',
      align: 'right',
      width: 80,
      render: (p) => (
        <Menu
          items={[
            { label: 'View details', icon: <VisibilityOutlined sx={{ fontSize: 18 }} />, onClick: () => router.push(`/iga/sod-policies/${p.id}`) },
            { label: 'Edit', icon: <EditOutlined sx={{ fontSize: 18 }} />, onClick: () => openEdit(p), divider: true },
            { label: 'Delete', icon: <DeleteOutline sx={{ fontSize: 18 }} />, danger: true, onClick: () => setDeleteTarget(p) },
          ]}
        />
      ),
    },
  ];

  const filterGroups: FilterGroup[] = [
    {
      id: 'severity',
      label: 'Severity',
      options: SEVERITY_OPTIONS.map((o) => ({ id: o.value, label: o.label })),
    },
    {
      id: 'status',
      label: 'Status',
      options: [
        { id: 'draft', label: 'Draft' },
        { id: 'active', label: 'Active' },
        { id: 'inactive', label: 'Inactive' },
      ],
    },
  ];

  return (
    <>
      <DirectoryListPage<SodPolicyRow>
        title="SoD Policies"
        description="Rules that define which access, held together, is a conflict of duties."
        searchPlaceholder="Search policies"
        columns={columns}
        rows={rows ?? []}
        matches={(p, q) => p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q)}
        filterGroups={filterGroups}
        filterMatches={(p, sel: FilterSelection) =>
          (!sel.severity?.length || sel.severity.includes(p.severity)) &&
          (!sel.status?.length || sel.status.includes(p.status))
        }
        onOpen={(id) => router.push(`/iga/sod-policies/${id}`)}
        emptyTitle="No SoD policies"
        emptyMessage="Create a policy to define which combination of access counts as a conflict."
        actions={
          <Button startIcon={<AddIcon />} onClick={openCreate}>
            Create new SoD Policy
          </Button>
        }
      />

      <SodPolicyDetailsDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        policy={editing}
        onSaved={({ id, created }) => {
          setDrawerOpen(false);
          // A new policy opens: everything that makes it *do* something is on the
          // detail page, and its checklist is the next instruction. An edited one
          // stays put — the reader is already looking at the list they wanted.
          if (created) router.push(`/iga/sod-policies/${id}`);
          else refresh();
        }}
      />

      <Dialog
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        tone="danger"
        title={`Delete ${deleteTarget?.name}?`}
        confirmLabel="Delete"
        onConfirm={confirmDelete}
      >
        The rule and every saved version of it are removed. Conflicts already raised under this
        policy keep their history, but nothing new will be detected.
      </Dialog>
    </>
  );
}
