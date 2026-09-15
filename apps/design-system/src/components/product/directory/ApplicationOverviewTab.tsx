'use client';

import * as React from 'react';
import AccountBalance from '@mui/icons-material/AccountBalance';
import Inventory2 from '@mui/icons-material/Inventory2';
import ReportProblem from '@mui/icons-material/ReportProblem';
import Hub from '@mui/icons-material/Hub';
import { Card, InfoRow, InfoRowGroup, StatusChip } from '@ds/components';
import { formatDateTime } from '../sod/labels';
import { infoIcon } from './infoIcons';
import { RowLink, RowValue } from './RowLink';
import { appProfileFor } from '@/data/seed';
import { listAuthorizations } from '@/data/provisioning-auth';
import { eventStatus, listConnectionEvents } from '@/data/connection-events';
import { reconciliationSummary } from '@/data/reconciliation';
import { listBaselines } from '@/data/baselines';
import { getGovEntity, explorerRow, displayName } from '@/data/governance';
import { applicationAccountable, type AccountableParty, type AppAccountRow, type EntitlementRow } from '@/data/directory';

interface CatalogApp {
  id: string;
  name: string;
  ownerIds: string[];
}

/** One unresolved thing, and the tab that resolves it. */
interface Gap {
  id: string;
  text: string;
  /** `danger` for a governance hole or a failure, `warning` for unfinished setup. */
  tone: 'danger' | 'warning';
  tab: string;
  cta: string;
}

/**
 * Application overview — is this application healthy and governed, and if not, what next.
 *
 * Four cards of the same shape, in two rows: what this application holds and what still
 * needs doing, then how it connects and how it is governed.
 *
 * The counts were a row of `StatTile`s above all of it — three 96px panels carrying one
 * number each, which is a dashboard's job, not a detail page's. They also linked to
 * `?tab=accounts`, a tab that no longer exists, so two of the three had been dead since
 * the inventory moved into Reconciliation. As rows in a card they sit at the same weight
 * as every other fact about the application, and the link goes where the list actually
 * lives.
 *
 * Risk stays off this tab — the identity band already carries the chip.
 */
