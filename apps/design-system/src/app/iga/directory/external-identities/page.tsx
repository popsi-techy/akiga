'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { IdentityCell, StatusChip, Tooltip, type Column, type StatusIntent } from '@ds/components';
import {
  accessExpired,
  getUserIdentityDetail,
  listExternalIdentities,
  type UserIdentityRow,
} from '@/data/directory';
import type { IdentityStatus } from '@/data/seed';
import { DirectoryListPage, IdentityKindChip, RiskScoreChip } from '@/components/product/directory';
import { formatDate } from '@/lib/datetime';

const STATUS: Record<IdentityStatus, { label: string; intent: StatusIntent }> = {
  active: { label: 'Active', intent: 'success' },
  inactive: { label: 'Inactive', intent: 'neutral' },
  'leaver-pending': { label: 'Leaver Pending', intent: 'warning' },
  terminated: { label: 'Terminated', intent: 'danger' },
};

/**
 * External Identities — everyone with access who is not on the payroll.
 *
 * A view of the same directory the Workforce list shows, not a second one: owners,
 * reviewers and reports all resolve against one population, and a parallel
 * directory would eventually disagree with it.
 *
 * It earns its own nav entry by asking questions the full list cannot. An external
 * identity has three fields an employee does not — the organisation it comes from,
 * the person here who sponsors it, and the date its access is meant to end — and
 * those columns would be empty for fourteen rows out of twenty on the main list.
 * The last one is the point: nothing in an HR feed announces a contractor
 * leaving, so **access that has outlived its end date is the most common way
 * standing access survives its reason**, and it is invisible on a list that shows
 * only status, because the status is still Active.
 */
export default function ExternalIdentitiesListPage() {
  const router = useRouter();
  const rows = listExternalIdentities();

  const sponsorName = (id?: string) =>
    id ? getUserIdentityDetail(id)?.identity.name ?? '—' : '—';

  const columns: Column<UserIdentityRow>[] = [
    {
      id: 'name',
      header: 'Name',
      sortable: true,
      // Wider than the 24% it held with a job title under it: an external address
      // carries the contractor's own domain, so it runs longer than any internal
      // one. The extra came from Type and Access ends, both of which had slack
      // over their chip.
      width: '28%',
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
      // Kept even though every row is external: the same row can be reached from
      // the full directory and from a report, and a reader who lands mid-scroll
      // should not have to infer which list they are on.
      render: (r) => <IdentityKindChip kind={r.kind} />,
    },
    {
      id: 'organization',
      header: 'Organization',
      sortable: true,
      width: '18%',
      value: (r) => r.organization ?? '—',
    },
    {
      id: 'sponsor',
      header: 'Sponsored by',
      sortable: true,
      width: '18%',
      value: (r) => sponsorName(r.sponsorId),
    },
    {
      id: 'accessEndsOn',
      header: 'Access ends',
      sortable: true,
      width: 140,
      wrap: true,
      value: (r) => r.accessEndsOn ?? '',
      render: (r) => {
        if (!r.accessEndsOn) return <span className="text-text-tertiary">Not set</span>;
        // The finding, stated in the cell rather than left for the reader to work
        // out by comparing a date against today.
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
      width: 110,
      wrap: true,
      value: (r) => STATUS[r.status].label,
      render: (r) => <StatusChip intent={STATUS[r.status].intent} label={STATUS[r.status].label} />,
    },
    {
      id: 'risk',
      header: 'Risk',
      sortable: true,
      align: 'right',
      width: 110,
      wrap: true,
      value: (r) => r.riskScore,
      render: (r) => <RiskScoreChip score={r.riskScore} />,
    },
  ];

  return (
    <DirectoryListPage<UserIdentityRow>
      title="External Identities"
      description="Contractors, vendors, partners and auditors — everyone with access who is not on the payroll."
      searchPlaceholder="Search external people"
      columns={columns}
      rows={rows}
      // Every column above declares a share, so the table never overflows and each
      // row is one height.
      layout="fixed"
      matches={(r, q) =>
        r.name.toLowerCase().includes(q) ||
        r.email.toLowerCase().includes(q) ||
        (r.organization ?? '').toLowerCase().includes(q) ||
        r.jobTitle.toLowerCase().includes(q)
      }
      // Same detail route as the full directory — one identity, one page.
      onOpen={(id) => router.push(`/iga/directory/user-identities/${id}`)}
      emptyTitle="No external identities"
      emptyMessage="Nobody outside the organization currently holds access."
      downloadable
    />
  );
}
