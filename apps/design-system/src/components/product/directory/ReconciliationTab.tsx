'use client';

import * as React from 'react';
import Sync from '@mui/icons-material/Sync';
import People from '@mui/icons-material/People';
import Shield from '@mui/icons-material/Shield';
import WatchLater from '@mui/icons-material/WatchLater';
import UploadFile from '@mui/icons-material/UploadFileOutlined';
import Widgets from '@mui/icons-material/Widgets';
import CircularProgress from '@mui/material/CircularProgress';
import { Button, Card, DataTable, StatusChip, useToast, type Column } from '@ds/components';
import { InfoRow, InfoRowGroup } from './DetailShell';
import { infoIcon } from './infoIcons';
import { RowLink, RowValue } from './RowLink';
import { SyncChangesDrawer, type SyncChangeKind } from './SyncChangesDrawer';
import { formatDateTime } from '../sod/labels';
import {
  listSyncRuns,
  reconciliationSummary,
  type ReconciliationSummary,
  type SyncRun,
} from '@/data/reconciliation';

/**
 * Reconciliation — what the connector last brought in, and every time it ran.
 *
 * Cards state the inventory position (how many, what moved); last-sync status sits
 * inline on the Sync Now row. The history below explains how that position was reached.
 * Only the outcome is chipped: it
 * is the one column where a value means someone has to act. Trigger and event
 * are facts about a run, not states of one, so they stay as text — chipping them
 * would put four pills on every row and bury the failure.
 *
 * The full account and entitlement lists open from the cards below, which are the only
 * place that counts them.
 * The cards here are the last-sync reading of those collections, not the lists.
 *
 * An IAM or a vault reconciles a third thing. `summary.applications` is present
 * exactly when it applies, so the card, the history column and the drawer all
 * appear or stay away together.
 */
export function ReconciliationTab({
  applicationId,
  applicationName,
  canSync = true,
  onViewAccounts,
  onViewEntitlements,
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
  /**
   * Open the full account and entitlement lists.
   *
   * They used to be two more tabs on the strip, which put the inventory in three places:
   * the count on a tab, the totals on these cards, and the rows a click further on. The
   * tab strip is for the parts of an application you set up; what reconciliation *pulled
   * in* belongs to reconciliation, so the way to the rows is from the card that already
   * counts them.
   */
  onViewAccounts?: () => void;
  onViewEntitlements?: () => void;
}) {
  const toast = useToast();
  const summary = reconciliationSummary(applicationId);
  const runs = listSyncRuns(applicationId);
  const apps = summary.applications;

  const [inspecting, setInspecting] = React.useState<{ run: SyncRun; kind: SyncChangeKind } | null>(null);
  const [changesOpen, setChangesOpen] = React.useState(false);
  const inspect = (run: SyncRun, kind: SyncChangeKind) => {
    setInspecting({ run, kind });
    setChangesOpen(true);
  };

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
        <LastSyncBand
          summary={summary}
          /*
            Two ways to reconcile, and an application only ever has one of them. With a
            connector the button asks it to run; without one there is nothing to ask, so
            the file is the run. The slot was empty in that case, which left the tab
            reporting "Never run" beside no way to change it.
          */
          action={
            canSync ? (
              <Button
                variant="secondary"
                onClick={syncNow}
                startIcon={
                  syncing ? (
                    <CircularProgress size={16} color="inherit" thickness={5} />
                  ) : (
                    <Sync sx={{ fontSize: 18 }} />
                  )
                }
              >
                {syncing ? 'Syncing…' : 'Sync Now'}
              </Button>
            ) : (
              <CsvSyncActions />
            )
          }
        />

        <div className={`grid gap-5 md:grid-cols-2 ${apps ? 'xl:grid-cols-3' : ''}`}>
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
              <InfoRow
                icon={infoIcon.account}
                label="Total Accounts"
                valueWrap
                value={
                  <RowValue>
                    <span>{summary.accounts.total}</span>
                    {onViewAccounts && <RowLink onClick={onViewAccounts}>View all</RowLink>}
                  </RowValue>
                }
              />
              <InfoRow
                icon={infoIcon.sync}
                label="Modifications in last sync"
                valueWrap
                value={
                  <RowValue>
                    {/* The chip stops being the control. Two ways into one drawer from one
                        row — a chip that happens to be clickable and a link that says so —
                        is one affordance too many, and the chip was the one nobody found. */}
                    <Delta
                      added={summary.accounts.added}
                      removed={summary.accounts.removed}
                      noun="account"
                    />
                    {runs[0] && (
                      <RowLink onClick={() => inspect(runs[0], 'accounts')}>
                        View modifications
                      </RowLink>
                    )}
                  </RowValue>
                }
              />
            </InfoRowGroup>
          </Card>

          <Card title="Entitlements" icon={<Shield />} padding="none">
            <InfoRowGroup>
              <InfoRow
                icon={infoIcon.entitlement}
                label="Total Entitlements"
                valueWrap
                value={
                  <RowValue>
                    <span>{summary.entitlements.total}</span>
                    {onViewEntitlements && (
                      <RowLink onClick={onViewEntitlements}>View all</RowLink>
                    )}
                  </RowValue>
                }
              />
              <InfoRow
                icon={infoIcon.sync}
                label="Modifications in last sync"
                valueWrap
                value={
                  <RowValue>
                    <Delta
                      added={summary.entitlements.added}
                      removed={summary.entitlements.removed}
                      noun="entitlement"
                    />
                    {runs[0] && (
                      <RowLink onClick={() => inspect(runs[0], 'entitlements')}>
                        View modifications
                      </RowLink>
                    )}
                  </RowValue>
                }
              />
            </InfoRowGroup>
          </Card>
        </div>

        <div>
          <h3 className="mb-3 text-h5 text-text-primary">Sync History</h3>
          <DataTable<SyncRun>
            layout="fixed"
            columns={columns}
            rows={runs}
            emptyTitle="No syncs yet"
            /* The empty state has to name the action this application actually has. With
               no connector "Run a sync" is advice for a button that is not on the page. */
            emptyMessage={
              canSync
                ? 'This application has not been reconciled. Run a sync to pull in its accounts and entitlements.'
                : 'This application has not been reconciled. Upload a CSV to set its accounts and entitlements.'
            }
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
 * Reconciliation without a connector.
 *
 * With provisioning off there is nothing to sync over, so the inventory is whatever the
 * last file said it was: the upload is the run. A CSV is matched against what IGA already
 * holds, so a row that has gone from the file is an account that has gone from the
 * application — removal is expressed by absence, which is why this is an upload rather
 * than an "add accounts" import.
 */
function CsvSyncActions() {
  const toast = useToast();
  const inputRef = React.useRef<HTMLInputElement>(null);

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept=".csv,text/csv"
        hidden
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = '';
          if (!file) return;
          toast.success(`${file.name} queued. Accounts missing from it will be removed.`);
        }}
      />
      <Button
        variant="secondary"
        onClick={() => inputRef.current?.click()}
        startIcon={<UploadFile sx={{ fontSize: 18 }} />}
      >
        Upload CSV
      </Button>
    </>
  );
}

