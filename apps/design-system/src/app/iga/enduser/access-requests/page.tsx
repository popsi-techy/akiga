'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import AddOutlined from '@mui/icons-material/AddOutlined';
import { Button, Dialog, DirectoryListPage, Menu, OverflowChips, type Column } from '@ds/components';
import { useSetBreadcrumbs } from '@/lib/breadcrumb';
import { RequestTypeChip } from '@/components/product/review-requests/labels';
import { EndUserRequestStatusChip } from '@/components/product/access-requests';
import {
  deleteAccessRequest,
  formatRequestDate,
  listEndUserRequests,
} from '@/data/access-requests';
import type { EndUserRequestRow } from '@/data/access-request-types';

const LIST = '/iga/enduser/access-requests';

export default function EndUserAccessRequestsPage() {
  const router = useRouter();
  useSetBreadcrumbs([{ label: 'Access Requests' }]);
  const [rows, setRows] = React.useState<EndUserRequestRow[]>([]);
  const [loaded, setLoaded] = React.useState(false);
  const [cancelId, setCancelId] = React.useState<string | null>(null);

  const refresh = React.useCallback(() => {
    setRows(listEndUserRequests());
    setLoaded(true);
  }, []);

  React.useEffect(() => {
    const t = window.setTimeout(refresh, 240);
    return () => window.clearTimeout(t);
  }, [refresh]);

  const open = (row: EndUserRequestRow) => {
    if (row.status === 'draft') {
      router.push(`${LIST}/${row.id}?step=${row.items.length > 0 ? 'items' : 'for-whom'}`);
      return;
    }
    router.push(`${LIST}/${row.id}?step=preview`);
  };

  const columns: Column<EndUserRequestRow>[] = [
    {
      id: 'request',
      header: 'Requests',
      sortable: true,
      wrap: true,
      value: (r) => r.reference,
      render: (r) => (
        <div className="flex min-w-0 flex-col gap-1">
          <span className="tabular-nums text-body-sm-strong text-text-primary">{r.reference}</span>
          <RequestTypeChip type={r.type} />
        </div>
      ),
    },
    {
      id: 'requestedFor',
      header: 'Requested For',
      sortable: true,
      value: (r) => r.requestedForEmail,
      render: (r) => <span className="text-text-secondary">{r.requestedForEmail}</span>,
    },
    {
      id: 'items',
      header: 'Requested Items',
      wrap: true,
      render: (r) => (
        <OverflowChips
          items={r.items.map((i) => ({ id: i.entitlementId, name: i.entitlementName || i.applicationName }))}
          emptyLabel="None yet"
          max={1}
        />
      ),
    },
    {
      id: 'submitted',
      header: 'Submitted On',
      sortable: true,
      value: (r) => r.submittedAt,
      render: (r) => (
        <span className="whitespace-nowrap text-text-secondary">
          {r.status === 'draft' ? '—' : formatRequestDate(r.submittedAt)}
        </span>
      ),
    },
    {
      id: 'expiry',
      header: 'Request Expiry',
      sortable: true,
      value: (r) => r.expiresAt,
      render: (r) => <span className="whitespace-nowrap text-text-secondary">{formatRequestDate(r.expiresAt)}</span>,
    },
    {
      id: 'status',
      header: 'Status',
      sortable: true,
      value: (r) => r.status,
      render: (r) => <EndUserRequestStatusChip status={r.status} />,
    },
    {
      id: 'actions',
      header: 'Actions',
      align: 'right',
      width: 56,
      render: (r) => (
        <Menu
          ariaLabel={`Actions for ${r.reference}`}
          items={[
            {
              label: r.status === 'draft' ? 'Continue' : 'View',
              onClick: () => open(r),
            },
            ...(r.status === 'draft'
              ? [{ label: 'Cancel request', danger: true, onClick: () => setCancelId(r.id) }]
              : []),
          ]}
        />
      ),
    },
  ];

  return (
    <>
      <DirectoryListPage<EndUserRequestRow>
        title="Access Requests"
        description="Track and manage your end-to-end access requests from one central table."
        searchPlaceholder="Search by request name, type, etc…"
        columns={columns}
        rows={loaded ? rows : []}
        matches={(r, q) =>
          r.reference.toLowerCase().includes(q) ||
          r.type.toLowerCase().includes(q) ||
          r.requestedForEmail.toLowerCase().includes(q) ||
          r.requestedForName.toLowerCase().includes(q) ||
          r.items.some((i) => i.entitlementName.toLowerCase().includes(q) || i.applicationName.toLowerCase().includes(q))
        }
        onOpen={(id) => {
          const row = rows.find((r) => r.id === id);
          if (row) open(row);
        }}
        emptyTitle={loaded ? 'No access requests' : 'Loading requests'}
        emptyMessage={
          loaded
            ? 'Create a request to ask for entitlements for yourself or someone else.'
            : 'Fetching the latest requests…'
        }
        actions={
          <Button variant="primary" startIcon={<AddOutlined />} onClick={() => router.push(`${LIST}/new`)}>
            Create New Request
          </Button>
        }
      />

      <Dialog
        open={Boolean(cancelId)}
        onClose={() => setCancelId(null)}
        title="Cancel this draft?"
        tone="danger"
        confirmLabel="Cancel request"
        onConfirm={() => {
          if (cancelId) deleteAccessRequest(cancelId);
          setCancelId(null);
          refresh();
        }}
      >
        The draft will be removed. This cannot be undone.
      </Dialog>
    </>
  );
}
