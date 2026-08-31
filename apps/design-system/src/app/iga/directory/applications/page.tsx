'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import AddOutlined from '@mui/icons-material/AddOutlined';
import ManageAccountsOutlined from '@mui/icons-material/ManageAccountsOutlined';
import ShieldOutlined from '@mui/icons-material/ShieldOutlined';
import { Button, OverflowChips, StatusChip, Tooltip, type Column, type FilterGroup } from '@ds/components';
import {
  applicationOwners,
  listCataloguedApplications,
  listOnboardedApplicationRows,
  type ApplicationRow,
} from '@/data/directory';
import { DirectoryListPage, EntityAvatar } from '@/components/product/directory';

const AUTH_CHIP = {
  authorized: { label: 'Authorized', intent: 'success' as const },
  pending: { label: 'Pending', intent: 'warning' as const },
};

const METRIC_ICON = { fontSize: 16 } as const;

function ReconciliationCounts({
  name,
  accounts,
  entitlements,
  href,
}: {
  name: string;
  accounts: number;
  entitlements: number;
  href: string;
}) {
  return (
    <Tooltip title={`${accounts} accounts · ${entitlements} entitlements`} describeChild>
      <Link
        href={href}
        onClick={(e) => e.stopPropagation()}
        aria-label={`Open reconciliation for ${name}: ${accounts} accounts, ${entitlements} entitlements`}
        className="inline-flex items-center gap-3 text-text-primary hover:text-text-link"
      >
        <span className="inline-flex items-center gap-1">
          <ManageAccountsOutlined sx={METRIC_ICON} className="shrink-0 text-icon-subtle" aria-hidden />
          <span className="tabular-nums text-body-sm">{accounts}</span>
        </span>
        <span className="inline-flex items-center gap-1">
          <ShieldOutlined sx={METRIC_ICON} className="shrink-0 text-icon-subtle" aria-hidden />
          <span className="tabular-nums text-body-sm">{entitlements}</span>
        </span>
      </Link>
    </Tooltip>
  );
}

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
      id: 'discoverySource',
      header: 'Discovery source',
      sortable: true,
      width: 150,
      value: (r) => r.discoverySource,
      render: (r) => <StatusChip intent="info" label={r.discoverySource} dot={false} />,
    },
    {
      id: 'authorizationStatus',
      header: 'Authorization Status',
      sortable: true,
      width: 170,
      value: (r) => r.authorizationStatus,
      render: (r) => {
        const chip = AUTH_CHIP[r.authorizationStatus];
        return <StatusChip intent={chip.intent} label={chip.label} />;
      },
    },
    {
      id: 'owners',
      header: 'Owners',
      sortable: true,
      wrap: true,
      width: 200,
      value: (r) => applicationOwners(r.id).map((o) => o.name).join(', '),
      render: (r) => <OverflowChips items={applicationOwners(r.id)} max={1} emptyLabel="—" />,
    },
    {
      id: 'reconciliation',
      header: 'Reconciliation',
      sortable: true,
      width: 148,
      value: (r) => r.accountCount + r.entitlementCount,
      render: (r) => (
        <ReconciliationCounts
          name={r.name}
          accounts={r.accountCount}
          entitlements={r.entitlementCount}
          href={`/iga/directory/applications/${r.id}?tab=reconciliation`}
        />
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
        r.name.toLowerCase().includes(q) ||
        (r.description ?? '').toLowerCase().includes(q) ||
        r.discoverySource.toLowerCase().includes(q) ||
        applicationOwners(r.id).some((o) => o.name.toLowerCase().includes(q))
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
