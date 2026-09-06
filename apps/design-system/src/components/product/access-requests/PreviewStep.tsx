'use client';

import * as React from 'react';
import Description from '@mui/icons-material/Description';
import {
  Button,
  DataTable,
  FileAttachmentField,
  Input,
  OverflowChips,
  Select,
  StatusChip,
  useToast,
  type Column,
} from '@ds/components';
import { EntityAvatar, RiskScoreChip } from '@/components/product/directory';
import type { AccessRequest, AccessRequestItem } from '@/data/access-request-types';
import { requestItems, updateAccessRequest } from '@/data/access-requests';
import { RequestTypeChip } from '@/components/product/review-requests/labels';

const JUSTIFICATION_TEMPLATES = [
  {
    value: 'project',
    label: 'Project work',
    text: 'I need this access to complete assigned project work.',
  },
  {
    value: 'role-change',
    label: 'Role or team change',
    text: 'My role or team has changed and I now need this access to perform my duties.',
  },
  {
    value: 'coverage',
    label: 'Covering an absence',
    text: 'I am covering for a colleague who is away and need this access until they return.',
  },
];

export function PreviewStep({ request }: { request: AccessRequest }) {
  const items = requestItems(request);

  const columns: Column<AccessRequestItem & { id: string }>[] = [
    {
      id: 'name',
      header: 'Name',
      sortable: true,
      wrap: true,
      value: (r) => r.entitlementName,
      render: (r) => (
        <div className="flex min-w-0 items-center gap-2.5">
          <EntityAvatar kind="entitlement" name={r.entitlementName} />
          <div className="min-w-0">
            <div className="truncate text-body-sm-strong text-text-primary">{r.entitlementName}</div>
            <div className="truncate text-caption text-text-secondary">{r.applicationName}</div>
          </div>
        </div>
      ),
    },
    {
      id: 'type',
      header: 'Type',
      render: () => <RequestTypeChip type="entitlement" />,
    },
    {
      id: 'risk',
      header: 'Risk',
      sortable: true,
      value: (r) => r.risk ?? 0,
      render: (r) => (r.risk != null ? <RiskScoreChip score={r.risk} /> : <span className="text-text-secondary">—</span>),
    },
    {
      id: 'duration',
      header: 'Access period',
      render: (r) => (
        <StatusChip intent="neutral" label={r.accessDurationKind === 'permanent' ? 'Permanent' : 'Temporary'} />
      ),
    },
  ];

  return (
    <div className="min-h-0 min-w-0">
      <div className="mb-5">
        <h2 className="text-h3 text-text-primary">Preview & Submit</h2>
        <p className="mt-1 text-body text-text-secondary">
          Review your selections before submitting the access request.
        </p>
      </div>
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="text-h5 text-text-primary">Requested entitlements</h3>
        {items.length > 0 && (
          <OverflowChips items={items.map((i) => ({ id: i.entitlementId, name: i.entitlementName }))} max={2} />
        )}
      </div>
      <DataTable<AccessRequestItem & { id: string }>
        columns={columns}
        rows={items.map((r) => ({ ...r, id: r.entitlementId }))}
        emptyTitle="No entitlements selected"
        emptyMessage="Go back and add at least one entitlement to submit this request."
      />
    </div>
  );
}

/**
 * Justification rail for the preview step. Docked to the right of the wizard —
 * under the header rule, down to the viewport bottom — so the form is a
 * page column, not a short card beside the table.
 */
export function PreviewJustificationDock({
  request,
  onChange,
  onSubmit,
  submitting,
  readOnly,
}: {
  request: AccessRequest;
  onChange: (next: AccessRequest) => void;
  onSubmit?: () => void;
  submitting?: boolean;
  readOnly?: boolean;
}) {
  const toast = useToast();
  const items = requestItems(request);
  const justificationOk = request.businessJustification.replace(/<[^>]*>/g, '').trim().length >= 10;
  const attachments = request.attachments ?? [];

  return (
    <aside
      className="flex h-full min-h-0 w-80 shrink-0 flex-col border-l border-border bg-subtle"
      aria-label="Provide justification"
    >
      <header className="flex shrink-0 items-center gap-2 px-4 py-4">
        <Description sx={{ fontSize: 18 }} className="text-icon" aria-hidden />
        <h2 className="text-h5 text-text-primary">Provide justification</h2>
      </header>
      <div className="flex min-h-0 flex-1 flex-col gap-5 px-4">
        <div className="flex shrink-0 flex-col gap-2">
          <span className="text-body-sm-strong text-text-primary">
            Justification
            <span aria-hidden className="text-danger">
              {' '}
              *
            </span>
          </span>
          <Select
            ariaLabel="Suggested justification"
            placeholder="Choose a justification…"
            value={request.justificationReason ?? ''}
            onChange={(v) => {
              const template = JUSTIFICATION_TEMPLATES.find((t) => t.value === v);
              const next = updateAccessRequest(request.id, {
                justificationReason: v,
                ...(template ? { businessJustification: template.text } : {}),
              });
              if (next) onChange(next);
            }}
            options={JUSTIFICATION_TEMPLATES.map(({ value, label }) => ({ value, label }))}
            disabled={readOnly}
          />
          <Input
            aria-label="Justification"
            placeholder="e.g. I need access to complete project X…"
            value={request.businessJustification.replace(/<[^>]*>/g, '')}
            onChange={(e) => {
              const next = updateAccessRequest(request.id, { businessJustification: e.target.value });
              if (next) onChange(next);
            }}
            multiline
            minRows={3}
            disabled={readOnly}
            required
          />
        </div>
        <FileAttachmentField
          fill
          files={attachments}
          onChange={(next) => {
            const saved = updateAccessRequest(request.id, { attachments: next });
            if (!saved) {
              toast.error('Couldn’t save those files. Try a smaller file.');
              return false;
            }
            onChange(saved);
          }}
          readOnly={readOnly}
        />
      </div>
      {onSubmit && !readOnly && (
        <div className="shrink-0 px-4 py-3">
          <Button
            variant="primary"
            fullWidth
            loading={submitting}
            disabled={!justificationOk || items.length === 0}
            onClick={onSubmit}
          >
            Submit Request
          </Button>
        </div>
      )}
    </aside>
  );
}
