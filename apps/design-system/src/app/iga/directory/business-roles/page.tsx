'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import type { Column } from '@ds/components';
import { listBusinessRoleRows, type RoleRow } from '@/data/directory';
import { DirectoryListPage, EntityAvatar, RiskScoreChip } from '@/components/product/directory';

export default function BusinessRolesListPage() {
  const router = useRouter();
  const columns: Column<RoleRow>[] = [
    {
      id: 'name',
      header: 'Business Role Name',
      sortable: true,
      value: (r) => r.name,
      render: (r) => (
        <div className="flex items-center gap-3">
          <EntityAvatar kind="business-role" name={r.name} />
          <span className="font-medium text-text-primary">{r.name}</span>
        </div>
      ),
    },
    { id: 'description', header: 'Description', value: (r) => r.description, render: (r) => <span className="text-text-secondary">{r.description}</span> },
    { id: 'risk', header: 'Risk Score', sortable: true, align: 'right', value: (r) => r.risk, render: (r) => <RiskScoreChip score={r.risk} /> },
  ];
  return (
    <DirectoryListPage<RoleRow>
      title="Business Roles"
      description="Business functions that bundle one or more technical roles."
      searchPlaceholder="Search business roles"
      columns={columns}
      rows={listBusinessRoleRows()}
      matches={(r, q) => r.name.toLowerCase().includes(q) || r.description.toLowerCase().includes(q)}
      onOpen={(id) => router.push(`/iga/directory/business-roles/${id}`)}
      emptyTitle="No business roles found"
      emptyMessage="No business roles match your search."
    />
  );
}
