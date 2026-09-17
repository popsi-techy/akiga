'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { DirectoryListPage, IdentityCell, StatusChip, Tooltip, type Column } from '@ds/components';
import {
  accessEndingSoon,
  accessExpired,
  listSponsoredIdentities,
  type UserIdentityRow,
} from '@/data/directory';
import { ExternalTypeChip, ExternalIdentityActions, IDENTITY_STATUS } from '@/components/product/directory';
import { LastModified } from '@/components/product/LastModified';
import { formatDate } from '@/lib/datetime';

/**
 * Sponsored Users — the reviewer's view of the externals they answer for.
 *
 * Not the admin External Identities list. The Sponsor column is dropped — every
 * row is theirs — so the space goes to the two things the sponsor acts on: the
 * access period they have to stand behind, and the decision that is due
 * (approve/reject a pending onboarding, or extend / suspend / end an active one).
 */
export default function SponsoredUsersPage() {
  const router = useRouter();
  const [rows, setRows] = React.useState<UserIdentityRow[]>([]);
  const refresh = React.useCallback(() => setRows(listSponsoredIdentities()), []);
  React.useEffect(() => refresh(), [refresh]);

  const columns: Column<UserIdentityRow>[] = [
    {
      id: 'name',
      header: 'Name',
      sortable: true,
      width: '26%',
      wrap: true,
      value: (r) => r.name,
      render: (r) => <IdentityCell name={r.name} email={r.email} />,
    },
    {
      id: 'type',
      header: 'Type / Organization',
      sortable: true,
      width: '20%',
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
      width: 112,
      value: (r) =>
        r.status === 'pending-approval' ? 'Pending' : r.status === 'inactive' ? 'Rejected' : 'Manage',
      render: (r) => <ExternalIdentityActions row={r} role="reviewer" variant="row" onChanged={refresh} />,
    },
  ];

  return (
    <DirectoryListPage<UserIdentityRow>
      title="Sponsored Users"
      description="External users you sponsor. Approve a pending onboarding to provision access, or manage an active one — extend, suspend, or end the contract."
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
      onOpen={(id) => router.push(`/iga/reviewer/sponsored-users/${id}`)}
      emptyTitle="No sponsored users"
      emptyMessage="When you sponsor an external identity, they will appear here for review."
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