/**
 * Last sync — the state of the connection, and the one control that changes it.
 *
 * One full-width band rather than two objects sharing a row. The reading and the button
 * that produces it were separate bordered shapes floating at opposite ends of an invisible
 * container: on a wide screen they drifted so far apart that "Success · Aug 9" and
 * "Sync Now" read as unrelated furniture, and the band above a pair of cards had no edge of
 * its own to sit on.
 *
 * **One line, three weights.** The fix for "nothing leads" is not a second line — stacked,
 * the label got an overline and the band grew to 65px to say what fits in 45. It is weight:
 * the clock and "Last sync" are scaffolding and stay in caption grey, the timestamp is the
 * reading and takes primary ink at 600, and the chip trails as the qualifier. The line reads
 * as one sentence instead of three tags.
 *
 * **When before whether.** The outcome used to come before the moment it belonged to. A
 * sync that succeeded eight months ago is not good news, and reading the chip first is how
 * that goes unnoticed — "Success" qualifies "Aug 9", not the other way round.
 */
function LastSyncBand({
  summary,
  action,
}: {
  summary: ReconciliationSummary;
  /** Sync Now, when the application has a connector to sync over. */
  action?: React.ReactNode;
}) {
  const lastSync = summary.lastSync;
  const ariaLabel = lastSync
    ? `Last sync ${lastSync.outcome === 'success' ? 'succeeded' : 'failed'} on ${formatDateTime(lastSync.at)}`
    : 'No sync has run yet';

  return (
    <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3 rounded-xl border border-border bg-surface px-4 py-3">
      <div
        className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1"
        role="status"
        aria-label={ariaLabel}
      >
        <span className="flex shrink-0 items-center gap-2">
          <WatchLater sx={{ fontSize: 18 }} className="text-icon" aria-hidden />
          <span className="text-caption-medium text-text-secondary">Last sync</span>
        </span>

        {lastSync ? (
          <>
            <time
              dateTime={lastSync.at}
              className="text-body-sm-strong tabular-nums text-text-primary"
            >
              {formatDateTime(lastSync.at)}
            </time>
            <StatusChip
              intent={lastSync.outcome === 'success' ? 'success' : 'danger'}
              label={lastSync.outcome === 'success' ? 'Success' : 'Failed'}
            />
          </>
        ) : (
          /* Not a chip: a status chip is a status object, and never having run is the
             absence of one. The label beside it already asks the question. */
          <span className="text-body-sm text-text-secondary">Never run</span>
        )}
      </div>

      {action}
    </div>
  );
}

/**
 * A count and what moved it, as one chip.
 *
 * Chipped rather than loose text because the total and its two signed parts are
 * a single reading — one cell, one mark — and the neutral fill keeps them from
 * being mistaken for the status column beside them. The signs carry the meaning,
 * so they carry the colour; the total stays neutral. A quiet run still shows
 * +0 −0, so every chip is the same three-part reading.
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
  noun?: string;
}) {
  const chrome =
    'inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-pill border border-border bg-subtle px-2 py-0.5 text-caption-medium';
  const body = (
    <>
      {total !== undefined && <span className="text-text-primary">{total}</span>}
      <span className="text-success">+{added}</span>
      <span className="text-danger">−{removed}</span>
    </>
  );

  if (!onClick) return <span className={chrome}>{body}</span>;

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`${added} ${noun ?? 'item'}${added === 1 ? '' : 's'} added, ${removed} removed. Show which ones.`}
      className={`${chrome} transition-colors hover:border-border-strong hover:bg-surface-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-subtle`}
    >
      {body}
    </button>
  );
}
