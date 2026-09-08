'use client';

import * as React from 'react';
import Description from '@mui/icons-material/Description';
import {
  Button,
  DataTable,
  FileAttachmentField,
  Input,
  Select,
  StatusChip,
  Tooltip,
  useToast,
  type Column,
} from '@ds/components';
import { EntityAvatar, RiskScoreChip } from '@/components/product/directory';
import type { AccessRequest, AccessRequestItem } from '@/data/access-request-types';
import { requestItems, updateAccessRequest } from '@/data/access-requests';

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
  /*
    Why Submit is unavailable, in the order the reader would fix it — there is nothing to
    justify until something is being asked for.

    Naming the reason is not decoration here. `Button` maps `disabled` to `aria-disabled`
    rather than the native attribute *specifically* so a gated control stays focusable and
    the explanation stays reachable; a call site that gates without explaining takes the
    whole cost of that choice — a focusable button that does nothing — and none of the
    benefit, leaving a keyboard reader on "Submit Request, unavailable" with no way to
    learn what is missing.
  */
  const blockedReason =
    items.length === 0
      ? 'Add at least one entitlement to submit this request.'
      : !justificationOk
        ? 'Add a justification of at least 10 characters.'
        : null;

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
            // 5 rows = 100px at this type step. A floor, not a height — the field still
            // grows as the reason gets longer, and the attachment dropzone below takes
            // whatever the column has left.
            minRows={5}
            disabled={readOnly}
            required
          />
        </div>
        <FileAttachmentField
          label="Attach files"
          fill
          /*
            Ten is the cap. Past that the dock stops being a list of evidence and becomes a
            folder — and an approver who has to open twelve files to answer one question
            will open none of them. The field hides "Drop or attach more files" at the limit and says
            so, rather than letting a picker take twelve and silently keeping ten.
          */
          maxFiles={10}
          files={attachments}
          onChange={(next) => {
            const saved = updateAccessRequest(request.id, { attachments: next });
            if (!saved) {
              toast.error('Couldn’t save those files. Try a smaller file.');
              return false;
            }
            onChange(saved);
          }}
          // Without this the rejects are dropped in silence, and a reader who picked
          // twelve files sees ten appear with no account of the other two.
          onReject={(rejects) => toast.error(rejects[0]?.message ?? 'Some files were not attached.')}
          readOnly={readOnly}
        />
      </div>
      {onSubmit && !readOnly && (
        <div className="shrink-0 px-4 py-3">
          {/* `describeChild`, so the reason lands on `aria-describedby` and explains the
              button rather than renaming it — and the tooltip opens on focus, so a reader
              who tabs here hears why. Same pattern the wizard chrome uses for its own
              gated CTA. The gated button keeps `pointer-events: auto`, so no wrapper span
              is needed for the hover to register. */}
          {blockedReason ? (
            <Tooltip title={blockedReason} describeChild>
              <Button variant="primary" fullWidth loading={submitting} disabled onClick={onSubmit}>
                Submit Request
              </Button>
            </Tooltip>
          ) : (
            <Button variant="primary" fullWidth loading={submitting} onClick={onSubmit}>
              Submit Request
            </Button>
          )}
        </div>
      )}
    </aside>
  );
}
