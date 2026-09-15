'use client';

import * as React from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import EditOutlined from '@mui/icons-material/EditOutlined';
import DeleteOutline from '@mui/icons-material/DeleteOutline';
import SettingsOutlined from '@mui/icons-material/SettingsOutlined';
import { Button, Dialog, Drawer, Menu, SetupChecklistDock, StatusChip, type TabItem, useToast } from '@ds/components';
import {
  applicationIsAuthorized,
  deleteApplication,
  getApplicationDetail,
} from '@/data/directory';
import {
  appBlockingSteps,
  applicationShowsConfigure,
  isAppSetupStepDone,
  requiredAppSetupCount,
} from '@/data/application-setup';
import { appProfileFor } from '@/data/seed';
import {
  applicationSetupSteps,
  appSetupIncomplete,
  firstUnfinishedAppTab,
} from '@/components/product/directory/applicationSetupSteps';
import {
  DetailShell,
  DetailNotFound,
  EntityAvatar,
  ApplicationOverviewTab,
  ApplicationBasicDetailsDrawer,
  EntityOwnersTab,
  ApplicationApprovalPolicyTab,
  ReconciliationTab,
  ProvisioningSetupTab,
  BaselineAccessTab,
  ApplicationAccountsTab,
  ApplicationEntitlementsTab,
} from '@/components/product/directory';
import { EmergencyAccessGuideButton } from '@/components/product/emergency/EmergencyAccessGuideModal';

const LIST_HREF = '/iga/directory/applications';

/**
 * The strip is the parts of an application you set up.
 *
 * App Accounts and Entitlements were on it and are not any more. They are not steps — they
 * are what reconciliation pulled in, and having them here put the inventory in three places
 * at once: a count on a tab, the same totals on the Reconciliation cards, and the rows a
 * click past either. They open from those cards now, which is the one place that counts
 * them.
 */
const BASE_TABS: TabItem[] = [
  { value: 'overview', label: 'Overview' },
  { value: 'provisioning', label: 'Configure' },
  { value: 'reconciliation', label: 'Reconciliation' },
  { value: 'owners', label: 'Owners' },
  { value: 'baseline', label: 'Baseline Access' },
  { value: 'approval', label: 'Approval Policy' },
];

/** What the inventory drawer is showing, when it is open. */
type InventoryView = 'accounts' | 'entitlements';

/**
 * Inventory tabs — nothing to show until the connector exists, so they stay off
 * the strip until Configure is finished.
 */
const PRE_CONFIGURE_TABS = new Set(['overview', 'accounts', 'entitlements']);

/**
 * `?view=` from the brief clubbed inventory.
 *
 * All three of its values land on Reconciliation now — it is the section that owns the
 * inventory, and `accounts` / `entitlements` open its drawer on top rather than naming a
 * tab of their own.
 */
function tabFromQuery(tab: string | null, view: string | null, fallback: string): string {
  if (view === 'accounts' || view === 'entitlements' || view === 'history') return 'reconciliation';
  return tab ?? fallback;
}

/** The `?view=` values that open the drawer, rather than just choosing a tab. */
function inventoryFromQuery(view: string | null): InventoryView | null {
  return view === 'accounts' || view === 'entitlements' ? view : null;
}

/**
 * Sections that cannot be set up until the connector is in place, and why.
 *
 * Each reason is a real dependency rather than a sequencing preference — a gate that
 * only means "do this first because I said so" trains people to look for the way round
 * it. Owners is deliberately absent: naming who answers for an application needs no
 * connector, and it is the one piece of governance worth having before anything is
 * reachable.
 */
const NEEDS_CONFIGURE: Record<string, string> = {
  reconciliation:
    'Reconciliation pulls this application’s accounts and entitlements over the connector. Until IGA can reach it, there is nothing to pull.',
  baseline:
    'A baseline is chosen from the entitlements reconciliation brings in, so the list to choose from does not exist yet.',
  approval:
    'An approval policy decides who may grant access here. Nothing can be granted until IGA can reach the application to provision it.',
};

/**
 * What a section shows before the connector exists.
 *
 * Not a disabled tab: the reader came here to find out what this section is, and a tab
 * that refuses to open answers nothing. It opens, says what it will hold, says why it
 * cannot hold it yet, and offers the one thing that changes that.
 */
