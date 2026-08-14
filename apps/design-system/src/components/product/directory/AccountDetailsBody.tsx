'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import OpenInNewOutlined from '@mui/icons-material/OpenInNewOutlined';
import InfoOutlined from '@mui/icons-material/InfoOutlined';
import { Avatar, Card, InfoRow, InfoRowGroup, StatusChip, Tooltip } from '@ds/components';
import { getAppAccountDetail, getUserIdentityDetail, type AppAccountRow } from '@/data/directory';
import type { SeedUserIdentity } from '@/data/seed';
import { AppBadge } from '../sod/labels';
import { RiskScoreChip } from './RiskScoreChip';
import { infoIcon } from './infoIcons';

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
              <Avatar name={account.accountName} size="xs" shape="circle" />
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
                <Avatar name={account.identityName} size="xs" shape="circle" />
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
          value={<EntitlementChips items={entitlements} />}
        />
    </InfoRowGroup>
  );

  return surface === 'card' ? <Card padding="none">{rows}</Card> : rows;
}

/**
 * Who the account belongs to, one hover away.
 *
 * The row already names the identity; this answers the follow-up — *which* Emily
 * Davis, and is she someone whose access should worry me — without leaving the
 * account. The card carries its own link out, so reading and navigating stay
 * separate decisions.
 */
function IdentityTip({ identity }: { identity: SeedUserIdentity }) {
  return (
    <Tooltip variant="card" placement="top" title={<IdentityCard identity={identity} />}>
      {/* A `span`, not a button: this sits inside table rows and panels that are
          themselves clickable, and a button inside a button is invalid. */}
      <span
        tabIndex={0}
        aria-label={`Details for ${identity.name}`}
        onClick={(e) => e.stopPropagation()}
        className="inline-grid shrink-0 cursor-help place-items-center rounded-full align-middle text-icon-subtle transition-colors hover:text-icon focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-subtle"
      >
        <InfoOutlined sx={{ fontSize: 14 }} />
      </span>
    </Tooltip>
  );
}

function IdentityCard({ identity }: { identity: SeedUserIdentity }) {
  const router = useRouter();
  return (
    <div className="w-[288px] text-left">
      <div className="flex items-center gap-2.5 px-3.5 pb-3 pt-3.5">
        <Avatar name={identity.name} size="md" shape="circle" />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-h5 leading-tight text-text-primary">{identity.name}</span>
          <span className="block truncate text-caption text-text-tertiary">{identity.email}</span>
        </span>
        <button
          type="button"
          onClick={() => router.push(`/iga/directory/user-identities/${identity.id}`)}
          aria-label={`Open ${identity.name}’s identity page`}
          title="Open identity page"
          className="-mr-1 shrink-0 rounded-md p-1 text-icon transition-colors hover:bg-surface-hover hover:text-text-brand"
        >
          <OpenInNewOutlined sx={{ fontSize: 16 }} />
        </button>
      </div>
      <dl className="grid grid-cols-2 gap-x-3 gap-y-1 border-t border-border-subtle px-3.5 py-3">
        <dt className="text-caption text-text-tertiary">Job title</dt>
        <dt className="text-caption text-text-tertiary">Department</dt>
        <dd className="min-w-0 truncate text-body-sm-strong text-text-primary">{identity.jobTitle}</dd>
        <dd className="min-w-0 truncate text-body-sm-strong text-text-primary">{identity.department}</dd>
        <dt className="mt-2 text-caption text-text-tertiary">Status</dt>
        <dt className="mt-2 text-caption text-text-tertiary">Risk</dt>
        <dd className="min-w-0">
          <StatusChip
            intent={identity.status === 'active' ? 'success' : 'neutral'}
            label={identity.status === 'active' ? 'Active' : 'Inactive'}
          />
        </dd>
        <dd className="min-w-0">
          <RiskScoreChip score={identity.riskScore} />
        </dd>
      </dl>
    </div>
  );
}

/**
 * Entitlements as chips: one named, the rest behind a `+n`.
 *
 * One, because two wrap to a second line in a 400px panel and that row then
 * stands taller than every other — a list of label/value rows reads by its
 * even rhythm. The overflow is a real affordance rather than an ellipsis:
 * hovering or focusing `+n` names the ones that did not fit.
 */
function EntitlementChips({ items }: { items: { id: string; name: string }[] }) {
  if (items.length === 0) return <span className="text-text-tertiary">None</span>;

  const shown = items.slice(0, 1);
  const rest = items.slice(1);
  const chip =
    'inline-flex max-w-[140px] items-center rounded-pill border border-border bg-subtle px-2 py-0.5 text-caption-strong text-text-primary';

  // `flex-nowrap`: one chip plus `+n` always fits, so wrapping can only ever be
  // a mistake here — and a wrap would be the thing that changes the row height.
  return (
    <span className="flex flex-nowrap items-center gap-1.5">
      {shown.map((e) => (
        <span key={e.id} className={chip} title={e.name}>
          <span className="truncate">{e.name}</span>
        </span>
      ))}
      {rest.length > 0 && (
        <Tooltip
          variant="card"
          // Chips in the overlay too — the same mark for the same kind of thing,
          // so the hidden ones read as a continuation of the row rather than a
          // different list. Free to wrap here: the card sizes to its contents.
          title={
            <div className="flex max-w-[260px] flex-wrap items-center gap-1.5 p-3">
              {rest.map((e) => (
                <span key={e.id} className={chip} title={e.name}>
                  <span className="truncate">{e.name}</span>
                </span>
              ))}
            </div>
          }
        >
          <span
            tabIndex={0}
            aria-label={`${rest.length} more: ${rest.map((e) => e.name).join(', ')}`}
            className={`${chip} cursor-help text-text-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-subtle`}
          >
            +{rest.length}
          </span>
        </Tooltip>
      )}
    </span>
  );
}
