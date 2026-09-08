'use client';

import * as React from 'react';
import Link from 'next/link';
import { StatusChip } from '@ds/components';
import { formatDateTime } from '../sod/labels';
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
 * ## Why this is not four cards of label/value rows
 *
 * It was, and the shape defeated the purpose. Eighteen rows in four framed cards, every
 * row the same size in the same weight, so nothing led and the reader had to read all of
 * it to learn anything. Worse, the rows that were actually *problems* — an unassigned
 * access review owner, an ungoverned application, a connector that had never synced —
 * were formatted identically to the rows that were merely facts, and buried in the fourth
 * card. The single most actionable statement on the page was the least visible thing on
 * it.
 *
 * ## Three levels, in this order
 *
 * 1. **What it holds**, as figures. Large numerals on the page's own ground, hairline
 *    separated, no tiles and no icons: a count is read by its magnitude, and wrapping four
 *    of them in tinted boxes spends the colour budget on decoration. Each links to the tab
 *    that lists the population, per `StatTile`'s rule that a number whose members can be
 *    listed should always say where.
 * 2. **What needs attention** — the protagonist, and the only framed thing on the page.
 *    It is the one region that can prompt an action, so it is the one region with a
 *    container. When there is nothing wrong it collapses to a single quiet line, which is
 *    the reward for having set the application up properly.
 * 3. **Reference detail**, in two unframed columns under quiet overline labels. Hairline
 *    rows rather than cards: this is material you consult, not material you scan, and
 *    boxing it made it compete with the part that needs you.
 *
 * Two things are deliberately absent. Risk, because `DetailShell`'s identity band above
 * already carries the `RiskScoreChip`, and a second copy four pixels below is the
 * duplication this page was full of. And what the last sync *moved*, because the
 * Reconciliation tab has three cards for it — here it was the busiest row on the page,
 * reading "No change accounts +1 −0 entitlements", to answer a question nobody asks of an
 * overview. That the last sync succeeded is the health fact; the deltas are the detail.
 *
 * Read-only throughout — every row's tab is where the corresponding work happens.
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
    <div className="ds-scroll h-full overflow-y-auto pr-0.5">
      <div className="max-w-5xl space-y-7 pb-8">
        {/* Figures. `divide-x` rather than four boxes: the numerals carry the weight and
            the hairlines only say where one ends.

            Breakpoints are `lg`, not `sm`/`md`. What has to fit is the content region, and
            the sidebar takes ~200px off the viewport before this element sees any of it —
            picked against the viewport, a four-across row at 768px clipped its last label
            to "Appli". */}
        <div className="grid grid-cols-2 gap-y-5 lg:flex lg:divide-x lg:divide-border-subtle">
          <Figure value={accounts.length} label="App accounts" href={href('accounts')} first />
          <Figure value={entitlements.length} label="Entitlements" href={href('entitlements')} />
          <Figure value={gov?.metrics.find((m) => m.label === 'Users')?.value ?? 0} label="Users with access" />
          {live?.applications != null && (
            <Figure value={live.applications} label="Applications discovered" href={href('reconciliation')} />
          )}
        </div>

        {live && (gaps.length > 0 ? <NeedsAttention gaps={gaps} appId={app.id} /> : <AllClear />)}

        <div className="grid gap-x-12 gap-y-7 lg:grid-cols-2">
          <section>
            <SectionLabel>Connection</SectionLabel>
            <Row label="Application type" value={profile.appType} />
            <Row
              label="Discovered via"
              value={profile.discoverySource === 'IAM' ? 'An IAM integration' : 'Added directly'}
            />
            <Row
              label="Provisioning"
              value={
                provisions ? `On · ${profile.provisioningType === 'auto' ? 'Automatic' : 'Manual'}` : 'Off · read only'
              }
            />
            {provisions && (
              <Row
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
              />
            )}
            <Row
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
            />
          </section>

          <section>
            <SectionLabel>Governance</SectionLabel>
            {/* Named people and accountable bodies in one row, because "who answers for
                this" is one question. A team is marked as a team rather than listed
                separately: which kind of party it is matters less here than that
                somebody is named at all. */}
            <Row
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
            />
            <Row
              label="Access review owner"
              value={
                reviewers.length ? (
                  reviewers.map((p) => p.name).join(', ')
                ) : (
                  <StatusChip intent="danger" label="Unassigned" />
                )
              }
            />
            <Row
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
            />
            <Row
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
            />
            <Row
              label="Departments"
              value={(gov?.departmentIds ?? []).map((id) => displayName(id)).join(', ') || '—'}
            />
          </section>
        </div>
      </div>
    </div>
  );
}

