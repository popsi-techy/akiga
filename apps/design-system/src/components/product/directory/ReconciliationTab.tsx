'use client';

import * as React from 'react';
import Sync from '@mui/icons-material/Sync';
import People from '@mui/icons-material/People';
import Shield from '@mui/icons-material/Shield';
import WatchLater from '@mui/icons-material/WatchLater';
import Widgets from '@mui/icons-material/Widgets';
import CircularProgress from '@mui/material/CircularProgress';
import { Button, Card, DataTable, StatusChip, useToast, type Column } from '@ds/components';
import { InfoRow, InfoRowGroup } from './DetailShell';
import { infoIcon } from './infoIcons';
import { SyncChangesDrawer, type SyncChangeKind } from './SyncChangesDrawer';
import { formatDateTime } from '../sod/labels';
import { listSyncRuns, reconciliationSummary, type SyncRun } from '@/data/reconciliation';

/**
 * Reconciliation — what the connector last brought in, and every time it ran.
 *
 * Cards state the position (how many, what moved, did it work), and the history
 * below explains how that position was reached. Only the outcome is chipped: it
 * is the one column where a value means someone has to act. Trigger and event
 * are facts about a run, not states of one, so they stay as text — chipping them
 * would put four pills on every row and bury the failure.
 *
 * ## An IAM or a vault reconciles a third thing
 *
 * A direct application is a leaf: it has accounts and entitlements and nothing
 * underneath. An IAM federates applications and a vault holds credentials for
 * them, so its inventory has a third collection — and for an IAM that collection
 * is the reason the connection was made, which is why it leads the cards rather
 * than trailing them. `summary.applications` is present exactly when it applies,
 * so the card, the history column and the drawer all appear or stay away
 * together; there is no separate flag for a caller to get wrong.
 */
