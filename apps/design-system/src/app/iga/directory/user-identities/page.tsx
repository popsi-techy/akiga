'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { IdentityCell, StatusChip, type Column, type StatusIntent } from '@ds/components';
import { listUserIdentities, type UserIdentityRow } from '@/data/directory';
import type { IdentityStatus } from '@/data/seed';
import { DirectoryListPage, IdentityKindChip, RiskScoreChip } from '@/components/product/directory';

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
      width: '40%',
      // Two lines — name over email — so it opts out of the single-line default.
      wrap: true,
      value: (r) => r.name,
      render: (r) => <IdentityCell name={r.name} email={r.email} />,
    },
    // Before Department, not after Status: whether someone is on the payroll
    // changes how the rest of the row should be read, so it belongs beside the
    // name rather than at the end with the measurements.
    { id: 'kind', header: 'Type', sortable: true, width: 140, wrap: true, value: (r) => (r.kind === 'external' ? 'External' : 'Workforce'), render: (r) => <IdentityKindChip kind={r.kind} /> },
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
