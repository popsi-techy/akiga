'use client';

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, type TabItem } from '@ds/components';
import { getGovernanceGroupDetail } from '@/data/directory';
import {
  DetailShell,
  DetailNotFound,
  InfoRow,
  InfoRowGroup,
  RelationTable,
  EntityAvatar,
  EntityOwnersTab,
  applicationColumns,
  entitlementColumns,
  roleColumns,
} from '@/components/product/directory';

const TABS: TabItem[] = [
  { value: 'overview', label: 'Overview' },
  { value: 'reviewers', label: 'Reviewers' },
  { value: 'applications', label: 'Owned Applications' },
  { value: 'entitlements', label: 'Owned Entitlements' },
  { value: 'technical-roles', label: 'Owned Technical Roles' },
  { value: 'business-roles', label: 'Owned Business Roles' },
];

export default function GovernanceGroupDetailPage() {
  const id = String(useParams().id);
  const router = useRouter();
  const [tab, setTab] = React.useState('overview');
  const detail = getGovernanceGroupDetail(id);

  if (!detail) return <DetailNotFound title="Governance group not found" backHref="/iga/directory/governance-groups" backLabel="Back to Governance Groups" />;
  const { group, reviewers, ownedApplications, ownedEntitlements, ownedTechnicalRoles, ownedBusinessRoles } = detail;

  return (
    <DetailShell
      avatar={<EntityAvatar kind="governance-group" name={group.name} size="md" />}
      title={group.name}
      description={group.description}
      backHref="/iga/directory/governance-groups"
      backLabel="Governance Groups"
      tabs={TABS}
      tab={tab}
      onTab={setTab}
    >
      {tab === 'overview' && (
        <div className="grid gap-5 lg:grid-cols-2">
          <Card title="Information" padding="none">
            <InfoRowGroup>
              <InfoRow label="Reviewers" value={reviewers.length} />
              <InfoRow label="Owned Applications" value={ownedApplications.length} />
              <InfoRow label="Owned Entitlements" value={ownedEntitlements.length} />
              <InfoRow label="Owned Technical Roles" value={ownedTechnicalRoles.length} />
              <InfoRow label="Owned Business Roles" value={ownedBusinessRoles.length} />
            </InfoRowGroup>
          </Card>
        </div>
      )}
      {tab === 'reviewers' && (
        <EntityOwnersTab entityType="governance-group" entityId={group.id} seedOwnerIds={group.reviewerIds} label="Reviewer" emptyHint="Add User Identities as reviewers for this governance group." />
      )}
      {tab === 'applications' && (
        <RelationTable
          columns={applicationColumns}
          rows={ownedApplications}
          onRowClick={(r) => router.push(`/iga/directory/applications/${r.id}`)}
          emptyTitle="No owned applications"
          emptyMessage="This group owns no applications yet."
        />
      )}
      {tab === 'entitlements' && (
        <RelationTable
          columns={entitlementColumns}
          rows={ownedEntitlements}
          onRowClick={(r) => router.push(`/iga/directory/entitlements/${r.id}`)}
          emptyTitle="No owned entitlements"
          emptyMessage="This group owns no entitlements yet."
        />
      )}
      {tab === 'technical-roles' && (
        <RelationTable
          columns={roleColumns('technical-role', 'Technical Role')}
          rows={ownedTechnicalRoles}
          onRowClick={(r) => router.push(`/iga/directory/technical-roles/${r.id}`)}
          emptyTitle="No owned technical roles"
          emptyMessage="This group owns no technical roles yet."
        />
      )}
      {tab === 'business-roles' && (
        <RelationTable
          columns={roleColumns('business-role', 'Business Role')}
          rows={ownedBusinessRoles}
          onRowClick={(r) => router.push(`/iga/directory/business-roles/${r.id}`)}
          emptyTitle="No owned business roles"
          emptyMessage="This group owns no business roles yet."
        />
      )}
    </DetailShell>
  );
}
