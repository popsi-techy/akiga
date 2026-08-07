'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { DataTable, Avatar, type Column } from '@ds/components';
import { listMyReviews } from '@/data/sod';
import type { MyReviewRow } from '@/data/sod-types';
import { SeverityChip, formatDateTime } from '@/components/product/sod/labels';

/**
 * SoD Resolution V4 — policy-centric flow driven by a single "Start resolution"
 * slider. The list surfaces the active policy violation; opening it launches the
 * resolution workspace.
 */
export default function SodResolutionV4ListPage() {
  const router = useRouter();
  const [rows, setRows] = React.useState<MyReviewRow[] | null>(null);

  React.useEffect(() => {
    setRows(listMyReviews());
  }, []);

  const active = (rows ?? []).filter((r) => r.reviewerStatus !== 'completed').slice(0, 1);
  const open = (id: string) => router.push(`/iga/reviewer/sod-resolution-v4/${id}`);

  const columns: Column<MyReviewRow>[] = [
    {
      id: 'user',
      header: 'User',
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
    { id: 'risk', header: 'Risk', value: (r) => r.riskScore, render: (r) => <SeverityChip severity={r.severity} score={r.riskScore} /> },
    { id: 'policy', header: 'SoD Policy', render: (r) => <span className="text-text-primary">{r.policyNames[0]}</span> },
    { id: 'rules', header: 'Access combinations', align: 'right', width: 148, render: (r) => <span className="tabular-nums text-text-primary">{r.ruleCount}</span> },
    { id: 'due', header: 'Due', render: (r) => <span className="whitespace-nowrap text-text-secondary">{formatDateTime(r.dueDate)}</span> },
  ];

  return (
    <div className="flex h-full flex-col">
      <div className="mb-5 shrink-0">
        <h1 className="text-h2 font-bold tracking-tight text-text-primary">SoD Resolution</h1>
        <p className="mt-1 text-body text-text-secondary">Your active policy violation. Open it, then start resolution to clear every conflicting access combination.</p>
      </div>

      <div className="min-h-0 flex-1">
        <DataTable<MyReviewRow>
          columns={columns}
          rows={active}
          loading={rows === null}
          onRowClick={(r) => open(r.id)}
          fillHeight
          emptyTitle="No active violation"
          emptyMessage="You have no active separation-of-duties violation to resolve."
        />
      </div>
    </div>
  );
}
