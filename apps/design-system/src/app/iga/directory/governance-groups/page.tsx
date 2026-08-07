'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import type { Column } from '@ds/components';
import { listGovernanceGroupRows, type GovernanceGroupRow } from '@/data/directory';
import { DirectoryListPage, EntityAvatar } from '@/components/product/directory';

export default function GovernanceGroupsListPage() {
  const router = useRouter();
  const columns: Column<GovernanceGroupRow>[] = [
    {
      id: 'name',
      header: 'Governance Team Name',
      sortable: true,
      value: (r) => r.name,
      render: (r) => (
        <div className="flex items-center gap-3">
          <EntityAvatar kind="governance-group" name={r.name} />
          <span className="font-medium text-text-primary">{r.name}</span>
        </div>
      ),
    },
    { id: 'description', header: 'Description', value: (r) => r.description, render: (r) => <span className="text-text-secondary">{r.description}</span> },
    { id: 'reviewers', header: 'Reviewers', sortable: true, align: 'right', value: (r) => r.reviewerCount, render: (r) => <span className="tabular-nums text-text-secondary">{r.reviewerCount}</span> },
  ];
  return (
    <DirectoryListPage<GovernanceGroupRow>
      title="Governance Teams"
      description="Teams of reviewers and owners responsible for governing access."
      searchPlaceholder="Search governance teams"
      columns={columns}
      rows={listGovernanceGroupRows()}
      matches={(r, q) => r.name.toLowerCase().includes(q) || r.description.toLowerCase().includes(q)}
      onOpen={(id) => router.push(`/iga/directory/governance-groups/${id}`)}
      emptyTitle="No governance teams found"
      emptyMessage="No governance teams match your search."
    />
  );
}
