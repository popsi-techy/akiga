'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import InfoOutlined from '@mui/icons-material/InfoOutlined';
import OpenInNewOutlined from '@mui/icons-material/OpenInNewOutlined';
import { Avatar, StatusChip, Tooltip } from '@ds/components';
import type { SeedUserIdentity } from '@/data/seed';
import { RiskScoreChip } from './RiskScoreChip';

/**
 * Who the account belongs to, one hover away.
 *
 * The row already names the identity; this answers the follow-up — *which* Emily
 * Davis, and is she someone whose access should worry me — without leaving the
 * account. The card carries its own link out, so reading and navigating stay
 * separate decisions.
 */
export function IdentityTip({ identity }: { identity: SeedUserIdentity }) {
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
