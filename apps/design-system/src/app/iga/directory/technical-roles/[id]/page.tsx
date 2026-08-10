'use client';

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, type TabItem } from '@ds/components';
import { getTechnicalRoleDetail } from '@/data/directory';
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
} from '@/components/product/directory';

const TABS: TabItem[] = [
  { value: 'overview', label: 'Overview' },
  { value: 'owners', label: 'Assigned Owners' },
  { value: 'members', label: 'User Identities' },
  { value: 'entitlements', label: 'Entitlements' },
];

export default function TechnicalRoleDetailPage() {
  const id = String(useParams().id);
  const router = useRouter();
  const [tab, setTab] = React.useState('overview');
  const detail = getTechnicalRoleDetail(id);

  if (!detail) return <DetailNotFound title="Technical role not found" backHref="/iga/directory/technical-roles" backLabel="Back to Technical Roles" />;
  const { role, members, entitlements } = detail;

  return (
    <DetailShell
      avatar={<EntityAvatar kind="technical-role" name={role.name} size="md" />}
      title={role.name}
      chips={<RiskScoreChip score={role.risk} />}
      description={role.description}
      tabs={TABS}
      tab={tab}
      onTab={setTab}
    >
      {tab === 'overview' && (
        <div className="grid gap-5 lg:grid-cols-2">
          <Card title="Information" padding="none">
            <InfoRowGroup>
              <InfoRow label="Risk Score" value={<RiskScoreChip score={role.risk} />} />
              <InfoRow label="Entitlements" value={entitlements.length} />
              <InfoRow label="Assigned User Identities" value={members.length} />
              <InfoRow label="Owners" value={role.ownerIds.length} />
            </InfoRowGroup>
          </Card>
        </div>
      )}
      {tab === 'owners' && <EntityOwnersTab entityType="technical-role" entityId={role.id} seedOwnerIds={role.ownerIds} label="Owner" />}
      {tab === 'members' && (
        <RelationTable
          columns={peopleColumns}
          rows={members}
          onRowClick={(r) => router.push(`/iga/directory/user-identities/${r.id}`)}
          emptyTitle="No user identities"
          emptyMessage="No one is assigned this technical role yet."
        />
      )}
      {tab === 'entitlements' && (
        <RelationTable
          columns={entitlementColumns}
          rows={entitlements}
          onRowClick={(r) => router.push(`/iga/directory/entitlements/${r.id}`)}
          emptyTitle="No entitlements"
          emptyMessage="This technical role bundles no entitlements yet."
        />
      )}
    </DetailShell>
  );
}