export function ApplicationOverviewTab({
  app,
  accounts,
  entitlements,
}: {
  app: CatalogApp;
  accounts: AppAccountRow[];
  entitlements: EntitlementRow[];
}) {
  const profile = appProfileFor(app.id);
  const gov = getGovEntity(app.id);
  const row = gov ? explorerRow(gov) : null;
  const provisions = profile.externalProvisioning === 'enabled';

  /*
    Authorization, events, sync and baselines are all localStorage-backed, so they can
    only be read after mount — during render the server would answer with the seed and
    the client with the store. The figures above do not wait on this; the attention
    block does, because a list of problems that starts empty and fills in a frame later
    reads as "all clear" for exactly long enough to be believed.
  */
  const [live, setLive] = React.useState<{
    hasAuth: boolean;
    connected: boolean;
    events: { total: number; needingSetup: number };
    lastSync: { at: string; ok: boolean } | null;
    applications: number | null;
    baseline: { name: string; size: number } | null;
    owners: AccountableParty[];
  } | null>(null);

  React.useEffect(() => {
    const auths = listAuthorizations(app.id);
    const events = listConnectionEvents(app.id);
    const summary = reconciliationSummary(app.id);
    const baselines = listBaselines(app.id);
    const primary = baselines.find((b) => b.isDefault) ?? baselines[0] ?? null;
    setLive({
      hasAuth: auths.length > 0,
      connected: auths.some((a) => a.authorized),
      events: { total: events.length, needingSetup: events.filter((e) => eventStatus(e) === 'partial').length },
      lastSync: summary.lastSync ? { at: summary.lastSync.at, ok: summary.lastSync.outcome === 'success' } : null,
      // Present only on an IAM or a vault — see `reconcilesApplications`.
      applications: summary.applications ? summary.applications.total : null,
      baseline: primary ? { name: primary.name, size: primary.entitlementIds.length } : null,
      /*
        Individuals and Governance Teams together. Asking only for individuals said
        "Nobody owns this application" about one a team had just taken on.
      */
      owners: applicationAccountable(app.id),
    });
  }, [app.id]);

  const reviewers = row?.ownership.reviewers ?? [];
  const controls = row?.controls;
  const policyCount = controls ? controls.birthright + controls.approval + controls.sod : 0;
  const href = (tab: string) => `/iga/directory/applications/${app.id}?tab=${tab}`;
  /** Reconciliation, with one of its inventory drawers already open. */
  const view = (v: string) => `/iga/directory/applications/${app.id}?view=${v}`;

  /*
    Only gaps the reader can actually close from here.

    "No access review owner" is a real hole and it is reported below as a `danger` chip on
    its own row — but it is not in this list, because nothing in the product assigns one
    per application: `reviewed-by` comes from the governance graph, and review ownership is
    configured per certification campaign. A list item whose link cannot finish the job is
    worse than no item, because after the second dead end the reader stops trusting the
    whole block.

    The rule for adding to this list: name the tab that closes it, and check something on
    that tab writes the value this gap reads.
  */
  const gaps: Gap[] = React.useMemo(() => {
    if (!live) return [];
    const out: Gap[] = [];
    /*
      Connector gaps only when there is a connector to fix. With provisioning off there is
      no Configure tab, so an item pointing at it would be a dead end — and "not
      authorized" is not a defect in an application IGA only reads.
    */
    if (provisions && !live.hasAuth) {
      out.push({ id: 'auth', text: 'The connector has no authorization', tone: 'warning', tab: 'provisioning', cta: 'Configure' });
    } else if (provisions && !live.connected) {
      out.push({ id: 'auth', text: 'The connector is not connected', tone: 'warning', tab: 'provisioning', cta: 'Configure' });
    }
    if (provisions && live.events.total === 0) {
      out.push({ id: 'events', text: 'No connection events are configured', tone: 'warning', tab: 'provisioning', cta: 'Add events' });
    } else if (provisions && live.events.needingSetup > 0) {
      const n = live.events.needingSetup;
      out.push({
        id: 'events',
        text: `${n} connection event${n === 1 ? '' : 's'} ${n === 1 ? 'needs' : 'need'} setup`,
        tone: 'warning',
        tab: 'provisioning',
        cta: 'Finish setup',
      });
    }
    if (!live.lastSync) {
      out.push({ id: 'sync', text: 'This application has never been reconciled', tone: 'warning', tab: 'reconciliation', cta: 'Reconciliation' });
    } else if (!live.lastSync.ok) {
      out.push({ id: 'sync', text: 'The last sync failed', tone: 'danger', tab: 'reconciliation', cta: 'See why' });
    }
    /*
      Ownership is the one gap that is a real governance hole rather than unfinished
      wiring: with nobody accountable, an access request has no one to answer it. A
      Governance Team counts — a body answering for an application is real accountability,
      so this fires only when neither half has anyone in it.
    */
    if (live.owners.length === 0) {
      out.push({ id: 'owners', text: 'Nobody owns this application', tone: 'danger', tab: 'owners', cta: 'Add an owner' });
    }
    if (!live.baseline) {
      out.push({ id: 'baseline', text: 'No default baseline is set', tone: 'warning', tab: 'baseline', cta: 'Set a baseline' });
    }
    if (policyCount === 0) {
      out.push({ id: 'policy', text: 'No policy governs access to this application', tone: 'warning', tab: 'approval', cta: 'Add a policy' });
    }
    return out;
  }, [live, provisions, policyCount]);


  return (
    <div className="ds-scroll flex h-full min-h-0 flex-col gap-5 overflow-y-auto">
        <div className="grid shrink-0 items-stretch gap-5 lg:grid-cols-2">
          <Card title="Inventory" icon={<Inventory2 />} padding="none" className="h-full min-h-0">
            <InfoRowGroup>
              {/* Straight to the list, not to the tab that holds it: `?view=` opens
                  Reconciliation with the drawer already up, which is where these rows
                  live now. */}
              <InfoRow
                icon={infoIcon.account}
                label="Accounts"
                valueWrap
                value={
                  <RowValue>
                    <span>{accounts.length}</span>
                    <RowLink href={view('accounts')}>View all</RowLink>
                  </RowValue>
                }
              />
              <InfoRow
                icon={infoIcon.entitlement}
                label="Entitlements"
                valueWrap
                value={
                  <RowValue>
                    <span>{entitlements.length}</span>
                    <RowLink href={view('entitlements')}>View all</RowLink>
                  </RowValue>
                }
              />
              {live?.applications != null && (
                <InfoRow
                  icon={infoIcon.application}
                  label="Applications discovered"
                  valueWrap
                  value={
                    <RowValue>
                      <span>{live.applications}</span>
                      <RowLink href={href('reconciliation')}>View all</RowLink>
                    </RowValue>
                  }
                />
              )}
            </InfoRowGroup>
          </Card>

          <Card
            title="Needs attention"
            icon={<ReportProblem />}
            padding="none"
            className="h-full min-h-0"
            action={
              gaps.length > 0 ? (
                <span className="tabular-nums text-caption text-text-tertiary">{gaps.length}</span>
              ) : undefined
            }
          >
            {live && (gaps.length > 0 ? <NeedsAttention gaps={gaps} appId={app.id} /> : <AllClear />)}
          </Card>
        </div>

        <div className="grid min-h-0 flex-1 items-stretch gap-5 lg:grid-cols-2">
          <Card title="Connection" icon={<Hub />} padding="none" className="h-full min-h-0">
            <InfoRowGroup>
              <InfoRow icon={infoIcon.type} label="Application type" value={profile.appType} />
              <InfoRow
                icon={infoIcon.discovery}
                label="Discovered via"
                value={profile.discoverySource === 'IAM' ? 'An IAM integration' : 'Added directly'}
              />
              <InfoRow
                icon={infoIcon.sync}
                label="Provisioning"
                value={
                  provisions
                    ? `On · ${profile.provisioningType === 'auto' ? 'Automatic' : 'Manual'}`
                    : 'Off · read only'
                }
              />
              {provisions && (
                <InfoRow
                  icon={infoIcon.authorization}
                  label="Authorization"
                  value={
                    !live ? (
                      <Pending />
                    ) : !live.hasAuth ? (
                      <StatusChip intent="warning" label="None" />
                    ) : live.connected ? (
                      <StatusChip intent="success" label="Connected" />
                    ) : (
                      <StatusChip intent="warning" label="Not connected" />
                    )
                  }
                  valueWrap
                />
              )}
              <InfoRow
                icon={infoIcon.updated}
                label="Last sync"
                value={
                  !live ? (
                    <Pending />
                  ) : !live.lastSync ? (
                    <span className="text-text-tertiary">Never</span>
                  ) : (
                    <span className="inline-flex items-center gap-2">
                      {formatDateTime(live.lastSync.at)}
                      {!live.lastSync.ok && <StatusChip intent="danger" label="Failed" />}
                    </span>
                  )
                }
                valueWrap
              />
            </InfoRowGroup>
          </Card>

          <Card title="Governance" icon={<AccountBalance />} padding="none" className="h-full min-h-0">
            <InfoRowGroup>
              <InfoRow
                icon={infoIcon.owner}
                label="Owners"
                value={
                  !live ? (
                    <Pending />
                  ) : live.owners.length ? (
                    live.owners.map((o) => (o.kind === 'team' ? `${o.name} (team)` : o.name)).join(', ')
                  ) : (
                    <StatusChip intent="warning" label="None" />
                  )
                }
                valueWrap
              />
              <InfoRow
                icon={infoIcon.reviewer}
                label="Access review owner"
                value={
                  reviewers.length ? (
                    reviewers.map((p) => p.name).join(', ')
                  ) : (
                    <StatusChip intent="danger" label="Unassigned" />
                  )
                }
                valueWrap
              />
              <InfoRow
                icon={infoIcon.baseline}
                label="Default baseline"
                value={
                  !live ? (
                    <Pending />
                  ) : live.baseline ? (
                    `${live.baseline.name} · ${live.baseline.size} entitlement${live.baseline.size === 1 ? '' : 's'}`
                  ) : (
                    <StatusChip intent="warning" label="None" />
                  )
                }
                valueWrap
              />
              <InfoRow
                icon={infoIcon.policy}
                label="Governing policies"
                value={
                  controls && policyCount > 0 ? (
                    [
                      controls.birthright && `${controls.birthright} birthright`,
                      controls.approval && `${controls.approval} approval`,
                      controls.sod && `${controls.sod} SoD`,
                    ]
                      .filter(Boolean)
                      .join(' · ')
                  ) : (
                    <StatusChip intent="warning" label="Ungoverned" />
                  )
                }
                valueWrap
              />
              <InfoRow
                icon={infoIcon.department}
                label="Departments"
                value={(gov?.departmentIds ?? []).map((id) => displayName(id)).join(', ') || '—'}
              />
            </InfoRowGroup>
          </Card>
        </div>
    </div>
  );
}

