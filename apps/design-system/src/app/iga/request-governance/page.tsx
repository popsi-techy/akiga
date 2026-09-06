'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import SearchOutlined from '@mui/icons-material/SearchOutlined';
import FilterListOutlined from '@mui/icons-material/FilterListOutlined';
import FactCheckOutlined from '@mui/icons-material/FactCheckOutlined';
import ErrorOutline from '@mui/icons-material/ErrorOutline';
import TimerOutlined from '@mui/icons-material/TimerOutlined';
import WarningAmberOutlined from '@mui/icons-material/WarningAmberOutlined';
import {
  Button,
  DataTable,
  FilterDrawer,
  IdentityCell,
  Input,
  StatTile,
  StatusChip,
  type Column,
  type FilterGroup,
  type FilterSelection,
} from '@ds/components';
import { useSetBreadcrumbs } from '@/lib/breadcrumb';
import {
  governanceMatches,
  isHighRisk,
  isProvisioningFailed,
  listGovernanceRequests,
  RESOURCE_TYPE_LABEL,
  slaStatusOf,
  type GovernanceRequest,
} from '@/data/request-governance';
import {
  LiveStageStepper,
  ResourceTypeMark,
  SlaTimer,
} from '@/components/product/request-governance';

export default function RequestGovernancePage() {
  useSetBreadcrumbs([{ label: 'Request Governance' }]);
  const router = useRouter();
  const [rows, setRows] = React.useState<GovernanceRequest[]>([]);
  const [loaded, setLoaded] = React.useState(false);
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

  const failedCount = rows.filter(isProvisioningFailed).length;
  const breachedCount = rows.filter((r) => slaStatusOf(r) === 'breached').length;
  const highRiskCount = rows.filter(isHighRisk).length;
  const openCount = rows.filter((r) => !r.closedAt).length;

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
  const searched = rows.filter((r) => governanceMatches(r, search));
  const filtered = searched.filter((r) => {
    if (selection.type?.length && !selection.type.includes(r.resourceType)) return false;
    if (selection.stage?.length && !selection.stage.includes(r.currentStage)) return false;
    if (selection.origin?.length && !selection.origin.includes(r.origin)) return false;
    return true;
  });

  const columns: Column<GovernanceRequest>[] = [
    {
      id: 'id',
      header: 'Request ID',
      sortable: true,
      width: 220,
      wrap: true,
      value: (r) => r.reference,
      render: (r) => (
        <span className="inline-flex min-w-0 items-center gap-2">
          <span className="shrink-0 tabular-nums text-body-sm-strong text-text-primary">{r.reference}</span>
          <StatusChip intent="neutral" dot={false} label={RESOURCE_TYPE_LABEL[r.resourceType]} />
        </span>
      ),
    },
    {
      id: 'requester',
      header: 'Requester',
      sortable: true,
      width: 200,
      wrap: true,
      value: (r) => r.requester.email,
      render: (r) => <IdentityCell name={r.requester.name} email={r.requester.email} />,
    },
    {
      id: 'target',
      header: 'Target user',
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
      id: 'type',
      header: 'Resource',
      sortable: true,
      width: 200,
      wrap: true,
      value: (r) => r.resourceName,
      render: (r) => (
        <ResourceTypeMark type={r.resourceType} name={r.resourceName} appType={r.appType ?? r.appName} />
      ),
    },
    {
      id: 'stage',
      header: 'Live stage',
      sortable: true,
      width: 200,
      wrap: true,
      value: (r) => r.currentStage,
      render: (r) => <LiveStageStepper row={r} />,
    },
    {
      id: 'sla',
      header: 'SLA',
      sortable: true,
      width: 132,
      wrap: true,
      value: (r) => r.slaDueAt,
      render: (r) => <SlaTimer row={r} />,
    },
  ];

  return (
    <div className="flex h-full flex-col">
      <h1 className="sr-only">Request Governance</h1>

      <div className="mb-5 grid shrink-0 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile
          label="Open requests"
          value={loaded ? openCount : '—'}
          tone="brand"
          icon={<FactCheckOutlined />}
        />
        <StatTile
          label="Provisioning failed"
          value={loaded ? failedCount : '—'}
          tone="danger"
          icon={<ErrorOutline />}
        />
        <StatTile
          label="SLA breached"
          value={loaded ? breachedCount : '—'}
          tone="warning"
          icon={<TimerOutlined />}
        />
        <StatTile
          label="High risk / SoD"
          value={loaded ? highRiskCount : '—'}
          tone="danger"
          icon={<WarningAmberOutlined />}
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
          emptyTitle="No requests match"
          emptyMessage="Clear the search or filters to see the operations queue again."
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
            if (staged.type?.length && !staged.type.includes(r.resourceType)) return false;
            if (staged.stage?.length && !staged.stage.includes(r.currentStage)) return false;
            if (staged.origin?.length && !staged.origin.includes(r.origin)) return false;
            return true;
          }).length;
          return `${kept} of ${searched.length} match`;
        }}
      />
    </div>
  );
}
