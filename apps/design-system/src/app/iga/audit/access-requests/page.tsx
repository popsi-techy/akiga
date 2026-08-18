'use client';

import * as React from 'react';
import SearchOutlined from '@mui/icons-material/SearchOutlined';
import FilterListOutlined from '@mui/icons-material/FilterListOutlined';
import FileDownloadOutlined from '@mui/icons-material/FileDownloadOutlined';
import RefreshOutlined from '@mui/icons-material/Refresh';
import InfoOutlined from '@mui/icons-material/InfoOutlined';
import DescriptionOutlined from '@mui/icons-material/DescriptionOutlined';
import ShieldOutlined from '@mui/icons-material/ShieldOutlined';
import PersonOutline from '@mui/icons-material/PersonOutline';
import CircularProgress from '@mui/material/CircularProgress';
import { Avatar, Button, DataTable, Input, StatusChip, Tooltip, useToast, type Column } from '@ds/components';
import { AuditEntryDrawer } from '@/components/product/audit/AuditEntryDrawer';
import { formatDateTime } from '@/components/product/sod/labels';
import { useSetBreadcrumbs } from '@/lib/breadcrumb';
import { auditMatches, listAuditEntries, type AuditEntry } from '@/data/audit-logs';

/**
 * The access-request audit trail.
 *
 * Read-only by nature, so the toolbar is about getting to the right rows and
 * taking them away: search, filter, export, refresh. Nothing here edits anything.
 *
 * Only the outcome is chipped. Time, event, actor and target are all facts about
 * a row; a failure is the one that means someone has to look.
 */
export default function AccessRequestAuditPage() {
  useSetBreadcrumbs([{ label: 'Audit Logs', href: '/iga/audit' }, { label: 'Access Requests' }]);

  const toast = useToast();
  const [search, setSearch] = React.useState('');
  const [peek, setPeek] = React.useState<AuditEntry | null>(null);
  const [refreshing, setRefreshing] = React.useState(false);
  const timer = React.useRef<ReturnType<typeof setTimeout>>();
  React.useEffect(() => () => clearTimeout(timer.current), []);

  const rows = listAuditEntries().filter((e) => auditMatches(e, search));

  const refresh = () => {
    if (refreshing) return;
    setRefreshing(true);
    timer.current = setTimeout(() => {
      setRefreshing(false);
      toast.info('Up to date. No events since you last looked.');
    }, 1200);
  };

  const columns: Column<AuditEntry>[] = [
    {
      id: 'at',
      header: 'Time',
      sortable: true,
      width: 190,
      value: (r) => r.at,
      // `whitespace-nowrap`: with the peek open the table is narrower, and a
      // wrapped timestamp turns one row into three lines while its neighbours
      // stay single — the column rhythm is what makes a log scannable.
      render: (r) => <span className="whitespace-nowrap text-text-secondary">{formatDateTime(r.at)}</span>,
    },
    {
      id: 'task',
      header: 'Event',
      sortable: true,
      width: 230,
      value: (r) => r.task,
      // A letter, not an icon: the same glyph on all 121 rows carried no
      // information and only paid for itself as decoration, where the event's
      // initial at least differs between Submit, Cancel and Complete. Uses the
      // product's one-letter avatar so this column matches every other table.
      render: (r) => (
        <span className="flex items-center gap-2.5">
          <Avatar name={r.task} size="xs" />
          <span className="truncate text-body-sm-strong text-text-primary">{r.task}</span>
        </span>
      ),
    },
    {
      id: 'actor',
      header: 'Actor',
      sortable: true,
      width: 220,
      value: (r) => r.actor,
      render: (r) =>
        r.actor === 'system' ? (
          <span className="flex items-center gap-2.5">
            <span className="grid h-6 w-6 shrink-0 place-items-center rounded-avatar bg-subtle text-icon-subtle">
              <PersonOutline sx={{ fontSize: 14 }} />
            </span>
            {/* Not a person, and it should not look like one — the platform acts
                on its own once approvals land. */}
            <span className="text-text-tertiary">System</span>
          </span>
        ) : (
          <span className="flex min-w-0 items-center gap-2.5">
            <Avatar name={r.actor} size="xs" kind="person" />
            <span className="min-w-0 truncate text-text-secondary">{r.actor}</span>
          </span>
        ),
    },
    {
      id: 'target',
      header: 'Request / Item',
      sortable: true,
      value: (r) => r.target,
      render: (r) => (
        <span className="flex min-w-0 items-center gap-2">
          {r.targetKind === 'request' ? (
            <DescriptionOutlined sx={{ fontSize: 16 }} className="shrink-0 text-icon-subtle" />
          ) : (
            <ShieldOutlined sx={{ fontSize: 16 }} className="shrink-0 text-icon-subtle" />
          )}
          <span className="min-w-0 truncate text-text-secondary">{r.target}</span>
        </span>
      ),
    },
    {
      id: 'outcome',
      header: 'Result',
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
    {
      id: 'details',
      header: '',
      width: 56,
      value: () => '',
      render: (r) => (
        <div className="flex justify-end">
          <Tooltip title="View details">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setPeek(r);
              }}
              aria-label={`View details for ${r.task} at ${formatDateTime(r.at)}`}
              className="rounded-md p-1 text-icon-subtle transition-colors hover:bg-surface-hover hover:text-text-brand"
            >
              <InfoOutlined sx={{ fontSize: 18 }} />
            </button>
          </Tooltip>
        </div>
      ),
    },
  ];

  return (
    <div className="flex h-full flex-col">
      <div className="mb-5 shrink-0">
        <h1 className="text-h2 text-text-primary">Access Request Audit Logs</h1>
        <p className="mt-1 text-body text-text-secondary">
          Requests submitted, cancelled and completed, and every approval decision on the items inside them.
        </p>
      </div>

      <div className="mb-4 flex shrink-0 flex-wrap items-center gap-3">
        <div className="w-full max-w-sm">
          <Input
            placeholder="Search by actor, event or request"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            startAdornment={<SearchOutlined sx={{ fontSize: 18 }} />}
          />
        </div>
        <Button variant="secondary" startIcon={<FilterListOutlined />} onClick={() => toast.info('Filters coming soon')}>
          Filter
        </Button>
        <div className="ml-auto flex items-center gap-3">
          <Button
            variant="secondary"
            aria-label="Export as CSV"
            onClick={() => toast.info(`Exporting ${rows.length} events…`)}
          >
            <FileDownloadOutlined sx={{ fontSize: 18 }} />
          </Button>
          <Button
            variant="secondary"
            onClick={refresh}
            startIcon={
              refreshing ? (
                <CircularProgress size={16} color="inherit" thickness={5} />
              ) : (
                <RefreshOutlined sx={{ fontSize: 18 }} />
              )
            }
          >
            {refreshing ? 'Refreshing…' : 'Refresh'}
          </Button>
        </div>
      </div>

      {/* Full width, with the record in an overlay drawer: an audit row has four
          tabs' worth of detail, which needs more room than a table can give up. */}
      <div className="min-h-0 flex-1">
        <DataTable<AuditEntry>
          columns={columns}
          rows={rows}
          fillHeight
          onRowClick={(r) => setPeek(r)}
          emptyTitle="No events"
          emptyMessage={
            search ? 'No audit event matches your search.' : 'Nothing has happened to an access request yet.'
          }
        />
      </div>

      <AuditEntryDrawer entry={peek} open={peek !== null} onClose={() => setPeek(null)} />
    </div>
  );
}
