'use client';

import * as React from 'react';
import { Dialog, Input, Select } from '@ds/components';
import {
  GOVERNANCE_REVIEWERS,
  currentApproverOf,
  type GovernanceRequest,
  type NudgeChannel,
} from '@/data/request-governance';

export function NudgeDialog({
  row,
  open,
  onClose,
  onConfirm,
}: {
  row: GovernanceRequest | null;
  open: boolean;
  onClose: () => void;
  onConfirm: (channel: NudgeChannel) => void;
}) {
  const [channel, setChannel] = React.useState<NudgeChannel>('slack');
  React.useEffect(() => {
    if (open) setChannel('slack');
  }, [open]);
  const who = row ? currentApproverOf(row) : undefined;
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Nudge approver"
      confirmLabel="Send nudge"
      onConfirm={() => onConfirm(channel)}
    >
      <p>
        Sends a reminder to {who?.name ?? 'the active approver'} that {row?.reference} is waiting.
      </p>
      <div className="mt-4">
        <Select
          label="Channel"
          value={channel}
          onChange={(v) => setChannel(v as NudgeChannel)}
          options={[
            { value: 'slack', label: 'Slack' },
            { value: 'teams', label: 'Teams' },
            { value: 'email', label: 'Email' },
          ]}
        />
      </div>
    </Dialog>
  );
}

export function ReassignDialog({
  row,
  open,
  onClose,
  onConfirm,
}: {
  row: GovernanceRequest | null;
  open: boolean;
  onClose: () => void;
  onConfirm: (reviewerId: string, reason: string) => void;
}) {
  const who = row ? currentApproverOf(row) : undefined;
  const options = GOVERNANCE_REVIEWERS.filter((r) => r.id !== who?.id);
  const [reviewerId, setReviewerId] = React.useState(options[0]?.id ?? '');
  const [reason, setReason] = React.useState('');
  React.useEffect(() => {
    if (open) {
      setReviewerId(options[0]?.id ?? '');
      setReason('');
    }
  }, [open, who?.id]);

  const ready = reason.trim().length >= 8 && Boolean(reviewerId);
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Reassign approver"
      confirmLabel="Reassign"
      onConfirm={() => ready && onConfirm(reviewerId, reason)}
    >
      <p>
        Moves the current hop from {who?.name ?? 'the active approver'} to another reviewer. The
        reason is written to the audit trail.
      </p>
      <div className="mt-4 space-y-3">
        <Select
          label="New reviewer"
          value={reviewerId}
          onChange={setReviewerId}
          options={options.map((r) => ({
            value: r.id,
            label: r.title ? `${r.name} · ${r.title}` : r.name,
          }))}
        />
        <Input
          label="Justification"
          required
          multiline
          minRows={3}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Why this reviewer, and why now"
        />
      </div>
    </Dialog>
  );
}

export function ForceApproveDialog({
  row,
  open,
  onClose,
  onConfirm,
}: {
  row: GovernanceRequest | null;
  open: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
}) {
  const [reason, setReason] = React.useState('');
  React.useEffect(() => {
    if (open) setReason('');
  }, [open]);
  const ready = reason.trim().length >= 12;
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Force approve"
      confirmLabel="Override and approve"
      onConfirm={() => ready && onConfirm(reason)}
    >
      <p>
        Skips remaining approval hops on {row?.reference} and sends the request to provisioning.
        This is an admin override — the reason is mandatory and audited.
      </p>
      <div className="mt-4">
        <Input
          label="Override reason"
          required
          multiline
          minRows={3}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Why this request must move now"
          error={reason.length > 0 && !ready ? 'At least 12 characters' : undefined}
        />
      </div>
    </Dialog>
  );
}
