'use client';

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, SegmentedControl, type TabItem } from '@ds/components';
import { getEntitlementDetail, type AppAccountRow } from '@/data/directory';
import {
  DetailShell,
  DetailNotFound,
  InfoRow,
  InfoRowGroup,
  RelationTable,
  EntityAvatar,
  EntityOwnersTab,
  RiskScoreChip,
  accountColumns,
  roleColumns,
  infoIcon,
  AccountDetailsDrawer,
  AccountAccessVariants,
  ACCOUNT_PEEK_VARIANTS,
  type AccountPeekVariant,
} from '@/components/product/directory';

/** Demo fixture — see `AccountAccessVariants`. Remove once a variant is chosen. */
const DEMO_ENTITLEMENT_ID = 'ent-testent';

const TABS: TabItem[] = [
  { value: 'overview', label: 'Overview' },
  { value: 'owners', label: 'Assigned Owners' },
  { value: 'accounts', label: 'App Accounts' },
  { value: 'technical-roles', label: 'Technical Roles' },
  { value: 'business-roles', label: 'Business Roles' },
];

export default function EntitlementDetailPage() {
  const id = String(useParams().id);
  const router = useRouter();
  const [tab, setTab] = React.useState('overview');
  // Peek at a related account in place; the drawer offers its page as a second step.
  const [peekAccount, setPeekAccount] = React.useState<AppAccountRow | null>(null);
  const [peekVariant, setPeekVariant] = React.useState<AccountPeekVariant>('hover');
  const detail = getEntitlementDetail(id);

  if (!detail) return <DetailNotFound title="Entitlement not found" backHref="/iga/directory/entitlements" backLabel="Back to Entitlements" />;
  const { entitlement, accounts, technicalRoles, businessRoles } = detail;
  const demo = entitlement.id === DEMO_ENTITLEMENT_ID;

  return (
    <DetailShell
      avatar={<EntityAvatar kind="entitlement" name={entitlement.name} size="md" />}
      title={entitlement.name}
      chips={<RiskScoreChip score={entitlement.risk} />}
      description={entitlement.description}
      // Only while the tab it governs is open — a control in the header that
      // changes nothing you can see is worse than no control.
      actions={
        demo && tab === 'accounts' ? (
          <SegmentedControl
            ariaLabel="Account details interaction"
            options={ACCOUNT_PEEK_VARIANTS}
            value={peekVariant}
            onChange={setPeekVariant}
          />
        ) : undefined
      }
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
              <InfoRow icon={infoIcon.owner} label="Owners" value={entitlement.ownerIds.length} />
              <InfoRow icon={infoIcon.account} label="App Accounts" value={accounts.length} />
              <InfoRow icon={infoIcon.technicalRole} label="Technical Roles" value={technicalRoles.length} />
              <InfoRow icon={infoIcon.businessRole} label="Business Roles" value={businessRoles.length} />
            </InfoRowGroup>
          </Card>
        </div>
      )}
      {tab === 'owners' && <EntityOwnersTab entityType="entitlement" entityId={entitlement.id} seedOwnerIds={entitlement.ownerIds} label="Owner" />}
      {tab === 'accounts' &&
        // The demo entitlement carries the comparison harness; every other
        // entitlement keeps the shipped behaviour, so the two can be judged
        // side by side without the product itself becoming a prototype.
        (demo ? (
          <AccountAccessVariants accounts={accounts} variant={peekVariant} />
        ) : (
          <RelationTable
            columns={accountColumns}
            rows={accounts}
            onRowClick={(r) => setPeekAccount(r)}
            emptyTitle="No app accounts"
            emptyMessage="No accounts currently hold this entitlement."
          />
        ))}
      {tab === 'technical-roles' && (
        <RelationTable
          columns={roleColumns('technical-role', 'Technical Role')}
          rows={technicalRoles}
          onRowClick={(r) => router.push(`/iga/directory/technical-roles/${r.id}`)}
          emptyTitle="No technical roles"
          emptyMessage="No technical roles bundle this entitlement."
        />
      )}
      {tab === 'business-roles' && (
        <RelationTable
          columns={roleColumns('business-role', 'Business Role')}
          rows={businessRoles}
          onRowClick={(r) => router.push(`/iga/directory/business-roles/${r.id}`)}
          emptyTitle="No business roles"
          emptyMessage="No business roles include this entitlement directly."
        />
      )}

      <AccountDetailsDrawer
        account={peekAccount}
        open={peekAccount !== null}
        onClose={() => setPeekAccount(null)}
      />
    </DetailShell>
  );
}
