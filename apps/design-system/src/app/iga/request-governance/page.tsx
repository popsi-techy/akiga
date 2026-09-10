'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import SearchOutlined from '@mui/icons-material/SearchOutlined';
import FilterListOutlined from '@mui/icons-material/FilterListOutlined';
import {
  Button,
  DataTable,
  FilterDrawer,
  IdentityCell,
  Input,
  OverflowChips,
  StatusChip,
  Tabs,
  type Column,
  type FilterGroup,
  type FilterSelection,
  type TabItem,
} from '@ds/components';
import { useSetBreadcrumbs } from '@/lib/breadcrumb';
import {
  cartStatusMeta,
  cartStatusOf,
  formatGovDateTime,
  governanceMatches,
  listGovernanceRequests,
  requestItems,
  RESOURCE_TYPE_LABEL,
  type GovernanceRequest,
} from '@/data/request-governance';
import { ResourceTypeMark } from '@/components/product/request-governance';

type QueueTab = 'pending' | 'completed';

export default function RequestGovernancePage() {
  useSetBreadcrumbs([{ label: 'Request Governance' }]);
  const router = useRouter();
  const [rows, setRows] = React.useState<GovernanceRequest[]>([]);
  const [loaded, setLoaded] = React.useState(false);
  const [tab, setTab] = React.useState<QueueTab>('pending');
  const [search, setSearch] = React.useState('');
  const [filterOpen, setFilterOpen] = React.useState(false);
  const [selection, setSelection] = React.useState<FilterSelection>({});

  const refresh = React.useCallback(() => setRows(listGovernanceRequests()), []);
  React.useEffect(() => {
    const t = window.setTimeout(() => {
      refresh();
      setLoaded(true);
    }, 240);
    return () => window.clearTimeout(t);
  }, [refresh]);

  const pendingRows = rows.filter((r) => cartStatusOf(r).pending > 0);
  const completedRows = rows.filter((r) => cartStatusOf(r).pending === 0);
  const tabRows = tab === 'pending' ? pendingRows : completedRows;

  const tabs: TabItem[] = [
    { value: 'pending', label: 'Pending', count: pendingRows.length },
    { value: 'completed', label: 'Completed', count: completedRows.length },
  ];

  const filterGroups: FilterGroup[] = [
    {
      id: 'type',
      label: 'Resource type',
      options: [
        { id: 'application', label: 'Application' },
        { id: 'entitlement', label: 'Entitlement' },
        { id: 'role', label: 'Technical Role' },
      ],
    },
    {
      id: 'stage',
      label: 'Stage',
      options: [
        { id: 'submission', label: 'Submission' },
        { id: 'policy', label: 'Policy / SoD Check' },
        { id: 'approval', label: 'Approval' },
        { id: 'provisioning', label: 'Provisioning' },
      ],
    },
    {
      id: 'origin',
      label: 'Origin',
      options: [
        { id: 'end_user', label: 'End-user portal' },
        { id: 'manager', label: 'Manager request' },
        { id: 'joiner', label: 'Joiner workflow' },
        { id: 'api', label: 'API' },
      ],
    },
  ];

  const activeFilters = Object.values(selection).reduce((n, ids) => n + ids.length, 0);
  const searched = tabRows.filter((r) => governanceMatches(r, search));
  const filtered = searched.filter((r) => {
    const items = requestItems(r);
    if (selection.type?.length && !items.some((i) => selection.type.includes(i.resourceType))) return false;
    if (
      selection.stage?.length &&
      !items.some((i) => selection.stage.includes(i.currentStage ?? r.currentStage)) &&
      !selection.stage.includes(r.currentStage)
    ) {
      return false;
    }
    if (selection.origin?.length && !selection.origin.includes(r.origin)) return false;
    return true;
  });

  const columns: Column<GovernanceRequest>[] = [
    {
      id: 'id',
      header: 'Request ID',
      sortable: true,
      width: 248,
      wrap: true,
      value: (r) => r.reference,
      render: (r) => (
        <div className="flex items-center gap-2">
          <span className="tabular-nums text-body-sm-strong text-text-primary">{r.reference}</span>
          <StatusChip intent="neutral" dot={false} label={RESOURCE_TYPE_LABEL[r.resourceType]} />
        </div>
      ),
    },
    {
      id: 'requester',
      header: 'Requested By',
      sortable: true,
      width: 200,
      wrap: true,
      value: (r) => r.requester.email,
      render: (r) => <IdentityCell name={r.requester.name} email={r.requester.email} />,
    },
    {
      id: 'target',
      header: 'Requested For',
      sortable: true,
      width: 200,
      wrap: true,
      value: (r) => r.target.email,
      render: (r) =>
        r.requester.id === r.target.id ? (
          <StatusChip intent="neutral" dot={false} label="Self" />
        ) : (
          <IdentityCell name={r.target.name} email={r.target.email} />
        ),
    },
    {
      id: 'resources',
      header: 'Resources',
      sortable: true,
      width: 240,
      wrap: true,
      value: (r) => requestItems(r).map((i) => i.resourceName).join(' '),
      render: (r) => (
        <OverflowChips
          items={requestItems(r).map((i) => ({
            id: i.id,
            name: i.resourceName,
            type: i.resourceType,
            appType: i.appType ?? i.appName,
          }))}
          max={1}
          emptyLabel="None"
          renderItem={(i) => <ResourceTypeMark type={i.type} name={i.name} appType={i.appType} />}
        />
      ),
    },
    {
      id: 'status',
      header: 'All status',
      sortable: true,
      width: 160,
      wrap: true,
      value: (r) => cartStatusMeta(r).label,
      render: (r) => {
        const status = cartStatusMeta(r);
        return <StatusChip intent={status.intent} dot={false} label={status.label} />;
      },
    },
    {
      id: 'submitted',
      header: 'Submitted',
      sortable: true,
      width: 180,
      wrap: true,
      value: (r) => r.submittedAt,
      render: (r) => (
        <span className="whitespace-nowrap text-body-sm text-text-secondary">{formatGovDateTime(r.submittedAt)}</span>
      ),
    },
  ];

  return (
    <div className="flex h-full flex-col">
      <div className="mb-5 shrink-0">
        <h1 className="text-h2 tracking-tight text-text-primary">Request Governance</h1>
        <p className="mt-1 text-body text-text-secondary">
          Monitor access requests across applications, entitlements, and technical roles. Open a
          request to review each resource and intervene when a line is stuck.
        </p>
      </div>

      <div className="mb-4 shrink-0">
        <Tabs
          items={tabs}
          value={tab}
          onChange={(v) => setTab(v as QueueTab)}
          aria-label="Request status"
        />
      </div>

      <div className="mb-4 flex shrink-0 flex-wrap items-center gap-3">
        <div className="w-full max-w-sm">
          <Input
            placeholder="Search by ID, person, or resource"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            startAdornment={<SearchOutlined sx={{ fontSize: 18 }} />}
          />
        </div>
        <Button
          variant="secondary"
          startIcon={<FilterListOutlined />}
          onClick={() => setFilterOpen(true)}
        >
          Filter{activeFilters > 0 ? ` (${activeFilters})` : ''}
        </Button>
      </div>

      <div className="min-h-0 flex-1">
        <DataTable<GovernanceRequest>
          columns={columns}
          rows={filtered}
          layout="fixed"
          fillHeight
          loading={!loaded}
          onRowClick={(r) => router.push(`/iga/request-governance/${r.id}`)}
          emptyTitle={tab === 'pending' ? 'No pending requests' : 'No completed requests'}
          emptyMessage={
            tab === 'pending'
              ? 'Requests that still have work land here. Clear search or filters if you expected to see some.'
              : 'Requests where every resource is done land here.'
          }
        />
      </div>

      <FilterDrawer
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        groups={filterGroups}
        value={selection}
        onApply={setSelection}
        subtitle="Narrow the operations queue."
        renderStatus={(staged) => {
          const n = Object.values(staged).reduce((a, ids) => a + ids.length, 0);
          if (n === 0) return `${searched.length} available`;
          const kept = searched.filter((r) => {
            const items = requestItems(r);
            if (staged.type?.length && !items.some((i) => staged.type.includes(i.resourceType))) return false;
            if (
              staged.stage?.length &&
              !items.some((i) => staged.stage.includes(i.currentStage ?? r.currentStage)) &&
              !staged.stage.includes(r.currentStage)
            ) {
              return false;
            }
            if (staged.origin?.length && !staged.origin.includes(r.origin)) return false;
            return true;
          }).length;
          return `${kept} of ${searched.length} match`;
        }}
      />
    </div>
  );
}
