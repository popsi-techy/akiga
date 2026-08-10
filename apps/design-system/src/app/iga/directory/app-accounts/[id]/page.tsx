'use client';

import * as React from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Card, StatusChip, type TabItem } from '@ds/components';
import { getAppAccountDetail } from '@/data/directory';
import {
  DetailShell,
  DetailNotFound,
  InfoRow,
  InfoRowGroup,
  RelationTable,
  EntityAvatar,
  entitlementColumns,
} from '@/components/product/directory';

const TABS: TabItem[] = [
  { value: 'overview', label: 'Overview' },
  { value: 'entitlements', label: 'Entitlements' },
];

export default function AppAccountDetailPage() {
  const id = String(useParams().id);
  const router = useRouter();
  const [tab, setTab] = React.useState('overview');
  const detail = getAppAccountDetail(id);

  if (!detail) return <DetailNotFound title="App account not found" backHref="/iga/directory/app-accounts" backLabel="Back to App Accounts" />;
  const { account, applicationName, identityName, entitlements } = detail;

  return (
    <DetailShell
      avatar={<EntityAvatar kind="account" name={account.accountName} size="md" />}
      title={account.accountName}
      chips={account.identityId === null ? <StatusChip intent="warning" label="Orphan" /> : undefined}
      description={`${applicationName} account`}
      tabs={TABS}
      tab={tab}
      onTab={setTab}
    >
      {tab === 'overview' && (
        <div className="grid gap-5 lg:grid-cols-2">
          <Card title="Information" padding="none">
            <InfoRowGroup>
              <InfoRow
                label="Application"
                value={
                  <Link href={`/iga/directory/applications/${account.applicationId}`} className="text-text-link hover:underline">
                    {applicationName}
                  </Link>
                }
              />
              <InfoRow
                label="Owner (User Identity)"
                value={
                  account.identityId && identityName ? (
                    <Link href={`/iga/directory/user-identities/${account.identityId}`} className="text-text-link hover:underline">
                      {identityName}
                    </Link>
                  ) : (
                    <span className="text-[var(--ds-color-status-warning-fg)]">Orphan — no owner</span>
                  )
                }
              />
              <InfoRow label="Email" value={account.email || '—'} />
              <InfoRow label="Entitlements" value={entitlements.length} />
            </InfoRowGroup>
          </Card>
        </div>
      )}
      {tab === 'entitlements' && (
        <RelationTable
          columns={entitlementColumns}
          rows={entitlements}
          onRowClick={(r) => router.push(`/iga/directory/entitlements/${r.id}`)}
          emptyTitle="No entitlements"
          emptyMessage="This account holds no entitlements yet."
        />
      )}
    </DetailShell>
  );
}
