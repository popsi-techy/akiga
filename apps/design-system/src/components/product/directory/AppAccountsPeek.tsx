'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import InfoOutlined from '@mui/icons-material/InfoOutlined';
import OpenInNewOutlined from '@mui/icons-material/OpenInNewOutlined';
import { Button, Tooltip, type Column } from '@ds/components';
import { AppBadge } from '../sod/labels';
import { EntityAvatar } from './EntityAvatar';
import { RelationTable } from './DetailShell';
import { AccountDetailsBody } from './AccountDetailsBody';
import { PeekPanel, PeekSlot } from './PeekPanel';
import type { AppAccountRow } from '@/data/directory';

/**
 * Related app accounts, with the account's summary opening beside the table.
 *
 * Chosen over a hover card and an overlay drawer after trying all three: the
 * panel takes width from the table rather than covering it, so the list stays
 * visible and clickable — pick the next row and the panel simply swaps. A hover
 * card was too transient to read from and its link was pointer-only; an overlay
 * drawer had more room but made the table inert while open.
 */
export function AppAccountsPeek({ accounts }: { accounts: AppAccountRow[] }) {
  const router = useRouter();
  const [peek, setPeek] = React.useState<AppAccountRow | null>(null);

  const columns: Column<AppAccountRow>[] = [
    {
      id: 'name',
      header: 'Account',
      sortable: true,
      value: (r) => r.accountName,
      render: (r) => (
        <div className="flex items-center gap-3">
          <EntityAvatar kind="account" name={r.accountName} />
          <span className="truncate text-body-sm-strong text-text-primary">{r.accountName}</span>
        </div>
      ),
    },
    {
      id: 'email',
      header: 'Email',
      sortable: true,
      value: (r) => r.email,
      render: (r) => <span className="text-text-secondary">{r.email || '—'}</span>,
    },
    {
      id: 'application',
      header: 'Application',
      sortable: true,
      value: (r) => r.applicationName,
      render: (r) => (
        <span className="flex items-center gap-2 text-text-secondary">
          <AppBadge app={r.applicationName} size={20} />
          {r.applicationName}
        </span>
      ),
    },
    {
      // The same thing the row click does, but visible rather than discovered —
      // and a real button, so the panel is reachable from the keyboard.
      id: 'details',
      header: '',
      width: 56,
      value: () => '',
      render: (r) => (
        <div className="flex justify-end">
          <Tooltip title="View details">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setPeek(r);
              }}
              aria-label={`View details for ${r.accountName}`}
              className="rounded-md p-1 text-icon-subtle transition-colors hover:bg-surface-hover hover:text-text-brand"
            >
              <InfoOutlined sx={{ fontSize: 18 }} />
            </button>
          </Tooltip>
        </div>
      ),
    },
  ];

  return (
    <div className="flex h-full min-h-0">
      <div className="min-w-0 flex-1">
        <RelationTable
          columns={columns}
          rows={accounts}
          onRowClick={(r) => setPeek(r)}
          emptyTitle="No app accounts"
          emptyMessage="No accounts currently hold this entitlement."
        />
      </div>

      <PeekSlot open={peek !== null}>
        {peek && (
          <PeekPanel
            // Same mark as the row it opened from, so the panel is visibly about
            // that row rather than about "an account".
            avatar={<EntityAvatar kind="account" name={peek.accountName} size="md" />}
            title={peek.accountName}
            subtitle="This account’s identity and access"
            onClose={() => setPeek(null)}
            footer={
              <Button
                variant="secondary"
                fullWidth
                startIcon={<OpenInNewOutlined sx={{ fontSize: 18 }} />}
                onClick={() => router.push(`/iga/directory/app-accounts/${peek.id}`)}
              >
                Open account page
              </Button>
            }
          >
            {/* `bare`: the panel is already the box. */}
            <AccountDetailsBody account={peek} surface="bare" />
          </PeekPanel>
        )}
      </PeekSlot>
    </div>
  );
}
