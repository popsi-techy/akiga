'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import SearchOutlined from '@mui/icons-material/SearchOutlined';
import FilterListOutlined from '@mui/icons-material/FilterListOutlined';
import AddIcon from '@mui/icons-material/Add';
import VisibilityOutlined from '@mui/icons-material/VisibilityOutlined';
import DeleteOutline from '@mui/icons-material/DeleteOutline';
import {
  DataTable,
  StatusChip,
  Avatar,
  Button,
  Input,
  Menu,
  Dialog,
  useToast,
  type Column,
} from '@ds/components';
import { deleteEmergencyAccess, getEmergencyAccessList, type EARow } from '@/data/emergency-access';
import { LastModified } from '@/components/product/LastModified';
import { EmergencyAccessEmptyState } from './EmergencyAccessEmptyState';

/**
 * The Emergency Access list. Create and row-open stay with the caller so the
 * list stays a table, not a router.
 */
export function EmergencyAccessListView({
  basePath,
  onCreate,
}: {
  basePath: string;
  onCreate: () => void;
}) {
  const router = useRouter();
  const toast = useToast();
  const [search, setSearch] = React.useState('');
  const [pendingDelete, setPendingDelete] = React.useState<EARow | null>(null);

  const all = getEmergencyAccessList();
  const rows = all.filter((r) => r.name.toLowerCase().includes(search.trim().toLowerCase()));
  const firstRun = all.length === 0;

  const open = (row: EARow) => {
    router.push(`${basePath}/${row.id}`);
  };

  const columns: Column<EARow>[] = [
    {
      id: 'name',
      header: 'Emergency Access',
      sortable: true,
      value: (r) => r.name,
      render: (r) => (
        <div className="flex items-center gap-3">
          <Avatar name={r.name} initials={r.initial} size="sm" />
          <span className="text-body-sm-strong text-text-primary">{r.name}</span>
        </div>
      ),
    },
    {
      id: 'status',
      header: 'Status',
      sortable: true,
      value: (r) => r.status.label,
      render: (r) => <StatusChip intent={r.status.intent} label={r.status.label} />,
    },
    {
      id: 'risk',
      header: 'Risk Score',
      render: (r) =>
        r.risk ? (
          <StatusChip intent={r.risk.intent} dot={false} label={r.risk.label} />
        ) : (
          <span className="text-text-disabled">N/A</span>
        ),
    },
    {
      id: 'updatedOn',
      header: 'Modified',
      sortable: true,
      width: 196,
      value: (r) => r.updatedOn,
      render: (r) => <LastModified at={r.updatedOn} />,
    },
    {
      id: 'actions',
      header: 'Actions',
      align: 'right',
      width: 80,
      render: (r) => (
          <Menu
            items={[
              { label: 'View details', icon: <VisibilityOutlined sx={{ fontSize: 18 }} />, onClick: () => open(r) },
              {
                label: 'Delete',
                icon: <DeleteOutline sx={{ fontSize: 18 }} />,
                danger: true,
                onClick: () => setPendingDelete(r),
              },
            ]}
          />
        ),
    },
  ];

  return (
    <div className="flex h-full flex-col">
      {!firstRun && (
        <div className="mb-5 shrink-0">
          <h1 className="text-h2 text-text-primary">Emergency Access</h1>
          <p className="mt-1 text-body text-text-secondary">
            Track and manage time-bound, break-glass access to critical systems from one central table.
          </p>
        </div>
      )}

      {!firstRun && (
        <div className="mb-4 flex shrink-0 flex-wrap items-center gap-3">
          <div className="w-full max-w-sm">
            <Input
              placeholder="Search by application"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              startAdornment={<SearchOutlined sx={{ fontSize: 18 }} />}
            />
          </div>
          <Button variant="secondary" startIcon={<FilterListOutlined />} onClick={() => toast.info('Filters coming soon')}>
            Filter
          </Button>
          <div className="ml-auto">
            <Button startIcon={<AddIcon />} onClick={onCreate}>
              Create Emergency Access
            </Button>
          </div>
        </div>
      )}

      {firstRun ? (
        <EmergencyAccessEmptyState onCreate={onCreate} />
      ) : (
        <div className="min-h-0 flex-1">
          <DataTable<EARow>
            columns={columns}
            rows={rows}
            onRowClick={(r) => open(r)}
            fillHeight
            emptyTitle="No emergency access found"
            emptyMessage="Try a different search, or create emergency access to grant time-bound access to critical systems."
          />
        </div>
      )}

      <Dialog
        open={Boolean(pendingDelete)}
        onClose={() => setPendingDelete(null)}
        tone="danger"
        title={`Delete ${pendingDelete?.name ?? 'this access'}?`}
        confirmLabel="Delete"
        onConfirm={() => {
          if (!pendingDelete) return;
          deleteEmergencyAccess(pendingDelete.id);
          toast.success(`“${pendingDelete.name}” deleted`);
          setPendingDelete(null);
        }}
      >
        {pendingDelete?.status.label === 'Draft'
          ? 'The profile and everything configured on it are removed. Nothing has been granted under it, so nobody loses access.'
          : 'Anyone holding access through this profile keeps it until their session ends, and nobody can request it again. Sessions already granted stay in the audit log.'}
      </Dialog>
    </div>
  );
}
