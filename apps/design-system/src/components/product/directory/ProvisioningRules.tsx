'use client';

import * as React from 'react';
import SearchOutlined from '@mui/icons-material/SearchOutlined';
import TuneOutlined from '@mui/icons-material/TuneOutlined';
import { DataTable, Input, StatusChip, type Column } from '@ds/components';
import { AttributeMappingDrawer } from './AttributeMappingDrawer';
import {
  EVENT_KINDS,
  listConnectionEvents,
  type ConnectionEvent,
} from '@/data/connection-events';

/**
 * Provisioning rules — the attribute mapping for each connection event.
 *
 * Connection configuration says *what* IGA calls; this says how those calls
 * read and write fields. Mapping stays a drawer because the unit of work is
 * a row of four related fields.
 */
export function ProvisioningRules({
  applicationId,
  applicationName,
  onChanged,
}: {
  applicationId: string;
  applicationName: string;
  onChanged?: () => void;
}) {
  const [rows, setRows] = React.useState<ConnectionEvent[]>([]);
  const [search, setSearch] = React.useState('');
  const [mapping, setMapping] = React.useState<ConnectionEvent | null>(null);

  const refresh = React.useCallback(() => setRows(listConnectionEvents(applicationId)), [applicationId]);
  React.useEffect(() => refresh(), [refresh]);

  const kindLabel = (e: ConnectionEvent) => EVENT_KINDS.find((k) => k.value === e.kind)?.label ?? e.kind;
  const q = search.trim().toLowerCase();
  const filtered = q
    ? rows.filter((r) => r.name.toLowerCase().includes(q) || kindLabel(r).toLowerCase().includes(q))
    : rows;

  const columns: Column<ConnectionEvent>[] = [
    {
      id: 'name',
      header: 'Event',
      sortable: true,
      value: (r) => r.name,
      render: (r) => (
        <div className="flex items-center gap-3">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-brand-subtle text-icon-brand">
            <TuneOutlined sx={{ fontSize: 18 }} />
          </span>
          <span className="min-w-0">
            <span className="block truncate text-body-sm-medium text-text-primary">{r.name}</span>
            <span className="block truncate text-caption text-text-secondary">{kindLabel(r)}</span>
          </span>
        </div>
      ),
    },
    {
      id: 'mapping',
      header: 'Attribute mapping',
      sortable: true,
      width: 220,
      value: (r) => r.attributes.length,
      render: (r) => (
        <button
          type="button"
          onClick={() => setMapping(r)}
          className="text-body-sm-strong text-text-link hover:underline"
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
      width: 160,
      value: (r) => (r.attributes.length > 0 ? 'mapped' : 'unmapped'),
      render: (r) =>
        r.attributes.length > 0 ? (
          <StatusChip intent="success" label="Mapped" />
        ) : (
          <StatusChip intent="warning" label="Not mapped" />
        ),
    },
  ];

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="mb-4 w-full max-w-sm shrink-0">
        <Input
          placeholder="Search events"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          startAdornment={<SearchOutlined sx={{ fontSize: 18 }} />}
        />
      </div>
      <div className="min-h-0 flex-1">
        <DataTable<ConnectionEvent>
          columns={columns}
          rows={filtered}
          fillHeight
          onRowClick={(r) => setMapping(r)}
          emptyTitle="No events to map"
          emptyMessage="Add connection events first. Attribute mapping lives on those calls."
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
          onChanged?.();
        }}
      />
    </div>
  );
}
