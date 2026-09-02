'use client';

import * as React from 'react';
import SettingsEthernet from '@mui/icons-material/SettingsEthernet';
import ContentCopyOutlined from '@mui/icons-material/ContentCopyOutlined';
import CheckCircleOutline from '@mui/icons-material/CheckCircleOutline';
import ErrorOutline from '@mui/icons-material/ErrorOutline';
import InfoOutlined from '@mui/icons-material/InfoOutlined';
import { Button, Drawer, Input, Select, Switch, Tabs, Tooltip, useToast } from '@ds/components';
import {
  BODY_TYPES,
  HTTP_METHODS,
  emptyEvent,
  saveConnectionEvent,
  type ConnectionEvent,
  type EventKind,
  type HttpMethod,
} from '@/data/connection-events';
import { METHOD_LABEL, type AppAuthorization } from '@/data/provisioning-auth';

type Draft = Omit<ConnectionEvent, 'id' | 'updatedAt'> & { id?: string };

type Section = 'details' | 'call' | 'response' | 'advanced';

interface TestOutcome {
  ok: boolean;
  title: string;
  detail: string;
}

/**
 * One API call, described — in the order you would describe it.
 *
 * Four tabs, each a question with an answer: what is this and what does it sign
 * in with, what request goes out, how do we read what comes back, and how does
 * it behave across a sync. Nothing sits above the tabs: a band of "common"
 * fields over a tab strip means the form has two organising ideas and the
 * reader has to hold both.
 *
 * The first three carry a completion tick, because their required fields are
 * now on separate screens and Save must not be the thing that discovers a gap.
 * Advanced has none — it ships with working defaults, so it is never *pending*.
 */
export function ConnectionEventDrawer({
  open,
  applicationId,
  applicationName,
  authorizations,
  existing,
  initialKind,
  onClose,
  onSaved,
}: {
  open: boolean;
  applicationId: string;
  applicationName?: string;
  /** The application's stored authorizations — an event signs in with one of them. */
  authorizations: AppAuthorization[];
  existing: ConnectionEvent | null;
  /** When adding from the catalog, lock the drawer to this event type. */
  initialKind?: EventKind;
  onClose: () => void;
  onSaved: () => void;
}) {
  const toast = useToast();
  const [draft, setDraft] = React.useState<Draft>(() => emptyEvent(applicationId));
  const [section, setSection] = React.useState<Section>('details');
  const [touched, setTouched] = React.useState(false);
  const [testing, setTesting] = React.useState(false);
  const [test, setTest] = React.useState<TestOutcome | null>(null);
  const testTimer = React.useRef<number>();

  React.useEffect(() => {
    if (!open) return;
    // Keep `enabled` as it stands: the catalog switch owns whether a type runs,
    // so editing a call must not quietly switch it back on.
    setDraft(existing ? { ...existing } : emptyEvent(applicationId, initialKind));
    setSection('details');
    setTouched(false);
    setTest(null);
  }, [open, existing, applicationId, initialKind]);

  React.useEffect(() => () => window.clearTimeout(testTimer.current), []);

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) => setDraft((d) => ({ ...d, [key]: value }));

  // A result describes one particular request. Change the request and it is no
  // longer a result, it is a leftover.
  const setRequest = <K extends keyof Draft>(key: K, value: Draft[K]) => {
    setTest(null);
    set(key, value);
  };

  const required = (value: string) => (touched && !value.trim() ? 'Required.' : undefined);

  const detailsDone = draft.name.trim() !== '' && draft.authorizationId !== null;
  const callDone = draft.url.trim() !== '';
  const responseDone = draft.successStatusCode.trim() !== '' && draft.successMessageKey.trim() !== '';

  const save = () => {
    setTouched(true);
    const gap: Section | null = !detailsDone ? 'details' : !callDone ? 'call' : !responseDone ? 'response' : null;
    if (gap) {
      setSection(gap);
      toast.error('Some required fields are still empty.');
      return;
    }
    saveConnectionEvent({ ...draft, name: draft.name.trim(), url: draft.url.trim() });
    toast.success(existing ? 'Event updated.' : 'Event added. It runs on the next sync.');
    onSaved();
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
      title={existing ? 'Edit event' : 'Add event'}
      subtitle="The API call IGA makes to this application, and how to read its answer."
      width={560}
      toolbar={
        <Tabs
          aria-label="Event settings"
          value={section}
          onChange={(v) => setSection(v as Section)}
          items={[
            { value: 'details', label: 'Details', status: detailsDone ? 'complete' : 'pending' },
            { value: 'call', label: 'API call', status: callDone ? 'complete' : 'pending' },
            { value: 'response', label: 'Response', status: responseDone ? 'complete' : 'pending' },
            { value: 'advanced', label: 'Advanced' },
          ]}
        />
      }
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={save}>Save</Button>
        </>
      }
    >
      {section === 'details' && (
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
        </div>
      )}

      {section === 'call' && (
        <div className="space-y-5">
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
            hint="JSON object. Authorization is added for you from the credentials on Details — do not repeat it here."
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

          {/* A dry run, and it says so. Anything that looks like it reached the
              application but did not is worse than no test at all. */}
          <div className="rounded-lg bg-subtle px-4 py-3">
            <div className="flex items-center justify-between gap-4">
              <p className="min-w-0 text-body-sm text-text-secondary">
                Try the call as configured. Simulated — nothing is sent to {target}.
              </p>
              <Button
                variant="secondary"
                loading={testing}
                disabled={!callDone || draft.authorizationId === null}
                onClick={runTest}
                className="shrink-0"
              >
                Test event
              </Button>
            </div>

            {test && (
              <div
                role="status"
                className="mt-3 flex items-start gap-2 rounded-md border p-3"
                style={{
                  borderColor: test.ok
                    ? 'var(--ds-color-status-success-border)'
                    : 'var(--ds-color-status-danger-border)',
                  backgroundColor: test.ok
                    ? 'var(--ds-color-status-success-subtle)'
                    : 'var(--ds-color-status-danger-subtle)',
                }}
              >
                {test.ok ? (
                  <CheckCircleOutline
                    sx={{ fontSize: 18, color: 'var(--ds-color-status-success-fg)' }}
                    className="mt-0.5 shrink-0"
                    aria-hidden
                  />
                ) : (
                  <ErrorOutline
                    sx={{ fontSize: 18, color: 'var(--ds-color-status-danger-fg)' }}
                    className="mt-0.5 shrink-0"
                    aria-hidden
                  />
                )}
                <div className="min-w-0">
                  <p className="text-body-sm-strong text-text-primary">{test.title}</p>
                  <p className="mt-0.5 break-words text-caption text-text-secondary">{test.detail}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {section === 'response' && (
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
        </div>
      )}

      {section === 'advanced' && (
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
      )}
    </Drawer>
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
