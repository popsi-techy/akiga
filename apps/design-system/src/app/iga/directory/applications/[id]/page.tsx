'use client';

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, type TabItem } from '@ds/components';
import { getApplicationDetail } from '@/data/directory';
import {
  DetailShell,
  DetailNotFound,
  InfoRow,
  InfoRowGroup,
  RelationTable,
  EntityAvatar,
  EntityOwnersTab,
  accountColumns,
  entitlementColumns,
} from '@/components/product/directory';

const TABS: TabItem[] = [
  { value: 'overview', label: 'Overview' },
  { value: 'owners', label: 'Assigned Owners' },
  { value: 'accounts', label: 'App Accounts' },
  { value: 'entitlements', label: 'Entitlements' },
];

export default function ApplicationDetailPage() {
  const id = String(useParams().id);
  const router = useRouter();
  const [tab, setTab] = React.useState('overview');
  const detail = getApplicationDetail(id);

  if (!detail) return <DetailNotFound title="Application not found" backHref="/iga/directory/applications" backLabel="Back to Applications" />;
  const { app, accounts, entitlements } = detail;

  return (
    <DetailShell
      avatar={<EntityAvatar kind="application" name={app.name} size="md" />}
      title={app.name}
      description={app.description}
      backHref="/iga/directory/applications"
      backLabel="Applications"
      tabs={TABS}
      tab={tab}
      onTab={setTab}
    >
      {tab === 'overview' && (
        <div className="grid gap-5 lg:grid-cols-2">
          <Card title="Information" padding="none">
            <InfoRowGroup>
              <InfoRow label="App Accounts" value={accounts.length} />
              <InfoRow label="Entitlements" value={entitlements.length} />
              <InfoRow label="Owners" value={app.ownerIds.length} />
            </InfoRowGroup>
          </Card>
        </div>
      )}
      {tab === 'owners' && <EntityOwnersTab entityType="application" entityId={app.id} seedOwnerIds={app.ownerIds} label="Owner" />}
      {tab === 'accounts' && (
        <RelationTable
          columns={accountColumns}
          rows={accounts}
          onRowClick={(r) => router.push(`/iga/directory/app-accounts/${r.id}`)}
          emptyTitle="No app accounts"
          emptyMessage="No accounts exist in this application yet."
        />
      )}
      {tab === 'entitlements' && (
        <RelationTable
          columns={entitlementColumns}
          rows={entitlements}
          onRowClick={(r) => router.push(`/iga/directory/entitlements/${r.id}`)}
          emptyTitle="No entitlements"
          emptyMessage="This application exposes no entitlements yet."
        />
      )}
    </DetailShell>
  );
}
