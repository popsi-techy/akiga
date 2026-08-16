'use client';

import * as React from 'react';
import TaskAlt from '@mui/icons-material/TaskAlt';
import KeyboardArrowDown from '@mui/icons-material/KeyboardArrowDown';
import { Avatar, Drawer, InfoRow, InfoRowGroup, StatusChip, Tabs, type TabItem } from '@ds/components';
import { AppBadge } from '../sod/labels';
import { RiskScoreChip, infoIcon } from '../directory';
import { formatDateTime } from '../sod/labels';
import type { AuditEntry } from '@/data/audit-logs';

const TABS: TabItem[] = [
  { value: 'event', label: 'Event' },
  { value: 'actor', label: 'Actor' },
  { value: 'target', label: 'Target' },
];

/**
 * One audit event, in full.
 *
 * Three tabs, one per question an audit record answers — *what happened, who did
 * it, and what it was done to* — because stacking twenty rows in one column makes
 * the reader do that grouping themselves.
 *
 * The target's state at the time is nested under the target, not given a tab of
 * its own. Four preserved fields are not a fourth question; detached from the
 * thing they describe they read as duplicated data, and a snapshot only means
 * something next to the object it is a snapshot *of*.
 *
 * Each tab's fields sit in a bordered box: the tab strip needs something to hand
 * off to, and without it the rows float against the drawer wall.
 */
