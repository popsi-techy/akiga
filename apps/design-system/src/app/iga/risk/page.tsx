'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import SearchOutlined from '@mui/icons-material/SearchOutlined';
import VisibilityOutlined from '@mui/icons-material/VisibilityOutlined';
import PersonAddAltOutlined from '@mui/icons-material/PersonAddAltOutlined';
import { DataTable, Avatar, Input, Select, Menu, type Column } from '@ds/components';
import { listViolations } from '@/data/sod';
import type { ViolationRow, SodReview, ReviewStatus } from '@/data/sod-types';
import { SeverityChip, StatusPill, formatDateTime } from '@/components/product/sod/labels';
import { AssignReviewerDrawer } from '@/components/product/sod/AssignReviewerDrawer';

export default function SodViolationsListPage() {
  const router = useRouter();
  const [rows, setRows] = React.useState<ViolationRow[] | null>(null);
  const [search, setSearch] = React.useState('');
  const [status, setStatus] = React.useState<'all' | ReviewStatus>('all');
  const [assignTarget, setAssignTarget] = React.useState<ViolationRow | null>(null);

  const refresh = React.useCallback(() => setRows(listViolations()), []);
  React.useEffect(() => {
    refresh();
  }, [refresh]);

  const filtered = (rows ?? []).filter(
    (r) =>
      (r.userName.toLowerCase().includes(search.trim().toLowerCase()) || r.userEmail.toLowerCase().includes(search.trim().toLowerCase())) &&
      (status === 'all' || r.status === status),
  );

  const open = (id: string) => router.push(`/iga/risk/${id}`);

  const columns: Column<ViolationRow>[] = [
    {
      id: 'user',
      header: 'User',
      sortable: true,
      value: (r) => r.userName,
      render: (r) => (
        <div className="flex items-center gap-3">
          <Avatar name={r.userName} initials={r.userName.trim().charAt(0).toUpperCase()} size="sm" />
          <div className="min-w-0">
            <div className="truncate font-medium text-text-primary">{r.userName}</div>
            <div className="truncate text-caption text-text-secondary">{r.userEmail}</div>
          </div>
        </div>
      ),
    },
    {
      id: 'policy',
      header: 'SoD Policy',
      render: (r) => (
        <span className="text-text-primary">
          {r.policyNames[0]}
          {r.policyNames.length > 1 && <span className="ml-1 text-text-tertiary">+{r.policyNames.length - 1}</span>}
        </span>
      ),
    },
    { id: 'rules', header: 'Conflicts', align: 'right', width: 96, sortable: true, value: (r) => r.ruleCount, render: (r) => <span className="tabular-nums text-text-primary">{r.ruleCount}</span> },
    { id: 'risk', header: 'Risk', sortable: true, value: (r) => r.riskScore, render: (r) => <SeverityChip severity={r.severity} score={r.riskScore} /> },
    { id: 'reviewer', header: 'Reviewer', render: (r) => (r.assignedReviewerName ? <span className="text-text-primary">{r.assignedReviewerName}</span> : <span className="text-text-disabled">Unassigned</span>) },
    { id: 'status', header: 'Status', sortable: true, value: (r) => r.status, render: (r) => <StatusPill status={r.status} /> },
    { id: 'due', header: 'Due', render: (r) => <span className="whitespace-nowrap text-text-secondary">{formatDateTime(r.dueDate)}</span> },
    {
      id: 'actions',
      header: 'Actions',
      align: 'right',
      width: 72,
      render: (r) => (
        <Menu
          items={[
            { label: 'Open', icon: <VisibilityOutlined sx={{ fontSize: 18 }} />, onClick: () => open(r.id) },
            { label: r.assignedReviewerName ? 'Reassign reviewer' : 'Assign reviewer', icon: <PersonAddAltOutlined sx={{ fontSize: 18 }} />, divider: true, onClick: () => setAssignTarget(r) },
          ]}
        />
      ),
    },
  ];

  return (
    <div className="flex h-full flex-col">
      <div className="mb-5 shrink-0">
        <h1 className="text-h2 font-bold tracking-tight text-text-primary">Risk — SoD Violations</h1>
        <p className="mt-1 text-body text-text-secondary">
          Users with active separation-of-duties violations. Assign a reviewer to resolve each case.
        </p>
      </div>

      <div className="mb-4 flex shrink-0 flex-wrap items-center gap-3">
        <div className="w-full max-w-sm">
          <Input placeholder="Search by user or email" value={search} onChange={(e) => setSearch(e.target.value)} startAdornment={<SearchOutlined sx={{ fontSize: 18 }} />} />
        </div>
        <div className="w-[168px]">
          <Select
            options={[
              { value: 'all', label: 'All statuses' },
              { value: 'unassigned', label: 'Unassigned' },
              { value: 'assigned', label: 'Assigned' },
              { value: 'inProgress', label: 'In Progress' },
              { value: 'overdue', label: 'Overdue' },
              { value: 'completed', label: 'Completed' },
            ]}
            value={status}
            onChange={(v) => setStatus(v as 'all' | ReviewStatus)}
          />
        </div>
      </div>

      <div className="min-h-0 flex-1">
        <DataTable<ViolationRow>
          columns={columns}
          rows={filtered}
          loading={rows === null}
          onRowClick={(r) => open(r.id)}
          fillHeight
          defaultRowsPerPage={12}
          rowsPerPageOptions={[12, 24, 48]}
          emptyTitle="No violations"
          emptyMessage="Users with active SoD violations will appear here."
        />
      </div>

      <AssignReviewerDrawer
        open={assignTarget !== null}
        review={assignTarget}
        onClose={() => setAssignTarget(null)}
        onAssigned={(_r: SodReview) => refresh()}
      />
    </div>
  );
}
