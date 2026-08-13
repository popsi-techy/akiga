'use client';

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import EditOutlined from '@mui/icons-material/EditOutlined';
import DeleteOutline from '@mui/icons-material/DeleteOutline';
import { Button, Menu, useToast, type TabItem } from '@ds/components';
import { getApplicationDetail } from '@/data/directory';
import {
  DetailShell,
  DetailNotFound,
  RelationTable,
  EntityAvatar,
  ApplicationOverviewTab,
  EntityOwnersTab,
  ApplicationApprovalPolicyTab,
  ReconciliationTab,
  ProvisioningSetupTab,
  BaselineGovernanceTab,
  RiskScoreChip,
  accountColumns,
  entitlementColumns,
} from '@/components/product/directory';
import { getGovEntity } from '@/data/governance';

const LIST_HREF = '/iga/directory/applications';

const TABS: TabItem[] = [
  { value: 'overview', label: 'Overview' },
  { value: 'accounts', label: 'App Accounts' },
  { value: 'entitlements', label: 'Entitlements' },
  { value: 'reconciliation', label: 'Reconciliation' },
  { value: 'provisioning', label: 'Provisioning Setup' },
  { value: 'baseline', label: 'Baseline Governance' },
  { value: 'approval', label: 'Approval Policy' },
  { value: 'owners', label: 'Owners' },
];


export default function ApplicationDetailPage() {
  const id = String(useParams().id);
  const router = useRouter();
  const toast = useToast();
  const [tab, setTab] = React.useState('overview');
  const detail = getApplicationDetail(id);

  if (!detail) {
    return <DetailNotFound title="Application not found" backHref={LIST_HREF} backLabel="Back to Applications" />;
  }
  const { app, accounts, entitlements } = detail;
  const gov = getGovEntity(app.id);

  return (
    <DetailShell
      avatar={<EntityAvatar kind="application" name={app.name} size="md" />}
      title={app.name}
      description={app.description}
      // No gap count here any more: Overview now leads with everything that
      // needs attention, and a header chip counting only the governance half of
      // it would disagree with the list two lines below.
      chips={gov ? <RiskScoreChip score={gov.risk} /> : null}
      actions={
        <>
          <Button variant="secondary" startIcon={<EditOutlined />} onClick={() => toast.info('Edit basic details')}>
            Basic Details
          </Button>
          {/* No Duplicate: an application is a connector to a real external system,
              not a document. Copying the record would claim a second Okta exists. */}
          <Menu
            items={[
              { label: 'Delete', icon: <DeleteOutline sx={{ fontSize: 18 }} />, danger: true, onClick: () => toast.error('Delete is not available in this prototype') },
            ]}
          />
        </>
      }
      tabs={TABS.map((t) =>
        t.value === 'accounts'
          ? { ...t, count: accounts.length }
          : t.value === 'entitlements'
            ? { ...t, count: entitlements.length }
            : t,
      )}
      tab={tab}
      onTab={setTab}
    >
      {tab === 'overview' && (
        <ApplicationOverviewTab app={app} accounts={accounts} entitlements={entitlements} />
      )}
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
      {tab === 'reconciliation' && <ReconciliationTab applicationId={app.id} />}
      {tab === 'provisioning' && <ProvisioningSetupTab applicationId={app.id} applicationName={app.name} />}
      {tab === 'baseline' && <BaselineGovernanceTab applicationId={app.id} entitlements={entitlements} />}
      {tab === 'approval' && <ApplicationApprovalPolicyTab applicationId={app.id} />}
      {tab === 'owners' && (
        <EntityOwnersTab
          entityType="application"
          entityId={app.id}
          seedOwnerIds={app.ownerIds}
          label="Owner"
          emptyHint="Nobody is accountable for this application. Add an owner to approve access requests and attest to its risk."
        />
      )}
    </DetailShell>
  );
}
