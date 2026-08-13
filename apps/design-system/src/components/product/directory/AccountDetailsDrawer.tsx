'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import AccountBoxOutlined from '@mui/icons-material/AccountBoxOutlined';
import OpenInNewOutlined from '@mui/icons-material/OpenInNewOutlined';
import { Button, Card, Drawer, InfoRow, InfoRowGroup, StatusChip } from '@ds/components';
import { getAppAccountDetail, getUserIdentityDetail, type AppAccountRow } from '@/data/directory';
import { infoIcon } from './infoIcons';

/**
 * A peek at an app account, opened from a relationship table.
 *
 * Cross-navigation used to be the only option: clicking a related account threw
 * you onto its page and you lost the entitlement you were reading. Most of the
 * time the question is small — *who is this account, and what does it hold?* — so
 * the row answers it in place, and offers the full page as a deliberate second
 * step rather than an accident.
 */
/**
 * The account summary itself, independent of what contains it.
 *
 * Extracted so the overlay drawer and the inline panel show the same thing:
 * two copies of these rows would drift the moment one gained a field.
 */
export function AccountDetailsBody({
  account,
  surface = 'card',
}: {
  account: AppAccountRow;
  /** `bare` drops the bordered card — for containers that already have a border. */
  surface?: 'card' | 'bare';
}) {
  const detail = React.useMemo(() => getAppAccountDetail(account.id), [account.id]);
  const identity = React.useMemo(
    () => (account.identityId ? getUserIdentityDetail(account.identityId)?.identity ?? null : null),
    [account.identityId],
  );

  const entitlements = detail?.entitlements ?? [];
  // Two names, then a count — the full list belongs on the account's own page.
  const entitlementSummary =
    entitlements.length === 0
      ? 'None'
      : entitlements
          .slice(0, 2)
          .map((e) => e.name)
          .join(', ') + (entitlements.length > 2 ? ` +${entitlements.length - 2}` : '');

  // `emphasis="label"`: read cold, opened from a table row, so the reader is
  // learning which fields exist as much as what is in them. Detail rails keep
  // the default, where the value leads.
  // `bare` drops the row gutter too — its container supplies the inset, so the
  // dividers stop at the gutter instead of running to the panel edge.
  const pad = surface === 'card' ? 'px-5' : '';
  const rows = (
    <InfoRowGroup
      emphasis="label"
      className={surface === 'card' ? '-mx-5 w-[calc(100%+2.5rem)]' : undefined}
    >
      <InfoRow className={pad} icon={infoIcon.account} label="Account" value={account.accountName} />
        <InfoRow className={pad} icon={infoIcon.email} label="Email" value={account.email || '—'} />
        <InfoRow className={pad} icon={infoIcon.application} label="Application" value={account.applicationName} />
        <InfoRow
          className={pad}
          icon={infoIcon.person}
          label="Linked identity"
          value={
            account.orphan || !account.identityName ? (
              <span className="flex items-center gap-2">
                <span className="text-text-tertiary">Not linked</span>
                <StatusChip intent="warning" label="Orphan" />
              </span>
            ) : (
              account.identityName
            )
          }
        />
        {identity && (
          <>
            <InfoRow className={pad} icon={infoIcon.jobTitle} label="Job title" value={identity.jobTitle} />
            <InfoRow className={pad} icon={infoIcon.department} label="Department" value={identity.department} />
          </>
        )}
        <InfoRow
          className={pad}
          icon={infoIcon.entitlement}
          label={`Entitlements (${entitlements.length})`}
          value={entitlementSummary}
        />
    </InfoRowGroup>
  );

  return surface === 'card' ? <Card padding="none">{rows}</Card> : rows;
}

export function AccountDetailsDrawer({
  account,
  open,
  onClose,
}: {
  account: AppAccountRow | null;
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();

  if (!account) return null;

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={`${account.accountName}’s Details`}
      subtitle="View this account’s identity and access"
      icon={<AccountBoxOutlined sx={{ fontSize: 22, color: 'var(--ds-color-brand-primary)' }} />}
      width={560}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
          {/* The escape hatch, not the default: going to the page is a choice you
              make after reading, so it is an explicit action rather than a click
              that fires while you are still scanning the table. */}
          <Button
            startIcon={<OpenInNewOutlined />}
            onClick={() => router.push(`/iga/directory/app-accounts/${account.id}`)}
          >
            Open account page
          </Button>
        </>
      }
    >
      <AccountDetailsBody account={account} />
    </Drawer>
  );
}

export default AccountDetailsDrawer;
