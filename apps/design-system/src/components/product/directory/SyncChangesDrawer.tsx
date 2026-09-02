'use client';

import * as React from 'react';
import PeopleOutlined from '@mui/icons-material/PeopleOutlined';
import ShieldOutlined from '@mui/icons-material/ShieldOutlined';
import { DataTable, Drawer, Tabs, type Column } from '@ds/components';
import { formatDateTime } from '../sod/labels';
import type { SyncItem, SyncRun } from '@/data/reconciliation';

/** Which of a run's two change lists the drawer is showing. */
export type SyncChangeKind = 'accounts' | 'entitlements';

/** Which part of that list — the three tabs. */
type Group = 'added' | 'removed' | 'unchanged';

// Outlined, per the iconography rule: filled is reserved for a Card header,
// where the glyph is forced to 15px and a 1px stroke stops reading. A Drawer's
// tile is 22px, so the stroke is fine and the filled twin would be the odd mark
// out among every other header in the product.
const KIND = {
  accounts: {
    title: 'Accounts',
    noun: 'account',
    icon: <PeopleOutlined sx={{ fontSize: 22 }} />,
    nameHeader: 'Account',
    detailHeader: 'Email',
    // Account names run long and are mostly login-shaped, so they need more of
    // the row than an entitlement name does.
    nameWidth: 200,
  },
  entitlements: {
    title: 'Entitlements',
    noun: 'entitlement',
    icon: <ShieldOutlined sx={{ fontSize: 22 }} />,
    nameHeader: 'Entitlement',
    detailHeader: 'Description',
    nameWidth: 170,
  },
} as const;

const plural = (n: number, noun: string) => `${n} ${noun}${n === 1 ? '' : 's'}`;

/**
 * What one sync run did to an application's accounts or entitlements.
 *
 * Opened from the delta chip in the Sync History row, which states the same
 * three numbers this drawer names. The counts answer "how much moved"; a
 * reviewer asked to sign off on a run needs "which ones", and until now that
 * was nowhere in the product.
 *
 * Three tabs rather than three stacked lists, because the groups are read one
 * at a time and are wildly uneven: an application with two new accounts and
 * ninety untouched ones would bury the two under the ninety, and the reader
 * would scroll past the only part of the run that changed anything. The counts
 * ride on the tabs, so the whole shape of the run is still legible at a glance
 * without opening any of them.
 */
export function SyncChangesDrawer({
  open,
  run,
  kind,
  applicationName,
  onClose,
}: {
  open: boolean;
  /** `null` between closing and the state clearing — the drawer keeps its last
   *  frame while it animates out. */
  run: SyncRun | null;
  kind: SyncChangeKind;
  applicationName: string;
  onClose: () => void;
}) {
  const meta = KIND[kind];
  const delta = run?.[kind];
  const [group, setGroup] = React.useState<Group>('added');

  // Open on the first group that has anything in it. Landing on an empty Added
  // tab when the run's whole story is a removal makes the reader hunt for the
  // thing they clicked the chip to see.
  React.useEffect(() => {
    if (!delta) return;
    setGroup(delta.added > 0 ? 'added' : delta.removed > 0 ? 'removed' : 'unchanged');
    // Only when the drawer is pointed at a different list — not on every
    // re-render, which would fight the reader for control of the tabs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [run?.id, kind]);

  const rows: Record<Group, SyncItem[]> = {
    added: delta?.addedItems ?? [],
    removed: delta?.removedItems ?? [],
    unchanged: delta?.unchangedItems ?? [],
  };

  const empty: Record<Group, { title: string; message: string }> = {
    added: {
      title: `No ${meta.noun}s added`,
      message: `This sync found nothing in ${applicationName} that IGA did not already hold.`,
    },
    removed: {
      title: `No ${meta.noun}s removed`,
      message: `Everything IGA held before this sync was still in ${applicationName} when it ran.`,
    },
    unchanged: {
      title: `Nothing was already here`,
      message: `${applicationName} held no ${meta.noun}s before this sync ran.`,
    },
  };

  // `fixed`, so the name column keeps its share and the two columns do not
  // resize as you move between tabs — three tables that jump about read as
  // three different tables rather than three views of one run.
  const columns: Column<SyncItem>[] = [
    {
      id: 'name',
      header: meta.nameHeader,
      width: meta.nameWidth,
      value: (r) => r.name,
      // `title` by hand: the table adds one only for a plain value, and a name
      // truncated to "svc-okta-provisio…" with no way to read the rest is not
      // an identification of anything.
      render: (r) => (
        <span title={r.name} className="text-body-sm-medium text-text-primary">
          {r.name}
        </span>
      ),
    },
    {
      id: 'detail',
      header: meta.detailHeader,
      // Wrapped, not truncated: a description cut at "Manage org configuration,
      // users, and…" is the part of the row worth reading, and there are few
      // enough rows here that ragged heights cost nothing.
      wrap: true,
      value: (r) => r.detail,
      render: (r) => <span className="text-text-secondary">{r.detail}</span>,
    },
  ];

  return (
    <Drawer
      open={open}
      onClose={onClose}
      icon={meta.icon}
      title={meta.title}
      subtitle={
        run
          ? `${run.event} · ${formatDateTime(run.at)} · ${run.trigger === 'manual' ? 'Manual' : 'Automatic'}`
          : undefined
      }
      width={520}
      subheader={
        run?.outcome === 'failed' ? (
          // Above the tabs, not inside one: it explains why two of the three are
          // empty, which is not a fact about whichever tab is open. Stated
          // plainly rather than in a red banner — the row that opened this
          // drawer already carries the Failed chip, and repeating the alarm
          // here would imply a second, separate problem.
          <p className="text-body-sm text-text-secondary">
            This sync failed, so nothing was added or removed. {applicationName} still holds the{' '}
            {plural(delta?.total ?? 0, meta.noun)} it held before it ran.
          </p>
        ) : undefined
      }
      toolbar={
        delta ? (
          <Tabs
            aria-label={`${meta.title} changed by this sync`}
            value={group}
            onChange={(v) => setGroup(v as Group)}
            items={[
              { value: 'added', label: 'Added', count: delta.added },
              { value: 'removed', label: 'Removed', count: delta.removed },
              { value: 'unchanged', label: 'Untouched', count: delta.unchangedItems.length },
            ]}
          />
        ) : undefined
      }
    >
      {delta && (
        <DataTable<SyncItem>
          layout="fixed"
          columns={columns}
          rows={rows[group]}
          // Short by construction — one group of one run — so the page-size
          // selector and a "1–2 of 2" range would be more chrome than table.
          paginated={false}
          emptyTitle={empty[group].title}
          emptyMessage={empty[group].message}
        />
      )}
    </Drawer>
  );
}
