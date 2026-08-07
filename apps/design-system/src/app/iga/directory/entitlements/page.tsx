'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import type { Column } from '@ds/components';
import { listEntitlementRows, type EntitlementRow } from '@/data/directory';
import { DirectoryListPage, EntityAvatar, RiskScoreChip } from '@/components/product/directory';

export default function EntitlementsListPage() {
  const router = useRouter();
  const columns: Column<EntitlementRow>[] = [
    {
      id: 'name',
      header: 'Entitlement Name',
      sortable: true,
      value: (r) => r.name,
      render: (r) => (
        <div className="flex items-center gap-3">
          <EntityAvatar kind="entitlement" name={r.name} />
          <span className="font-medium text-text-primary">{r.name}</span>
        </div>
      ),
    },
    { id: 'description', header: 'Description', value: (r) => r.description, render: (r) => <span className="text-text-secondary">{r.description}</span> },
    { id: 'application', header: 'Application', sortable: true, value: (r) => r.applicationName, render: (r) => <span className="text-text-secondary">{r.applicationName}</span> },
    { id: 'risk', header: 'Risk Score', sortable: true, align: 'right', value: (r) => r.risk, render: (r) => <RiskScoreChip score={r.risk} /> },
  ];
  return (
    <DirectoryListPage<EntitlementRow>
      title="Entitlements"
      description="Permissions and access rights within an application."
      searchPlaceholder="Search entitlements"
      columns={columns}
      rows={listEntitlementRows()}
      matches={(r, q) => r.name.toLowerCase().includes(q) || r.description.toLowerCase().includes(q) || r.applicationName.toLowerCase().includes(q)}
      onOpen={(id) => router.push(`/iga/directory/entitlements/${id}`)}
      emptyTitle="No entitlements found"
      emptyMessage="No entitlements match your search."
    />
  );
}
