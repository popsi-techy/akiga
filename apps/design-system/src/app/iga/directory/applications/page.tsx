'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import AddOutlined from '@mui/icons-material/AddOutlined';
import { Button, StatusChip, type Column, type FilterGroup } from '@ds/components';
import {
  listCataloguedApplications,
  listOnboardedApplicationRows,
  type ApplicationRow,
} from '@/data/directory';
import { DirectoryListPage, EntityAvatar } from '@/components/product/directory';

export default function ApplicationsListPage() {
  const router = useRouter();
  // The catalog paints straight away; onboarded applications live in
  // localStorage, so they can only be read after mount — reading them during
  // render would give the server one list and the client another.
  const [onboarded, setOnboarded] = React.useState<ApplicationRow[]>([]);
  React.useEffect(() => setOnboarded(listOnboardedApplicationRows()), []);
  const apps = [...onboarded, ...listCataloguedApplications()];

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
        icon: <EntityAvatar kind="application" name={a.name} />,
      })),
    },
  ];

  /**
   * Six columns, one chip.
   *
   * Authorization is the only one that can be *wrong* — a pending app is one we
   * are not yet cleared to manage — so it gets the status chip and everything
   * else stays text. Chipping all four state columns would put 40 coloured pills
   * on screen and leave the one that needs attention indistinguishable from the
   * three that don't.
   */
  const columns: Column<ApplicationRow>[] = [
    {
      id: 'name',
      header: 'App Name',
      sortable: true,
      value: (r) => r.name,
      render: (r) => (
        <div className="flex items-center gap-3">
          <EntityAvatar kind="application" name={r.name} />
          <span className="truncate text-body-sm-strong text-text-primary">{r.name}</span>
        </div>
      ),
    },
    {
      id: 'appType',
      header: 'App Type',
      sortable: true,
      value: (r) => r.appType,
      render: (r) => <span className="text-text-secondary">{r.appType}</span>,
    },
    {
      id: 'discoverySource',
      header: 'Discovery Source',
      sortable: true,
      width: 150,
      value: (r) => r.discoverySource,
      render: (r) => <span className="text-text-secondary">{r.discoverySource}</span>,
    },
    {
      id: 'authorizationStatus',
      header: 'Authorization',
      sortable: true,
      width: 140,
      value: (r) => r.authorizationStatus,
      render: (r) => (
        <StatusChip
          intent={r.authorizationStatus === 'authorized' ? 'success' : 'warning'}
          label={r.authorizationStatus === 'authorized' ? 'Authorized' : 'Pending'}
        />
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
      onOpen={(id) => router.push(`/iga/directory/applications/${id}`)}
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
