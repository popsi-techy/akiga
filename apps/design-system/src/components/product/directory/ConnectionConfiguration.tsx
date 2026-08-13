'use client';

import * as React from 'react';
import AddOutlined from '@mui/icons-material/AddOutlined';
import SearchOutlined from '@mui/icons-material/SearchOutlined';
import SyncOutlined from '@mui/icons-material/SyncOutlined';
import InfoOutlined from '@mui/icons-material/InfoOutlined';
import EditOutlined from '@mui/icons-material/EditOutlined';
import DeleteOutline from '@mui/icons-material/DeleteOutline';
import TuneOutlined from '@mui/icons-material/TuneOutlined';
import { Button, DataTable, Dialog, Input, Menu, StatusChip, Tooltip, useToast, type Column } from '@ds/components';
import { ConnectionEventDrawer } from './ConnectionEventDrawer';
import { AttributeMappingDrawer } from './AttributeMappingDrawer';
import {
  EVENT_KINDS,
  deleteConnectionEvent,
  eventStatus,
  listConnectionEvents,
  missingPieces,
  saveConnectionEvent,
  type ConnectionEvent,
} from '@/data/connection-events';
import type { AppAuthorization } from '@/data/provisioning-auth';

/**
 * Connection Configuration — the calls IGA makes once it can sign in.
 *
 * The banner is not decoration: these settings rewrite records that already
 * exist, which is the one thing a user would not assume from a form called
 * "configuration". It stays above the table rather than inside the drawer
 * because it is true of every row, not of one edit.
 */
export function ConnectionConfiguration({
  applicationId,
  applicationName,
  authorizations,
}: {
  applicationId: string;
  applicationName: string;
  authorizations: AppAuthorization[];
}) {
  const toast = useToast();
  const [rows, setRows] = React.useState<ConnectionEvent[]>([]);
  const [search, setSearch] = React.useState('');
  const [editing, setEditing] = React.useState<ConnectionEvent | null>(null);
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [removing, setRemoving] = React.useState<ConnectionEvent | null>(null);
  const [mapping, setMapping] = React.useState<ConnectionEvent | null>(null);

  const refresh = React.useCallback(() => setRows(listConnectionEvents(applicationId)), [applicationId]);
  React.useEffect(() => refresh(), [refresh]);

  const kindLabel = (e: ConnectionEvent) => EVENT_KINDS.find((k) => k.value === e.kind)?.label ?? e.kind;

  const q = search.trim().toLowerCase();
  const filtered = q
    ? rows.filter((r) => r.name.toLowerCase().includes(q) || kindLabel(r).toLowerCase().includes(q))
    : rows;

  const confirmRemove = () => {
    if (!removing) return;
    deleteConnectionEvent(removing.id);
    setRemoving(null);
    refresh();
    toast.success('Event removed. It will not run again.');
  };

  const columns: Column<ConnectionEvent>[] = [
    {
      id: 'name',
      header: 'Event Name',
      sortable: true,
      value: (r) => r.name,
      render: (r) => (
        <div className="flex items-center gap-3">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-brand-subtle text-icon-brand">
            <SyncOutlined sx={{ fontSize: 18 }} />
          </span>
          <span className="truncate text-body-sm-strong text-text-primary">{r.name}</span>
        </div>
      ),
    },
    {
      id: 'kind',
      header: 'Event',
      sortable: true,
      width: 180,
      value: kindLabel,
      render: (r) => <span className="text-text-secondary">{kindLabel(r)}</span>,
    },
    {
      id: 'mapping',
      header: 'Attribute Mapping',
      sortable: true,
      width: 190,
      value: (r) => r.attributes.length,
      render: (r) => (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setMapping(r);
          }}
          className="text-body-sm-strong text-text-brand hover:underline"
        >
          {r.attributes.length === 0
            ? 'Map attributes'
            : `${r.attributes.length} ${r.attributes.length === 1 ? 'attribute' : 'attributes'} mapped`}
        </button>
      ),
    },
    {
      id: 'status',
      header: 'Status',
      sortable: true,
      width: 200,
      value: (r) => eventStatus(r),
      render: (r) => {
        const status = eventStatus(r);
        if (status === 'ready') return <StatusChip intent="success" label="Ready" />;
        if (status === 'disabled') return <StatusChip intent="neutral" label="Disabled" />;
        // The chip names the state; the tooltip names what is missing, so the
        // fix is one hover away instead of an edit-and-hunt.
        return (
          <Tooltip title={`Still needs ${missingPieces(r).join(', ')}.`}>
            <span tabIndex={0} className="inline-flex">
              <StatusChip intent="warning" label="Needs setup" />
            </span>
          </Tooltip>
        );
      },
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
              {
                label: 'Map attributes',
                icon: <TuneOutlined sx={{ fontSize: 18 }} />,
                onClick: () => setMapping(r),
              },
              {
                label: r.enabled ? 'Disable' : 'Enable',
                onClick: () => {
                  saveConnectionEvent({ ...r, enabled: !r.enabled });
                  refresh();
                  toast.info(r.enabled ? 'Event disabled. It will not run.' : 'Event enabled.');
                },
              },
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
      <div className="mb-4 flex shrink-0 items-start gap-2.5 rounded-lg border border-[var(--ds-color-status-info-border)] bg-[var(--ds-color-status-info-subtle)] p-4">
        <InfoOutlined
          sx={{ fontSize: 18, color: 'var(--ds-color-status-info-fg)' }}
          className="mt-0.5 shrink-0"
          aria-hidden
        />
        <p className="text-body-sm text-text-secondary">
          <span className="text-body-sm-strong text-text-primary">These settings are retroactive.</span> The next sync
          applies them to accounts and entitlements already imported from this application, not only to new ones —
          existing records are rewritten to match.
        </p>
      </div>

      <div className="mb-4 flex shrink-0 flex-wrap items-center gap-3">
        <div className="w-full max-w-sm">
          <Input
            placeholder="Search events"
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
            Add Event
          </Button>
        </div>
      </div>

      <div className="min-h-0 flex-1">
        <DataTable<ConnectionEvent>
          columns={columns}
          rows={filtered}
          fillHeight
          onRowClick={(r) => {
            setEditing(r);
            setDrawerOpen(true);
          }}
          emptyTitle="No events yet"
          emptyMessage="An event is one API call — importing users, deactivating a leaver. Add the first one to tell IGA what to call and when."
        />
      </div>

      <AttributeMappingDrawer
        open={mapping !== null}
        event={mapping}
        applicationName={applicationName}
        onClose={() => setMapping(null)}
        onSaved={() => {
          setMapping(null);
          refresh();
        }}
      />

      <ConnectionEventDrawer
        open={drawerOpen}
        applicationId={applicationId}
        authorizations={authorizations}
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
        title="Remove this event?"
        confirmLabel="Remove"
        tone="danger"
        onConfirm={confirmRemove}
      >
        {removing?.name ? `“${removing.name}” ` : 'This event '}
        stops running on the next sync. Records it already imported are kept.
      </Dialog>
    </div>
  );
}
