'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import SearchOutlined from '@mui/icons-material/SearchOutlined';
import { DataTable, Avatar, Input, Tabs, type Column, type TabItem } from '@ds/components';
import { listMyReviews } from '@/data/sod';
import { hasV3Draft, v3ReviewerStatus } from '@/data/sod-resolution-v3-store';
import type { MyReviewRow } from '@/data/sod-types';
import { ReviewerStatusPillV3, AccessConflictPill, formatDateTime } from '@/components/product/sod/labels';

/**
 * SoD Resolution V3 — policy-centric list with Active / Accepted Risk / Resolved tabs.
 * Active surfaces open violations; Accepted Risk shows submitted risk acceptances;
 * Resolved shows completed resolutions that carry no accepted risk.
 *
 * The Resolved tab keeps the internal key `history` — renaming it would reach into
 * `AccessConflictPill`'s shared `tab` union in labels.tsx, which V1/V2 also compile
 * against, for no user-visible gain.
 */
export default function SodResolutionV3ListPage() {
  const router = useRouter();
  const [rows, setRows] = React.useState<MyReviewRow[] | null>(null);
  const [search, setSearch] = React.useState('');
  const [tab, setTab] = React.useState<'active' | 'acceptedRisk' | 'history'>('active');

  /**
   * Which reviews have unsubmitted V3 work. Snapshotted here with the rows rather
   * than read per row: it is a localStorage parse, and this effect is already the
   * one client-only place that loads the list.
   */
  const [draftIds, setDraftIds] = React.useState<Set<string>>(() => new Set());

  React.useEffect(() => {
    const loaded = listMyReviews();
    setRows(loaded);
    setDraftIds(new Set(loaded.filter((r) => hasV3Draft(r.id)).map((r) => r.id)));
  }, []);

  /** Pending → In Progress → Completed, from the shared rule. */
  const statusOf = (r: MyReviewRow) =>
    v3ReviewerStatus({ submitted: r.reviewerStatus === 'completed', hasDraft: draftIds.has(r.id) });

  const all = rows ?? [];
  const isActive = (r: MyReviewRow) => r.reviewerStatus !== 'completed';
  const isAcceptedRisk = (r: MyReviewRow) => r.reviewerStatus === 'completed' && r.acceptedRiskCount > 0;
  const isHistory = (r: MyReviewRow) => r.reviewerStatus === 'completed' && r.acceptedRiskCount === 0;
  const activeCount = all.filter(isActive).length;
  const acceptedRiskCount = all.filter(isAcceptedRisk).length;
  const historyCount = all.filter(isHistory).length;

  const filtered = all
    .filter((r) => {
      if (tab === 'active') return isActive(r);
      if (tab === 'acceptedRisk') return isAcceptedRisk(r);
      return isHistory(r);
    })
    .filter(
      (r) =>
        r.userName.toLowerCase().includes(search.trim().toLowerCase()) ||
        r.userEmail.toLowerCase().includes(search.trim().toLowerCase()) ||
        r.policyNames.some((p) => p.toLowerCase().includes(search.trim().toLowerCase())),
    );

  const tabs: TabItem[] = [
    { value: 'active', label: 'Active', count: activeCount },
    { value: 'acceptedRisk', label: 'Accepted Risk', count: acceptedRiskCount },
    { value: 'history', label: 'Resolved', count: historyCount },
  ];
  const open = (id: string) => router.push(`/iga/reviewer/sod-resolution-v3/${id}`);

  const accessConflictValue = (r: MyReviewRow) => {
    if (tab === 'acceptedRisk') return r.acceptedRiskCount;
    if (tab === 'history') return 0;
    return r.pendingCount;
  };

  const columns: Column<MyReviewRow>[] = [
    {
      id: 'user',
      header: 'User',
      sortable: true,
      value: (r) => r.userName,
      render: (r) => (
        <div className="flex items-center gap-3">
          <Avatar name={r.userName} initials={r.userName.trim().charAt(0).toUpperCase()} size="sm" />
          <div className="min-w-0">
            <div className="truncate font-medium text-text-primary">{r.userName}</div>
            <div className="truncate text-caption text-text-secondary">{r.userEmail}</div>
          </div>
        </div>
      ),
    },
    {
      id: 'policy',
      header: 'SoD Policy',
      render: (r) => (
        <span className="text-text-primary">
          {r.policyNames[0]}
          {r.policyNames.length > 1 && <span className="ml-1 text-text-tertiary">+{r.policyNames.length - 1}</span>}
        </span>
      ),
    },
    {
      id: 'status',
      header: 'Status',
      sortable: true,
      value: (r) => statusOf(r),
      render: (r) => <ReviewerStatusPillV3 status={statusOf(r)} />,
    },
    {
      id: 'rules',
      header: 'Violated Combinations',
      width: 190,
      sortable: true,
      value: accessConflictValue,
      render: (r) => (
        <AccessConflictPill
          tab={tab}
          pendingCount={r.pendingCount}
          acceptedRiskCount={r.acceptedRiskCount}
        />
      ),
    },
    ...(tab === 'active'
      ? [
          {
            id: 'detected',
            header: 'Detected at',
            sortable: true,
            value: (r: MyReviewRow) => r.detectedAt,
            render: (r: MyReviewRow) => (
              <span className="whitespace-nowrap text-text-secondary">{formatDateTime(r.detectedAt)}</span>
            ),
          } satisfies Column<MyReviewRow>,
        ]
      : [
          {
            id: 'submitted',
            header: 'Submitted',
            sortable: true,
            value: (r: MyReviewRow) => r.submittedAt ?? '',
            render: (r: MyReviewRow) => (
              <span className="whitespace-nowrap text-text-secondary">{formatDateTime(r.submittedAt)}</span>
            ),
          } satisfies Column<MyReviewRow>,
        ]),
  ];

  return (
    <div className="flex h-full flex-col">
      <div className="mb-5 shrink-0">
        <h1 className="text-h2 font-bold tracking-tight text-text-primary">SoD Policy Violations</h1>
        <p className="mt-1 text-body text-text-secondary">
          Resolve SoD Policy Violations assigned to you or review resolutions you have already submitted.
        </p>
      </div>

      <div className="mb-4 shrink-0">
        <Tabs items={tabs} value={tab} onChange={(v) => setTab(v as 'active' | 'acceptedRisk' | 'history')} aria-label="Review status" />
      </div>

      <div className="mb-4 w-full max-w-sm shrink-0">
        <Input
          placeholder="Search by user, email, or policy"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          startAdornment={<SearchOutlined sx={{ fontSize: 18 }} />}
        />
      </div>

      <div className="min-h-0 flex-1">
        <DataTable<MyReviewRow>
          columns={columns}
          rows={filtered}
          loading={rows === null}
          onRowClick={(r) => open(r.id)}
          fillHeight
          defaultRowsPerPage={12}
          rowsPerPageOptions={[12, 24, 48]}
          emptyTitle={
            tab === 'active'
              ? 'No active violations'
              : tab === 'acceptedRisk'
                ? 'No accepted-risk resolutions'
                : 'No resolved violations'
          }
          emptyMessage={
            tab === 'active'
              ? 'Policy violations assigned to you that are pending or in progress will appear here.'
              : tab === 'acceptedRisk'
                ? 'Resolutions you submitted with accepted residual risk will appear here.'
                : 'Violations you resolved by revoking access will appear here.'
          }
        />
      </div>
    </div>
  );
}
