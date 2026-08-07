'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { StatusChip, type Column, type StatusIntent } from '@ds/components';
import { listUserIdentities, type UserIdentityRow } from '@/data/directory';
import type { IdentityStatus } from '@/data/seed';
import { DirectoryListPage, EntityAvatar, RiskScoreChip } from '@/components/product/directory';

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
      header: 'User Name',
      sortable: true,
      value: (r) => r.name,
      render: (r) => (
        <div className="flex items-center gap-3">
          <EntityAvatar kind="user" name={r.name} />
          <div className="min-w-0">
            <div className="truncate font-medium text-text-primary">{r.name}</div>
            <div className="truncate text-caption text-text-secondary">{r.jobTitle}</div>
          </div>
        </div>
      ),
    },
    { id: 'email', header: 'Email', sortable: true, value: (r) => r.email, render: (r) => <span className="text-text-secondary">{r.email}</span> },
    { id: 'department', header: 'Department', sortable: true, value: (r) => r.department, render: (r) => <span className="text-text-secondary">{r.department}</span> },
    { id: 'status', header: 'Status', sortable: true, value: (r) => STATUS[r.status].label, render: (r) => <StatusChip intent={STATUS[r.status].intent} label={STATUS[r.status].label} /> },
    { id: 'risk', header: 'Risk Score', sortable: true, align: 'right', value: (r) => r.riskScore, render: (r) => <RiskScoreChip score={r.riskScore} /> },
  ];
  return (
    <DirectoryListPage<UserIdentityRow>
      title="User Identities"
      description="The primary representation of every person in the organization."
      searchPlaceholder="Search people"
      columns={columns}
      rows={listUserIdentities()}
      matches={(r, q) => r.name.toLowerCase().includes(q) || r.email.toLowerCase().includes(q) || r.department.toLowerCase().includes(q) || r.jobTitle.toLowerCase().includes(q)}
      onOpen={(id) => router.push(`/iga/directory/user-identities/${id}`)}
      emptyTitle="No user identities found"
      emptyMessage="No people match your search."
      downloadable
    />
  );
}
