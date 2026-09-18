'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import HowToRegOutlined from '@mui/icons-material/HowToRegOutlined';
import PersonOffOutlined from '@mui/icons-material/PersonOffOutlined';
import {
  Button,
  DirectoryListPage,
  IdentityCell,
  StatusChip,
  Tabs,
  Tooltip,
  type Column,
  useToast,
} from '@ds/components';
import {
  accessEndingSoon,
  accessExpired,
  listSponsoredIdentities,
  type UserIdentityRow,
} from '@/data/directory';
import { ExternalTypeChip, ExternalIdentityActions, IDENTITY_STATUS, SponsorDecisionDrawer, accessStatusOf } from '@/components/product/directory';
import { LastModified } from '@/components/product/LastModified';
import { formatDate } from '@/lib/datetime';
import { recordSponsorDecision } from '@/data/external-lifecycle';

type InboxTab = 'pending' | 'taken';

const isPendingDecision = (r: UserIdentityRow) => r.status === 'pending-approval';

/**
 * Sponsored Users — the reviewer's view of the externals they answer for.
 *
 * Two inboxes, not one mixed list. Approve/reject is a different job from
 * standing behind someone already in: mixing them put a green tick next to a
 * kebab and asked the sponsor to hunt. **Pending** is only the decision that is
 * due; **Action taken** is everyone they have already decided on (and anyone
 * they still manage after that — extend, suspend, end).
 */
export default function SponsoredUsersPage() {
  const router = useRouter();
  const toast = useToast();
  const [tab, setTab] = React.useState<InboxTab>('pending');
  const [rows, setRows] = React.useState<UserIdentityRow[]>([]);
  const [selectedIds, setSelectedIds] = React.useState<string[]>([]);
  const [bulk, setBulk] = React.useState<{ ids: string[]; decision: 'approved' | 'rejected' } | null>(null);
  const refresh = React.useCallback(() => setRows(listSponsoredIdentities()), []);
  React.useEffect(() => refresh(), [refresh]);

  const pending = rows.filter(isPendingDecision);
  const taken = rows.filter((r) => !isPendingDecision(r));
  const visible = tab === 'pending' ? pending : taken;

  const setTabAndClear = (next: InboxTab) => {
    setTab(next);
    setSelectedIds([]);
  };

  const decideMany = (ids: string[], decision: 'approved' | 'rejected', payload: { startsOn?: string; endsOn?: string; justification: string }) => {
    ids.forEach((id) => recordSponsorDecision(id, decision, payload));
    setSelectedIds([]);
    setBulk(null);
    refresh();
    const n = ids.length;
    toast.success(
      decision === 'approved'
        ? n === 1
          ? 'Onboarding approved. Access will provision.'
          : `${n} onboardings approved. Access will provision.`
        : n === 1
          ? 'Onboarding rejected. Access stays disabled.'
          : `${n} onboardings rejected. Access stays disabled.`,
    );
  };

  const columns: Column<UserIdentityRow>[] = [
    {
      id: 'name',
      header: 'Name',
      sortable: true,
      // No width: Name absorbs whatever the sized columns leave, so the
      // selection checkbox keeps its 44px instead of being squeezed or padded.
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
      id: 'accessPeriod',
      header: 'End date',
      sortable: true,
      width: '12%',
      wrap: true,
      value: (r) => r.accessEndsOn ?? '',
      render: (r) => <AccessPeriod row={r} />,
    },
    {
      id: 'updatedAt',
      header: 'Last modified',
      sortable: true,
      width: '14%',
      wrap: true,
      value: (r) => r.updatedAt ?? '',
      render: (r) =>
        r.updatedAt ? <LastModified at={r.updatedAt} /> : <span className="text-text-tertiary">—</span>,
    },
    {
      id: 'status',
      header: 'Identity status',
      sortable: true,
      width: '14%',
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
      id: 'action',
      header: 'Action',
      width: '9%',
      value: (r) =>
        r.status === 'pending-approval' ? 'Pending' : r.status === 'inactive' ? 'Rejected' : 'Manage',
      render: (r) => <ExternalIdentityActions row={r} role="reviewer" variant="row" onChanged={refresh} />,
    },
  ];

  return (
    <>
    <DirectoryListPage<UserIdentityRow>
      title="Sponsored Users"
      description="External users you sponsor. Approve a pending onboarding, or manage someone already decided — extend, suspend, or end the contract."
      searchPlaceholder="Search by name, email or type"
      columns={columns}
      rows={visible}
      layout="fixed"
      matches={(r, q) =>
        r.name.toLowerCase().includes(q) ||
        r.email.toLowerCase().includes(q) ||
        (r.externalType ?? '').toLowerCase().includes(q)
      }
      onOpen={(id) => router.push(`/iga/reviewer/sponsored-users/${id}`)}
      emptyTitle={tab === 'pending' ? 'Nothing waiting for a decision' : 'No decided users yet'}
      emptyMessage={
        tab === 'pending'
          ? 'When an external you sponsor needs approval or rejection, they appear here.'
          : 'People you have approved or rejected move here. You can still extend, suspend, or end an active contract.'
      }
      selectable={tab === 'pending'}
      selectedIds={tab === 'pending' ? selectedIds : []}
      onSelectionChange={setSelectedIds}
      selectionNoun="user"
      selectionActions={(ids) => (
        <>
          <Button
            variant="tertiary"
            size="sm"
            startIcon={<HowToRegOutlined sx={{ fontSize: 18 }} />}
            onClick={() => setBulk({ ids, decision: 'approved' })}
          >
            Approve
          </Button>
          <Button
            variant="tertiary"
            size="sm"
            startIcon={<PersonOffOutlined sx={{ fontSize: 18 }} />}
            onClick={() => setBulk({ ids, decision: 'rejected' })}
          >
            Reject
          </Button>
        </>
      )}
      summary={
        <Tabs
          aria-label="Sponsored users by decision"
          value={tab}
          onChange={(v) => setTabAndClear(v as InboxTab)}
          items={[
            { value: 'pending', label: 'Pending', count: pending.length },
            { value: 'taken', label: 'Action taken', count: taken.length },
          ]}
        />
      }
    />
    <SponsorDecisionDrawer
      open={Boolean(bulk)}
      decision={bulk?.decision ?? null}
      names={bulk ? rows.filter((r) => bulk.ids.includes(r.id)).map((r) => r.name) : []}
      onClose={() => setBulk(null)}
      onConfirm={(payload) => bulk && decideMany(bulk.ids, bulk.decision, payload)}
    />
    </>
  );
}

/** Access period exists after approval. Pending rows have none yet. */
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
