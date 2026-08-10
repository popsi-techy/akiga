'use client';

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, StatusChip, type TabItem, type StatusIntent } from '@ds/components';
import { getUserIdentityDetail } from '@/data/directory';
import type { IdentityStatus } from '@/data/seed';
import {
  DetailShell,
  DetailNotFound,
  InfoRow,
  InfoRowGroup,
  RelationTable,
  EntityAvatar,
  RiskScoreChip,
  accountColumns,
  roleColumns,
} from '@/components/product/directory';

const STATUS: Record<IdentityStatus, { label: string; intent: StatusIntent }> = {
  active: { label: 'Active', intent: 'success' },
  inactive: { label: 'Inactive', intent: 'neutral' },
  'leaver-pending': { label: 'Leaver Pending', intent: 'warning' },
  terminated: { label: 'Terminated', intent: 'danger' },
};

const TABS: TabItem[] = [
  { value: 'overview', label: 'Overview' },
  { value: 'accounts', label: 'App Accounts' },
  { value: 'technical-roles', label: 'Technical Roles' },
  { value: 'business-roles', label: 'Business Roles' },
];

export default function UserIdentityDetailPage() {
  const id = String(useParams().id);
  const router = useRouter();
  const [tab, setTab] = React.useState('overview');
  const detail = getUserIdentityDetail(id);

  if (!detail) return <DetailNotFound title="User identity not found" backHref="/iga/directory/user-identities" backLabel="Back to User Identities" />;
  const { identity, accounts, technicalRoles, businessRoles } = detail;
  const status = STATUS[identity.status];

  return (
    <DetailShell
      avatar={<EntityAvatar kind="user" name={identity.name} size="md" />}
      title={identity.name}
      chips={
        <>
          <StatusChip intent={status.intent} label={status.label} />
          <RiskScoreChip score={identity.riskScore} />
        </>
      }
      description={`${identity.jobTitle} · ${identity.department}`}
      tabs={TABS}
      tab={tab}
      onTab={setTab}
    >
      {tab === 'overview' && (
        <div className="grid gap-5 lg:grid-cols-2">
          <Card title="Information" padding="none">
            <InfoRowGroup>
              <InfoRow label="Email" value={identity.email} />
              <InfoRow label="Job Title" value={identity.jobTitle} />
              <InfoRow label="Department" value={identity.department} />
              <InfoRow label="Status" value={<StatusChip intent={status.intent} label={status.label} />} />
              <InfoRow label="Risk Score" value={<RiskScoreChip score={identity.riskScore} />} />
            </InfoRowGroup>
          </Card>
          <Card title="Access Summary" padding="none">
            <InfoRowGroup>
              <InfoRow label="App Accounts" value={accounts.length} />
              <InfoRow label="Technical Roles" value={technicalRoles.length} />
              <InfoRow label="Business Roles" value={businessRoles.length} />
            </InfoRowGroup>
          </Card>
        </div>
      )}
      {tab === 'accounts' && (
        <RelationTable
          columns={accountColumns}
          rows={accounts}
          onRowClick={(r) => router.push(`/iga/directory/app-accounts/${r.id}`)}
          emptyTitle="No app accounts"
          emptyMessage="This user has no application accounts yet."
        />
      )}
      {tab === 'technical-roles' && (
        <RelationTable
          columns={roleColumns('technical-role', 'Technical Role')}
          rows={technicalRoles}
          onRowClick={(r) => router.push(`/iga/directory/technical-roles/${r.id}`)}
          emptyTitle="No technical roles"
          emptyMessage="This user is assigned no technical roles yet."
        />
      )}
      {tab === 'business-roles' && (
        <RelationTable
          columns={roleColumns('business-role', 'Business Role')}
          rows={businessRoles}
          onRowClick={(r) => router.push(`/iga/directory/business-roles/${r.id}`)}
          emptyTitle="No business roles"
          emptyMessage="This user is assigned no business roles yet."
        />
      )}
    </DetailShell>
  );
}
