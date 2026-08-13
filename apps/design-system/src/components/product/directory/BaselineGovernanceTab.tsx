'use client';

import * as React from 'react';
import AddOutlined from '@mui/icons-material/AddOutlined';
import SearchOutlined from '@mui/icons-material/SearchOutlined';
import EditOutlined from '@mui/icons-material/EditOutlined';
import DeleteOutline from '@mui/icons-material/DeleteOutline';
import StarOutlineOutlined from '@mui/icons-material/StarOutlineOutlined';
import { Button, DataTable, Dialog, Input, Menu, StatusChip, useToast, type Column } from '@ds/components';
import { BaselineDrawer } from './BaselineDrawer';
import { EntityAvatar } from './EntityAvatar';
import { formatDateTime } from '../sod/labels';
import { deleteBaseline, listBaselines, setDefaultBaseline, type AccessBaseline } from '@/data/baselines';
import type { EntitlementRow } from '@/data/directory';

/**
 * Baseline Governance — the access this application is expected to grant.
 *
 * A baseline is a reference set, not a control: nothing is blocked by it. It
 * exists so drift has something to be measured against, which is why the table
 * says what each one holds and which is the default, and nothing about
 * enforcement.
 */
export function BaselineGovernanceTab({
  applicationId,
  entitlements,
}: {
  applicationId: string;
  entitlements: EntitlementRow[];
}) {
  const toast = useToast();
  const [rows, setRows] = React.useState<AccessBaseline[]>([]);
  const [search, setSearch] = React.useState('');
  const [editing, setEditing] = React.useState<AccessBaseline | null>(null);
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [removing, setRemoving] = React.useState<AccessBaseline | null>(null);

  const refresh = React.useCallback(() => setRows(listBaselines(applicationId)), [applicationId]);
  React.useEffect(() => refresh(), [refresh]);

  const q = search.trim().toLowerCase();
  const filtered = q ? rows.filter((r) => r.name.toLowerCase().includes(q)) : rows;

  const makeDefault = (r: AccessBaseline) => {
    setDefaultBaseline(r.id);
    refresh();
    toast.success(`“${r.name}” is now the default baseline.`);
  };

  const confirmRemove = () => {
    if (!removing) return;
    deleteBaseline(removing.id);
    setRemoving(null);
    refresh();
    toast.success('Baseline removed.');
  };

  const columns: Column<AccessBaseline>[] = [
    {
      id: 'name',
      header: 'Baseline Name',
      sortable: true,
      value: (r) => r.name,
      render: (r) => (
        <div className="flex items-center gap-3">
          <EntityAvatar kind="entitlement" name={r.name} />
          <div className="min-w-0">
            <div className="truncate text-body-sm-strong text-text-primary">{r.name}</div>
            <div className="truncate text-caption text-text-secondary">
              {r.entitlementIds.length} {r.entitlementIds.length === 1 ? 'entitlement' : 'entitlements'}
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'default',
      header: 'Default',
      sortable: true,
      width: 170,
      value: (r) => (r.isDefault ? 0 : 1),
      // The default one states it; the others offer the verb. One column, two
      // jobs — which is the difference between reading a table and using it.
      render: (r) =>
        r.isDefault ? (
          <StatusChip intent="success" label="Default" />
        ) : (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              makeDefault(r);
            }}
            className="text-body-sm-strong text-text-brand hover:underline"
          >
            Make default
          </button>
        ),
    },
    {
      id: 'updated',
      header: 'Updated',
      sortable: true,
      width: 220,
      value: (r) => r.updatedAt,
      render: (r) => <span className="text-text-secondary">{formatDateTime(r.updatedAt)}</span>,
    },
    {
      id: 'actions',
      header: '',
      width: 64,
      value: () => '',
      render: (r) => (
        <div className="flex justify-end" onClick={(e) => e.stopPropagation()}>
          <Menu
            items={[
              {
                label: 'Edit',
                icon: <EditOutlined sx={{ fontSize: 18 }} />,
                onClick: () => {
                  setEditing(r);
                  setDrawerOpen(true);
                },
              },
              ...(r.isDefault
                ? []
                : [
                    {
                      label: 'Make default',
                      icon: <StarOutlineOutlined sx={{ fontSize: 18 }} />,
                      onClick: () => makeDefault(r),
                    },
                  ]),
              {
                label: 'Remove',
                icon: <DeleteOutline sx={{ fontSize: 18 }} />,
                danger: true,
                onClick: () => setRemoving(r),
              },
            ]}
          />
        </div>
      ),
    },
  ];

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="mb-4 flex shrink-0 flex-wrap items-center gap-3">
        <div className="w-full max-w-sm">
          <Input
            placeholder="Search baselines"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            startAdornment={<SearchOutlined sx={{ fontSize: 18 }} />}
          />
        </div>
        <div className="ml-auto">
          <Button
            startIcon={<AddOutlined />}
            onClick={() => {
              setEditing(null);
              setDrawerOpen(true);
            }}
          >
            Create Baseline
          </Button>
        </div>
      </div>

      <div className="min-h-0 flex-1">
        <DataTable<AccessBaseline>
          columns={columns}
          rows={filtered}
          fillHeight
          onRowClick={(r) => {
            setEditing(r);
            setDrawerOpen(true);
          }}
          emptyTitle="No baselines yet"
          emptyMessage="A baseline records the access this application is expected to grant, so drift has something to be measured against. Create the first one."
        />
      </div>

      <BaselineDrawer
        open={drawerOpen}
        applicationId={applicationId}
        entitlements={entitlements}
        existing={editing}
        onClose={() => setDrawerOpen(false)}
        onSaved={() => {
          setDrawerOpen(false);
          refresh();
        }}
      />

      <Dialog
        open={removing !== null}
        onClose={() => setRemoving(null)}
        title="Remove this baseline?"
        confirmLabel="Remove"
        tone="danger"
        onConfirm={confirmRemove}
      >
        {removing?.isDefault
          ? `“${removing.name}” is the default. Removing it leaves this application with no baseline to measure drift against until you set another.`
          : `“${removing?.name ?? 'This baseline'}” stops being available as a reference. The entitlements themselves are untouched.`}
      </Dialog>
    </div>
  );
}
