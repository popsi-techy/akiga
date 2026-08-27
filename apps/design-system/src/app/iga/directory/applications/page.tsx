'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import AddOutlined from '@mui/icons-material/AddOutlined';
import { Button, type Column, type FilterGroup } from '@ds/components';
import {
  listCataloguedApplications,
  listOnboardedApplicationRows,
  type ApplicationRow,
} from '@/data/directory';
import { reconciliationSummary } from '@/data/reconciliation';
import { formatDateTime } from '@/components/product/sod/labels';
import { DirectoryListPage, EntityAvatar } from '@/components/product/directory';

export default function ApplicationsListPage() {
  const router = useRouter();
  // The catalog paints straight away; onboarded applications live in
  // localStorage, so they can only be read after mount — reading them during
  // render would give the server one list and the client another.
  const [onboarded, setOnboarded] = React.useState<ApplicationRow[]>([]);
  React.useEffect(() => setOnboarded(listOnboardedApplicationRows()), []);
  const apps = React.useMemo(
    () => [...onboarded, ...listCataloguedApplications()],
    [onboarded],
  );

  const lastSyncAt = React.useMemo(() => {
    const map = new Map<string, string | null>();
    for (const a of apps) {
      map.set(a.id, reconciliationSummary(a.id).lastSync?.at ?? null);
    }
    return map;
  }, [apps]);

  /**
   * One category today. The modal is built for several, so the shape is here
   * ready for Status / Owner / Risk once those exist on the row.
   */
  const filterGroups: FilterGroup[] = [
    {
      id: 'application',
      label: 'Application',
      optionHeader: 'Application',
      searchPlaceholder: 'Search',
      options: apps.map((a) => ({
        id: a.id,
        label: a.name,
        icon: <EntityAvatar kind="application" name={a.name} appType={a.appType} />,
      })),
    },
  ];

  const open = (id: string) => router.push(`/iga/directory/applications/${id}`);

  const columns: Column<ApplicationRow>[] = [
    {
      id: 'name',
      header: 'App Name',
      sortable: true,
      value: (r) => r.name,
      render: (r) => (
        <div className="flex items-center gap-3">
          <EntityAvatar kind="application" name={r.name} appType={r.appType} />
          <span className="truncate text-body-sm-strong text-text-primary">{r.name}</span>
        </div>
      ),
    },
    {
      id: 'lastSync',
      header: 'Last Sync',
      sortable: true,
      width: 200,
      value: (r) => lastSyncAt.get(r.id) ?? '',
      render: (r) => {
        const at = lastSyncAt.get(r.id);
        return (
          <span className="whitespace-nowrap text-text-secondary">
            {at ? formatDateTime(at) : '—'}
          </span>
        );
      },
    },
    {
      id: 'owners',
      header: 'Owners',
      sortable: true,
      align: 'right',
      width: 100,
      value: (r) => r.ownerCount,
      render: (r) => (
        <span className="tabular-nums text-text-secondary">{r.ownerCount}</span>
      ),
    },
    {
      id: 'externalProvisioning',
      header: 'External Provisioning',
      sortable: true,
      width: 170,
      value: (r) => r.externalProvisioning,
      render: (r) =>
        r.externalProvisioning === 'enabled' ? (
          <span className="text-text-secondary">Enabled</span>
        ) : (
          <span className="text-text-tertiary">Disabled</span>
        ),
    },
    {
      id: 'provisioningType',
      header: 'Provisioning Type',
      sortable: true,
      width: 150,
      value: (r) => r.provisioningType,
      render: (r) => (
        <span className="capitalize text-text-secondary">{r.provisioningType}</span>
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      width: 120,
      render: (r) => (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            open(r.id);
          }}
          aria-label={`View details for ${r.name}`}
          className="text-body-sm-strong text-text-link hover:underline"
        >
          View details
        </button>
      ),
    },
  ];
  return (
    <DirectoryListPage<ApplicationRow>
      title="Applications"
      description="Systems integrated with the IGA platform."
      searchPlaceholder="Search applications"
      columns={columns}
      rows={apps}
      matches={(r, q) =>
        r.name.toLowerCase().includes(q) || (r.description ?? '').toLowerCase().includes(q)
      }
      onOpen={open}
      emptyTitle="No applications found"
      emptyMessage="No applications match your search."
      actions={
        <Button startIcon={<AddOutlined />} onClick={() => router.push('/iga/directory/applications/onboard')}>
          Onboard new application
        </Button>
      }
      filterGroups={filterGroups}
      filterMatches={(r, s) => {
        const picked = s.application ?? [];
        return picked.length === 0 || picked.includes(r.id);
      }}
    />
  );
}
