'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import OpenInNewOutlined from '@mui/icons-material/OpenInNewOutlined';
import InfoOutlined from '@mui/icons-material/InfoOutlined';
import { Avatar, Card, InfoRow, InfoRowGroup, OverflowChips, StatusChip, Tooltip } from '@ds/components';
import { getAppAccountDetail, getUserIdentityDetail, type AppAccountRow } from '@/data/directory';
import type { SeedUserIdentity } from '@/data/seed';
import { AppBadge } from '../sod/labels';
import { RiskScoreChip } from './RiskScoreChip';
import { infoIcon } from './infoIcons';
import { IdentityTip } from './IdentityTip';

/**
 * An app account's summary — who holds it and what it grants.
 *
 * Cross-navigation used to be the only option: clicking a related account threw
 * you onto its page and you lost the entitlement you were reading. Most of the
 * time the question is small — *who is this account, and what does it hold?* — so
 * the row answers it in place, and offers the full page as a deliberate second
 * step rather than an accident.
 *
 * Separate from its container so the panel that shows it can change without the
 * content changing with it.
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

  // Default emphasis — icon and label recede, the value carries the weight, the
  // same way the detail-rail cards read. The field names are predictable enough
  // that emphasising them just competes with the answers.
  //
  // `bare` drops the row gutter too — its container supplies the inset, so the
  // dividers stop at the gutter instead of running to the panel edge.
  const pad = surface === 'card' ? 'px-5' : '';
  const rows = (
    <InfoRowGroup className={surface === 'card' ? '-mx-5 w-[calc(100%+2.5rem)]' : undefined}>
      <InfoRow
          className={pad}
          icon={infoIcon.account}
          label="Account"
          // The circle avatar's ring paints 3px outside its box, and the cell's
          // default `truncate` clips it. Lifting the clip lets the ring show; the
          // name span below still truncates, so nothing wraps.
          valueWrap
          value={
            <span className="flex min-w-0 items-center gap-2">
              <Avatar name={account.accountName} size="xs" kind="person" />
              <span className="min-w-0 truncate">{account.accountName}</span>
            </span>
          }
        />
        <InfoRow className={pad} icon={infoIcon.email} label="Email" value={account.email || '—'} />
        <InfoRow
          className={pad}
          icon={infoIcon.application}
          label="Application"
          value={
            <span className="flex min-w-0 items-center gap-2">
              <AppBadge app={account.applicationName} size={18} variant="subtle" />
              <span className="min-w-0 truncate">{account.applicationName}</span>
            </span>
          }
        />
        <InfoRow
          className={pad}
          icon={infoIcon.person}
          label="Linked identity"
          valueWrap
          value={
            account.orphan || !account.identityName ? (
              <span className="flex items-center gap-2">
                <span className="text-text-tertiary">Not linked</span>
                <StatusChip intent="warning" label="Orphan" />
              </span>
            ) : (
              <span className="flex min-w-0 items-center gap-2">
                <Avatar name={account.identityName} size="xs" kind="person" />
                <span className="min-w-0 truncate">{account.identityName}</span>
                {identity && <IdentityTip identity={identity} />}
              </span>
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
          valueWrap
          value={<OverflowChips items={entitlements} />}
        />
    </InfoRowGroup>
  );

  return surface === 'card' ? <Card padding="none">{rows}</Card> : rows;
}
