'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import CheckCircleOutline from '@mui/icons-material/CheckCircleOutline';
import CancelOutlined from '@mui/icons-material/CancelOutlined';
import { DirectoryListPage, IdentityCell, StatusChip, Tooltip, useToast, type Column } from '@ds/components';
import { accessExpired, listSponsoredIdentities, type UserIdentityRow } from '@/data/directory';
import { recordSponsorDecision } from '@/data/sponsor-decisions';
import { IdentityKindChip, IDENTITY_STATUS } from '@/components/product/directory';
import { LastModified } from '@/components/product/LastModified';
import { formatDate } from '@/lib/datetime';

/**
 * Sponsored Users — the reviewer's view of externals they are accountable for.
 *
 * Not the admin External Identities list. Application is the wrong column here:
 * a sponsored person is not scoped to one app. Organization and the access end
 * date are what the sponsor has to stand behind; approve/reject is the work
 * when onboarding is still pending.
 */
export default function SponsoredUsersPage() {
  const router = useRouter();
  const toast = useToast();
  const [rows, setRows] = React.useState<UserIdentityRow[]>([]);

  const refresh = React.useCallback(() => setRows(listSponsoredIdentities()), []);
  React.useEffect(() => refresh(), [refresh]);

  const decide = (row: UserIdentityRow, decision: 'approved' | 'rejected') => {
    recordSponsorDecision(row.id, decision);
    refresh();
    toast.success(
      decision === 'approved'
        ? `${row.name} is onboarded. Their access will provision.`
        : `${row.name} was rejected. Their access stays disabled.`,
    );
  };

  const columns: Column<UserIdentityRow>[] = [
    {
      id: 'name',
      header: 'Name',
      sortable: true,
      width: '24%',
      wrap: true,
      value: (r) => r.name,
      render: (r) => <IdentityCell name={r.name} email={r.email} />,
    },
    {
      id: 'kind',
      header: 'Type',
      sortable: true,
      width: 104,
      wrap: true,
      value: () => 'External',
      render: (r) => <IdentityKindChip kind={r.kind} />,
    },
    {
      id: 'organization',
      header: 'Organization',
      sortable: true,
      width: '16%',
      value: (r) => r.organization ?? '—',
    },
    {
      id: 'accessEndsOn',
      header: 'Access ends',
      sortable: true,
      width: 150,
      wrap: true,
      value: (r) => r.accessEndsOn ?? '',
      render: (r) => {
        if (!r.accessEndsOn) return <span className="text-text-tertiary">Not set</span>;
        if (accessExpired(r)) {
          return (
            <Tooltip title="The end date has passed and the account is still enabled.">
              <span>
                <StatusChip intent="danger" label={`Expired ${formatDate(r.accessEndsOn)}`} />
              </span>
            </Tooltip>
          );
        }
        return <span className="text-text-secondary">{formatDate(r.accessEndsOn)}</span>;
      },
    },
    {
      id: 'status',
      header: 'Status',
      sortable: true,
      width: 168,
      wrap: true,
      value: (r) => IDENTITY_STATUS[r.status].label,
      render: (r) => <StatusChip intent={IDENTITY_STATUS[r.status].intent} label={IDENTITY_STATUS[r.status].label} />,
    },
    {
      id: 'action',
      header: 'Action',
      width: 120,
      wrap: true,
      value: (r) => (r.status === 'pending-approval' ? 'Pending' : r.status === 'inactive' ? 'Rejected' : 'Approved'),
      render: (r) => {
        if (r.status === 'pending-approval') {
          return (
            <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                aria-label={`Approve ${r.name}`}
                onClick={() => decide(r, 'approved')}
                className="grid h-8 w-8 place-items-center rounded-md text-[var(--ds-color-status-success-fg)] transition-colors hover:bg-[var(--ds-color-status-success-subtle)]"
              >
                <CheckCircleOutline sx={{ fontSize: 20 }} />
              </button>
              <button
                type="button"
                aria-label={`Reject ${r.name}`}
                onClick={() => decide(r, 'rejected')}
                className="grid h-8 w-8 place-items-center rounded-md text-danger transition-colors hover:bg-[var(--ds-color-status-danger-subtle)]"
              >
                <CancelOutlined sx={{ fontSize: 20 }} />
              </button>
            </div>
          );
        }
        if (r.status === 'inactive' || r.status === 'terminated') {
          return <StatusChip intent="danger" label="Rejected" />;
        }
        return <StatusChip intent="success" label="Approved" />;
      },
    },
    {
      id: 'updatedAt',
      header: 'Last modified',
      sortable: true,
      width: 176,
      wrap: true,
      value: (r) => r.updatedAt ?? '',
      render: (r) =>
        r.updatedAt ? <LastModified at={r.updatedAt} /> : <span className="text-text-tertiary">—</span>,
    },
  ];

  return (
    <DirectoryListPage<UserIdentityRow>
      title="Sponsored Users"
      description="External users you sponsor. Approve pending onboardings to provision their access, or reject to disable it. Active users are already onboarded."
      searchPlaceholder="Search sponsored people"
      columns={columns}
      rows={rows}
      layout="fixed"
      matches={(r, q) =>
        r.name.toLowerCase().includes(q) ||
        r.email.toLowerCase().includes(q) ||
        (r.organization ?? '').toLowerCase().includes(q) ||
        r.jobTitle.toLowerCase().includes(q)
      }
      onOpen={(id) => router.push(`/iga/directory/user-identities/${id}`)}
      emptyTitle="No sponsored users"
      emptyMessage="When you sponsor an external identity, they will appear here for review."
    />
  );
}
