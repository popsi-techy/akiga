'use client';

import * as React from 'react';
import SettingsEthernet from '@mui/icons-material/SettingsEthernet';
import ContentCopyOutlined from '@mui/icons-material/ContentCopyOutlined';
import { Button, Drawer, Input, Select, Switch, Tabs, Tooltip, useToast } from '@ds/components';
import InfoOutlined from '@mui/icons-material/InfoOutlined';
import {
  BODY_TYPES,
  eventKindMeta,
  HTTP_METHODS,
  emptyEvent,
  saveConnectionEvent,
  type ConnectionEvent,
  type EventKind,
  type HttpMethod,
} from '@/data/connection-events';
import { METHOD_LABEL, type AppAuthorization } from '@/data/provisioning-auth';

type Draft = Omit<ConnectionEvent, 'id' | 'updatedAt'> & { id?: string };

/**
 * One API call, described.
 *
 * The four fields above the tabs are the ones every event needs — what it is
 * called, when it fires, what it signs in with, and where it goes. Everything
 * below is per-call detail, split the way an HTTP request is: what we send
 * (headers, body) and how we read what comes back (advanced).
 */
export function ConnectionEventDrawer({
  open,
  applicationId,
  authorizations,
  existing,
  initialKind,
  onClose,
  onSaved,
}: {
  open: boolean;
  applicationId: string;
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
  const [section, setSection] = React.useState('headers');
  const [touched, setTouched] = React.useState(false);

  React.useEffect(() => {
    if (!open) return;
    setDraft(existing ? { ...existing, enabled: true } : emptyEvent(applicationId, initialKind));
    setSection('headers');
    setTouched(false);
  }, [open, existing, applicationId, initialKind]);

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) => setDraft((d) => ({ ...d, [key]: value }));

  const required = (value: string) => (touched && !value.trim() ? 'Required.' : undefined);
  const valid = draft.name.trim() !== '' && draft.authorizationId !== null && draft.url.trim() !== '';

  const save = () => {
    setTouched(true);
    if (!valid) return;
    saveConnectionEvent({ ...draft, name: draft.name.trim(), url: draft.url.trim() });
    toast.success(existing ? 'Event updated.' : 'Event added. It runs on the next sync.');
    onSaved();
  };

  const copyUrl = () => {
    void navigator.clipboard?.writeText(draft.url);
    toast.info('Endpoint copied.');
  };

  const authOptions = authorizations.map((a) => ({
    value: a.id,
    label: `${METHOD_LABEL[a.method]}${a.authorized ? '' : ' — not connected'}`,
  }));

  return (
    <Drawer
      open={open}
      onClose={onClose}
      icon={<SettingsEthernet sx={{ fontSize: 22 }} />}
      title={existing ? 'Edit event' : 'Add event'}
      subtitle="The API call IGA makes to this application, and how to read its answer."
      width={560}
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
        <Input
          label="Event name"
          required
          hint="Yours to choose — it appears in sync history, so name it after what it does."
          placeholder="Nightly user import"
          value={draft.name}
          onChange={(e) => set('name', e.target.value)}
          error={required(draft.name)}
        />
        <div>
          <p className="mb-1.5 text-body-sm-strong text-text-primary">Event</p>
          <p className="text-body-sm text-text-secondary">
            {eventKindMeta(draft.kind).label}
            <span className="text-text-tertiary">
              {' · '}
              {eventKindMeta(draft.kind).direction === 'inbound' ? 'Inbound' : 'Outbound'}
            </span>
          </p>
        </div>

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
            onChange={(v) => set('authorizationId', v)}
            error={touched && !draft.authorizationId ? 'Required.' : undefined}
          />
        )}

        <div>
          <label className="mb-1.5 flex items-center gap-1.5 text-body-sm-strong text-text-primary" htmlFor="event-url">
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
                onChange={(v) => set('method', v as HttpMethod)}
              />
            </div>
            <div className="min-w-0 flex-1">
              <Input
                id="event-url"
                placeholder="https://api.example.com/v1/users"
                value={draft.url}
                onChange={(e) => set('url', e.target.value)}
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

        <Tabs
          items={[
            { value: 'headers', label: 'Headers' },
            { value: 'body', label: 'Body' },
            { value: 'response', label: 'Response' },
          ]}
          value={section}
          onChange={setSection}
        />

        {section === 'headers' && (
          <Input
            label="Custom headers"
            hint="JSON object. Authorization is added for you from the credentials above — do not repeat it here."
            placeholder={'{\n  "Accept": "application/json"\n}'}
            multiline
            minRows={4}
            value={draft.headers}
            onChange={(e) => set('headers', e.target.value)}
          />
        )}

        {section === 'body' && (
          <div className="space-y-5">
            <Select
              label="Content type"
              options={BODY_TYPES.map((b) => ({ value: b, label: b }))}
              value={draft.bodyContentType}
              onChange={(v) => set('bodyContentType', v)}
              disabled={draft.method === 'GET'}
              helperText={draft.method === 'GET' ? 'A GET request sends no body.' : undefined}
            />
            <Input
              label="Body"
              hint="Sent as-is. Use {{placeholders}} for values filled at run time."
              placeholder="{}"
              multiline
              minRows={5}
              value={draft.body}
              onChange={(e) => set('body', e.target.value)}
              disabled={draft.method === 'GET'}
            />
          </div>
        )}

        {section === 'response' && (
          <div className="space-y-5">
            <Input
              label="Success status code"
              hint="Anything else is treated as a failure and shows in sync history."
              value={draft.successStatusCode}
              onChange={(e) => set('successStatusCode', e.target.value)}
            />
            <Input
              label="Success message key"
              hint="Where to read the application's own wording for a success. Dotted paths are supported."
              placeholder="message"
              value={draft.successMessageKey}
              onChange={(e) => set('successMessageKey', e.target.value)}
            />
            <Input
              label="Error message key"
              hint="Where to read the reason for a failure, so sync history can quote the application instead of a status code."
              placeholder="error.message"
              value={draft.errorMessageKey}
              onChange={(e) => set('errorMessageKey', e.target.value)}
            />
            <Input
              label="External ID key"
              hint="The field that identifies a record in the application. IGA matches on it to avoid creating duplicates."
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
            <Input
              label="Priority"
              hint="Lower runs first when several events fire in the same sync."
              type="number"
              value={String(draft.priority)}
              onChange={(e) => set('priority', Number(e.target.value) || 1)}
            />

            <div className="space-y-3">
              <ToggleRow
                label="Event enabled"
                hint="Turn off to keep this configuration but stop running it."
                checked={draft.enabled}
                onChange={(v) => set('enabled', v)}
              />
              <ToggleRow
                label="Fetch full records"
                hint="Call the single-record endpoint for each result. Slower, but needed when the list response is a summary."
                checked={draft.fetchFullRecords}
                onChange={(v) => set('fetchFullRecords', v)}
              />
              <ToggleRow
                label="Paginate results"
                hint="Follow the application's paging until it stops. Without it, IGA reads the first page only."
                checked={draft.paginate}
                onChange={(v) => set('paginate', v)}
              />
            </div>

            {/* Paging fields answer a question only pagination asks, so they are
                disabled rather than hidden — a field that vanishes reads as a bug. */}
            <div className={`space-y-5 ${draft.paginate ? '' : 'opacity-60'}`}>
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
      </div>
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
    <div className="flex items-center justify-between gap-3 rounded-lg bg-subtle px-4 py-3.5">
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
