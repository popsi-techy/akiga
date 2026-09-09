'use client';

import * as React from 'react';
import AccountTree from '@mui/icons-material/AccountTree';
import Flag from '@mui/icons-material/Flag';
import Person from '@mui/icons-material/Person';
import Shield from '@mui/icons-material/Shield';
import { Card, InfoRow, InfoRowGroup, StatusChip } from '@ds/components';
import { RiskScoreChip, infoIcon } from '@/components/product/directory';
import {
  ORIGIN_LABEL,
  RESOURCE_TYPE_LABEL,
  formatGovDateTime,
  type GovernanceRequest,
} from '@/data/request-governance';
import { RequestTimeline } from './RequestTimeline';
import { SlaTimer } from './SlaTimer';

/**
 * The request as one screen: where it is, then what it is.
 *
 * Tabs hid one of those answers behind the other. The left column is the
 * workflow — the same timeline the old Timeline tab owned. The right column
 * is the Emergency Access overview pattern: framed Cards of InfoRows, so a
 * reader who already knows this product finds the facts the same way.
 */
export function RequestDetailSplit({ row }: { row: GovernanceRequest }) {
  const self = row.requester.id === row.target.id;

  return (
    <div className="grid h-full min-h-0 flex-1 gap-5 lg:grid-cols-[minmax(0,1.15fr)_minmax(280px,360px)]">
      <Card title="Workflow" icon={<AccountTree />} padding="none" className="min-h-[280px] lg:h-full lg:min-h-0">
        <div className="ds-scroll -mx-4 h-full min-h-0 overflow-y-auto px-4 py-4">
          <RequestTimeline row={row} />
        </div>
      </Card>

      <div className="ds-scroll min-h-0 space-y-5 overflow-y-auto lg:h-full">
        <Card title="Requester" icon={<Person />} padding="none">
          <InfoRowGroup>
            <InfoRow icon={infoIcon.person} label="Name" value={row.requester.name} />
            <InfoRow icon={infoIcon.email} label="Email" value={row.requester.email} />
            {row.requester.title && (
              <InfoRow icon={infoIcon.jobTitle} label="Title" value={row.requester.title} />
            )}
          </InfoRowGroup>
        </Card>

        <Card title="Target user" icon={<Person />} padding="none">
          <InfoRowGroup>
            <InfoRow
              icon={infoIcon.person}
              label="Name"
              value={
                self ? (
                  <span className="inline-flex min-w-0 items-center gap-2">
                    <span className="truncate">{row.target.name}</span>
                    <StatusChip intent="neutral" dot={false} label="Self" />
                  </span>
                ) : (
                  row.target.name
                )
              }
              valueWrap={self}
            />
            <InfoRow icon={infoIcon.email} label="Email" value={row.target.email} />
            {row.target.title && <InfoRow icon={infoIcon.jobTitle} label="Title" value={row.target.title} />}
          </InfoRowGroup>
        </Card>

        <Card title="Requested resource" icon={<Shield />} padding="none">
          <InfoRowGroup>
            <InfoRow icon={infoIcon.type} label="Type" value={RESOURCE_TYPE_LABEL[row.resourceType]} />
            <InfoRow
              icon={
                row.resourceType === 'application'
                  ? infoIcon.application
                  : row.resourceType === 'role'
                    ? infoIcon.technicalRole
                    : infoIcon.entitlement
              }
              label="Resource"
              value={row.resourceName}
            />
            {row.resourceDetail && (
              <InfoRow icon={infoIcon.item} label="About" value={row.resourceDetail} valueWrap />
            )}
            {row.appName && row.resourceType !== 'application' && (
              <InfoRow icon={infoIcon.application} label="Application" value={row.appName} />
            )}
          </InfoRowGroup>
        </Card>

        <Card title="Risk & SLA" icon={<Flag />} padding="none">
          <InfoRowGroup>
            <InfoRow
              icon={infoIcon.risk}
              label="Risk"
              value={
                <span className="inline-flex flex-wrap items-center gap-2">
                  <RiskScoreChip score={row.riskScore} />
                  {row.sodConflict && <StatusChip intent="danger" label="SoD conflict" />}
                </span>
              }
              valueWrap
            />
            {row.sodSummary && (
              <InfoRow icon={infoIcon.policy} label="Conflict" value={row.sodSummary} valueWrap />
            )}
            <InfoRow icon={infoIcon.discovery} label="Origin" value={ORIGIN_LABEL[row.origin]} />
            <InfoRow
              icon={infoIcon.submitted}
              label="Submitted"
              value={formatGovDateTime(row.submittedAt)}
            />
            <InfoRow
              icon={infoIcon.duration}
              label="SLA"
              value={<SlaTimer row={row} showStatus={false} />}
              valueWrap
            />
            {row.ticketRef && (
              <InfoRow icon={infoIcon.item} label="Ticket" value={row.ticketRef} />
            )}
          </InfoRowGroup>
        </Card>
      </div>
    </div>
  );
}
