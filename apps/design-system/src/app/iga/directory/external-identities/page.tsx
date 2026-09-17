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
} from '@/components/product/directory';
import { LastModified } from '@/components/product/LastModified';
import { formatDate } from '@/lib/datetime';

/**
 * External Identities — everyone with access who is not on the payroll, and the
 * one population that leaves without an HR event to notice.
 *
 * The columns are chosen for the questions this list exists to answer, not copied
 * from a generic directory: **who is accountable** (Sponsor), **when does access
 * end and has it already** (Access period), and **what state is it in** (a single
 * effective Status). Type and Organization are clubbed — the type is a chip over
 * the company — and the source application is a filter rather than a column,
 * because it narrows the list without being a risk in itself.
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
      width: '22%',
      wrap: true,
      value: (r) => r.name,
      render: (r) => <IdentityCell name={r.name} email={r.email} />,
    },
    {
      id: 'type',
      header: 'Type / Organization',
      sortable: true,
      width: '18%',
      wrap: true,
      value: (r) => `${r.externalType ?? ''} ${r.organization ?? ''}`.trim(),
      render: (r) => (
        <div className="flex min-w-0 flex-col items-start gap-1">
          <ExternalTypeChip type={r.externalType} />
          <span className="truncate text-body-sm text-text-secondary" title={r.organization}>
            {r.organization ?? '—'}
          </span>
        </div>
      ),
    },
    {
      id: 'sponsor',
      header: 'Sponsor',
      sortable: true,
      width: '15%',
      wrap: true,
      value: (r) => sponsorName(r.sponsorId) ?? 'Unsponsored',
      render: (r) => {
        const name = sponsorName(r.sponsorId);
        if (name) return <span className="text-text-secondary">{name}</span>;
        return (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              router.push(`/iga/directory/external-identities/${r.id}`);
            }}
            className="rounded-sm text-body-sm-strong text-text-link hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-subtle"
          >
            Assign sponsor
          </button>
        );
      },
    },
    {
      id: 'accessPeriod',
      header: 'Access period',
      sortable: true,
      width: 160,
      wrap: true,
      value: (r) => r.accessEndsOn ?? '',
      render: (r) => <AccessPeriod row={r} />,
    },
    {
      id: 'status',
      header: 'Status',
      sortable: true,
      width: 150,
      wrap: true,
      value: (r) => IDENTITY_STATUS[r.status].label,
      render: (r) => <StatusChip intent={IDENTITY_STATUS[r.status].intent} label={IDENTITY_STATUS[r.status].label} />,
    },
    {
      id: 'updatedAt',
      header: 'Last modified',
      sortable: true,
      width: 168,
      wrap: true,
      value: (r) => r.updatedAt ?? '',
      render: (r) =>
        r.updatedAt ? <LastModified at={r.updatedAt} /> : <span className="text-text-tertiary">—</span>,
    },
    {
      id: 'action',
      header: 'Action',
      width: 96,
      value: () => '',
      render: (r) => <ExternalIdentityActions row={r} role="admin" variant="row" onChanged={refresh} />,
    },
  ];

  return (
    <DirectoryListPage<UserIdentityRow>
      title="External Identities"
      description="Contractors, vendors, partners and auditors — everyone with access who is not on the payroll."
      searchPlaceholder="Search by name, organization or email"
      columns={columns}
      rows={rows}
      layout="fixed"
      matches={(r, q) =>
        r.name.toLowerCase().includes(q) ||
        r.email.toLowerCase().includes(q) ||
        (r.organization ?? '').toLowerCase().includes(q) ||
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
  if (!row.accessEndsOn) return <span className="text-text-tertiary">Not set</span>;
  const expired = accessExpired(row);
  const soon = accessEndingSoon(row);
  return (
    <div className="flex flex-col items-start gap-0.5">
      {expired ? (
        <Tooltip title="The end date has passed and the account is still enabled.">
          <span>
            <StatusChip intent="danger" label={`Expired ${formatDate(row.accessEndsOn)}`} />
          </span>
        </Tooltip>
      ) : soon ? (
        <StatusChip intent="warning" label={`Ends ${formatDate(row.accessEndsOn)}`} />
      ) : (
        <span className="text-body-sm text-text-secondary">{formatDate(row.accessEndsOn)}</span>
      )}
      {row.accessStartsOn && (
        <span className="text-caption text-text-tertiary">from {formatDate(row.accessStartsOn)}</span>
      )}
    </div>
  );
}
