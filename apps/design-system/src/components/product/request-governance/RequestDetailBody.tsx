'use client';

import * as React from 'react';
import { Avatar, IdentityCell, StatusChip } from '@ds/components';
import { RiskScoreChip } from '@/components/product/directory';
import {
  ORIGIN_LABEL,
  RESOURCE_TYPE_LABEL,
  formatGovDateTime,
  type GovernanceRequest,
} from '@/data/request-governance';
import { ResourceTypeMark } from './labels';
import { RequestTimeline } from './RequestTimeline';
import { SlaTimer } from './SlaTimer';

/**
 * Who asked, for whom, for what — and how risky it is.
 *
 * Split out of `RequestDetailBody` so the detail page can show it as its Overview tab
 * while the drawer keeps all three parts stacked. The drawer is a peek: scrolling one
 * column is the right shape there, and tabs inside a drawer would be navigation inside
 * navigation.
 */
export function RequestSummary({
  row,
  hideSlaStatus = false,
}: {
  row: GovernanceRequest;
  /** The surface already shows the SLA status elsewhere — leave the clock, drop the chip. */
  hideSlaStatus?: boolean;
}) {
  const self = row.requester.id === row.target.id;
  return (
    <div className="space-y-8">
      <section className="rounded-md border border-border bg-surface p-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <div className="text-caption text-text-secondary">Requester</div>
            <div className="mt-2">
              <IdentityCell name={row.requester.name} email={row.requester.email} />
            </div>
            {row.requester.title && (
              <p className="mt-1 pl-[38px] text-caption text-text-tertiary">{row.requester.title}</p>
            )}
          </div>
          <div>
            <div className="text-caption text-text-secondary">Target user</div>
            <div className="mt-2">
              {self ? (
                <div className="flex items-center gap-2.5">
                  <Avatar name={row.target.name} size="s" />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-body-sm-strong text-text-primary">{row.target.name}</span>
                      <StatusChip intent="neutral" dot={false} label="Self" />
                    </div>
                    <div className="truncate text-caption text-text-secondary">{row.target.email}</div>
                  </div>
                </div>
              ) : (
                <IdentityCell name={row.target.name} email={row.target.email} />
              )}
            </div>
            {!self && row.target.title && (
              <p className="mt-1 pl-[38px] text-caption text-text-tertiary">{row.target.title}</p>
            )}
          </div>
        </div>
        <div className="mt-4 grid gap-4 border-t border-border pt-4 sm:grid-cols-2">
          <div>
            <div className="text-caption text-text-secondary">Requested resource</div>
            <div className="mt-2">
              <ResourceTypeMark type={row.resourceType} name={row.resourceName} appType={row.appType ?? row.appName} />
            </div>
            {row.resourceDetail && (
              <p className="mt-1 pl-[38px] text-caption text-text-secondary">{row.resourceDetail}</p>
            )}
            {row.appName && row.resourceType !== 'application' && (
              <p className="mt-0.5 pl-[38px] text-caption text-text-tertiary">{row.appName}</p>
            )}
          </div>
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <RiskScoreChip score={row.riskScore} />
              {row.sodConflict && <StatusChip intent="danger" label="SoD conflict" />}
            </div>
            {row.sodSummary && <p className="text-caption text-text-secondary">{row.sodSummary}</p>}
            <div className="text-caption text-text-secondary">
              Origin · {ORIGIN_LABEL[row.origin]}
              {/* En dash: the middot to its left labels a value, and the one inside the
                  timestamp binds its date to its time. A third meaning would be too many. */}
              <span className="text-text-tertiary"> – Submitted {formatGovDateTime(row.submittedAt)}</span>
            </div>
            <SlaTimer row={row} showStatus={!hideSlaStatus} />
          </div>
        </div>
      </section>

      {row.ticketRef && (
        <p className="text-body-sm text-text-secondary">
          Manual ticket {row.ticketRef} is open for the target IT app team.
        </p>
      )}
    </div>
  );
}

/** Summary then history, stacked — for the drawer, where one scrolling column is right. */
export function RequestDetailBody({ row }: { row: GovernanceRequest }) {
  return (
    <div className="space-y-8">
      <RequestSummary row={row} />
      {/* Headed here, unlike on the detail page, where the tab already names it. */}
      <section>
        <h2 className="text-body-strong text-text-primary">Timeline</h2>
        <p className="mt-1 text-caption text-text-secondary">
          Submission through provisioning, with everything that happened inside each stage.
        </p>
        <div className="mt-4">
          <RequestTimeline row={row} />
        </div>
      </section>
    </div>
  );
}

export function requestSubtitle(row: GovernanceRequest): string {
  return `${RESOURCE_TYPE_LABEL[row.resourceType]} · ${row.resourceName}`;
}
