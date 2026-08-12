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

  const detail = React.useMemo(
    () => (account ? getAppAccountDetail(account.id) : null),
    [account],
  );
  const identity = React.useMemo(
    () => (account?.identityId ? getUserIdentityDetail(account.identityId)?.identity ?? null : null),
    [account],
  );

  if (!account) return null;

  const entitlements = detail?.entitlements ?? [];
  // Two names, then a count — the full list belongs on the account's own page.
  const entitlementSummary =
    entitlements.length === 0
      ? 'None'
      : entitlements
          .slice(0, 2)
          .map((e) => e.name)
          .join(', ') + (entitlements.length > 2 ? ` +${entitlements.length - 2}` : '');

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
      {/* Cancels Card's `padding="none"` gutter so the dividers reach the card's
          edges; each row then carries its own `px-5`. The explicit width is
          required: `InfoRowGroup` is `w-full`, so a bare `-mx-5` would shift the
          group left without widening it and leave the rules 40px short on the
          right. Same inset as before — the rules just read as one continuous
          list instead of a stack of short lines. */}
      <Card padding="none">
        {/* `emphasis="label"`: this drawer is read cold, opened from a table row,
            so the reader is learning which fields exist as much as what is in
            them. Detail rails keep the default, where the value leads. */}
        <InfoRowGroup emphasis="label" className="-mx-5 w-[calc(100%+2.5rem)]">
          <InfoRow className="px-5" icon={infoIcon.account} label="Account" value={account.accountName} />
          <InfoRow className="px-5" icon={infoIcon.email} label="Email" value={account.email || '—'} />
          <InfoRow className="px-5" icon={infoIcon.application} label="Application" value={account.applicationName} />
          <InfoRow className="px-5"
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
              <InfoRow className="px-5" icon={infoIcon.jobTitle} label="Job title" value={identity.jobTitle} />
              <InfoRow className="px-5" icon={infoIcon.department} label="Department" value={identity.department} />
            </>
          )}
          <InfoRow className="px-5"
            icon={infoIcon.entitlement}
            label={`Entitlements (${entitlements.length})`}
            value={entitlementSummary}
          />
        </InfoRowGroup>
      </Card>
    </Drawer>
  );
}

export default AccountDetailsDrawer;
