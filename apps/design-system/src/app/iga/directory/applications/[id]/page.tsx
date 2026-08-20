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
  StatusChip,
  Tooltip,
  useToast,
  type TabItem,
} from '@ds/components';
import { getApplicationDetail } from '@/data/directory';
import { appBlockingSteps } from '@/data/application-setup';
import {
  DetailRail,
  type DetailRailGroup,
  type DetailRailRow,
} from '@/components/product/DetailRail';
import {
  applicationSetupSteps,
  type ApplicationSetupStep,
} from '@/components/product/directory/applicationSetupSteps';
import { infoIcon } from '@/components/product/directory/infoIcons';
import { connectApplication } from '@/data/applications-store';
import {
  DetailShell,
  DetailNotFound,
  RelationTable,
  EntityAvatar,
  ApplicationOverviewTab,
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

/**
 * The sections this page has, which the rail is derived from.
 *
 * Overview keeps its name in both states now. It was relabelled "Setup" while the
 * checklist lived inside it; the checklist is the rail, so the tab that held it is a
 * summary again — of what the application *is* during setup, and of what it holds once
 * connected.
 */
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
  const [tab, setTab] = React.useState('overview');
  /**
   * Which rail row was pressed, where a section has more than one.
   *
   * Authorization and Connection events are both configured on Provisioning Setup, so the
   * section alone cannot say which row the reader is on. Cleared whenever the section
   * changes by any other route — `connect()` returns to Overview, where one row matches
   * and the override would only be a stale claim about a different section.
   */
  const [activeRow, setActiveRow] = React.useState<string | undefined>(undefined);
  const goToSection = (value: string, rowId?: string) => {
    setTab(value);
    setActiveRow(rowId);
  };
  const [basicsOpen, setBasicsOpen] = React.useState(false);
  const [, bump] = React.useReducer((n: number) => n + 1, 0);

  /**
   * The onboarding store is `localStorage`-backed, so it is empty during SSR and full on
   * the client. Reading it while rendering made the two disagree and React threw a
   * hydration error on any application that had been onboarded — the server rendered
   * "not found" or a connected profile, the client a profile in setup.
   *
   * So it is read after mount, like every other session-memory store in this codebase,
   * and nothing renders until then. Unlike the emergency-access stores this one survives
   * a reload, which is exactly why it cannot be read during the first render.
   */
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  const detail = mounted ? getApplicationDetail(id) : null;
  const onboarded = detail?.onboarded;
  const isSetup = onboarded?.status === 'setup';

  if (!mounted) return null;
  if (!detail) {
    return <DetailNotFound title="Application not found" backHref={LIST_HREF} backLabel="Back to Applications" />;
  }

  const { app, accounts, entitlements } = detail;
  const gov = getGovEntity(app.id);
  const blocking = onboarded ? appBlockingSteps(onboarded) : [];

  /**
   * What the rail lists — one derivation, not one per state.
   *
   * A connected application shows the same grouped, ticked list one in setup does; it
   * just leads with the sections that are not setup steps. So connecting an application
   * does not restyle its navigation, and the ticks keep earning their place afterwards —
   * "this connected application still has no owners" is a governance gap worth seeing
   * without opening anything.
   *
   * Steps come from the step definition and non-step sections from the same list the tab
   * strip would have rendered, so the rail cannot offer a section this page does not have,
   * or miss one it does.
   */
  const sections = sectionsFor(accounts.length, entitlements.length);
  const steps = onboarded ? applicationSetupSteps(onboarded) : [];
  const countFor = (value: string) => sections.find((s) => s.value === value)?.count;
  const stepRow = (step: ApplicationSetupStep): DetailRailRow => ({
    id: step.id,
    label: step.label,
    tab: step.tab,
    count: countFor(step.tab),
    done: step.done,
  });
  const railGroups: DetailRailGroup[] = [
    {
      rows: sections
        .filter((s) => !steps.some((step) => step.tab === s.value))
        .map((s) => ({ id: s.value, label: s.label, tab: s.value, count: s.count })),
    },
    {
      heading: 'Required to connect',
      headingHint: 'these steps gate connection',
      rows: steps.filter((s) => s.required).map(stepRow),
    },
    {
      heading: 'Recommended',
      headingHint: 'optional, and does not block connection',
      rows: steps.filter((s) => !s.required).map(stepRow),
    },
  ].filter((g) => g.rows.length > 0);

  const connect = () => {
    if (!onboarded || blocking.length > 0) return;
    connectApplication(onboarded.id);
    toast.success(`“${onboarded.name}” is connected. IGA can now reach this application.`);
    bump();
    // Through `goToSection` so the row override is cleared with the section: leaving it
    // set would have a Provisioning step still claiming to be current on Overview.
    goToSection('overview');
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
            {/* A plain button that is simply disabled until nothing blocks. It used to
                carry a progress ring and a "N required steps to connect" label, from when
                the header was the only place to learn how far setup had got — the rail
                reports that step by step now, so the ring was the same state said twice
                and the crowded-out half was the button's one action. */}
            {isSetup && onboarded ? (
              <Tooltip
                title={
                  blocking.length > 0
                    ? `Add ${blocking.join(' and ')} before this can be connected.`
                    : 'Let IGA reach this application'
                }
              >
                <span>
                  <Button disabled={blocking.length > 0} onClick={connect}>
                    Connect
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
        tabs={sections}
        tab={tab}
        onTab={setTab}
        rail={
          <DetailRail
            ariaLabel={isSetup ? 'Setup checklist' : 'Application sections'}
            groups={railGroups}
            currentTab={tab}
            currentId={activeRow}
            onGoTo={(row) => {
              // `basic` is the one row that is not a section — it opens the same drawer
              // the header's Basic Details button does, so there is one editor. It does
              // not become current, because nothing about the section behind it changed.
              if (row.id === 'basic') {
                setBasicsOpen(true);
                return;
              }
              goToSection(row.tab, row.id);
            }}
          />
        }
      >
        {tab === 'overview' &&
          (isSetup && onboarded ? (
            /* During setup this is what the application *is*, not what it holds — it holds
               nothing until IGA can reach it. The checklist that used to sit beside these
               facts is the rail now, so the card is the whole section rather than its
               sidebar. Kept to a reading width for the same reason a paragraph is. */
            <div className="ds-scroll h-full overflow-y-auto pr-0.5">
              <div className="max-w-xl">
                <Card title="Application type" icon={<Info />} padding="none">
                  <InfoRowGroup>
                    <InfoRow icon={infoIcon.type} label="Type" value={onboarded.appType} />
                    <InfoRow
                      icon={infoIcon.sync}
                      label="Provisioning"
                      value={onboarded.enableProvisioning ? 'Enabled' : 'Off'}
                    />
                    <InfoRow
                      icon={infoIcon.people}
                      label="Identity source"
                      value={onboarded.identitySource ? 'Yes' : 'No'}
                    />
                    <InfoRow
                      icon={infoIcon.baseline}
                      label="Requestable"
                      value={onboarded.requestable ? 'Yes' : 'No'}
                    />
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
