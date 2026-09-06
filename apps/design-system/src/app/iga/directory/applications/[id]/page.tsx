'use client';

import * as React from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import EditOutlined from '@mui/icons-material/EditOutlined';
import DeleteOutline from '@mui/icons-material/DeleteOutline';
import CheckCircleOutlined from '@mui/icons-material/CheckCircleOutlined';
import BlockOutlined from '@mui/icons-material/BlockOutlined';
import {
  Button,
  Dialog,
  Menu,
  StatusChip,
  Tooltip,
  useToast,
  type TabItem,
} from '@ds/components';
import {
  activateApplication,
  applicationIsAuthorized,
  applicationLifecycle,
  deactivateApplication,
  deleteApplication,
  getApplicationDetail,
} from '@/data/directory';
import { appBlockingSteps, applicationShowsConfigure, requiredAppSetupCount } from '@/data/application-setup';
import { appProfileFor } from '@/data/seed';
import {
  applicationSetupSteps,
  firstUnfinishedAppTab,
} from '@/components/product/directory/applicationSetupSteps';
import {
  DetailShell,
  DetailNotFound,
  RelationTable,
  EntityAvatar,
  APPLICATION_LIFECYCLE_CHIP,
  ApplicationOverviewTab,
  ApplicationBasicDetailsDrawer,
  EntityOwnersTab,
  ApplicationApprovalPolicyTab,
  ReconciliationTab,
  ProvisioningSetupTab,
  BaselineAccessTab,
  RiskScoreChip,
  accountColumns,
  entitlementColumns,
} from '@/components/product/directory';
import { getGovEntity } from '@/data/governance';
import { EmergencyAccessGuideButton } from '@/components/product/emergency/EmergencyAccessGuideModal';
import { SetupChecklistDock } from '@/components/product/emergency/SetupChecklistDock';

const LIST_HREF = '/iga/directory/applications';

const BASE_TABS: TabItem[] = [
  { value: 'overview', label: 'Overview' },
  { value: 'accounts', label: 'App Accounts' },
  { value: 'entitlements', label: 'Entitlements' },
  { value: 'provisioning', label: 'Configure' },
  { value: 'reconciliation', label: 'Reconciliation' },
  { value: 'owners', label: 'Owners' },
  { value: 'baseline', label: 'Baseline Access' },
  { value: 'approval', label: 'Approval Policy' },
];

/** Collections that only exist once IGA can reach the application. */
const CONNECTED_ONLY = new Set(['overview', 'accounts', 'entitlements']);

function sectionsFor(accounts: number, entitlements: number): TabItem[] {
  return BASE_TABS.map((t) => {
    if (t.value === 'accounts') return { ...t, count: accounts };
    if (t.value === 'entitlements') return { ...t, count: entitlements };
    return t;
  });
}