export function AuditEntryDrawer({
  entry,
  open,
  onClose,
}: {
  entry: AuditEntry | null;
  open: boolean;
  onClose: () => void;
}) {
  const [tab, setTab] = React.useState('event');
  const [targetOpen, setTargetOpen] = React.useState(false);

  // A new event opens on its own terms, not on the tab left over from the last.
  React.useEffect(() => {
    if (open) {
      setTab('event');
      setTargetOpen(false);
    }
  }, [open, entry?.id]);

  if (!entry) return null;

  const system = entry.actor === 'system';

  return (
    <Drawer
      open={open}
      onClose={onClose}
      icon={<TaskAlt sx={{ fontSize: 22 }} />}
      title={entry.task}
      subtitle={`${entry.target} · ${formatDateTime(entry.at)}`}
      width={560}
    >
      <div className="space-y-4">
        <Tabs items={TABS} value={tab} onChange={setTab} />

        {tab === 'event' && (
          <Fields>
            {/* First row, because it is the answer the reader came for: did the
                thing work? Everything under it explains what the thing was. */}
            <InfoRow
              className={ROW}
              icon={infoIcon.status}
              label="Result"
              value={
                entry.outcome === 'success' ? (
                  <StatusChip intent="success" label="Success" />
                ) : (
                  <StatusChip intent="danger" label="Failed" />
                )
              }
            />
            <InfoRow className={ROW} icon={infoIcon.type} label="Event" value={entry.task} />
            <InfoRow className={ROW} icon={infoIcon.steps} label="What happened" valueWrap value={entry.description} />
            <InfoRow className={ROW} icon={infoIcon.completed} label="When" value={formatDateTime(entry.at)} />
            {/* Last, and wrapped: nobody reads it, but support asks for it. */}
            <InfoRow className={ROW} icon={infoIcon.item} label="Event ID" valueWrap value={<Mono>{entry.eventId}</Mono>} />
          </Fields>
        )}

        {tab === 'actor' && (
          <Fields>
            <InfoRow
              className={ROW}
              icon={infoIcon.person}
              label="Actor"
              valueWrap
              value={
                system ? (
                  <span className="text-text-tertiary">System</span>
                ) : (
                  <span className="flex min-w-0 items-center gap-2">
                    <Avatar name={entry.actor} size="xs" shape="circle" />
                    <span className="min-w-0 truncate">{entry.actor}</span>
                  </span>
                )
              }
            />
            <InfoRow
              className={ROW}
              icon={infoIcon.trigger}
              label="Acted as"
              value={system ? 'The platform, once approvals landed' : 'A signed-in user'}
            />
            <InfoRow className={ROW} icon={infoIcon.discovery} label="Source IP" value={entry.source} />
            <InfoRow className={ROW} icon={infoIcon.status} label="Actor ID" valueWrap value={<Mono>{entry.actorId}</Mono>} />
          </Fields>
        )}

        {tab === 'target' && (
          <Fields>
            {/* The target's own state is nested under it, not listed beside the
                event's fields: it describes a different object, and inlining it
                keeps the reader from holding "which of these is the item and
                which is the event" in their head. */}
            <InfoRow
              className={ROW}
              icon={entry.targetKind === 'request' ? infoIcon.item : infoIcon.entitlement}
              label="Performed on"
              value={
                <button
                  type="button"
                  onClick={() => setTargetOpen((v) => !v)}
                  aria-expanded={targetOpen}
                  className="inline-flex items-center gap-1 text-body-sm-strong text-text-brand hover:underline"
                >
                  {entry.target}
                  <KeyboardArrowDown
                    sx={{ fontSize: 16 }}
                    className={`transition-transform ${targetOpen ? 'rotate-180' : ''}`}
                  />
                </button>
              }
            />
            {targetOpen && (
              // Spans both grid columns so it reads as a drawer under the row
              // rather than a value in it.
              <div className="col-span-2 border-b border-border bg-subtle px-4 py-3.5 last:border-b-0">
                <p className="text-caption text-text-tertiary">
                  As recorded on {formatDateTime(entry.at)}
                </p>
                <p className="mt-1.5 text-body-sm leading-5 text-text-primary">{entry.targetDescription}</p>
                <dl className="mt-3 grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-2">
                  <dt className="text-caption text-text-tertiary">Risk score</dt>
                  <dd>
                    <RiskScoreChip score={entry.snapshot.riskScore} />
                  </dd>
                  <dt className="text-caption text-text-tertiary">Type</dt>
                  <dd className="text-body-sm-strong text-text-primary">
                    {entry.targetKind === 'request'
                      ? 'Access request'
                      : TYPE_LABEL[entry.snapshot.entitlementType]}
                  </dd>
                  <dt className="text-caption text-text-tertiary">Status</dt>
                  <dd>
                    {entry.snapshot.status === 'ACTIVE' ? (
                      <StatusChip intent="success" label="Active" />
                    ) : (
                      <StatusChip intent="neutral" label="Inactive" />
                    )}
                  </dd>
                  <dt className="text-caption text-text-tertiary">Requestable</dt>
                  <dd className="text-body-sm-strong text-text-primary">
                    {entry.snapshot.requestable ? 'Yes' : <span className="text-text-tertiary">No</span>}
                  </dd>
                </dl>
              </div>
            )}
            <InfoRow
              className={ROW}
              icon={infoIcon.type}
              label="Type"
              value={entry.targetKind === 'request' ? 'Access request' : 'Access item'}
            />
            <InfoRow
              className={ROW}
              icon={infoIcon.application}
              label="Application"
              valueWrap
              value={
                <span className="flex min-w-0 items-center gap-2">
                  <AppBadge app={entry.application} size={18} variant="subtle" />
                  <span className="min-w-0 truncate">{entry.application}</span>
                </span>
              }
            />
            <InfoRow className={ROW} icon={infoIcon.submitted} label="Request" value={entry.requestId} />
            <InfoRow
              className={ROW}
              icon={infoIcon.outcome}
              label="Decision"
              value={
                entry.decision === 'NOT_APPLICABLE' ? (
                  <span className="text-text-tertiary">Not applicable</span>
                ) : entry.decision === 'APPROVED' ? (
                  <StatusChip intent="success" label="Approved" />
                ) : entry.decision === 'REJECTED' ? (
                  <StatusChip intent="danger" label="Rejected" />
                ) : (
                  <StatusChip intent="warning" label="Pending" />
                )
              }
            />
            <InfoRow
              className={ROW}
              icon={infoIcon.reviewer}
              label="Decided by"
              valueWrap
              value={entry.decidedBy === 'WORKFLOW' ? 'An approval policy' : entry.decidedBy}
            />
            <InfoRow className={ROW} icon={infoIcon.policy} label="Approval policy" valueWrap value={<Mono>{entry.approvalPolicy}</Mono>} />
            <InfoRow className={ROW} icon={infoIcon.status} label="Target ID" valueWrap value={<Mono>{entry.targetId}</Mono>} />
            <InfoRow className={ROW} icon={infoIcon.status} label="Request ID" valueWrap value={<Mono>{entry.requestUuid}</Mono>} />
          </Fields>
        )}

      </div>
    </Drawer>
  );
}

/** Row gutter. Named once so all four tabs share it and cannot drift apart. */
const ROW = 'px-4';

/**
 * The bordered box each tab's fields sit in.
 *
 * Without it the rows float against the drawer wall and the tab strip has nothing
 * to hand off to. `overflow-hidden` so the first and last row's dividers stop at
 * the radius instead of cutting the corner.
 */
function Fields({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-lg border border-border">
      <InfoRowGroup>{children}</InfoRowGroup>
    </div>
  );
}

const TYPE_LABEL: Record<AuditEntry['snapshot']['entitlementType'], string> = {
  PERMISSION: 'Permission',
  ROLE: 'Role',
  GROUP: 'Group',
};

/**
 * Machine ids, set in a monospace so a mistyped character is visible and the
 * value is obviously not prose. `break-all` because a uuid has no break points.
 */
function Mono({ children }: { children: React.ReactNode }) {
  return <span className="break-all font-mono text-caption text-text-secondary">{children}</span>;
}
