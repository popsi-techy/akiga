'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import InfoOutlined from '@mui/icons-material/InfoOutlined';
import OpenInNewOutlined from '@mui/icons-material/OpenInNewOutlined';
import { Tooltip } from '@ds/components';
import type { EntitlementRow } from '@/data/directory';
import { AppBadge } from '../sod/labels';
import { RiskScoreChip } from './RiskScoreChip';

/**
 * What an entitlement is today, one hover away — the sibling of `IdentityTip`.
 *
 * Deliberately shows the **catalog's current** view and says so, because the
 * surface that uses it (an audit entry) sits beside a snapshot of how the same
 * entitlement looked when the event happened. Two sets of unlabelled risk scores
 * four rows apart is the confusion this card exists to avoid, so the heading
 * names which one you are reading. It never restates the recorded state.
 */
export function EntitlementTip({ entitlement }: { entitlement: EntitlementRow }) {
  return (
    <Tooltip variant="card" placement="top" title={<EntitlementCard entitlement={entitlement} />}>
      {/* A `span`, not a button: this sits inside rows and panels that are
          themselves clickable, and a button inside a button is invalid. */}
      <span
        tabIndex={0}
        aria-label={`Details for ${entitlement.name}`}
        onClick={(e) => e.stopPropagation()}
        className="inline-grid shrink-0 cursor-help place-items-center rounded-full align-middle text-icon-subtle transition-colors hover:text-icon focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-subtle"
      >
        <InfoOutlined sx={{ fontSize: 14 }} />
      </span>
    </Tooltip>
  );
}

function EntitlementCard({ entitlement }: { entitlement: EntitlementRow }) {
  const router = useRouter();
  return (
    <div className="w-[288px] text-left">
      <div className="flex items-start gap-2.5 px-3.5 pb-3 pt-3.5">
        <span className="mt-0.5 shrink-0">
          <AppBadge app={entitlement.applicationName} size={22} variant="subtle" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-h5 leading-tight text-text-primary">{entitlement.name}</span>
          <span className="block truncate text-caption text-text-tertiary">{entitlement.applicationName}</span>
        </span>
        <button
          type="button"
          onClick={() => router.push(`/iga/directory/entitlements/${entitlement.id}`)}
          aria-label={`Open ${entitlement.name}`}
          title="Open entitlement"
          className="-mr-1 shrink-0 rounded-md p-1 text-icon transition-colors hover:bg-surface-hover hover:text-text-brand"
        >
          <OpenInNewOutlined sx={{ fontSize: 16 }} />
        </button>
      </div>
      <div className="border-t border-border-subtle px-3.5 py-3">
        <p className="text-caption text-text-tertiary">In the catalog now</p>
        <p className="mt-1.5 line-clamp-3 text-body-sm leading-5 text-text-primary">
          {entitlement.description}
        </p>
        <div className="mt-2.5 flex items-center gap-2">
          <span className="text-caption text-text-tertiary">Risk score</span>
          <RiskScoreChip score={entitlement.risk} />
        </div>
      </div>
    </div>
  );
}
