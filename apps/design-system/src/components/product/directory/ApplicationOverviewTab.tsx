'use client';

import * as React from 'react';
import AccountBalance from '@mui/icons-material/AccountBalance';
import Inventory2 from '@mui/icons-material/Inventory2';
import ReportProblem from '@mui/icons-material/ReportProblem';
import Hub from '@mui/icons-material/Hub';
import { AppIcon, Avatar, Card, InfoRow, InfoRowGroup, OverflowChips, StatusChip } from '@ds/components';
import { formatDateTime } from '../sod/labels';
import { infoIcon } from './infoIcons';
import { RowLink, RowValue } from './RowLink';
import { appProfileFor } from '@/data/seed';
import { listAuthorizations } from '@/data/provisioning-auth';
import { eventStatus, listConnectionEvents } from '@/data/connection-events';
import { reconciliationSummary } from '@/data/reconciliation';
import { listBaselines } from '@/data/baselines';
import { getAppApprovalPolicy } from '@/data/app-approval-policy';
import { getApprovalPolicy } from '@/data/approval-policies';
import {
  applicationAccountable,
  applicationForBasics,
  type AccountableParty,
  type AppAccountRow,
  type EntitlementRow,
} from '@/data/directory';

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
 * Application overview — can this application govern access, and if not, what next.
 *
 * Two equal columns, two rows. A card matches its neighbour so the page does not
 * lean; it does not then stretch to fill the frame, which is what turned a
 * two-line fact into a hollow panel.
 *
 * A fact earns a row only if it changes a decision on this page. Authorization
 * does not — the identity band already carries Authorized, and a hole lands in
 * Needs attention. The entitlement count on a baseline does not — the name is
 * the decision; the size lives on Baseline Access.
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
    baseline: { name: string } | null;
    owners: AccountableParty[];
    approvalPolicy: { name: string } | null;
    useCases: { id: string; name: string }[];
  } | null>(null);

  React.useEffect(() => {
    const auths = listAuthorizations(app.id);
    const events = listConnectionEvents(app.id);
    const summary = reconciliationSummary(app.id);
    const baselines = listBaselines(app.id);
    const primary = baselines.find((b) => b.isDefault) ?? baselines[0] ?? null;
    const policyId = getAppApprovalPolicy(app.id);
    const policy = policyId ? getApprovalPolicy(policyId) : null;
    const basics = applicationForBasics(app.id);
    const useCases = [
      basics?.enableProvisioning && { id: 'provisioning', name: 'Lifecycle provisioning' },
      basics?.identitySource && { id: 'identity', name: 'Identity source' },
      basics?.requestable && { id: 'requests', name: 'Access requests' },
    ].filter((c): c is { id: string; name: string } => Boolean(c));
    setLive({
      hasAuth: auths.length > 0,
      connected: auths.some((a) => a.authorized),
      events: { total: events.length, needingSetup: events.filter((e) => eventStatus(e) === 'partial').length },
      lastSync: summary.lastSync ? { at: summary.lastSync.at, ok: summary.lastSync.outcome === 'success' } : null,
      // Present only on an IAM or a vault — see `reconcilesApplications`.
      applications: summary.applications ? summary.applications.total : null,
      baseline: primary ? { name: primary.name } : null,
      /*
        Individuals and Governance Teams together. Asking only for individuals said
        "Nobody owns this application" about one a team had just taken on.
      */
      owners: applicationAccountable(app.id),
      approvalPolicy: policy ? { name: policy.policyName } : null,
      useCases,
    });
  }, [app.id]);

  const href = (tab: string) => `/iga/directory/applications/${app.id}?tab=${tab}`;
  /** Reconciliation, with one of its inventory drawers already open. */
  const view = (v: string) => `/iga/directory/applications/${app.id}?view=${v}`;

  /*
    Only gaps the reader can actually close from here.

    Review ownership is not on this card: nothing here assigns a `reviewed-by`
    person (that lives on a certification campaign), so a row or a gap that
    cannot be closed would be a dead end.

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
    if (!live.approvalPolicy) {
      out.push({ id: 'policy', text: 'No approval policy is assigned', tone: 'warning', tab: 'approval', cta: 'Add a policy' });
    }
    return out;
  }, [live, provisions]);


  return (
    <div className="ds-scroll flex h-full min-h-0 flex-col gap-5 overflow-y-auto">
      <div className="grid items-stretch gap-5 lg:grid-cols-2">
        <Card
          title="Needs attention"
          icon={<ReportProblem />}
          padding="none"
          className="h-full"
          action={
            gaps.length > 0 ? (
              <span className="tabular-nums text-caption text-text-tertiary">{gaps.length}</span>
            ) : undefined
          }
        >
          {live && (gaps.length > 0 ? <NeedsAttention gaps={gaps} appId={app.id} /> : <AllClear />)}
        </Card>

        <Card title="Inventory" icon={<Inventory2 />} padding="none" className="h-full">
          <InfoRowGroup>
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
      </div>

      <div className="grid items-stretch gap-5 lg:grid-cols-2">
        <Card title="Governance" icon={<AccountBalance />} padding="none" className="h-full">
          <InfoRowGroup>
            <InfoRow
              icon={infoIcon.owner}
              label="Owners"
              value={
                !live ? (
                  <Pending />
                ) : live.owners.length ? (
                  <OverflowChips
                    items={live.owners}
                    max={2}
                    renderItem={(o) => <OwnerMark party={o} />}
                  />
                ) : (
                  <StatusChip intent="warning" label="None" />
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
                  <RowLink href={href('baseline')}>{live.baseline.name}</RowLink>
                ) : (
                  <StatusChip intent="warning" label="None" />
                )
              }
              valueWrap
            />
            <InfoRow
              icon={infoIcon.policy}
              label="Approval policy"
              value={
                !live ? (
                  <Pending />
                ) : live.approvalPolicy ? (
                  <RowLink href={href('approval')}>{live.approvalPolicy.name}</RowLink>
                ) : (
                  <StatusChip intent="warning" label="None" />
                )
              }
              valueWrap
            />
          </InfoRowGroup>
        </Card>

        <Card title="Connection" icon={<Hub />} padding="none" className="h-full">
          <InfoRowGroup>
            <InfoRow
              icon={infoIcon.type}
              label="Application type"
              valueWrap
              value={
                <span className="inline-flex items-center gap-2">
                  <AppIcon app={profile.appType} size={20} />
                  {profile.appType}
                </span>
              }
            />
            <InfoRow
              icon={infoIcon.discovery}
              label="Discovered via"
              valueWrap
              value={<StatusChip intent="info" label={profile.discoverySource} dot={false} />}
            />
            <InfoRow
              icon={infoIcon.sync}
              label="Use cases"
              value={
                !live ? (
                  <Pending />
                ) : live.useCases.length ? (
                  <OverflowChips items={live.useCases} max={2} />
                ) : (
                  <StatusChip intent="warning" label="None" />
                )
              }
              valueWrap
            />
            <InfoRow
              icon={infoIcon.updated}
              label="Last sync"
              value={
                !live ? (
                  <Pending />
                ) : !live.lastSync ? (
                  <span className="text-text-tertiary">Never</span>
                ) : (
                  <RowValue>
                    <span className="inline-flex min-w-0 items-center gap-2">
                      <span className="truncate">{formatDateTime(live.lastSync.at)}</span>
                      {!live.lastSync.ok && <StatusChip intent="danger" label="Failed" />}
                    </span>
                    <RowLink href={href('reconciliation')}>History</RowLink>
                  </RowValue>
                )
              }
              valueWrap
            />
          </InfoRowGroup>
        </Card>
      </div>
    </div>
  );
}

/** The same mark the applications table uses — face, then name. */
function OwnerMark({ party }: { party: AccountableParty }) {
  return (
    <span className="inline-flex min-w-0 items-center gap-2">
      <Avatar name={party.name} size="xs" kind={party.kind === 'team' ? 'entity' : 'person'} />
      <span className="truncate text-body-sm text-text-primary" title={party.name}>
        {party.name}
      </span>
    </span>
  );
}

/**
 * Everything unresolved, and one link each to resolve it.
 *
 * It used to carry its own frame and heading, because it was the one framed thing on a
 * page of loose tiles and had to be the loudest. It is now the first card — the
 * protagonist — and keeps only the list. A second frame inside a card is a box inside
 * a box.
 *
 * The dots take their status colour; the container stays white. A card about problems is
 * not an amber card.
 */
function NeedsAttention({ gaps, appId }: { gaps: Gap[]; appId: string }) {
  return (
    /* No gutter of its own: `padding="none"` already keeps the Card's `px-4` so a flush
       list's dividers do not kiss the panel border (ADR-0009). */
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