export function ReconciliationTab({
  applicationId,
  applicationName,
  canSync = true,
}: {
  applicationId: string;
  applicationName: string;
  /**
   * Whether IGA can actually run a sync — false when the application has no
   * connector configured.
   *
   * The inventory is still worth showing without one: totals, last-sync state and the
   * history are all honest reads, and "nothing here, never synced" is the answer to what
   * this application holds. What is not honest is a Sync Now that has nothing to sync
   * over, which promises an action IGA cannot take and returns a toast saying it queued.
   */
  canSync?: boolean;
}) {
  const toast = useToast();
  const summary = reconciliationSummary(applicationId);
  const runs = listSyncRuns(applicationId);
  /*
    Present exactly when this connection fronts other systems. One source for the card,
    the history column and the drawer, so they cannot disagree about whether this
    application has applications inside it.
  */
  const apps = summary.applications;

  // Which run's change list is open. The run is kept after `open` goes false so
  // the drawer has something to render while it slides out.
  const [inspecting, setInspecting] = React.useState<{ run: SyncRun; kind: SyncChangeKind } | null>(null);
  const [changesOpen, setChangesOpen] = React.useState(false);
  const inspect = (run: SyncRun, kind: SyncChangeKind) => {
    setInspecting({ run, kind });
    setChangesOpen(true);
  };

  // Demo sync: spinner, then a result. No run is written — the history stays
  // deterministic, which is what makes the totals above add up.
  const [syncing, setSyncing] = React.useState(false);
  const timer = React.useRef<ReturnType<typeof setTimeout>>();
  React.useEffect(() => () => clearTimeout(timer.current), []);
  const syncNow = () => {
    if (syncing) return;
    setSyncing(true);
    timer.current = setTimeout(() => {
      setSyncing(false);
      toast.success('Sync queued. The connector will report back when it finishes.');
    }, 1600);
  };

  const columns: Column<SyncRun>[] = [
    {
      id: 'at',
      header: 'Sync Time',
      sortable: true,
      width: 200,
      value: (r) => r.at,
      render: (r) => <span className="text-text-secondary">{formatDateTime(r.at)}</span>,
    },
    {
      id: 'trigger',
      header: 'Sync Type',
      sortable: true,
      width: 110,
      value: (r) => r.trigger,
      render: (r) => (
        <span className="text-text-secondary">{r.trigger === 'manual' ? 'Manual' : 'Automatic'}</span>
      ),
    },
    {
      id: 'event',
      header: 'Event Type',
      sortable: true,
      width: 170,
      value: (r) => r.event,
      render: (r) => <span className="text-text-secondary">{r.event}</span>,
    },
    {
      id: 'accounts',
      header: 'Accounts',
      sortable: true,
      width: 150,
      value: (r) => r.accounts.total,
      render: (r) => (
        <Delta
          total={r.accounts.total}
          added={r.accounts.added}
          removed={r.accounts.removed}
          noun="account"
          onClick={() => inspect(r, 'accounts')}
        />
      ),
    },
    {
      id: 'entitlements',
      header: 'Entitlements',
      sortable: true,
      width: 150,
      value: (r) => r.entitlements.total,
      render: (r) => (
        <Delta
          total={r.entitlements.total}
          added={r.entitlements.added}
          removed={r.entitlements.removed}
          noun="entitlement"
          onClick={() => inspect(r, 'entitlements')}
        />
      ),
    },
    ...(apps
      ? [
          {
            id: 'applications',
            header: 'Applications',
            sortable: true,
            width: 150,
            value: (r: SyncRun) => r.applications?.total ?? 0,
            render: (r: SyncRun) =>
              r.applications ? (
                <Delta
                  total={r.applications.total}
                  added={r.applications.added}
                  removed={r.applications.removed}
                  noun="application"
                  onClick={() => inspect(r, 'applications')}
                />
              ) : null,
          } satisfies Column<SyncRun>,
        ]
      : []),
    {
      id: 'outcome',
      header: 'Status',
      sortable: true,
      width: 120,
      value: (r) => r.outcome,
      render: (r) =>
        r.outcome === 'success' ? (
          <StatusChip intent="success" label="Success" />
        ) : (
          <StatusChip intent="danger" label="Failed" />
        ),
    },
  ];

  return (
    <div className="ds-scroll h-full overflow-y-auto pr-0.5">
      <div className="space-y-5">
        {/* The row goes with the button rather than sitting empty above the cards. */}
        {canSync && (
          <div className="flex justify-end">
            <Button
              variant="secondary"
              onClick={syncNow}
              startIcon={
                syncing ? <CircularProgress size={16} color="inherit" thickness={5} /> : <Sync sx={{ fontSize: 18 }} />
              }
            >
              {syncing ? 'Syncing…' : 'Sync Now'}
            </Button>
          </div>
        )}

        {/* Two up before 1280px: three columns squeeze the label/value rows to
            the point where "Modifications in last sync" and a timestamp both
            truncate, and a card whose value is cut off states nothing. Four
            cards stay two up at every width for the same reason — a 2x2 block
            reads as one group, where three-and-one reads as a card left over. */}
        <div className={`grid gap-5 md:grid-cols-2 ${apps ? '' : 'xl:grid-cols-3'}`}>
          {/* `Widgets`, not `Apps`: MUI draws `Apps` identically filled or outlined, and a
              Card header is forced to 15px where an outlined glyph smudges. The shared
              `infoIcon.application` mark stays on the rows inside, at a size that can
              carry a 1px stroke. */}
          {apps && (
            <Card title="Applications" icon={<Widgets />} padding="none">
              <InfoRowGroup>
                <InfoRow
                  icon={infoIcon.application}
                  label="Applications Discovered"
                  value={String(apps.total)}
                />
                <InfoRow
                  icon={infoIcon.sync}
                  label="Modifications in last sync"
                  value={
                    <Delta
                      added={apps.added}
                      removed={apps.removed}
                      noun="application"
                      onClick={runs[0]?.applications ? () => inspect(runs[0], 'applications') : undefined}
                    />
                  }
                />
              </InfoRowGroup>
            </Card>
          )}

          <Card title="Accounts" icon={<People />} padding="none">
            <InfoRowGroup>
              <InfoRow icon={infoIcon.account} label="Total Accounts" value={String(summary.accounts.total)} />
              <InfoRow
                icon={infoIcon.sync}
                label="Modifications in last sync"
                value={
                  <Delta
                    added={summary.accounts.added}
                    removed={summary.accounts.removed}
                    noun="account"
                    onClick={runs[0] ? () => inspect(runs[0], 'accounts') : undefined}
                  />
                }
              />
            </InfoRowGroup>
          </Card>

          <Card title="Entitlements" icon={<Shield />} padding="none">
            <InfoRowGroup>
              <InfoRow
                icon={infoIcon.entitlement}
                label="Total Entitlements"
                value={String(summary.entitlements.total)}
              />
              <InfoRow
                icon={infoIcon.sync}
                label="Modifications in last sync"
                value={
                  <Delta
                    added={summary.entitlements.added}
                    removed={summary.entitlements.removed}
                    noun="entitlement"
                    onClick={runs[0] ? () => inspect(runs[0], 'entitlements') : undefined}
                  />
                }
              />
            </InfoRowGroup>
          </Card>

          <Card title="Last Sync Status" icon={<WatchLater />} padding="none">
            <InfoRowGroup>
              <InfoRow
                icon={infoIcon.status}
                label="Status"
                value={
                  summary.lastSync ? (
                    <StatusChip
                      intent={summary.lastSync.outcome === 'success' ? 'success' : 'danger'}
                      label={summary.lastSync.outcome === 'success' ? 'Success' : 'Failed'}
                    />
                  ) : (
                    <StatusChip intent="neutral" label="Never synced" />
                  )
                }
              />
              <InfoRow
                icon={infoIcon.completed}
                label="Date & Time"
                value={summary.lastSync ? formatDateTime(summary.lastSync.at) : '—'}
              />
            </InfoRowGroup>
          </Card>
        </div>

        <div>
          <h3 className="mb-3 text-h5 text-text-primary">Sync History</h3>
          <DataTable<SyncRun>
            columns={columns}
            rows={runs}
            emptyTitle="No syncs yet"
            emptyMessage="This application has not been reconciled. Run a sync to pull in its accounts and entitlements."
          />
        </div>
      </div>

      <SyncChangesDrawer
        open={changesOpen}
        run={inspecting?.run ?? null}
        kind={inspecting?.kind ?? 'accounts'}
        applicationName={applicationName}
        onClose={() => setChangesOpen(false)}
      />
    </div>
  );
}

