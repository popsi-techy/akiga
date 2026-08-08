'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import type { Column } from '@ds/components';
import { listApplications, type ApplicationRow } from '@/data/directory';
import { DirectoryListPage, EntityAvatar } from '@/components/product/directory';

export default function ApplicationsListPage() {
  const router = useRouter();
  const columns: Column<ApplicationRow>[] = [
    {
      id: 'name',
      header: 'Application Name',
      sortable: true,
      value: (r) => r.name,
      render: (r) => (
        <div className="flex items-center gap-3">
          <EntityAvatar kind="application" name={r.name} />
          <span className="text-body-sm-strong text-text-primary">{r.name}</span>
        </div>
      ),
    },
    { id: 'description', header: 'Description', value: (r) => r.description, render: (r) => <span className="text-text-secondary">{r.description}</span> },
  ];
  return (
    <DirectoryListPage<ApplicationRow>
      title="Applications"
      description="Systems integrated with the IGA platform."
      searchPlaceholder="Search applications"
      columns={columns}
      rows={listApplications()}
      matches={(r, q) => r.name.toLowerCase().includes(q) || r.description.toLowerCase().includes(q)}
      onOpen={(id) => router.push(`/iga/directory/applications/${id}`)}
      emptyTitle="No applications found"
      emptyMessage="No applications match your search."
    />
  );
}
