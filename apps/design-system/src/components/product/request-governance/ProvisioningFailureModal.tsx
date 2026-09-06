'use client';

import * as React from 'react';
import ErrorOutline from '@mui/icons-material/ErrorOutline';
import { Button, FileAttachmentField, Modal, Select, Switch, type FileAttachment } from '@ds/components';
import { formatGovDateTime, type GovernanceRequest, type TicketSystem } from '@/data/request-governance';

type Remedy = 'retry' | 'ticket' | 'complete';

export function ProvisioningFailureModal({
  row,
  open,
  onClose,
  onAutoEscalate,
  onRetry,
  onConvertTicket,
  onMarkComplete,
}: {
  row: GovernanceRequest | null;
  open: boolean;
  onClose: () => void;
  onAutoEscalate: (enabled: boolean) => void;
  onRetry: () => void;
  onConvertTicket: (system: TicketSystem) => void;
  onMarkComplete: (proof: FileAttachment[]) => void;
}) {
  const [remedy, setRemedy] = React.useState<Remedy>('retry');
  const [system, setSystem] = React.useState<TicketSystem>('jira');
  const [proof, setProof] = React.useState<FileAttachment[]>([]);

  React.useEffect(() => {
    if (open) {
      setRemedy('retry');
      setSystem('jira');
      setProof([]);
    }
  }, [open, row?.id]);

  const failure = row?.failure;
  const canComplete = proof.some((f) => !f.status || f.status === 'success');

  const confirm = () => {
    if (remedy === 'retry') onRetry();
    else if (remedy === 'ticket') onConvertTicket(system);
    else if (canComplete) onMarkComplete(proof.filter((f) => !f.status || f.status === 'success'));
  };

  const confirmLabel =
    remedy === 'retry' ? 'Retry provisioning' : remedy === 'ticket' ? 'Create ticket' : 'Mark completed';

  return (
    <Modal
      open={open}
      onClose={onClose}
      width={640}
      title="Provisioning failed"
      subtitle={row ? `${row.reference} · ${row.resourceName}` : undefined}
      icon={<ErrorOutline sx={{ fontSize: 20 }} />}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={confirm} disabled={remedy === 'complete' && !canComplete}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      {row && failure && (
        <div className="space-y-5">
          <div className="flex items-start gap-2 rounded-md border border-[var(--ds-color-status-danger-border)] bg-[var(--ds-color-status-danger-subtle)] px-3 py-2.5">
            <ErrorOutline
              sx={{ fontSize: 18, color: 'var(--ds-color-status-danger-fg)', marginTop: '1px' }}
              aria-hidden
            />
            <div className="min-w-0">
              <p className="text-body-sm-strong text-[var(--ds-color-status-danger-fg)]">
                {failure.connector} {failure.httpStatus} · {failure.code}
              </p>
              <p className="mt-0.5 text-caption text-[var(--ds-color-status-danger-fg)]">{failure.message}</p>
              <p className="mt-1 text-caption text-text-secondary">
                {failure.target} · {formatGovDateTime(failure.occurredAt)}
              </p>
            </div>
          </div>

          <pre className="ds-scroll max-h-36 overflow-auto rounded-md border border-border bg-subtle px-3 py-2.5 font-mono text-caption leading-5 text-text-secondary">
            {failure.payload}
          </pre>

          <label className="flex items-start justify-between gap-4 rounded-md border border-border bg-surface px-3 py-3">
            <span className="min-w-0">
              <span className="block text-body-sm-strong text-text-primary">Auto-alert reviewer and requester</span>
              <span className="mt-0.5 block text-caption text-text-secondary">
                Sends a human-readable status update when this exception changes.
              </span>
            </span>
            <Switch
              checked={row.autoEscalate}
              onChange={(e) => onAutoEscalate(e.target.checked)}
              inputProps={{ 'aria-label': 'Auto-alert reviewer and requester' }}
            />
          </label>

          <div>
            <h3 className="text-body-sm-strong text-text-primary">Remediation</h3>
            <p className="mt-1 text-caption text-text-secondary">Pick one path. Only that action runs.</p>
            <div className="mt-3 space-y-2">
              <RemedyCard
                selected={remedy === 'retry'}
                onSelect={() => setRemedy('retry')}
                title="Retry API provisioning"
                description="Re-triggers the SCIM or webhook connector with the same payload."
              />
              <RemedyCard
                selected={remedy === 'ticket'}
                onSelect={() => setRemedy('ticket')}
                title="Convert to manual ticket"
                description="Opens a pre-filled ticket for the target IT app team."
              />
              <RemedyCard
                selected={remedy === 'complete'}
                onSelect={() => setRemedy('complete')}
                title="Mark as manually completed"
                description="Upload a screenshot or proof and close the request cleanly."
              />
            </div>
          </div>

          {remedy === 'ticket' && (
            <Select
              label="Ticketing system"
              value={system}
              onChange={(v) => setSystem(v as TicketSystem)}
              options={[
                { value: 'jira', label: 'Jira' },
                { value: 'servicenow', label: 'ServiceNow' },
              ]}
            />
          )}

          {remedy === 'complete' && (
            <FileAttachmentField
              label="Proof"
              hint="Screenshot, email, or ticket confirmation that the access was granted outside the connector."
              files={proof}
              onChange={(files) => {
                setProof(files);
              }}
            />
          )}
        </div>
      )}
    </Modal>
  );
}

function RemedyCard({
  selected,
  onSelect,
  title,
  description,
}: {
  selected: boolean;
  onSelect: () => void;
  title: string;
  description: string;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={[
        'w-full rounded-md border px-3 py-2.5 text-left transition-colors',
        selected
          ? 'border-brand bg-surface text-text-primary'
          : 'border-border bg-surface text-text-primary hover:border-border-strong',
      ].join(' ')}
    >
      <div className="text-body-sm-strong">{title}</div>
      <p className="mt-0.5 text-caption text-text-secondary">{description}</p>
    </button>
  );
}
