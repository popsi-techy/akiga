'use client';

import * as React from 'react';
import { Avatar, InfoRow, InfoRowGroup, StatusChip } from '@ds/components';
import { RiskScoreChip } from './RiskScoreChip';
import { infoIcon } from './infoIcons';
import { getUserIdentityDetail, type UserIdentityRow } from '@/data/directory';

/**
 * A user identity's summary — who they are, and how much access rides on them.
 *
 * Same contract as `AccountDetailsBody`: rows only, no container, so a peek panel
 * or a card can hold it without either one knowing about the other. Risk and
 * status come last because they are the reason to look, and the reader needs the
 * name and role first to know whose risk it is.
 */
export function IdentityDetailsBody({
  identity,
  surface = 'card',
}: {
  identity: UserIdentityRow;
  /** `bare` drops the bordered card — for containers that already have a border. */
  surface?: 'card' | 'bare';
}) {
  const detail = React.useMemo(() => getUserIdentityDetail(identity.id), [identity.id]);
  const pad = surface === 'card' ? 'px-5' : '';

  const accounts = detail?.accounts.length ?? 0;
  const technicalRoles = detail?.technicalRoles.length ?? 0;
  const businessRoles = detail?.businessRoles.length ?? 0;

  return (
    <InfoRowGroup className={surface === 'card' ? '-mx-5 w-[calc(100%+2.5rem)]' : undefined}>
      <InfoRow
        className={pad}
        icon={infoIcon.person}
        label="Name"
        valueWrap
        value={
          <span className="flex min-w-0 items-center gap-2">
            <Avatar name={identity.name} size="xs" kind="person" />
            <span className="min-w-0 truncate">{identity.name}</span>
          </span>
        }
      />
      <InfoRow className={pad} icon={infoIcon.email} label="Email" value={identity.email || '—'} />
      <InfoRow className={pad} icon={infoIcon.jobTitle} label="Job title" value={identity.jobTitle} />
      <InfoRow className={pad} icon={infoIcon.department} label="Department" value={identity.department} />
      <InfoRow
        className={pad}
        icon={infoIcon.status}
        label="Status"
        value={
          <StatusChip
            intent={identity.status === 'active' ? 'success' : 'neutral'}
            label={identity.status === 'active' ? 'Active' : 'Inactive'}
          />
        }
      />
      <InfoRow
        className={pad}
        icon={infoIcon.risk}
        label="Risk score"
        value={<RiskScoreChip score={identity.riskScore} />}
      />
      <InfoRow className={pad} icon={infoIcon.account} label="App Accounts" value={String(accounts)} />
      <InfoRow
        className={pad}
        icon={infoIcon.technicalRole}
        label="Roles"
        value={`${technicalRoles} technical · ${businessRoles} business`}
      />
    </InfoRowGroup>
  );
}
