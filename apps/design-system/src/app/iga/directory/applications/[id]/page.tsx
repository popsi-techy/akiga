'use client';

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import EditOutlined from '@mui/icons-material/EditOutlined';
import DeleteOutline from '@mui/icons-material/DeleteOutline';
import Info from '@mui/icons-material/Info';
import {
  Button,
  Card,
  InfoRow,
  InfoRowGroup,
  Menu,
  ProgressRing,
  StatusChip,
  Tooltip,
  useToast,
  type TabItem,
} from '@ds/components';
import { getApplicationDetail } from '@/data/directory';
import { APP_REQUIRED_STEPS, appBlockingSteps } from '@/data/application-setup';
import { connectApplication } from '@/data/applications-store';
import {
  DetailShell,
  DetailNotFound,
  RelationTable,
  EntityAvatar,
  ApplicationOverviewTab,
  ApplicationSetupCard,
  ApplicationBasicDetailsDrawer,
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

const BASE_TABS: TabItem[] = [
  { value: 'overview', label: 'Overview' },
  { value: 'accounts', label: 'App Accounts' },
  { value: 'entitlements', label: 'Entitlements' },
  { value: 'reconciliation', label: 'Reconciliation' },
  { value: 'provisioning', label: 'Provisioning Setup' },
  { value: 'baseline', label: 'Baseline Governance' },
  { value: 'approval', label: 'Approval Policy' },
  { value: 'owners', label: 'Owners' },
];

function tabsFor(isSetup: boolean, accounts: number, entitlements: number): TabItem[] {
  return BASE_TABS.map((t) => {
    if (t.value === 'overview') return { ...t, label: isSetup ? 'Setup' : 'Overview' };
    if (t.value === 'accounts') return { ...t, count: accounts };
    if (t.value === 'entitlements') return { ...t, count: entitlements };
    return t;
  });
}

export default function ApplicationDetailPage() {
  const id = String(useParams().id);
  const router = useRouter();
  const toast = useToast();
  const [tab, setTab] = React.useState('overview');
  const [basicsOpen, setBasicsOpen] = React.useState(false);
  const [, bump] = React.useReducer((n: number) => n + 1, 0);

  const detail = getApplicationDetail(id);
  const onboarded = detail?.onboarded;
  const isSetup = onboarded?.status === 'setup';

  if (!detail) {
    return <DetailNotFound title="Application not found" backHref={LIST_HREF} backLabel="Back to Applications" />;
  }

  const { app, accounts, entitlements } = detail;
  const gov = getGovEntity(app.id);
  const blocking = onboarded ? appBlockingSteps(onboarded) : [];

  const connect = () => {
    if (!onboarded || blocking.length > 0) return;
    connectApplication(onboarded.id);
    toast.success(`“${onboarded.name}” is connected. IGA can now reach this application.`);
    bump();
    setTab('overview');
  };

  return (
    <>
      <DetailShell
        avatar={<EntityAvatar kind="application" name={app.name} size="md" />}
        title={app.name}
        description={app.description}
        chips={
          <>
            {isSetup ? <StatusChip intent="warning" label="Setup" /> : null}
            {gov ? <RiskScoreChip score={gov.risk} /> : null}
          </>
        }
        actions={
          <>
            <Button
              variant="secondary"
              startIcon={<EditOutlined />}
              onClick={() => (onboarded ? setBasicsOpen(true) : toast.info('Edit basic details'))}
            >
              Basic Details
            </Button>
            {isSetup && onboarded ? (
              <Tooltip
                title={
                  blocking.length > 0
                    ? `Add ${blocking.join(' and ')} before this can be connected.`
                    : 'Let IGA reach this application'
                }
              >
                <span>
                  <Button
                    startIcon={
                      <ProgressRing
                        value={APP_REQUIRED_STEPS - blocking.length}
                        total={APP_REQUIRED_STEPS}
                        accent={blocking.length > 0 ? 'var(--ds-color-status-success-fill)' : undefined}
                      />
                    }
                    disabled={blocking.length > 0}
                    onClick={connect}
                  >
                    {blocking.length > 0
                      ? `${blocking.length} required step${blocking.length === 1 ? '' : 's'} to connect`
                      : 'Connect'}
                  </Button>
                </span>
              </Tooltip>
            ) : null}
            <Menu
              items={[
                {
                  label: 'Delete',
                  icon: <DeleteOutline sx={{ fontSize: 18 }} />,
                  danger: true,
                  onClick: () => toast.error('Delete is not available in this prototype'),
                },
              ]}
            />
          </>
        }
        tabs={tabsFor(isSetup, accounts.length, entitlements.length)}
        tab={tab}
        onTab={setTab}
      >
        {tab === 'overview' &&
          (isSetup && onboarded ? (
            <div className="ds-scroll h-full overflow-y-auto pr-0.5">
              <div className="grid items-start gap-5 lg:grid-cols-[1fr_340px]">
                <ApplicationSetupCard
                  app={onboarded}
                  onGoToTab={setTab}
                  onEditBasics={() => setBasicsOpen(true)}
                  onConnect={connect}
                />
                <Card title="Application type" icon={<Info />} padding="none">
                  <InfoRowGroup>
                    <InfoRow label="Type" value={onboarded.appType} />
                    <InfoRow
                      label="Provisioning"
                      value={onboarded.enableProvisioning ? 'Enabled' : 'Off'}
                    />
                    <InfoRow
                      label="Identity source"
                      value={onboarded.identitySource ? 'Yes' : 'No'}
                    />
                    <InfoRow label="Requestable" value={onboarded.requestable ? 'Yes' : 'No'} />
                  </InfoRowGroup>
                </Card>
              </div>
            </div>
          ) : (
            <ApplicationOverviewTab app={app} accounts={accounts} entitlements={entitlements} />
          ))}
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
        {tab === 'provisioning' && (
          <ProvisioningSetupTab applicationId={app.id} applicationName={app.name} onChanged={bump} />
        )}
        {tab === 'baseline' && <BaselineGovernanceTab applicationId={app.id} entitlements={entitlements} />}
        {tab === 'approval' && <ApplicationApprovalPolicyTab applicationId={app.id} />}
        {tab === 'owners' && (
          <EntityOwnersTab
            entityType="application"
            entityId={app.id}
            seedOwnerIds={app.ownerIds}
            label="Owner"
            emptyHint="Nobody is accountable for this application. Add an owner to approve access requests and attest to its risk."
            onChanged={bump}
          />
        )}
      </DetailShell>

      {onboarded ? (
        <ApplicationBasicDetailsDrawer
          open={basicsOpen}
          app={onboarded}
          onClose={() => setBasicsOpen(false)}
          onSaved={() => {
            bump();
            toast.success('Basic details saved.');
          }}
        />
      ) : null}
    </>
  );
}
