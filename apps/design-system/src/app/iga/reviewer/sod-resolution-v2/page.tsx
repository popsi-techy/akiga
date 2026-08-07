'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import SearchOutlined from '@mui/icons-material/SearchOutlined';
import { DataTable, Avatar, Input, Tabs, type Column, type TabItem } from '@ds/components';
import { listMyReviews } from '@/data/sod';
import type { MyReviewRow } from '@/data/sod-types';
import { SeverityChip, ReviewerStatusPill, formatDate, formatDateTime } from '@/components/product/sod/labels';

export default function MyReviewsV2Page() {
  const router = useRouter();
  const [rows, setRows] = React.useState<MyReviewRow[] | null>(null);
  const [search, setSearch] = React.useState('');
  const [tab, setTab] = React.useState<'active' | 'history'>('active');

  React.useEffect(() => {
    setRows(listMyReviews());
  }, []);

  const all = rows ?? [];
  const isActive = (r: MyReviewRow) => r.reviewerStatus !== 'completed';
  const activeCount = all.filter(isActive).length;
  const historyCount = all.length - activeCount;

  const filtered = all
    .filter((r) => (tab === 'active' ? isActive(r) : r.reviewerStatus === 'completed'))
    .filter((r) => r.userName.toLowerCase().includes(search.trim().toLowerCase()) || r.userEmail.toLowerCase().includes(search.trim().toLowerCase()));

  const tabs: TabItem[] = [
    { value: 'active', label: 'Active', count: activeCount },
    { value: 'history', label: 'History', count: historyCount },
  ];
  const open = (id: string) => router.push(`/iga/reviewer/sod-resolution-v2/${id}`);

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
    { id: 'risk', header: 'Risk', sortable: true, value: (r) => r.riskScore, render: (r) => <SeverityChip severity={r.severity} score={r.riskScore} /> },
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
    { id: 'rules', header: 'Access combinations', align: 'right', width: 148, sortable: true, value: (r) => r.ruleCount, render: (r) => <span className="tabular-nums text-text-primary">{r.ruleCount}</span> },
    { id: 'due', header: 'Due', render: (r) => <span className="whitespace-nowrap text-text-secondary">{formatDateTime(r.dueDate)}</span> },
    { id: 'assigned', header: 'Assigned', render: (r) => <span className="text-text-secondary">{formatDate(r.assignedAt)}</span> },
    { id: 'status', header: 'Status', sortable: true, value: (r) => r.reviewerStatus, render: (r) => <ReviewerStatusPill status={r.reviewerStatus} /> },
  ];

  return (
    <div className="flex h-full flex-col">
      <div className="mb-5 shrink-0">
        <h1 className="text-h2 font-bold tracking-tight text-text-primary">My Reviews</h1>
        <p className="mt-1 text-body text-text-secondary">Separation-of-duties reviews assigned to you. Open one to resolve its violations.</p>
      </div>

      <div className="mb-4 shrink-0">
        <Tabs items={tabs} value={tab} onChange={(v) => setTab(v as 'active' | 'history')} aria-label="Review status" />
      </div>

      <div className="mb-4 w-full max-w-sm shrink-0">
        <Input placeholder="Search by user or email" value={search} onChange={(e) => setSearch(e.target.value)} startAdornment={<SearchOutlined sx={{ fontSize: 18 }} />} />
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
          emptyTitle={tab === 'active' ? 'No active reviews' : 'No completed reviews'}
          emptyMessage={tab === 'active' ? 'Reviews assigned to you that are not started or in progress will appear here.' : 'Reviews you have submitted will appear here.'}
        />
      </div>
    </div>
  );
}