/**
 * A count and what moved it, as one chip.
 *
 * Chipped rather than loose text because the total and its two signed parts are
 * a single reading — one cell, one mark — and the neutral fill keeps them from
 * being mistaken for the status column beside them. The signs carry the meaning,
 * so they carry the colour; the total stays neutral. A run that changed nothing
 * says so, instead of showing two zeroes that compete with the number.
 *
 * Geometry matches `StatusChip` (rounded-pill, px-2 py-0.5, caption-medium), so
 * a row of chips sits on one baseline whichever column it is in.
 *
 * Given `onClick` it becomes a button to the names behind the numbers. The
 * chrome is identical either way — a chip that changed shape when it happened
 * to be actionable would make the two columns look like different data — so the
 * affordance is carried by the hover, the pointer, and the accessible name.
 */
export function Delta({
  total,
  added,
  removed,
  onClick,
  noun,
}: {
  total?: number;
  added: number;
  removed: number;
  onClick?: () => void;
  /** Singular, for the button's accessible name — "account", "entitlement". */
  noun?: string;
}) {
  const still = added === 0 && removed === 0;
  const chrome =
    'inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-pill border border-border bg-subtle px-2 py-0.5 text-caption-medium';
  const body = (
    <>
      {total !== undefined && <span className="text-text-primary">{total}</span>}
      {still ? (
        <span className="text-text-tertiary">No change</span>
      ) : (
        <>
          <span className="text-success">+{added}</span>
          <span className="text-danger">−{removed}</span>
        </>
      )}
    </>
  );

  if (!onClick) return <span className={chrome}>{body}</span>;

  return (
    <button
      type="button"
      onClick={onClick}
      // The chip's own glyphs are shorthand a screen reader cannot expand, so
      // the button says what it is and what opening it gets you.
      aria-label={`${added} ${noun ?? 'item'}${added === 1 ? '' : 's'} added, ${removed} removed. Show which ones.`}
      className={`${chrome} transition-colors hover:border-border-strong hover:bg-surface-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-subtle`}
    >
      {body}
    </button>
  );
}
