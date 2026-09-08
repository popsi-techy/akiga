'use client';

import * as React from 'react';
import { useParams } from 'next/navigation';
import { Card, type TabItem } from '@ds/components';
import { getEntitlementDetail, entityAccountable, type AccountableParty } from '@/data/directory';
import {
  DetailShell,
  DetailNotFound,
  InfoRow,
  InfoRowGroup,
  EntityAvatar,
  EntityOwnersTab,
  RiskScoreChip,
  infoIcon,
  AppAccountsPeek,
} from '@/components/product/directory';

const TABS: TabItem[] = [
  { value: 'overview', label: 'Overview' },
  { value: 'owners', label: 'Assigned Owners' },
  { value: 'accounts', label: 'App Accounts' },
];

export default function EntitlementDetailPage() {
  const id = String(useParams().id);
  const [tab, setTab] = React.useState('overview');
  /*
    Individuals and Governance Teams both, read after mount: the owner store and the team
    charter are session state, and the count here has to be the same number the Owners tab
    shows. Reading `entitlement.ownerIds` was the seed — it ignored every owner added since, and
    every team accountable for this entitlement.
  */
  const [accountable, setAccountable] = React.useState<AccountableParty[]>([]);
  React.useEffect(() => {
    const d = getEntitlementDetail(id);
    setAccountable(d ? entityAccountable('entitlement', d.entitlement.id, d.entitlement.ownerIds) : []);
  }, [id]);
  const detail = getEntitlementDetail(id);

  if (!detail) return <DetailNotFound title="Entitlement not found" backHref="/iga/directory/entitlements" backLabel="Back to Entitlements" />;
  const { entitlement, accounts, technicalRoles, businessRoles } = detail;

  return (
    <DetailShell
      avatar={<EntityAvatar kind="entitlement" name={entitlement.name} size="md" />}
      title={entitlement.name}
      chips={<RiskScoreChip score={entitlement.risk} />}
      description={entitlement.description}
      tabs={TABS}
      tab={tab}
      onTab={setTab}
    >
      {tab === 'overview' && (
        <div className="grid gap-5 lg:grid-cols-2">
          <Card title="Information" padding="none">
            <InfoRowGroup>
              <InfoRow icon={infoIcon.application} label="Application" value={entitlement.applicationName} />
              <InfoRow icon={infoIcon.risk} label="Risk Score" value={<RiskScoreChip score={entitlement.risk} />} />
              <InfoRow icon={infoIcon.owner} label="Owners" value={accountable.length} />
              <InfoRow icon={infoIcon.account} label="App Accounts" value={accounts.length} />
              <InfoRow icon={infoIcon.technicalRole} label="Technical Roles" value={technicalRoles.length} />
              <InfoRow icon={infoIcon.businessRole} label="Business Roles" value={businessRoles.length} />
            </InfoRowGroup>
          </Card>
        </div>
      )}
      {tab === 'owners' && <EntityOwnersTab entityType="entitlement" entityId={entitlement.id} seedOwnerIds={entitlement.ownerIds} label="Owner" />}
      {tab === 'accounts' && <AppAccountsPeek accounts={accounts} />}
    </DetailShell>
  );
}
