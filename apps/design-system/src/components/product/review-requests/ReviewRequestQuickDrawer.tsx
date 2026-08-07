'use client';

import * as React from 'react';
import Link from 'next/link';
import AssignmentOutlined from '@mui/icons-material/AssignmentOutlined';
import ArrowForwardOutlined from '@mui/icons-material/ArrowForwardOutlined';
import { Button, Drawer, InfoRow, InfoRowGroup, Input, Select, useToast } from '@ds/components';
import type { AccessRequest } from '@/data/access-request-types';
import {
  accessDurationLabel,
  decideReviewRequest,
  formatRequestDate,
  formatRequestDateTime,
} from '@/data/access-requests';
import {
  RequestStatusChip,
  RequestTypeChip,
  recommendationIntent,
  recommendationTitle,
} from './labels';

export function ReviewRequestQuickDrawer({
  request,
  open,
  initialDecision,
  onClose,
  onDecided,
}: {
  request: AccessRequest | null;
  open: boolean;
  initialDecision: 'approved' | 'rejected' | null;
  onClose: () => void;
  onDecided: () => void;
}) {
  const toast = useToast();
  const [decision, setDecision] = React.useState<'approved' | 'rejected'>('approved');
  const [justification, setJustification] = React.useState('');

  React.useEffect(() => {
    if (open && request) {
      setDecision(initialDecision ?? (request.recommendation === 'reject' ? 'rejected' : 'approved'));
      setJustification('');
    }
  }, [open, request, initialDecision]);

  const save = () => {
    if (!request) return;
    if (justification.trim().length < 10) {
      toast.error('Add a justification of at least 10 characters');
      return;
    }
    const updated = decideReviewRequest(request.id, decision, justification.trim());
    if (!updated) return;
    toast.success(decision === 'approved' ? 'Request approved' : 'Request rejected');
    onDecided();
    onClose();
  };

  if (!request) return null;

  const recIntent = recommendationIntent(request.recommendation);
  const durationText =
    request.accessDurationKind === 'temporary' && request.accessDurationUntil
      ? `Temporary (until ${formatRequestDate(request.accessDurationUntil)})`
      : request.accessDurationKind === 'permanent'
        ? 'Permanent'
        : 'Temporary';

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={`${request.reference} Request details`}
      subtitle="Quick review — save here or open the full detail page."
      icon={<AssignmentOutlined sx={{ fontSize: 22, color: 'var(--ds-color-brand-primary)' }} />}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={save}>Save</Button>
        </>
      }
    >
      <div className="space-y-5">
        <InfoRowGroup>
          <InfoRow label="Request type" value={<RequestTypeChip type={request.type} />} />
          <InfoRow label="Requested item" value={request.itemName} />
          <InfoRow label="Access duration" value={durationText} />
          <InfoRow label="Requested for" value={request.requestedForName} />
          <InfoRow label="Requested by" value={request.requestedByName} />
          <InfoRow label="Submitted on" value={formatRequestDateTime(request.submittedAt)} />
          <InfoRow label="Status" value={<RequestStatusChip status={request.status} />} />
        </InfoRowGroup>

        <div
          className={[
            'rounded-lg border px-4 py-3',
            recIntent === 'success'
              ? 'border-[var(--ds-color-status-success-border)] bg-[var(--ds-color-status-success-subtle)]'
              : recIntent === 'danger'
                ? 'border-[var(--ds-color-status-danger-border)] bg-[var(--ds-color-status-danger-subtle)]'
                : 'border-[var(--ds-color-status-warning-border)] bg-[var(--ds-color-status-warning-subtle)]',
          ].join(' ')}
        >
          <div
            className={[
              'text-body-sm font-semibold',
              recIntent === 'success'
                ? 'text-[var(--ds-color-status-success-fg)]'
                : recIntent === 'danger'
                  ? 'text-[var(--ds-color-status-danger-fg)]'
                  : 'text-[var(--ds-color-status-warning-fg)]',
            ].join(' ')}
          >
            {recommendationTitle(request.recommendation)}
          </div>
          <p className="mt-1 text-caption leading-relaxed text-text-secondary">{request.recommendationSummary}</p>
        </div>

        <Link
          href={`/iga/reviewer/review-requests/${request.id}`}
          className="inline-flex items-center gap-1 text-body-sm font-medium text-brand hover:underline"
        >
          View detailed information
          <ArrowForwardOutlined sx={{ fontSize: 16 }} />
        </Link>

        <div className="space-y-4 border-t border-border pt-5">
          <Select
            label="Decision"
            size="sm"
            value={decision}
            onChange={(v) => setDecision(v as 'approved' | 'rejected')}
            options={[
              { value: 'approved', label: 'Approve' },
              { value: 'rejected', label: 'Reject' },
            ]}
          />
          <Input
            label="Justification"
            size="sm"
            multiline
            minRows={3}
            value={justification}
            onChange={(e) => setJustification(e.target.value)}
            placeholder="Explain your decision for the audit record"
          />
        </div>
      </div>
    </Drawer>
  );
}

export default ReviewRequestQuickDrawer;
