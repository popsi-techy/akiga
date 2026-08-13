'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import InfoOutlined from '@mui/icons-material/InfoOutlined';
import CloseOutlined from '@mui/icons-material/CloseOutlined';
import OpenInNewOutlined from '@mui/icons-material/OpenInNewOutlined';
import { Avatar, Button, StatusChip, Tooltip, type Column } from '@ds/components';
import { AppBadge } from '../sod/labels';
import { EntityAvatar } from './EntityAvatar';
import { RelationTable } from './DetailShell';
import { AccountDetailsBody, AccountDetailsDrawer } from './AccountDetailsDrawer';
import { getAppAccountDetail, type AppAccountRow } from '@/data/directory';

export type AccountPeekVariant = 'hover' | 'inline' | 'drawer';

/** The switcher lives in the page header, so the options are exported with it. */
export const ACCOUNT_PEEK_VARIANTS: { value: AccountPeekVariant; label: string }[] = [
  { value: 'hover', label: 'Hover card' },
  { value: 'inline', label: 'Inline panel' },
  { value: 'drawer', label: 'Side drawer' },
];

/**
 * A comparison harness, not a product surface.
 *
 * The same table three ways, so the question "how should a related account
 * reveal itself?" can be answered by using each one rather than by arguing from
 * a mock. Pick the winner and this collapses to a single table with that
 * behaviour built in.
 *
 * The trades, since nothing on screen states them any more:
 *
 * - **Hover card** — no click, nothing lost, but transient, awkward to copy
 *   from, and its link is pointer-only (focus never enters a tooltip).
 * - **Inline panel** — takes width from the table rather than covering it, so
 *   the list stays visible and a click on the next row just swaps the panel.
 *   Narrow enough that some values clip.
 * - **Side drawer** — widest and calmest, but the table is covered by an
 *   overlay and inert until it closes.
 *
 * `variant` is owned by the page so the switcher can sit in the header beside
 * the other actions.
 */
export function AccountAccessVariants({
  accounts,
  variant,
}: {
  accounts: AppAccountRow[];
  variant: AccountPeekVariant;
}) {
  const [peek, setPeek] = React.useState<AppAccountRow | null>(null);

  // A row selected under one variant should not reappear under the next: each
  // is meant to be tried from a standing start.
  React.useEffect(() => setPeek(null), [variant]);

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
          {variant === 'hover' && <AccountDetailsTip account={r} />}
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
    // An explicit trigger for the same thing the row click does — so the
    // affordance is visible rather than discovered, and reachable by keyboard.
    ...(variant === 'hover'
      ? []
      : [
          {
            id: 'details',
            header: '',
            width: 56,
            value: () => '',
            render: (r: AppAccountRow) => (
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
          } satisfies Column<AppAccountRow>,
        ]),
  ];

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex min-h-0 flex-1">
        <div className="min-w-0 flex-1">
          <RelationTable
            columns={columns}
            rows={accounts}
            // The hover variant has no row action at all: that is the trade being
            // demonstrated, not an omission.
            onRowClick={variant === 'hover' ? undefined : (r) => setPeek(r)}
            emptyTitle="No app accounts"
            emptyMessage="No accounts currently hold this entitlement."
          />
        </div>

        {/* Animating width rather than transform: the panel has to take space
            from the table, not sit on top of it, so the table reflows as it
            opens. `overflow-hidden` clips the fixed-width contents while the
            wrapper is still narrower than them, which is what makes it read as
            a slide rather than a squeeze. */}
        <div
          className={[
            'shrink-0 overflow-hidden transition-[width,margin] duration-200 ease-out',
            variant === 'inline' && peek ? 'ml-5 w-[400px]' : 'ml-0 w-0',
          ].join(' ')}
          aria-hidden={!(variant === 'inline' && peek)}
        >
          <div className="h-full w-[400px]">
            {peek && <InlineAccountPanel account={peek} onClose={() => setPeek(null)} />}
          </div>
        </div>
      </div>

      <AccountDetailsDrawer
        account={peek}
        open={variant === 'drawer' && peek !== null}
        onClose={() => setPeek(null)}
      />
    </div>
  );
}

/**
 * The inline variant's panel. Same body as the overlay drawer — only the
 * container differs, which is the whole point of the comparison.
 */
