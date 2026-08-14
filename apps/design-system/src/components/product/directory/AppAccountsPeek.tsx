'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import CloseOutlined from '@mui/icons-material/CloseOutlined';
import InfoOutlined from '@mui/icons-material/InfoOutlined';
import OpenInNewOutlined from '@mui/icons-material/OpenInNewOutlined';
import { Button, Tooltip, type Column } from '@ds/components';
import { AppBadge } from '../sod/labels';
import { EntityAvatar } from './EntityAvatar';
import { RelationTable } from './DetailShell';
import { AccountDetailsBody } from './AccountDetailsBody';
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

      {/* Animating width rather than transform: the panel takes space from the
          table instead of sitting on top of it, so the table reflows as it
          opens. `overflow-hidden` clips the fixed-width contents while the
          wrapper is still narrower, which is what makes it read as a slide. */}
      <div
        className={[
          'shrink-0 overflow-hidden transition-[width,margin] duration-200 ease-out',
          peek ? 'ml-5 w-[400px]' : 'ml-0 w-0',
        ].join(' ')}
        aria-hidden={!peek}
      >
        <div className="h-full w-[400px]">
          {peek && <AccountPanel account={peek} onClose={() => setPeek(null)} />}
        </div>
      </div>
    </div>
  );
}

function AccountPanel({ account, onClose }: { account: AppAccountRow; onClose: () => void }) {
  const router = useRouter();
  return (
    <div className="flex h-full flex-col rounded-xl border border-border bg-surface">
      <header className="flex items-start gap-3 border-b border-border px-5 py-4">
        {/* Same mark as the row it opened from, so the panel is visibly about
            that row rather than about "an account". */}
        <EntityAvatar kind="account" name={account.accountName} size="md" />
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-h5 text-text-primary">{account.accountName}</h3>
          <p className="mt-0.5 text-caption text-text-secondary">This account’s identity and access</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close panel"
          className="-mr-1 shrink-0 rounded-md p-1 text-icon hover:bg-surface-hover"
        >
          <CloseOutlined sx={{ fontSize: 18 }} />
        </button>
      </header>

      {/* The gutter lives here, not on the rows — one inset, so the dividers
          stop where the content does. */}
      <div className="ds-scroll min-h-0 flex-1 overflow-y-auto px-5 py-1">
        <AccountDetailsBody account={account} />
      </div>

      <footer className="border-t border-border px-5 py-3">
        <Button
          variant="secondary"
          fullWidth
          startIcon={<OpenInNewOutlined sx={{ fontSize: 18 }} />}
          onClick={() => router.push(`/iga/directory/app-accounts/${account.id}`)}
        >
          Open account page
        </Button>
      </footer>
    </div>
  );
}
