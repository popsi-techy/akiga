'use client';

import * as React from 'react';
import SettingsEthernet from '@mui/icons-material/SettingsEthernet';
import AddOutlined from '@mui/icons-material/AddOutlined';
import DeleteOutline from '@mui/icons-material/DeleteOutline';
import ContentCopyOutlined from '@mui/icons-material/ContentCopyOutlined';
import InfoOutlined from '@mui/icons-material/InfoOutlined';
import { Button, Dialog, Drawer, Input, Menu, Select, StatusChip, Switch, Tabs, Tooltip, useToast } from '@ds/components';
import {
  BODY_TYPES,
  HTTP_METHODS,
  deleteConnectionEvent,
  emptyEvent,
  eventKindMeta,
  eventStatus,
  mappingComplete,
  saveConnectionEvent,
  type ConnectionEvent,
  type EventKind,
  type EventStatus,
  type HttpMethod,
} from '@/data/connection-events';
import { METHOD_LABEL, type AppAuthorization } from '@/data/provisioning-auth';
import { AttributeMappingEditor, blankMappingRow } from './AttributeMappingEditor';

type Draft = Omit<ConnectionEvent, 'updatedAt'> & { id: string };

type Section = 'request' | 'response' | 'advanced' | 'mapping';

const isDraftId = (id: string) => id.startsWith('__new__');
const makeDraftId = () => `__new__-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;

const EVENT_STATUS: Record<EventStatus | 'draft', { intent: 'success' | 'warning' | 'neutral' | 'info'; label: string }> = {
  ready: { intent: 'success', label: 'Ready' },
  partial: { intent: 'warning', label: 'Incomplete' },
  disabled: { intent: 'neutral', label: 'Off' },
  draft: { intent: 'info', label: 'Draft' },
};

function statusOf(row: Draft) {
  if (isDraftId(row.id)) return EVENT_STATUS.draft;
  return EVENT_STATUS[eventStatus({ ...row, updatedAt: '' })];
}

interface TestOutcome {
  ok: boolean;
  title: string;
  detail: string;
}

/**
 * One event type — every call of that kind, then the one you are describing.
 *
 * The left rail stores the calls. The right side describes the selected one:
 * the request, how to read the answer, how it behaves across a sync, and
 * which attributes it writes. Mapping sits with Advanced because it is the
 * last thing you set on a call, not a separate trip back to the catalog.
 */
export function ConnectionEventDrawer({
  open,
  kind,
  events,
  applicationId,
  applicationName,
  authorizations,
  onClose,
  onChanged,
}: {
  open: boolean;
  kind: EventKind | null;
  events: ConnectionEvent[];
  applicationId: string;
  applicationName?: string;
  authorizations: AppAuthorization[];
  onClose: () => void;
  onChanged: () => void;
}) {
  const toast = useToast();
  const [rows, setRows] = React.useState<Draft[]>([]);
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [section, setSection] = React.useState<Section>('request');
  const [touched, setTouched] = React.useState(false);
  const [testing, setTesting] = React.useState(false);
  const [test, setTest] = React.useState<TestOutcome | null>(null);
  const [removing, setRemoving] = React.useState<Draft | null>(null);
  const testTimer = React.useRef<number>();
  const kindRef = React.useRef<EventKind | null>(null);
  const displayKindRef = React.useRef<EventKind | null>(null);

  if (kind) displayKindRef.current = kind;

  const displayKind = kind ?? displayKindRef.current;
  const meta = displayKind ? eventKindMeta(displayKind) : null;
  const selected = rows.find((r) => r.id === selectedId) ?? null;
  const draft: Draft = selected ?? { ...emptyEvent(applicationId), id: '' };
  const hasDraft = selected !== null;

  const focusRow = (id: string | null) => {
    setSelectedId(id);
    setSection('request');
    setTouched(false);
    setTest(null);
  };

  React.useEffect(() => {
    if (!open || !kind) return;
    const opened = kindRef.current !== kind;
    kindRef.current = kind;
    if (!opened) return;
    const next = events.map((e) => ({ ...e }));
    setRows(next);
    focusRow(next[0]?.id ?? null);
    // Only reset when this type's drawer opens — a save refresh must not wipe drafts.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, kind]);

  React.useEffect(() => {
    if (!open) kindRef.current = null;
  }, [open]);

  React.useEffect(() => () => window.clearTimeout(testTimer.current), []);

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) =>
    setRows((rs) => rs.map((r) => (r.id === selectedId ? { ...r, [key]: value } : r)));

  // A result describes one particular request. Change the request and it is no
  // longer a result, it is a leftover.
  const setRequest = <K extends keyof Draft>(key: K, value: Draft[K]) => {
    setTest(null);
    set(key, value);
  };

  const required = (value: string) => (touched && !value.trim() ? 'Required.' : undefined);

  const requestDone = draft.name.trim() !== '' && draft.authorizationId !== null && draft.url.trim() !== '';
  const callReady = draft.url.trim() !== '';
  const responseDone = draft.successStatusCode.trim() !== '' && draft.successMessageKey.trim() !== '';
  const mappingRows = draft.attributes.length > 0 ? draft.attributes : [];
  const mappingStarted = mappingRows.filter(
    (r) => r.applicationField.trim() !== '' || r.igaAttribute !== '' || r.expression.trim() !== '',
  );
  const mappingDone = mappingStarted.length > 0 && mappingStarted.every(mappingComplete);

  const save = () => {
    if (!hasDraft || !kind) return;
    setTouched(true);
    const gap: Section | null = !requestDone ? 'request' : !responseDone ? 'response' : null;
    if (gap) {
      setSection(gap);
      toast.error('Some required fields are still empty.');
      return;
    }
    const incomplete = mappingStarted.filter((r) => !mappingComplete(r));
    if (incomplete.length > 0) {
      setSection('mapping');
      toast.error('Some attribute mappings are still incomplete.');
      return;
    }
    const wasDraft = isDraftId(draft.id);
    const record = saveConnectionEvent({
      ...draft,
      id: wasDraft ? undefined : draft.id,
      kind,
      name: draft.name.trim(),
      url: draft.url.trim(),
      attributes: mappingStarted,
    });
    setRows((rs) => rs.map((r) => (r.id === selectedId ? { ...record } : r)));
    setSelectedId(record.id);
    toast.success(wasDraft ? 'Event added. It runs on the next sync.' : 'Event updated.');
    onChanged();
  };

  const addEvent = () => {
    if (!kind) return;
    const taken = new Set(rows.map((e) => e.name));
    const base = eventKindMeta(kind).label;
    let name = base;
    let n = 2;
    while (taken.has(name)) {
      name = `${base} ${n}`;
      n += 1;
    }
    const next: Draft = { ...emptyEvent(applicationId, kind), id: makeDraftId(), name };
    setRows((rs) => [next, ...rs]);
    focusRow(next.id);
  };

  const dropRow = (id: string) => {
    const leftover = rows.filter((r) => r.id !== id);
    setRows(leftover);
    if (selectedId === id) focusRow(leftover[0]?.id ?? null);
  };

  const selectEvent = (id: string) => {
    if (id === selectedId) return;
    focusRow(id);
  };

  const confirmRemove = () => {
    if (!removing) return;
    if (!isDraftId(removing.id)) {
      deleteConnectionEvent(removing.id);
      onChanged();
      toast.success('Call removed. IGA no longer makes it.');
    } else {
      toast.info('Draft discarded.');
    }
    dropRow(removing.id);
    setRemoving(null);
  };

  const copyUrl = () => {
    void navigator.clipboard?.writeText(draft.url);
    toast.info('Endpoint copied.');
  };

  const runTest = () => {
    setTesting(true);
    setTest(null);
    testTimer.current = window.setTimeout(() => {
      const auth = authorizations.find((a) => a.id === draft.authorizationId);
      setTest(
        auth?.authorized
          ? {
              ok: true,
              title: `${draft.successStatusCode.trim() || '200'} · answered in 412 ms`,
              detail: `${draft.method} ${draft.url.trim()} accepted the request.`,
            }
          : {
              ok: false,
              title: '401 · not authorized',
              detail: `${
                auth ? METHOD_LABEL[auth.method] : 'The chosen authorization'
              } is not connected. Connect it under Authorization, then test again.`,
            },
      );
      setTesting(false);
    }, 1200);
  };

  const authOptions = authorizations.map((a) => ({
    value: a.id,
    label: `${METHOD_LABEL[a.method]}${a.authorized ? '' : ' — not connected'}`,
  }));

  const noBody = draft.method === 'GET';
  const target = applicationName ?? 'the application';

  return (
    <Drawer
      open={open}
      onClose={onClose}
      icon={<SettingsEthernet sx={{ fontSize: 22 }} />}
      title={meta?.label ?? 'Event'}
      subtitle={`${meta?.direction === 'inbound' ? 'Inbound' : 'Outbound'}. Add the calls IGA makes, then describe each one.`}
      width={1040}
      disablePadding
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          {hasDraft ? <Button onClick={save}>Save</Button> : null}
        </>
      }
    >
      <div className="flex min-h-0 flex-1 overflow-hidden">
        <aside className="flex h-full w-[240px] shrink-0 flex-col self-stretch border-r border-border bg-subtle">
          <div className="ds-scroll min-h-0 flex-1 overflow-y-auto p-1">
            <div role="tablist" aria-label={`${meta?.label ?? 'Event'} calls`} className="flex flex-col gap-1">
              {rows.map((row) => (
                <RailItem
                  key={row.id}
                  label={row.name.trim() || 'New event'}
                  status={statusOf(row)}
                  active={row.id === selectedId}
                  onSelect={() => selectEvent(row.id)}
                  onDelete={() => {
                    if (isDraftId(row.id)) {
                      dropRow(row.id);
                      toast.info('Draft discarded.');
                      return;
                    }
                    setRemoving(row);
                  }}
                />
              ))}
              {rows.length === 0 && (
                <p className="px-2.5 py-6 text-center text-caption text-text-secondary">
                  No calls yet
                </p>
              )}
            </div>
          </div>
          <div className="shrink-0 border-t border-border p-3">
            <Button className="w-full" variant="secondary" startIcon={<AddOutlined />} onClick={addEvent}>
              Add event
            </Button>
          </div>
        </aside>

        <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col">
          {hasDraft ? (
            <div className="shrink-0 bg-surface px-6 pt-2">
              <Tabs
                aria-label="Event settings"
                value={section}
                onChange={(v) => setSection(v as Section)}
                items={[
                  { value: 'request', label: 'Request', status: requestDone ? 'complete' : 'pending' },
                  { value: 'response', label: 'Response', status: responseDone ? 'complete' : 'pending' },
                  { value: 'advanced', label: 'Advanced' },
                  {
                    value: 'mapping',
                    label: 'Attribute mapping',
                    status: mappingDone ? 'complete' : 'pending',
                  },
                ]}
              />
            </div>
          ) : null}

          {!hasDraft && (
            <div className="grid min-h-0 flex-1 place-items-center px-6">
              <div className="flex max-w-sm flex-col items-center text-center">
                <p className="text-body-sm-strong text-text-primary">No calls yet</p>
                <p className="mt-1 text-body-sm text-text-secondary">
                  Add the API call IGA makes to {applicationName ?? 'this application'} for {meta?.label ?? 'this event'}.
                </p>
                <div className="mt-5">
                  <Button startIcon={<AddOutlined />} onClick={addEvent}>
                    Add event
                  </Button>
                </div>
              </div>
            </div>
          )}

      {hasDraft && section === 'request' && (
        <div className="ds-scroll min-h-0 flex-1 overflow-y-auto px-6 py-5">
        <div className="space-y-5">
          <Input
            label="Event name"
            required
            hint="Yours to choose — it appears in sync history, so name it after what it does."
            placeholder="Nightly user import"
            value={draft.name}
            onChange={(e) => set('name', e.target.value)}
            error={required(draft.name)}
          />

          {authorizations.length === 0 ? (
            <div>
              <p className="mb-1.5 text-body-sm-strong text-text-primary">Authorization</p>
              <p className="rounded-lg border border-border bg-subtle px-4 py-3 text-body-sm text-text-secondary">
                This application has no authorization yet. Add one under Authorization first — an event cannot call
                anything it cannot sign in to.
              </p>
            </div>
          ) : (
            <Select
              label="Authorization"
              required
              helperText="The stored credentials this call signs in with."
              placeholder="Select an authorization"
              options={authOptions}
              value={draft.authorizationId ?? ''}
              onChange={(v) => setRequest('authorizationId', v)}
              error={touched && !draft.authorizationId ? 'Required.' : undefined}
            />
          )}

          <div>
            <label
              className="mb-1.5 flex items-center gap-1.5 text-body-sm-strong text-text-primary"
              htmlFor="event-url"
            >
              <span>
                Endpoint
                <span aria-hidden className="text-danger"> *</span>
              </span>
              <Tooltip title="The method and full URL IGA calls. Relative paths are not resolved — give the whole address.">
                <span
                  tabIndex={0}
                  aria-label="The method and full URL IGA calls. Relative paths are not resolved — give the whole address."
                  className="inline-flex shrink-0 text-icon-subtle"
                >
                  <InfoOutlined sx={{ fontSize: 15 }} />
                </span>
              </Tooltip>
            </label>
            <div className="flex items-start gap-2">
              <div className="w-[120px] shrink-0">
                <Select
                  ariaLabel="HTTP method"
                  options={HTTP_METHODS.map((m) => ({ value: m, label: m }))}
                  value={draft.method}
                  onChange={(v) => setRequest('method', v as HttpMethod)}
                />
              </div>
              <div className="min-w-0 flex-1">
                <Input
                  id="event-url"
                  placeholder="https://api.example.com/v1/users"
                  value={draft.url}
                  onChange={(e) => setRequest('url', e.target.value)}
                  error={required(draft.url)}
                  endAdornment={
                    <button
                      type="button"
                      onClick={copyUrl}
                      aria-label="Copy endpoint"
                      className="rounded-md p-0.5 text-icon hover:bg-surface-hover"
                    >
                      <ContentCopyOutlined sx={{ fontSize: 18 }} />
                    </button>
                  }
                />
              </div>
            </div>
          </div>

          <Input
            label="Custom headers"
            hint="JSON object. Authorization is added for you from the credentials above — do not repeat it here."
            placeholder={'{\n  "Accept": "application/json"\n}'}
            multiline
            minRows={4}
            value={draft.headers}
            onChange={(e) => setRequest('headers', e.target.value)}
          />

          <Select
            label="Body content type"
            options={BODY_TYPES.map((b) => ({ value: b, label: b }))}
            value={draft.bodyContentType}
            onChange={(v) => setRequest('bodyContentType', v)}
            disabled={noBody}
            helperText={noBody ? 'A GET request sends no body.' : undefined}
          />

          <Input
            label="Body"
            hint="Sent as-is. Use {{placeholders}} for values filled at run time."
            placeholder="{}"
            multiline
            minRows={5}
            value={draft.body}
            onChange={(e) => setRequest('body', e.target.value)}
            disabled={noBody}
          />
        </div>
        </div>
      )}

      {hasDraft && section === 'response' && (
        <div className="flex h-full min-h-0 overflow-hidden">
          <div className="ds-scroll min-h-0 w-[420px] shrink-0 overflow-y-auto px-6 py-5">
            <div className="space-y-5">
              <Input
                label="Success status code"
                required
                hint="Anything else is treated as a failure and shows in sync history."
                value={draft.successStatusCode}
                onChange={(e) => set('successStatusCode', e.target.value)}
                error={required(draft.successStatusCode)}
              />
              <Input
                label="Success message key"
                required
                hint="Where to read the application's own wording for a success. Dotted paths are supported."
                placeholder="message"
                value={draft.successMessageKey}
                onChange={(e) => set('successMessageKey', e.target.value)}
                error={required(draft.successMessageKey)}
              />
              <Input
                label="Error message key"
                hint="Where to read the reason for a failure, so sync history can quote the application instead of a status code."
                placeholder="error.message"
                value={draft.errorMessageKey}
                onChange={(e) => set('errorMessageKey', e.target.value)}
              />
              <Input
                label="External identifier"
                hint="The field that uniquely identifies a record in the response. IGA matches on it to avoid creating duplicates."
                placeholder="id"
                value={draft.externalIdKey}
                onChange={(e) => set('externalIdKey', e.target.value)}
              />
              <Input
                label="Records key"
                hint="The key holding the list of records in the response — often 'users', 'data' or 'Resources'."
                placeholder="users"
                value={draft.usersKey}
                onChange={(e) => set('usersKey', e.target.value)}
              />

              <div className="rounded-lg bg-subtle px-4 py-3">
                <div className="flex items-center justify-between gap-4">
                  <p className="min-w-0 text-body-sm text-text-secondary">
                    Dry-run the call. Nothing is sent to {target} — the panel shows a sample
                    first, then what IGA would have read.
                  </p>
                  <Button
                    variant="secondary"
                    loading={testing}
                    disabled={!callReady || draft.authorizationId === null}
                    onClick={runTest}
                    className="shrink-0"
                  >
                    Test event
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <ResponsePreview draft={draft} test={test} testing={testing} />
        </div>
      )}

      {hasDraft && section === 'advanced' && (
        <div className="ds-scroll min-h-0 flex-1 overflow-y-auto px-6 py-5">
        <div className="space-y-5">
          <Input
            label="Event priority"
            hint="Lower runs first when several events fire in the same sync."
            type="number"
            value={String(draft.priority)}
            onChange={(e) => set('priority', Number(e.target.value) || 1)}
          />

          <div className="space-y-3">
            <ToggleRow
              label="Fetch full records"
              hint="Call the single-record endpoint for each result. Slower, but needed when the list response is a summary."
              checked={draft.fetchFullRecords}
              onChange={(v) => set('fetchFullRecords', v)}
            />
            <ToggleRow
              label="Enable pagination"
              hint="Follow the application's paging until it stops. Without it, IGA reads the first page only."
              checked={draft.paginate}
              onChange={(v) => set('paginate', v)}
            />
          </div>

          {/* Paging fields answer a question only pagination asks, so they are
              disabled rather than hidden — a field that vanishes reads as a bug. */}
          <div className="space-y-5">
            <Input
              label="First page"
              hint="The page number or cursor to start from."
              value={draft.firstPage}
              onChange={(e) => set('firstPage', e.target.value)}
              disabled={!draft.paginate}
            />
            <Input
              label="Next page key"
              hint="The response key holding the pointer to the next page."
              placeholder="nextPageToken"
              value={draft.nextPageKey}
              onChange={(e) => set('nextPageKey', e.target.value)}
              disabled={!draft.paginate}
            />
          </div>
        </div>
        </div>
      )}

      {hasDraft && section === 'mapping' && (
        <div className="ds-scroll min-h-0 flex-1 overflow-y-auto px-6 py-5">
          <AttributeMappingEditor
            rows={mappingRows.length > 0 ? mappingRows : [blankMappingRow(0)]}
            onChange={(rows) => set('attributes', rows)}
            applicationName={applicationName ?? 'Application'}
            touched={touched}
          />
        </div>
      )}
        </div>
      </div>

      <Dialog
        open={removing !== null}
        onClose={() => setRemoving(null)}
        title="Remove this call?"
        confirmLabel="Remove"
        tone="danger"
        onConfirm={confirmRemove}
      >
        {removing?.name} stops running immediately and its attribute mapping is deleted. The accounts and
        entitlements it already imported are kept.
      </Dialog>
    </Drawer>
  );
}

function RailItem({
  label,
  status,
  active,
  onSelect,
  onDelete,
}: {
  label: string;
  status: { intent: 'success' | 'warning' | 'neutral' | 'info'; label: string };
  active: boolean;
  onSelect: () => void;
  onDelete?: () => void;
}) {
  return (
    <div
      className={[
        'flex w-full items-start gap-0.5 rounded-md border bg-surface py-1.5 pl-2 pr-0.5',
        active ? 'border-brand' : 'border-border hover:border-border-strong',
      ].join(' ')}
    >
      <button
        type="button"
        role="tab"
        aria-selected={active}
        onClick={onSelect}
        className="min-w-0 flex-1 py-0.5 text-left"
      >
        <span className="block truncate text-body-sm-medium text-text-primary">{label}</span>
        <span className="mt-1.5 block">
          <StatusChip intent={status.intent} label={status.label} />
        </span>
      </button>
      {onDelete ? (
        <Menu
          ariaLabel={`Actions for ${label}`}
          items={[
            {
              label: 'Delete',
              icon: <DeleteOutline sx={{ fontSize: 18 }} />,
              danger: true,
              onClick: onDelete,
            },
          ]}
        />
      ) : null}
    </div>
  );
}

const SAMPLE_RECORDS = [
  {
    id: '00u1a2b3c4d5e6',
    externalId: 'ext-30281',
    userName: 'jane.doe@example.com',
    givenName: 'Jane',
    familyName: 'Doe',
    displayName: 'Jane Doe',
    email: 'jane.doe@example.com',
    title: 'Senior Product Manager',
    department: 'Engineering',
    active: true,
  },
  {
    id: '00u7f8g9h0i1j2',
    externalId: 'ext-44109',
    userName: 'lee.park@example.com',
    givenName: 'Lee',
    familyName: 'Park',
    displayName: 'Lee Park',
    email: 'lee.park@example.com',
    title: 'Identity Engineer',
    department: 'Security',
    active: true,
  },
] as const;

function setAtPath(obj: Record<string, unknown>, path: string, value: unknown) {
  const parts = path.split('.').map((p) => p.trim()).filter(Boolean);
  if (parts.length === 0) return obj;
  let cur: Record<string, unknown> = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    const key = parts[i];
    const next = cur[key];
    if (!next || typeof next !== 'object' || Array.isArray(next)) cur[key] = {};
    cur = cur[key] as Record<string, unknown>;
  }
  cur[parts[parts.length - 1]] = value;
  return obj;
}

function getAtPath(obj: unknown, path: string): unknown {
  return path
    .split('.')
    .map((p) => p.trim())
    .filter(Boolean)
    .reduce<unknown>((acc, key) => {
      if (acc && typeof acc === 'object' && !Array.isArray(acc)) {
        return (acc as Record<string, unknown>)[key];
      }
      return undefined;
    }, obj);
}

function recordsKeyOf(draft: Draft) {
  return draft.usersKey.trim() || 'users';
}

function idKeyOf(draft: Draft) {
  return draft.externalIdKey.trim() || 'id';
}

function previewPayload(draft: Draft, test: TestOutcome | null): unknown {
  if (test && !test.ok) {
    const body: Record<string, unknown> = {};
    setAtPath(body, draft.errorMessageKey.trim() || 'error.message', 'Authorization is not connected.');
    return body;
  }

  const idKey = idKeyOf(draft);
  const records = SAMPLE_RECORDS.map((row) => {
    const rec: Record<string, unknown> = { ...row };
    if (!(idKey in rec)) rec[idKey] = row.id;
    return rec;
  });

  const body: Record<string, unknown> = {};
  setAtPath(body, recordsKeyOf(draft), records);
  const messageKey = draft.successMessageKey.trim();
  if (messageKey) {
    setAtPath(body, messageKey, test?.ok ? 'Accounts fetched.' : 'OK');
  }
  return body;
}

function ResponsePreview({
  draft,
  test,
  testing,
}: {
  draft: Draft;
  test: TestOutcome | null;
  testing: boolean;
}) {
  const payload = previewPayload(draft, test);
  const records = getAtPath(payload, recordsKeyOf(draft));
  const recordCount = Array.isArray(records) ? records.length : 0;
  const firstId =
    Array.isArray(records) && records[0] && typeof records[0] === 'object'
      ? String((records[0] as Record<string, unknown>)[idKeyOf(draft)] ?? '—')
      : '—';
  const message = getAtPath(payload, draft.successMessageKey.trim());
  const error = getAtPath(payload, draft.errorMessageKey.trim() || 'error.message');
  const status = test?.ok === false ? '401' : draft.successStatusCode.trim() || '200';

  const title = test ? 'Simulated reply' : 'Sample response';
  const lead = testing
    ? 'Trying the call as configured. Nothing is sent.'
    : test?.ok
      ? 'Nothing was sent. This is what IGA would read using the keys on the left.'
      : test
        ? 'Nothing was sent. IGA would quote the error from the key you named.'
        : 'A typical payload. The keys on the left tell IGA where to look — change Records key and this sample follows.';

  return (
    <aside
      aria-label={title}
      aria-live="polite"
      className="flex h-full w-[380px] shrink-0 flex-col border-l border-border bg-subtle"
    >
      <header className="shrink-0 px-5 pt-5 pb-3">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-body-sm-strong text-text-primary">{title}</h3>
          {testing ? (
            <StatusChip intent="neutral" label="Testing" />
          ) : test?.ok ? (
            <StatusChip intent="success" label={status} />
          ) : test ? (
            <StatusChip intent="danger" label={status} />
          ) : (
            <StatusChip intent="info" label="Sample" />
          )}
        </div>
        <p className="mt-1.5 text-caption text-text-secondary">{lead}</p>
      </header>

      <div className="flex min-h-0 flex-1 flex-col px-5 pb-5">
        {test && !testing && (
          <dl className="mb-4 shrink-0 space-y-2">
            <p className="text-caption-strong text-text-tertiary">What IGA would read</p>
            <Readout label="Status" value={status} />
            {test.ok ? (
              <>
                {draft.successMessageKey.trim() ? (
                  <Readout label={draft.successMessageKey.trim()} value={String(message ?? '—')} />
                ) : null}
                <Readout
                  label={recordsKeyOf(draft)}
                  value={`${recordCount} record${recordCount === 1 ? '' : 's'}`}
                />
                <Readout label={idKeyOf(draft)} value={firstId} />
              </>
            ) : (
              <Readout
                label={draft.errorMessageKey.trim() || 'error.message'}
                value={String(error ?? '—')}
              />
            )}
          </dl>
        )}

        <pre className="ds-scroll min-h-0 flex-1 overflow-auto rounded-lg border border-border bg-surface p-4 font-mono text-caption leading-6 text-text-primary">
          {JSON.stringify(payload, null, 2)}
        </pre>
      </div>
    </aside>
  );
}

function Readout({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-t border-border pt-2">
      <dt className="min-w-0 truncate font-mono text-caption text-text-secondary">{label}</dt>
      <dd className="shrink-0 text-caption text-text-primary">{value}</dd>
    </div>
  );
}

function ToggleRow({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string;
  hint: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  const id = React.useId();
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg bg-subtle px-4 py-3">
      <label htmlFor={id} className="flex items-center gap-1.5 text-body-sm-strong text-text-primary">
        {label}
        <Tooltip title={hint}>
          <span tabIndex={0} aria-label={hint} className="inline-flex shrink-0 text-icon-subtle">
            <InfoOutlined sx={{ fontSize: 15 }} />
          </span>
        </Tooltip>
      </label>
      <Switch id={id} checked={checked} onChange={(e) => onChange(e.target.checked)} inputProps={{ 'aria-label': label }} />
    </div>
  );
}
