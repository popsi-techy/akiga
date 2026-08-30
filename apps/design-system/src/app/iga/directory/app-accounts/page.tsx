'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { IdentityCell, StatusChip, type Column } from '@ds/components';
import { listAppAccounts, type AppAccountRow } from '@/data/directory';
import { DirectoryListPage } from '@/components/product/directory';
import { AppBadge } from '@/components/product/sod/labels';

export default function AppAccountsListPage() {
  const router = useRouter();
  const columns: Column<AppAccountRow>[] = [
    {
      id: 'name',
      header: 'Account Name',
      sortable: true,
      wrap: true,
      value: (r) => r.accountName,
      render: (r) => (
        <IdentityCell
          name={r.accountName}
          email={r.email}
          kind="entity"
          trailing={r.orphan ? <StatusChip intent="warning" label="Orphan" /> : undefined}
        />
      ),
    },
    {
      id: 'application',
      header: 'Application',
      sortable: true,
      value: (r) => r.applicationName,
      render: (r) => (
        <span className="flex items-center gap-2 text-text-secondary">
          <AppBadge app={r.applicationName} size={20} />
          {r.applicationName}
        </span>
      ),
    },
  ];
  return (
    <DirectoryListPage<AppAccountRow>
      title="App Accounts"
      description="A User Identity's account within a specific application."
      searchPlaceholder="Search accounts"
      columns={columns}
      rows={listAppAccounts()}
      matches={(r, q) => r.accountName.toLowerCase().includes(q) || r.email.toLowerCase().includes(q) || r.applicationName.toLowerCase().includes(q)}
      onOpen={(id) => router.push(`/iga/directory/app-accounts/${id}`)}
      emptyTitle="No app accounts found"
      emptyMessage="No accounts match your search."
    />
  );
}