function InlineAccountPanel({ account, onClose }: { account: AppAccountRow; onClose: () => void }) {
  const router = useRouter();
  return (
    <div className="flex h-full flex-col rounded-xl border border-border bg-surface">
      <header className="flex items-start gap-3 border-b border-border px-5 py-4">
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
      {/* `bare`: the panel already has a border, and a bordered card inside it
          reads as a box in a box. */}
      {/* The gutter lives here, not on the rows — one inset, so the dividers
          stop where the content does. */}
      <div className="ds-scroll min-h-0 flex-1 overflow-y-auto px-5 py-1">
        <AccountDetailsBody account={account} surface="bare" />
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

/**
 * The hover variant's affordance — a `span` with `tabIndex`, not a button, so it
 * can live inside a clickable row without nesting one control in another. Same
 * construction as the access chips on SoD Resolution V3.
 */
function AccountDetailsTip({ account }: { account: AppAccountRow }) {
  return (
    <Tooltip variant="card" placement="top" title={<AccountDetailsCard account={account} />}>
      <span
        tabIndex={0}
        aria-label={`Details for ${account.accountName}`}
        onClick={(e) => e.stopPropagation()}
        // Hidden by opacity, not by `display`: the space stays reserved, so the
        // account name does not shift sideways as the pointer crosses the row.
        // `[tr:hover_&]` rather than `group-hover` because the row element
        // belongs to DataTable — this reaches it without a wrapper class.
        className="inline-grid shrink-0 cursor-help place-items-center rounded-full align-middle text-icon-subtle opacity-0 transition-[color,opacity] hover:text-icon focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-subtle [tr:hover_&]:opacity-100"
      >
        <InfoOutlined sx={{ fontSize: 14 }} />
      </span>
    </Tooltip>
  );
}

/**
 * What fits in a hover card: identity first, then the two or three facts a
 * reviewer actually asks for. Deliberately shorter than the drawer — a card that
 * needs scrolling has picked the wrong container.
 */
function AccountDetailsCard({ account }: { account: AppAccountRow }) {
  const router = useRouter();
  const detail = getAppAccountDetail(account.id);
  const entitlements = detail?.entitlements ?? [];

  return (
    <div className="w-[300px] text-left">
      <div className="flex items-center gap-2.5 px-3.5 pb-3 pt-3.5">
        <Avatar
          name={account.accountName}
          initials={account.accountName.trim().charAt(0).toUpperCase()}
          size="md"
          shape="soft"
        />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-h5 leading-tight text-text-primary">{account.accountName}</span>
          <span className="block truncate text-caption text-text-tertiary">{account.email || 'No email'}</span>
        </span>
        {/* Reachable because MUI keeps a tooltip open while the pointer is over
            it — the card is not a dead end. Pointer-only, though: focus never
            enters a tooltip, so keyboard users get the details but not this
            link. That limit is part of what the comparison is for. */}
        <button
          type="button"
          onClick={() => router.push(`/iga/directory/app-accounts/${account.id}`)}
          aria-label={`Open ${account.accountName}’s account page`}
          title="Open account page"
          className="-mr-1 shrink-0 rounded-md p-1 text-icon transition-colors hover:bg-surface-hover hover:text-text-brand"
        >
          <OpenInNewOutlined sx={{ fontSize: 16 }} />
        </button>
      </div>
      <div className="space-y-3 border-t border-border-subtle px-3.5 py-3">
        <dl className="grid grid-cols-2 gap-x-3 gap-y-1">
          <dt className="text-caption text-text-tertiary">Application</dt>
          <dt className="text-caption text-text-tertiary">Linked identity</dt>
          <dd className="flex min-w-0 items-center gap-1.5">
            <AppBadge app={account.applicationName} size={18} variant="subtle" />
            <span className="min-w-0 truncate text-body-sm-strong text-text-primary">
              {account.applicationName}
            </span>
          </dd>
          <dd className="min-w-0">
            {account.orphan || !account.identityName ? (
              <StatusChip intent="warning" label="Orphan" />
            ) : (
              <span className="block truncate text-body-sm-strong text-text-primary">{account.identityName}</span>
            )}
          </dd>
        </dl>
        <div>
          <div className="text-caption text-text-tertiary">Entitlements ({entitlements.length})</div>
          <p className="mt-0.5 text-body-sm leading-5 text-text-secondary">
            {entitlements.length === 0
              ? 'None'
              : entitlements
                  .slice(0, 3)
                  .map((e) => e.name)
                  .join(', ') + (entitlements.length > 3 ? ` +${entitlements.length - 3}` : '')}
          </p>
        </div>
      </div>
    </div>
  );
}
