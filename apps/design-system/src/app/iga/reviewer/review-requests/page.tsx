'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import SearchOutlined from '@mui/icons-material/SearchOutlined';
import FilterListOutlined from '@mui/icons-material/FilterListOutlined';
import ScheduleOutlined from '@mui/icons-material/ScheduleOutlined';
import CheckCircleOutline from '@mui/icons-material/CheckCircleOutline';
import CancelOutlined from '@mui/icons-material/CancelOutlined';
import {
  Avatar,
  Button,
  DataTable,
  Input,
  Tabs,
  useToast,
  type Column,
  type TabItem,
} from '@ds/components';
import {
  getReviewRequest,
  listCompletedReviewRequests,
  listPendingReviewRequests,
  formatRequestDateTime,
  timeLeftLabel,
} from '@/data/access-requests';
import type { ReviewRequestRow } from '@/data/access-request-types';
import { RequestTypeChip, RequestStatusChip } from '@/components/product/review-requests/labels';
import { ReviewRequestQuickDrawer } from '@/components/product/review-requests/ReviewRequestQuickDrawer';

type Tab = 'pending' | 'completed';

export default function ReviewRequestsPage() {
  const router = useRouter();
  const toast = useToast();
  const [tab, setTab] = React.useState<Tab>('pending');
  const [search, setSearch] = React.useState('');
  const [rows, setRows] = React.useState<ReviewRequestRow[]>([]);
  const [drawerId, setDrawerId] = React.useState<string | null>(null);
  const [drawerDecision, setDrawerDecision] = React.useState<'approved' | 'rejected' | null>(null);

  const refresh = React.useCallback(() => {
    setRows(tab === 'pending' ? listPendingReviewRequests() : listCompletedReviewRequests());
  }, [tab]);

  React.useEffect(() => {
    refresh();
  }, [refresh]);

  const pendingCount = listPendingReviewRequests().length;
  const completedCount = listCompletedReviewRequests().length;

  const filtered = rows.filter((r) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      r.reference.toLowerCase().includes(q) ||
      r.itemName.toLowerCase().includes(q) ||
      r.requestedForName.toLowerCase().includes(q) ||
      r.requestedForEmail.toLowerCase().includes(q) ||
      r.requestedByName.toLowerCase().includes(q)
    );
  });

  const tabs: TabItem[] = [
    { value: 'pending', label: 'Pending', count: pendingCount },
    { value: 'completed', label: 'Completed', count: completedCount },
  ];

  const openDrawer = (id: string, decision: 'approved' | 'rejected') => {
    setDrawerId(id);
    setDrawerDecision(decision);
  };

  const columns: Column<ReviewRequestRow>[] = [
    {
      id: 'reference',
      header: 'Request ID',
      sortable: true,
      value: (r) => r.reference,
      render: (r) => <span className="text-body-sm-strong tabular-nums text-text-primary">{r.reference}</span>,
    },
    {
      id: 'type',
      header: 'Type',
      sortable: true,
      value: (r) => r.type,
      render: (r) => <RequestTypeChip type={r.type} />,
    },
    {
      id: 'item',
      header: 'Requested Item',
      sortable: true,
      value: (r) => r.itemName,
      render: (r) => <span className="text-text-primary">{r.itemName}</span>,
    },
    {
      id: 'duration',
      header: 'Access Duration',
      render: (r) => (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            router.push(`/iga/reviewer/review-requests/${r.id}`);
          }}
          className="text-body-sm-strong text-brand hover:underline"
        >
          {r.accessDurationLabel}
        </button>
      ),
    },
    {
      id: 'requestedFor',
      header: 'Requested For',
      sortable: true,
      value: (r) => r.requestedForName,
      render: (r) => (
        <div className="flex items-center gap-2.5">
          <Avatar name={r.requestedForName} initials={r.requestedForName.charAt(0)} size="sm" />
          <span className="truncate text-text-primary">{r.requestedForName}</span>
        </div>
      ),
    },
    {
      id: 'requestedBy',
      header: 'Requested By',
      sortable: true,
      value: (r) => r.requestedByName,
      render: (r) => (
        <div className="flex items-center gap-2.5">
          <Avatar name={r.requestedByName} initials={r.requestedByName.charAt(0)} size="sm" />
          <span className="truncate text-text-primary">{r.requestedByName}</span>
        </div>
      ),
    },
    {
      id: 'submitted',
      header: 'Submitted On',
      sortable: true,
      value: (r) => r.submittedAt,
      render: (r) => <span className="whitespace-nowrap text-text-secondary">{formatRequestDateTime(r.submittedAt)}</span>,
    },
    ...(tab === 'pending'
      ? [
          {
            id: 'timeLeft',
            header: 'Time Left',
            sortable: true,
            value: (r: ReviewRequestRow) => r.dueAt,
            render: (r: ReviewRequestRow) => {
              const label = timeLeftLabel(r.dueAt);
              const overdue = label === 'Overdue';
              return (
                <span
                  className={[
                    'inline-flex items-center gap-1 whitespace-nowrap text-body-sm',
                    overdue ? 'text-body-sm-strong text-danger' : 'text-text-secondary',
                  ].join(' ')}
                >
                  <ScheduleOutlined sx={{ fontSize: 16 }} />
                  {label}
                </span>
              );
            },
          } satisfies Column<ReviewRequestRow>,
          {
            id: 'actions',
            header: 'Actions',
            align: 'right' as const,
            width: 96,
            render: (r: ReviewRequestRow) => (
              <div className="flex items-center justify-end gap-1">
                <button
                  type="button"
                  aria-label={`Approve ${r.reference}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    openDrawer(r.id, 'approved');
                  }}
                  className="grid h-8 w-8 place-items-center rounded-md text-[var(--ds-color-status-success-fg)] transition-colors hover:bg-[var(--ds-color-status-success-subtle)]"
                >
                  <CheckCircleOutline sx={{ fontSize: 20 }} />
                </button>
                <button
                  type="button"
                  aria-label={`Reject ${r.reference}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    openDrawer(r.id, 'rejected');
                  }}
                  className="grid h-8 w-8 place-items-center rounded-md text-danger transition-colors hover:bg-[var(--ds-color-status-danger-subtle)]"
                >
                  <CancelOutlined sx={{ fontSize: 20 }} />
                </button>
              </div>
            ),
          } satisfies Column<ReviewRequestRow>,
        ]
      : [
          {
            id: 'status',
            header: 'Status',
            sortable: true,
            value: (r: ReviewRequestRow) => r.status,
            render: (r: ReviewRequestRow) => <RequestStatusChip status={r.status} />,
          } satisfies Column<ReviewRequestRow>,
        ]),
  ];

  const drawerRequest = drawerId ? getReviewRequest(drawerId) : null;

  return (
    <div className="flex h-full flex-col">
      <div className="mb-5 shrink-0">
        <h1 className="text-h2 tracking-tight text-text-primary">Review Requests</h1>
        <p className="mt-1 text-body text-text-secondary">
          Approve or reject access requests assigned to you. Use quick actions from the table or open a request for full
          context.
        </p>
      </div>

      <div className="mb-4 shrink-0">
        <Tabs items={tabs} value={tab} onChange={(v) => setTab(v as Tab)} aria-label="Request status" />
      </div>

      <div className="mb-4 flex shrink-0 flex-wrap items-center gap-3">
        <div className="min-w-[200px] max-w-sm flex-1">
          <Input
            placeholder="Search by user, email, or policy"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            startAdornment={<SearchOutlined sx={{ fontSize: 18 }} />}
          />
        </div>
        <Button variant="secondary" startIcon={<FilterListOutlined />} onClick={() => toast.info('Filters coming soon')}>
          Filter
        </Button>
      </div>

      <div className="min-h-0 flex-1">
        <DataTable<ReviewRequestRow>
          columns={columns}
          rows={filtered}
          selectable={tab === 'pending'}
          onRowClick={(r) => router.push(`/iga/reviewer/review-requests/${r.id}`)}
          fillHeight
          defaultRowsPerPage={12}
          rowsPerPageOptions={[12, 24, 48]}
          emptyTitle={tab === 'pending' ? 'No pending requests' : 'No completed requests'}
          emptyMessage={
            tab === 'pending'
              ? 'Access requests awaiting your decision will appear here.'
              : 'Requests you have approved or rejected will appear here.'
          }
        />
      </div>

      <ReviewRequestQuickDrawer
        request={drawerRequest}
        open={Boolean(drawerRequest)}
        initialDecision={drawerDecision}
        onClose={() => {
          setDrawerId(null);
          setDrawerDecision(null);
        }}
        onDecided={refresh}
      />
    </div>
  );
}