/**
 * Everything unresolved, and one link each to resolve it.
 *
 * It used to carry its own frame and heading, because it was the one framed thing on a
 * page of loose tiles and had to be the loudest. That is no longer true — the overview is
 * four cards now — so it sits in the same `Card` as everything else and keeps only the
 * list. A second frame inside a card is a box inside a box.
 *
 * The dots take their status colour; the container stays white. A card about problems is
 * not an amber card.
 */
function NeedsAttention({ gaps, appId }: { gaps: Gap[]; appId: string }) {
  return (
    /* No gutter of its own: `padding="none"` already keeps the Card's `px-4` so a flush
       list's dividers do not kiss the panel border (ADR-0009). Adding another put this
       card's rows 16px inside the Inventory card's beside it. */
    <ul className="divide-y divide-border-subtle">
        {gaps.map((gap) => (
          <li key={gap.id} className="flex items-center justify-between gap-4 py-3">
            <span className="flex min-w-0 items-center gap-2.5">
              <span
                aria-hidden
                className="h-1.5 w-1.5 shrink-0 rounded-pill"
                style={{ backgroundColor: `var(--ds-color-status-${gap.tone}-solid)` }}
              />
              <span className="truncate text-body-sm text-text-primary">{gap.text}</span>
            </span>
            <RowLink href={`/iga/directory/applications/${appId}?tab=${gap.tab}`}>
              {gap.cta}
            </RowLink>
          </li>
        ))}
    </ul>
  );
}

/** No green panel — the reward for a well-set-up application is quiet. */
function AllClear() {
  return (
    <p className="py-3 text-body-sm text-text-secondary">
      <span className="font-emphasis text-text-primary">Nothing needs attention.</span> The connector is
      wired, the inventory is current, and this application is owned and governed.
    </p>
  );
}

/** A value the store has not answered for yet. Dimmed, so it does not read as "none". */
function Pending() {
  return <span className="text-text-tertiary">·</span>;
}