/**
 * One count, at a size you can read without looking for it.
 *
 * A link when the population can be listed, and the whole figure is the target rather
 * than a small affordance beside it — the number is the thing being clicked.
 */
function Figure({
  value,
  label,
  href,
  first = false,
}: {
  value: React.ReactNode;
  label: string;
  href?: string;
  first?: boolean;
}) {
  const body = (
    <>
      <div className="text-stat text-text-primary">{value}</div>
      <div className="mt-1 whitespace-nowrap text-caption text-text-secondary">{label}</div>
    </>
  );
  const pad = first ? 'lg:pr-7' : 'lg:px-7';
  if (!href) return <div className={pad}>{body}</div>;
  return (
    <Link
      href={href}
      className={`${pad} group rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-subtle`}
    >
      <div className="text-stat text-text-primary transition-colors group-hover:text-text-link">{value}</div>
      <div className="mt-1 whitespace-nowrap text-caption text-text-secondary">{label}</div>
    </Link>
  );
}

/**
 * The page's protagonist: everything unresolved, and one link each to resolve it.
 *
 * Built here rather than from `Card` on purpose. `Card` is a grey wrapper around a white
 * inner panel with an icon header — right for a region of reference rows, too much frame
 * for a short action list that has to be the loudest thing on a page where nothing else
 * is framed at all. One hairline border is the whole container.
 *
 * The dots take their status colour; the container stays white. A card about problems is
 * not an amber card.
 */
function NeedsAttention({ gaps, appId }: { gaps: Gap[]; appId: string }) {
  return (
    <section className="rounded-xl border border-border bg-surface px-4 py-3">
      <div className="mb-2 flex items-baseline gap-2">
        <h3 className="text-body-strong text-text-primary">Needs attention</h3>
        <span className="tabular-nums text-caption text-text-tertiary">{gaps.length}</span>
      </div>
      <ul className="divide-y divide-border-subtle">
        {gaps.map((gap) => (
          <li key={gap.id} className="flex items-center justify-between gap-4 py-2.5">
            <span className="flex min-w-0 items-center gap-2.5">
              <span
                aria-hidden
                className="h-1.5 w-1.5 shrink-0 rounded-pill"
                style={{ backgroundColor: `var(--ds-color-status-${gap.tone}-solid)` }}
              />
              <span className="truncate text-body-sm text-text-primary">{gap.text}</span>
            </span>
            <Link
              href={`/iga/directory/applications/${appId}?tab=${gap.tab}`}
              className="shrink-0 rounded-sm text-body-sm-medium text-text-link hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-subtle"
            >
              {gap.cta}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** No frame, no green panel — the reward for a well-set-up application is quiet. */
function AllClear() {
  return (
    <p className="text-body-sm text-text-secondary">
      <span className="font-emphasis text-text-primary">Nothing needs attention.</span> The connector is
      wired, the inventory is current, and this application is owned and governed.
    </p>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <h3 className="mb-1 text-overline uppercase text-text-tertiary">{children}</h3>;
}

/**
 * Label left, value right, hairline under.
 *
 * The value is right-aligned so the column of values shares an edge — with ragged
 * left-aligned values the eye has to find each one after reading its label.
 */
function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-border-subtle py-2.5 last:border-b-0">
      <span className="shrink-0 text-body-sm text-text-secondary">{label}</span>
      <span className="min-w-0 truncate text-right text-body-sm text-text-primary">{value}</span>
    </div>
  );
}

/** A value the store has not answered for yet. Dimmed, so it does not read as "none". */
function Pending() {
  return <span className="text-text-tertiary">·</span>;
}