export default function ApplicationDetailPage() {
  const id = String(useParams().id);
  const router = useRouter();
  const toast = useToast();
  const requestedTab = useSearchParams().get('tab');
  const [tab, setTab] = React.useState(requestedTab ?? 'overview');
  const [basicsOpen, setBasicsOpen] = React.useState(false);
  const [checklistOpen, setChecklistOpen] = React.useState(false);
  const [pendingDelete, setPendingDelete] = React.useState(false);
  const [pendingDeactivate, setPendingDeactivate] = React.useState(false);
  const [, bump] = React.useReducer((n: number) => n + 1, 0);

  /**
   * The onboarding store is `localStorage`-backed, so it is empty during SSR and full on
   * the client. Reading it while rendering made the two disagree and React threw a
   * hydration error on any application that had been onboarded — the server rendered
   * "not found" or a connected profile, the client a profile in draft.
   *
   * So it is read after mount, like every other session-memory store in this codebase,
   * and nothing renders until then. Unlike the emergency-access stores this one survives
   * a reload, which is exactly why it cannot be read during the first render.
   */
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  const detail = mounted ? getApplicationDetail(id) : null;
  const onboarded = detail?.onboarded;
  const isDraft = onboarded?.status === 'setup';

  React.useEffect(() => {
    if (mounted && onboarded?.status === 'setup') setChecklistOpen(true);
  }, [mounted, onboarded?.id, onboarded?.status]);

  if (!mounted) return null;
  if (!detail) {
    return <DetailNotFound title="Application not found" backHref={LIST_HREF} backLabel="Back to Applications" />;
  }

  const { app, accounts, entitlements } = detail;
  const gov = getGovEntity(app.id);
  const blocking = onboarded ? appBlockingSteps(onboarded) : [];
  const steps = onboarded ? applicationSetupSteps(onboarded) : [];
  const requiredTotal = onboarded ? requiredAppSetupCount(onboarded) : 0;
  // Catalogued apps use the seed profile; onboarded apps use the toggle the
  // admin set in the drawer. Off means IGA will not talk to the system — no
  // Configure, no Reconciliation.
  const showsConfigure = onboarded
    ? applicationShowsConfigure(onboarded)
    : appProfileFor(app.id).externalProvisioning === 'enabled';

  const allSections = sectionsFor(accounts.length, entitlements.length).filter((s) => {
    if (s.value === 'provisioning' || s.value === 'reconciliation') return showsConfigure;
    return true;
  });
  const visibleTabs = isDraft
    ? allSections.filter((s) => !CONNECTED_ONLY.has(s.value))
    : allSections;

  const shownTab = visibleTabs.some((t) => t.value === tab)
    ? tab
    : isDraft && onboarded
      ? firstUnfinishedAppTab(onboarded)
      : 'overview';

  const lifecycle = applicationLifecycle(app.id);
  const lifecycleChip = APPLICATION_LIFECYCLE_CHIP[lifecycle];
  const authorized = applicationIsAuthorized(app.id);
  const isActive = lifecycle === 'active';
  const activateBlocked = isDraft && blocking.length > 0;

  const activate = () => {
    if (activateBlocked) return;
    const ok = activateApplication(app.id);
    if (!ok) {
      toast.error('Could not activate this application.');
      return;
    }
    toast.success(`“${app.name}” is active.`);
    bump();
    if (isDraft) setTab('overview');
  };

  const deactivate = () => {
    const ok = deactivateApplication(app.id);
    setPendingDeactivate(false);
    if (!ok) {
      toast.error('Could not deactivate this application.');
      return;
    }
    toast.success(`“${app.name}” is inactive.`);
    bump();
  };

  return (
    <>
      <DetailShell
        avatar={<EntityAvatar kind="application" name={app.name} appType={onboarded?.appType} size="md" />}
        title={app.name}
        description={app.description}
        chips={
          <>
            <StatusChip intent={lifecycleChip.intent} label={lifecycleChip.label} />
            <StatusChip
              intent={authorized ? 'success' : 'warning'}
              label={authorized ? 'Authorized' : 'Not authorized'}
            />
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
            {isActive ? (
              <Button
                variant="secondary"
                startIcon={<BlockOutlined />}
                onClick={() => setPendingDeactivate(true)}
              >
                Deactivate
              </Button>
            ) : (
              <Tooltip
                describeChild
                title={
                  activateBlocked
                    ? `Add ${blocking.join(' and ')} before this can be activated.`
                    : isDraft
                      ? 'Make this application live in the catalog'
                      : 'Turn this application back on'
                }
              >
                <Button
                  startIcon={<CheckCircleOutlined />}
                  disabled={activateBlocked}
                  onClick={activate}
                >
                  Activate
                </Button>
              </Tooltip>
            )}
            <Menu
              items={[
                {
                  label: 'Delete',
                  icon: <DeleteOutline sx={{ fontSize: 18 }} />,
                  danger: true,
                  onClick: () => setPendingDelete(true),
                },
              ]}
            />
            {onboarded ? (
              <EmergencyAccessGuideButton
                expanded={checklistOpen}
                progress={
                  isDraft && showsConfigure
                    ? {
                        done: requiredTotal === 0 ? 1 : requiredTotal - blocking.length,
                        total: Math.max(requiredTotal, 1),
                      }
                    : undefined
                }
                onClick={() => setChecklistOpen((open) => !open)}
              />
            ) : null}
          </>
        }
        tabs={visibleTabs}
        tab={shownTab}
        onTab={setTab}
        docked={Boolean(onboarded)}
        dock={
          onboarded && checklistOpen ? (
            <SetupChecklistDock
              steps={steps}
              currentTab={shownTab}
              gateVerb="activate"
              onClose={() => setChecklistOpen(false)}
              onGoTo={(step) => setTab(step.tab)}
            />
          ) : undefined
        }
      >
        {shownTab === 'overview' && (
          <ApplicationOverviewTab app={app} accounts={accounts} entitlements={entitlements} />
        )}
        {shownTab === 'accounts' && (
          <RelationTable
            columns={accountColumns}
            rows={accounts}
            onRowClick={(r) => router.push(`/iga/directory/app-accounts/${r.id}`)}
            emptyTitle="No app accounts"
            emptyMessage="No accounts exist in this application yet."
          />
        )}
        {shownTab === 'entitlements' && (
          <RelationTable
            columns={entitlementColumns}
            rows={entitlements}
            onRowClick={(r) => router.push(`/iga/directory/entitlements/${r.id}`)}
            emptyTitle="No entitlements"
            emptyMessage="This application exposes no entitlements yet."
          />
        )}
        {shownTab === 'reconciliation' && (
          <ReconciliationTab applicationId={app.id} applicationName={app.name} />
        )}
        {shownTab === 'provisioning' && (
          <ProvisioningSetupTab applicationId={app.id} applicationName={app.name} onChanged={bump} />
        )}
        {shownTab === 'baseline' && <BaselineAccessTab applicationId={app.id} entitlements={entitlements} />}
        {shownTab === 'approval' && <ApplicationApprovalPolicyTab applicationId={app.id} />}
        {shownTab === 'owners' && (
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

      <Dialog
        open={pendingDeactivate}
        onClose={() => setPendingDeactivate(false)}
        title={`Deactivate ${app.name}?`}
        confirmLabel="Deactivate"
        onConfirm={deactivate}
      >
        IGA will treat this application as inactive. You can activate it again later.
      </Dialog>

      <Dialog
        open={pendingDelete}
        onClose={() => setPendingDelete(false)}
        title={`Delete ${app.name}?`}
        tone="danger"
        confirmLabel="Delete"
        onConfirm={() => {
          const ok = deleteApplication(app.id);
          setPendingDelete(false);
          if (ok) {
            toast.success(`“${app.name}” was deleted.`);
            router.push(LIST_HREF);
          } else {
            toast.error('Could not delete this application.');
          }
        }}
      >
        This removes the application from the catalog. This cannot be undone.
      </Dialog>
    </>
  );
}
