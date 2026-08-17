'use client';

import * as React from 'react';
import Sync from '@mui/icons-material/Sync';
import People from '@mui/icons-material/People';
import Shield from '@mui/icons-material/Shield';
import WatchLater from '@mui/icons-material/WatchLater';
import CircularProgress from '@mui/material/CircularProgress';
import { Button, Card, DataTable, StatusChip, useToast, type Column } from '@ds/components';
import { InfoRow, InfoRowGroup } from './DetailShell';
import { infoIcon } from './infoIcons';
import { formatDateTime } from '../sod/labels';
import { listSyncRuns, reconciliationSummary, type SyncRun } from '@/data/reconciliation';

/**
 * Reconciliation — what the connector last brought in, and every time it ran.
 *
 * Three cards state the position (how many, what moved, did it work), and the
 * history below explains how that position was reached. Only the outcome is
 * chipped: it is the one column where a value means someone has to act. Trigger
 * and event are facts about a run, not states of one, so they stay as text —
 * chipping them would put four pills on every row and bury the failure.
 */
export function ReconciliationTab({ applicationId }: { applicationId: string }) {
  const toast = useToast();
  const summary = reconciliationSummary(applicationId);
  const runs = listSyncRuns(applicationId);

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
      render: (r) => <Delta total={r.accounts.total} added={r.accounts.added} removed={r.accounts.removed} />,
    },
    {
      id: 'entitlements',
      header: 'Entitlements',
      sortable: true,
      width: 150,
      value: (r) => r.entitlements.total,
      render: (r) => (
        <Delta total={r.entitlements.total} added={r.entitlements.added} removed={r.entitlements.removed} />
      ),
    },
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

        {/* Two up before 1280px: three columns squeeze the label/value rows to
            the point where "Modifications in last sync" and a timestamp both
            truncate, and a card whose value is cut off states nothing. */}
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          <Card title="Accounts" icon={<People />} padding="none">
            <InfoRowGroup>
              <InfoRow icon={infoIcon.account} label="Total Accounts" value={String(summary.accounts.total)} />
              <InfoRow
                icon={infoIcon.sync}
                label="Modifications in last sync"
                value={<Delta added={summary.accounts.added} removed={summary.accounts.removed} />}
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
                value={<Delta added={summary.entitlements.added} removed={summary.entitlements.removed} />}
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
 */
export function Delta({ total, added, removed }: { total?: number; added: number; removed: number }) {
  const still = added === 0 && removed === 0;
  return (
    <span className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-pill border border-border bg-subtle px-2 py-0.5 text-caption-medium">
      {total !== undefined && <span className="text-text-primary">{total}</span>}
      {still ? (
        <span className="text-text-tertiary">No change</span>
      ) : (
        <>
          <span className="text-success">+{added}</span>
          <span className="text-danger">−{removed}</span>
        </>
      )}
    </span>
  );
}
