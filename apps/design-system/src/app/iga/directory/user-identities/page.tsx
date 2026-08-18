'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { StatusChip, type Column, type StatusIntent } from '@ds/components';
import { listUserIdentities, type UserIdentityRow } from '@/data/directory';
import type { IdentityStatus } from '@/data/seed';
import { DirectoryListPage, EntityAvatar, IdentityKindChip, RiskScoreChip } from '@/components/product/directory';

const STATUS: Record<IdentityStatus, { label: string; intent: StatusIntent }> = {
  active: { label: 'Active', intent: 'success' },
  inactive: { label: 'Inactive', intent: 'neutral' },
  'leaver-pending': { label: 'Leaver Pending', intent: 'warning' },
  terminated: { label: 'Terminated', intent: 'danger' },
};

export default function UserIdentitiesListPage() {
  const router = useRouter();
  const columns: Column<UserIdentityRow>[] = [
    {
      id: 'name',
      header: 'Name',
      sortable: true,
      width: '26%',
      // Two lines by design — name over job title — so it opts out of the
      // single-line default and each line truncates on its own.
      wrap: true,
      value: (r) => r.name,
      render: (r) => (
        <div className="flex items-center gap-3">
          <EntityAvatar kind="user" name={r.name} />
          <div className="min-w-0">
            <div className="truncate text-body-sm-strong text-text-primary">{r.name}</div>
            <div className="truncate text-caption text-text-secondary">{r.jobTitle}</div>
          </div>
        </div>
      ),
    },
    // Before Department, not after Status: whether someone is on the payroll
    // changes how the rest of the row should be read, so it belongs beside the
    // name rather than at the end with the measurements.
    { id: 'kind', header: 'Type', sortable: true, width: 140, wrap: true, value: (r) => (r.kind === 'external' ? 'External' : 'Workforce'), render: (r) => <IdentityKindChip kind={r.kind} /> },
    { id: 'email', header: 'Email', sortable: true, width: '24%', value: (r) => r.email, render: (r) => <span className="text-text-secondary">{r.email}</span> },
    { id: 'department', header: 'Department', sortable: true, width: '16%', value: (r) => r.department, render: (r) => <span className="text-text-secondary">{r.department}</span> },
    { id: 'status', header: 'Status', sortable: true, width: 120, wrap: true, value: (r) => STATUS[r.status].label, render: (r) => <StatusChip intent={STATUS[r.status].intent} label={STATUS[r.status].label} /> },
    { id: 'risk', header: 'Risk', sortable: true, align: 'right', width: 120, wrap: true, value: (r) => r.riskScore, render: (r) => <RiskScoreChip score={r.riskScore} /> },
  ];
  return (
    <DirectoryListPage<UserIdentityRow>
      title="Workforce"
      description="Everyone who holds access — the workforce, and the externals working alongside them."
      searchPlaceholder="Search people"
      columns={columns}
      rows={listUserIdentities()}
      // Every column declares a share, so the longer "Workforce" chip cannot push
      // Risk off the end the way it did under auto layout.
      layout="fixed"
      matches={(r, q) => r.name.toLowerCase().includes(q) || r.email.toLowerCase().includes(q) || r.department.toLowerCase().includes(q) || r.jobTitle.toLowerCase().includes(q)}
      onOpen={(id) => router.push(`/iga/directory/user-identities/${id}`)}
      emptyTitle="No user identities found"
      emptyMessage="No people match your search."
      downloadable
    />
  );
}
