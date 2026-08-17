'use client';

import * as React from 'react';
import TaskAlt from '@mui/icons-material/TaskAlt';
import KeyboardArrowDown from '@mui/icons-material/KeyboardArrowDown';
import { Avatar, Drawer, InfoRow, InfoRowGroup, StatusChip, Tabs, type TabItem } from '@ds/components';
import { AppBadge } from '../sod/labels';
import { RiskScoreChip, infoIcon } from '../directory';
import { IdentityTip } from '../directory/IdentityTip';
import { EntitlementTip } from '../directory/EntitlementTip';
import { formatDateTime } from '../sod/labels';
import { ACTOR_TYPE_LABEL, type AuditEntry } from '@/data/audit-logs';
import { listEntitlementRows, listUserIdentities } from '@/data/directory';

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

  // Above the `!entry` guard: hooks must run in the same order on every render,
  // and the drawer renders once with no entry before one is chosen.
  //
  // The log records an address, not an identity id, because an actor may not be
  // a governed identity at all (a service account, someone since deleted). So
  // this is a lookup that is allowed to fail, and the UI degrades when it does.
  const actorEmail = entry?.actor;
  const identity = React.useMemo(
    () =>
      !actorEmail || actorEmail === 'system'
        ? undefined
        : listUserIdentities().find((u) => u.email === actorEmail),
    [actorEmail],
  );

  // Matched on name and application, not id: the log stores its own uuid for the
  // target, and an audit trail outlives the catalog — an entitlement named here
  // may since have been renamed or retired. Unresolved is a normal outcome.
  const targetName = entry?.targetKind === 'item' ? entry.target : undefined;
  const targetApp = entry?.application;
  const targetEntitlement = React.useMemo(
    () =>
      !targetName
        ? undefined
        : listEntitlementRows().find(
            (e) => e.name === targetName && e.applicationName === targetApp,
          ),
    [targetName, targetApp],
  );

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
              label="Actor (initiated by)"
              valueWrap
              value={
                system ? (
                  <span className="text-text-tertiary">System</span>
                ) : (
                  <span className="flex min-w-0 items-center gap-2">
                    <Avatar name={entry.actor} size="xs" shape="circle" />
                    <span className="min-w-0 truncate">{entry.actor}</span>
                    {/* The row names an address; the icon answers the follow-up —
                        *which* person is that, and should their access worry me —
                        without leaving the event. Same affordance the account
                        panels use, and it carries its own way out to the identity
                        page, so reading and navigating stay separate decisions.
                        Absent when the address is not a governed identity: an
                        icon that opens nothing is worse than none. */}
                    {identity && <IdentityTip identity={identity} />}
                  </span>
                )
              }
            />
            <InfoRow
              className={ROW}
              icon={infoIcon.trigger}
              label="Actor type"
              value={ACTOR_TYPE_LABEL[entry.actorType]}
            />
            <InfoRow className={ROW} icon={infoIcon.discovery} label="IP address" value={entry.source} />
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
              valueWrap
              value={
                <span className="flex min-w-0 items-center gap-2">
                  {/* The name is a value, not a control. Making it the toggle put
                      the brand colour and an underline on the one thing in the row
                      the reader came to read, and promised navigation it never
                      delivered — the same name on the Actor tab is plain text, and
                      these two rows do the same job. The disclosure moved to its
                      own link on the right, where it reads as an action. */}
                  <span className="min-w-0 truncate">{entry.target}</span>
                  {/* Two different questions, two different controls: this opens
                      what the entitlement is in the catalog *now*, the link opens
                      what was recorded *then*. Absent when the item is not in the
                      catalog — an audit log outlives the things it describes. */}
                  {targetEntitlement && <EntitlementTip entitlement={targetEntitlement} />}
                  {/* "State at the time", not "View details".

                      Time is the only thing separating this from the ⓘ beside it,
                      which shows the same four fields as they are now — so a label
                      reading "details" described both controls and distinguished
                      neither, leaving the reader to click one and find out. Naming
                      the time also gives the panel a reason to exist: a risk score
                      of 53 at approval and 91 today is the finding, and it is
                      invisible unless the reader knows which one they are looking
                      at. It rhymes with the panel's own "As recorded on …" header.

                      The label holds still and the chevron carries open/closed —
                      the accordion convention. A View/Hide swap would have to
                      become "Hide state at the time", and the row's only fixed
                      point would change width every time it was clicked.

                      `ml-auto` rather than a justify-between wrapper: the name has
                      to keep its truncation, so it stays the flexible child and
                      this gets pushed off its end. */}
                  <button
                    type="button"
                    onClick={() => setTargetOpen((v) => !v)}
                    aria-expanded={targetOpen}
                    aria-controls={SNAPSHOT_ID}
                    className="group ml-auto inline-flex shrink-0 items-center gap-0.5 whitespace-nowrap rounded-sm text-body-sm-strong text-text-link focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-subtle"
                  >
                    {/* Underline on the label, not the button: text-decoration on
                        the button draws a rule under the chevron too. */}
                    <span className="group-hover:underline">State at the time</span>
                    <KeyboardArrowDown
                      sx={{ fontSize: 16 }}
                      className={`shrink-0 transition-transform ${targetOpen ? 'rotate-180' : ''}`}
                    />
                  </button>
                </span>
              }
            />
            {targetOpen && (
              // Spans both grid columns so it reads as a drawer under the row
              // rather than a value in it.
              <div
                id={SNAPSHOT_ID}
                className="col-span-2 border-b border-border bg-subtle px-4 py-3.5 last:border-b-0"
              >
                <p className="text-caption text-text-tertiary">
                  As recorded on {formatDateTime(entry.at)}
                </p>
                {/* No description here: the panel's job is the state that can
                    have changed since — risk, type, status. What the entitlement
                    *is* comes from the catalog card on the info icon beside the
                    row, where it is current. */}
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
 * Ties the "State at the time" link to the panel it opens for assistive tech.
 *
 * A constant is safe here because only one entry is open at a time — the drawer
 * renders a single event, so there is never a second panel to collide with.
 */
const SNAPSHOT_ID = 'audit-target-snapshot';

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