function NeedsConfigure({ reason, onGoToConfigure }: { reason: string; onGoToConfigure: () => void }) {
  return (
    <div className="grid min-h-0 flex-1 place-items-center">
      <div className="flex max-w-md flex-col items-center px-6 py-10 text-center">
        <span className="grid h-12 w-12 place-items-center rounded-full bg-subtle text-icon">
          <SettingsOutlined sx={{ fontSize: 24 }} />
        </span>
        <h2 className="mt-4 text-h5 text-text-primary">Configure this application first</h2>
        <p className="mt-1.5 text-body-sm text-text-secondary">{reason}</p>
        <div className="mt-5">
          <Button startIcon={<SettingsOutlined sx={{ fontSize: 18 }} />} onClick={onGoToConfigure}>
            Go to Configure
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function ApplicationDetailPage() {
  const id = String(useParams().id);
  const router = useRouter();
  const toast = useToast();
  const searchParams = useSearchParams();
  const requestedTab = searchParams.get('tab');
  const requestedView = searchParams.get('view');
  const [tab, setTab] = React.useState('overview');
  const [basicsOpen, setBasicsOpen] = React.useState(false);
  const [checklistOpen, setChecklistOpen] = React.useState(false);
  const [inventory, setInventory] = React.useState<InventoryView | null>(null);
  const [pendingDelete, setPendingDelete] = React.useState(false);
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

  React.useEffect(() => {
    if (!mounted) return;
    const fallback =
      onboarded && appSetupIncomplete(onboarded)
        ? firstUnfinishedAppTab(onboarded)
        : 'overview';
    if (requestedTab || requestedView) {
      setTab(tabFromQuery(requestedTab, requestedView, fallback));
      setInventory(inventoryFromQuery(requestedView));
      return;
    }
    setTab(fallback);
  }, [mounted, onboarded?.id, requestedTab, requestedView]);

  if (!mounted) return null;
  if (!detail) {
    return <DetailNotFound title="Application not found" backHref={LIST_HREF} backLabel="Back to Applications" />;
  }

  const { app, accounts, entitlements } = detail;

  // Catalogued apps use the seed profile; onboarded apps use the toggle the
  // admin set in the drawer. Off means IGA will not push access to the system.
  const showsConfigure = onboarded
    ? applicationShowsConfigure(onboarded)
    : appProfileFor(app.id).externalProvisioning === 'enabled';

  /*
    Every application has the same five setup steps, so every application gets the
    checklist — including one that came from the catalogue rather than the onboarding
    drawer, and one whose steps are all done.

    These used to be gated on `onboarded`, which made the guide a property of *how the
    application arrived* rather than of the work it needs. A catalogued app still has
    owners to name, a baseline to set and an approval policy to choose; it simply had
    nowhere to see that. And "all done" is worth showing, not hiding: the checklist is
    the page that answers "is this application actually governed", and a finished one
    answers yes.
  */
  const setupSubject = onboarded ?? { id: app.id, enableProvisioning: showsConfigure };
  const blocking = appBlockingSteps(setupSubject);
  const steps = applicationSetupSteps(setupSubject);
  const requiredTotal = requiredAppSetupCount(setupSubject);

  const provisioningDone = isAppSetupStepDone('provisioning', setupSubject);
  const setupIncomplete = appSetupIncomplete(setupSubject);
  const hideInventoryTabs =
    setupIncomplete && (!showsConfigure || !provisioningDone);

  const allSections = BASE_TABS.filter((s) => {
    /*
      Only Configure follows the provisioning toggle.

      Reconciliation used to be hidden with it, which conflated two directions:
      provisioning is IGA *pushing* access out, reconciliation is IGA *pulling* the
      inventory in. An application can be read without being written to — that is the
      normal shape for a system IGA governs but does not administer — and hiding the
      inventory left no way to see what it holds.
    */
    if (s.value === 'provisioning') return showsConfigure;
    /*
      Overview and inventory tabs need something to summarize. While setup is open they
      only show zeros and a long Needs-attention list — before Configure when
      provisioning is on, and throughout setup when it is off and the checklist still
      has governance steps to finish.
    */
    if (hideInventoryTabs && PRE_CONFIGURE_TABS.has(s.value)) return false;
    return true;
  });

  const shownTab = allSections.some((t) => t.value === tab)
    ? tab
    : allSections[0]?.value ?? 'overview';

  /**
   * Whether the open section is one that needs the connector, and does not have it yet.
   *
   * Gated on `showsConfigure` as well as readiness: with provisioning off there is no
   * Configure step at all, so gating on it would lock these sections behind a condition
   * nothing on the page could ever satisfy.
   */
  const gateReason =
    onboarded && showsConfigure && !isAppSetupStepDone('provisioning', onboarded)
      ? NEEDS_CONFIGURE[shownTab]
      : undefined;

  const authorized = applicationIsAuthorized(app.id);

  return (
    <>
      <DetailShell
        avatar={<EntityAvatar kind="application" name={app.name} appType={onboarded?.appType} size="md" />}
        title={app.name}
        description={app.description}
        /*
          Authorization is about IGA being able to reach *into* the system — it is the
          credential the connector signs in with. With provisioning off there is no
          connector, so there is nothing to authorize and nothing the reader could do about
          it: the chip reported a permanently unresolvable "Not authorized" on an
          application that was never going to push anything. It appears only where Configure
          appears, which is the screen that would change it.
        */
        chips={
          showsConfigure ? (
            <StatusChip
              intent={authorized ? 'success' : 'warning'}
              label={authorized ? 'Authorized' : 'Not authorized'}
            />
          ) : undefined
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
            {/* The donut is for a draft still being assembled — it counts down blocking
                work. On anything else the book stands alone: the guide is still there to
                open, it just has no countdown to show. */}
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
          </>
        }
        tabs={allSections}
        tab={shownTab}
        onTab={setTab}
        docked
        dock={
          checklistOpen ? (
            <SetupChecklistDock
              steps={steps}
              currentTab={shownTab}
              gateVerb="setup"
              onClose={() => setChecklistOpen(false)}
              onGoTo={(step) => setTab(step.tab)}
            />
          ) : undefined
        }
      >
        {/* A gated section shows why it is empty instead of its own machinery. */}
        {gateReason ? (
          <NeedsConfigure reason={gateReason} onGoToConfigure={() => setTab('provisioning')} />
        ) : (
          <>
          {shownTab === 'overview' && (
            <ApplicationOverviewTab app={app} accounts={accounts} entitlements={entitlements} />
          )}
          {shownTab === 'reconciliation' && (
            <ReconciliationTab
              applicationId={app.id}
              applicationName={app.name}
              canSync={showsConfigure}
              onViewAccounts={() => setInventory('accounts')}
              onViewEntitlements={() => setInventory('entitlements')}
            />
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
          </>
        )}
      </DetailShell>

      {/*
        * The inventory, over the page rather than instead of it.
        *
        * A drawer rather than a section, because reading what an application holds is a
        * side-read: you are checking the rows against the totals you just saw, and the
        * cards, the sync history and the last-sync banner all stay behind it. As its own
        * section it replaced the page you opened it from, and the way back was a link the
        * reader had to find — the tab strip appeared to be on Reconciliation already.
        *
        * 760 rather than the 480 default: the entitlement table carries a name, an
        * application and a risk chip beside search and paging, and at 480 the name is the
        * column that gives way.
        */}
      <Drawer
        open={inventory != null}
        onClose={() => setInventory(null)}
        title={inventory === 'accounts' ? 'App accounts' : 'Entitlements'}
        subtitle={app.name}
        leading={<EntityAvatar kind="application" name={app.name} appType={onboarded?.appType} size="sm" />}
        width={760}
      >
        {inventory === 'accounts' && (
          <ApplicationAccountsTab
            applicationId={app.id}
            applicationName={app.name}
            accounts={accounts}
            onChanged={bump}
          />
        )}
        {inventory === 'entitlements' && (
          <ApplicationEntitlementsTab
            applicationId={app.id}
            entitlements={entitlements}
            onChanged={bump}
          />
        )}
      </Drawer>

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
