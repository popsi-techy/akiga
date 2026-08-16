'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import type { Column } from '@ds/components';
import { listGovernanceTeamRows, type GovernanceTeamRow } from '@/data/directory';
import { DirectoryListPage, EntityAvatar } from '@/components/product/directory';

export default function GovernanceTeamsListPage() {
  const router = useRouter();
  const columns: Column<GovernanceTeamRow>[] = [
    {
      id: 'name',
      header: 'Governance Team Name',
      sortable: true,
      value: (r) => r.name,
      render: (r) => (
        <div className="flex items-center gap-3">
          <EntityAvatar kind="governance-team" name={r.name} />
          <span className="text-body-sm-strong text-text-primary">{r.name}</span>
        </div>
      ),
    },
    { id: 'description', header: 'Description', value: (r) => r.description, render: (r) => <span className="text-text-secondary">{r.description}</span> },
    { id: 'reviewers', header: 'Reviewers', sortable: true, align: 'right', value: (r) => r.reviewerCount, render: (r) => <span className="tabular-nums text-text-secondary">{r.reviewerCount}</span> },
  ];
  return (
    <DirectoryListPage<GovernanceTeamRow>
      title="Governance Teams"
      description="Teams of reviewers and owners responsible for governing access."
      searchPlaceholder="Search governance teams"
      columns={columns}
      rows={listGovernanceTeamRows()}
      matches={(r, q) => r.name.toLowerCase().includes(q) || r.description.toLowerCase().includes(q)}
      onOpen={(id) => router.push(`/iga/directory/governance-teams/${id}`)}
      emptyTitle="No governance teams found"
      emptyMessage="No governance teams match your search."
    />
  );
}
