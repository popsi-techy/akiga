'use client';

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, type TabItem } from '@ds/components';
import { getBusinessRoleDetail } from '@/data/directory';
import {
  DetailShell,
  DetailNotFound,
  InfoRow,
  InfoRowGroup,
  RelationTable,
  EntityAvatar,
  EntityOwnersTab,
  RiskScoreChip,
  peopleColumns,
  entitlementColumns,
  roleColumns,
} from '@/components/product/directory';

const TABS: TabItem[] = [
  { value: 'overview', label: 'Overview' },
  { value: 'owners', label: 'Assigned Owners' },
  { value: 'members', label: 'User Identities' },
  { value: 'technical-roles', label: 'Technical Roles' },
  { value: 'entitlements', label: 'Entitlements' },
];

export default function BusinessRoleDetailPage() {
  const id = String(useParams().id);
  const router = useRouter();
  const [tab, setTab] = React.useState('overview');
  const detail = getBusinessRoleDetail(id);

  if (!detail) return <DetailNotFound title="Business role not found" backHref="/iga/directory/business-roles" backLabel="Back to Business Roles" />;
  const { role, members, technicalRoles, entitlements } = detail;

  return (
    <DetailShell
      avatar={<EntityAvatar kind="business-role" name={role.name} size="md" />}
      title={role.name}
      chips={<RiskScoreChip score={role.risk} />}
      description={role.description}
      backHref="/iga/directory/business-roles"
      backLabel="Business Roles"
      tabs={TABS}
      tab={tab}
      onTab={setTab}
    >
      {tab === 'overview' && (
        <div className="grid gap-5 lg:grid-cols-2">
          <Card title="Information" padding="none">
            <InfoRowGroup>
              <InfoRow label="Risk Score" value={<RiskScoreChip score={role.risk} />} />
              <InfoRow label="Technical Roles" value={technicalRoles.length} />
              <InfoRow label="Direct Entitlements" value={entitlements.length} />
              <InfoRow label="Assigned User Identities" value={members.length} />
              <InfoRow label="Owners" value={role.ownerIds.length} />
            </InfoRowGroup>
          </Card>
        </div>
      )}
      {tab === 'owners' && <EntityOwnersTab entityType="business-role" entityId={role.id} seedOwnerIds={role.ownerIds} label="Owner" />}
      {tab === 'members' && (
        <RelationTable
          columns={peopleColumns}
          rows={members}
          onRowClick={(r) => router.push(`/iga/directory/user-identities/${r.id}`)}
          emptyTitle="No user identities"
          emptyMessage="No one is assigned this business role yet."
        />
      )}
      {tab === 'technical-roles' && (
        <RelationTable
          columns={roleColumns('technical-role', 'Technical Role')}
          rows={technicalRoles}
          onRowClick={(r) => router.push(`/iga/directory/technical-roles/${r.id}`)}
          emptyTitle="No technical roles"
          emptyMessage="This business role contains no technical roles yet."
        />
      )}
      {tab === 'entitlements' && (
        <RelationTable
          columns={entitlementColumns}
          rows={entitlements}
          onRowClick={(r) => router.push(`/iga/directory/entitlements/${r.id}`)}
          emptyTitle="No entitlements"
          emptyMessage="This business role adds no entitlements directly."
        />
      )}
    </DetailShell>
  );
}
