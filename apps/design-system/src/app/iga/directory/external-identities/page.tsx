'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { DirectoryListPage, IdentityCell, StatusChip, Tooltip, type Column, type FilterGroup } from '@ds/components';
import {
  accessEndingSoon,
  accessExpired,
  applicationNameFor,
  getUser,
  listExternalIdentities,
  type UserIdentityRow,
} from '@/data/directory';
import {
  ExternalTypeChip,
  ExternalIdentityActions,
  IDENTITY_STATUS,
  accessStatusOf,
} from '@/components/product/directory';
import { LastModified } from '@/components/product/LastModified';
import { formatDate } from '@/lib/datetime';

/**
 * External Identities — everyone with access who is not on the payroll, and the
 * one population that leaves without an HR event to notice.
 *
 * The columns are chosen for the questions this list exists to answer, not copied
 * from a generic directory: **who is accountable** (Sponsor), **when does access
 * end and has it already** (End date), **where they are in onboarding** (Identity
 * status), and **whether access is live** (Access status). Type is a chip; the
 * company is not listed here yet. The
 * source application is a filter rather than a column, because it narrows the
 * list without being a risk in itself.
 */
export default function ExternalIdentitiesListPage() {
  const router = useRouter();
  const [rows, setRows] = React.useState<UserIdentityRow[]>([]);
  const refresh = React.useCallback(() => setRows(listExternalIdentities()), []);
  React.useEffect(() => refresh(), [refresh]);

  const sponsorName = (id?: string) => (id ? getUser(id)?.name ?? '—' : null);

  const sourceApps = React.useMemo(() => {
    const ids = new Set(rows.map((r) => r.sourceApplicationId).filter(Boolean) as string[]);
    return [...ids].map((id) => ({ id, name: applicationNameFor(id) }));
  }, [rows]);

  const filterGroups: FilterGroup[] = [
    {
      id: 'sourceApp',
      label: 'Source application',
      optionHeader: 'Application',
      searchPlaceholder: 'Search applications',
      options: sourceApps.map((a) => ({ id: a.id, label: a.name })),
    },
  ];

  const columns: Column<UserIdentityRow>[] = [
    {
      id: 'name',
      header: 'Name',
      sortable: true,
      // No width: Name absorbs whatever the sized columns leave.
      wrap: true,
      value: (r) => r.name,
      render: (r) => <IdentityCell name={r.name} email={r.email} />,
    },
    {
      id: 'type',
      header: 'Type',
      sortable: true,
      width: '9%',
      wrap: true,
      value: (r) => r.externalType ?? '',
      render: (r) => <ExternalTypeChip type={r.externalType} />,
    },
    {
      id: 'sponsor',
      header: 'Sponsor',
      sortable: true,
      width: '14%',
      wrap: true,
      value: (r) => sponsorName(r.sponsorId) ?? 'Unsponsored',
      render: (r) => (
        <ExternalIdentityActions row={r} role="admin" variant="assign-link" onChanged={refresh} />
      ),
    },
    {
      id: 'accessPeriod',
      header: 'End date',
      sortable: true,
      width: '12%',
      wrap: true,
      value: (r) => r.accessEndsOn ?? '',
      render: (r) => <AccessPeriod row={r} />,
    },
    {
      id: 'status',
      header: 'Identity status',
      sortable: true,
      width: '13%',
      wrap: true,
      value: (r) => IDENTITY_STATUS[r.status].label,
      render: (r) => <StatusChip intent={IDENTITY_STATUS[r.status].intent} label={IDENTITY_STATUS[r.status].label} />,
    },
    {
      id: 'accessStatus',
      header: 'Access status',
      sortable: true,
      width: '12%',
      wrap: true,
      value: (r) => accessStatusOf(r.status).label,
      render: (r) => {
        const access = accessStatusOf(r.status);
        return <StatusChip intent={access.intent} label={access.label} />;
      },
    },
    {
      id: 'updatedAt',
      header: 'Last modified',
      sortable: true,
      width: '12%',
      wrap: true,
      value: (r) => r.updatedAt ?? '',
      render: (r) =>
        r.updatedAt ? <LastModified at={r.updatedAt} /> : <span className="text-text-tertiary">—</span>,
    },
    {
      id: 'action',
      header: 'Action',
      width: '8%',
      value: () => '',
      render: (r) => <ExternalIdentityActions row={r} role="admin" variant="row" onChanged={refresh} />,
    },
  ];

  return (
    <DirectoryListPage<UserIdentityRow>
      title="External Identities"
      description="Contractors, vendors, partners and auditors — everyone with access who is not on the payroll."
      searchPlaceholder="Search by name, email or type"
      columns={columns}
      rows={rows}
      layout="fixed"
      matches={(r, q) =>
        r.name.toLowerCase().includes(q) ||
        r.email.toLowerCase().includes(q) ||
        (r.externalType ?? '').toLowerCase().includes(q)
      }
      filterGroups={filterGroups}
      filterMatches={(r, s) => {
        const picked = s.sourceApp ?? [];
        return picked.length === 0 || (r.sourceApplicationId ? picked.includes(r.sourceApplicationId) : false);
      }}
      onOpen={(id) => router.push(`/iga/directory/external-identities/${id}`)}
      emptyTitle="No external identities"
      emptyMessage="Nobody outside the organization currently holds access."
      downloadable
    />
  );
}

/** End date with the risk stated in the cell, and the start date muted beneath it. */
function AccessPeriod({ row }: { row: UserIdentityRow }) {
  const awaitingDecision = row.status === 'pending-approval' || row.status === 'pending-sponsor';
  if (awaitingDecision) {
    return <span className="text-text-tertiary">Set on approval</span>;
  }
  if (!row.accessEndsOn) return <span className="text-text-tertiary">Not set</span>;
  const expired = accessExpired(row);
  const soon = accessEndingSoon(row);
  if (expired) {
    return (
      <Tooltip title="The end date has passed and the account is still enabled.">
        <span>
          <StatusChip intent="danger" label={`Expired ${formatDate(row.accessEndsOn)}`} />
        </span>
      </Tooltip>
    );
  }
  if (soon) return <StatusChip intent="warning" label={`Ends ${formatDate(row.accessEndsOn)}`} />;
  return <span className="text-body-sm text-text-secondary">{formatDate(row.accessEndsOn)}</span>;
}
