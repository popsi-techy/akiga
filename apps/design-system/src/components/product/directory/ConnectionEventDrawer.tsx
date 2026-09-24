'use client';

import * as React from 'react';
import SettingsEthernet from '@mui/icons-material/SettingsEthernet';
import AddOutlined from '@mui/icons-material/AddOutlined';
import SearchOutlined from '@mui/icons-material/SearchOutlined';
import DeleteOutline from '@mui/icons-material/DeleteOutline';
import ContentCopyOutlined from '@mui/icons-material/ContentCopyOutlined';
import InfoOutlined from '@mui/icons-material/InfoOutlined';
import { Button, Dialog, Drawer, Input, Menu, NavList, Select, StatusChip, Switch, Tabs, Tooltip, useToast } from '@ds/components';
import {
  BODY_TYPES,
  HTTP_METHODS,
  deleteConnectionEvent,
  emptyEvent,
  eventKindMeta,
  eventStatus,
  saveConnectionEvent,
  type ConnectionEvent,
  type EventKind,
  type EventStatus,
  type HttpMethod,
} from '@/data/connection-events';
import { METHOD_LABEL, type AppAuthorization } from '@/data/provisioning-auth';

type Draft = Omit<ConnectionEvent, 'updatedAt'> & { id: string };

type Section = 'request' | 'response' | 'advanced';

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
 * The left rail stores the API calls. The right side describes the selected one:
 * the request, how to read the answer, and how it behaves across a sync.
 * Field mapping lives on Advanced attribute mapping, not on this call.
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

  const save = () => {
    if (!hasDraft || !kind) return;
    setTouched(true);
    const gap: Section | null = !requestDone ? 'request' : !responseDone ? 'response' : null;
    if (gap) {
      setSection(gap);
      toast.error('Some required fields are still empty.');
      return;
    }
    const wasDraft = isDraftId(draft.id);
    const record = saveConnectionEvent({
      ...draft,
      id: wasDraft ? undefined : draft.id,
      kind,
      name: draft.name.trim(),
      url: draft.url.trim(),
    });
    setRows((rs) => rs.map((r) => (r.id === selectedId ? { ...record } : r)));
    setSelectedId(record.id);
    toast.success(wasDraft ? 'API call added. It runs on the next sync.' : 'API call updated.');
    onChanged();
  };

  const addEvent = () => {
    if (!kind) return;
    const taken = new Set(rows.map((e) => e.name));
    const base = eventKindMeta(kind).label;
    /*
      Numbered from the first one: "Accounts Fetch 1", then 2, then 3.

      The first call used to take the bare kind label and only the second got a suffix,
      which made the first one look like the event itself rather than one call of it — and
      it is the common case that an event has several. Starting at 1 says a number is
      coming, and the two names differ by something you can see rather than by one having
      a number and the other not.

      Annotated, because `base` is one of the literal event-kind labels and inference
      would otherwise pin `name` to that union.
    */
    let n = 1;
    let name: string = `${base} ${n}`;
    while (taken.has(name)) {
      n += 1;
      name = `${base} ${n}`;
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

  /*
    The rail's search narrows the rail and nothing else — the call open in the pane stays
    open even once it has been typed out of the list. Losing the thing you were editing
    because you went looking for another one is not a filter, it is a bug.
  */
  const [railQuery, setRailQuery] = React.useState('');
  const railQ = railQuery.trim().toLowerCase();
  const shownRows = railQ
    ? rows.filter((r) => (r.name.trim() || 'New API call').toLowerCase().includes(railQ))
    : rows;

  const noBody = draft.method === 'GET';
  const target = applicationName ?? 'the application';

  return (
    <Drawer
      open={open}
      onClose={onClose}
      icon={<SettingsEthernet sx={{ fontSize: 22 }} />}
      /*
        The heading names what this panel holds, not what the card outside it was called.

        It read "Accounts Fetch", which is the label on the card that opened the drawer, the
        heading of the rail's first row and the value in the Event name field two inches
        below — the one word on screen that was already said three times, and the only one
        that never said what you were now looking at. "Accounts Fetch API calls" is the
        rail's own noun: this panel is that event's API calls, and the tabs describe one of
        them.

        The subtitle drops "Inbound." — the card sits under an Inbound heading, and the
        label says Fetch — for the thing neither of them says: which system is on the other
        end, and that reading the answer is part of the job.
      */
      title={`${meta?.label ?? 'Event'} API calls`}
      subtitle={`The requests IGA sends to ${target}, and how it reads what comes back.`}
      width={1040}
      disablePadding
    >
      <div className="flex min-h-0 flex-1 overflow-hidden">
      {/* The rail appears with the first call.

          It is a switcher between calls, and there is nothing to switch between until one
          exists — empty, it was a column saying "No API calls yet" beside an empty state
          saying the same thing, and an Add event button under a list with nothing in it.
          Gone,
          the empty state gets the whole pane and says it once.

          288 wide, and the names are told apart by hover, not by width.

          A rail holds one event kind — `eventsFor(drawerKind)` — so the default names in it
          are that kind's label and the same label with a numeral: "Account Entitlement
          Revocation", then "Account Entitlement Revocation 2". What distinguishes them is
          the last character, which is the first thing truncation takes. Fitting the longest
          of those outright wants about 340, a third of the drawer held open for three
          names, and even 340 only postpones it — a renamed call can be longer still.

          So width is not the mechanism. `NavList` puts the full label in a `title`, the
          status chip and the order carry the rest, and 288 is set at the point where every
          short and medium label reads whole: "Entitlements Fetch", the longest of those,
          needs 108, and the row spends about 150 on the 24px gutter, its own padding and
          border, the state chip and the kebab. */}
      {rows.length > 0 && (
        <aside className="flex h-full w-[288px] shrink-0 flex-col self-stretch border-r border-border bg-surface">
          {/*
            One toolbar: find a call, or add one. The house pattern for any list —
            search leading, add opposite it — held to in a 288px column.

            The heading sits above the toolbar rather than beside Add, in the same shape
            the flow board's rail uses: the name of the list at `body-sm-strong`, and what
            it holds on the right in caption grey. It is a heading rather than an overline
            because it is the top of a column, not a label inside one — and the count is
            the one thing about this column that nothing else on screen says.

            Add used to be up there with it for want of anywhere better; opposite the field
            is where every other list in the product keeps it.

            `secondary`, not the primary this pattern usually gets: the drawer already
            spends its one filled button on Save, and adding a call is not the thing you
            came to the drawer to do.

            The field shows from the first call on. It used to appear at two, so the head
            changed height and the list jumped the moment a second call was added, and the
            control was missing every time you came back to a one-call event.
          */}
          <div className="shrink-0 border-b border-border px-3 py-3">
            <div className="mb-2 flex items-center justify-between gap-3">
              {/*
                "API calls", not "Calls", "Endpoints", "Operations" or "Requests".

                SailPoint's Web Services connector calls the level above this one an
                *operation* — "Accounts Fetch" is the operation — and the HTTP requests
                inside it *endpoints*; Saviynt's REST connector keys them `call1`, `call2`.
                Endpoint is already a field on each of these items, so it cannot also name
                the list; Operation belongs to the event kind, one level up; and Request in
                this product means an access request. API call is both the industry's word
                and the only one of them that is unambiguous here.
              */}
              <h3 className="min-w-0 truncate text-body-sm-strong text-text-primary">API calls</h3>
              {/* The number alone. "1 call" repeated the noun standing an inch to its left,
                  and a heading that says API calls does not need its count to say it too. */}
              <span className="shrink-0 tabular-nums text-caption text-text-secondary">{rows.length}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="min-w-0 flex-1">
                <Input
                  size="sm"
                  placeholder="Search API calls"
                  aria-label="Search API calls"
                  value={railQuery}
                  onChange={(e) => setRailQuery(e.target.value)}
                  startAdornment={<SearchOutlined sx={{ fontSize: 18 }} />}
                />
              </div>
              <Button size="sm" variant="secondary" startIcon={<AddOutlined />} onClick={addEvent}>
                Add
              </Button>
            </div>
          </div>

          {/* Same 12px gutter as the heading and the search above it. The list was on 4px,
              so every item hung 8px outside the field it sits under — three left edges in
              one column. */}
          <div className="ds-scroll min-h-0 flex-1 overflow-y-auto p-3">
            {/*
              `NavList`, not a rail of its own.

              This was a local `RailItem` — the last hand-rolled role=tablist in the
              product, beside twelve surfaces already on the component. It had drifted into
              its own selected treatment, its own hover and its own hairline, so every
              adjustment to it was a fresh judgement about something the system had already
              settled. The two things it needed that the component lacked — a status chip on
              the trailing edge and a per-row kebab — are slots on `NavList` now.
            */}
            <NavList
              ariaLabel={`${meta?.label ?? 'Event'} API calls`}
              value={selectedId ?? ''}
              onChange={selectEvent}
              items={shownRows.map((row) => {
                const status = statusOf(row);
                const label = row.name.trim() || 'New API call';
                return {
                  id: row.id,
                  label,
                  trailing: <StatusChip intent={status.intent} label={status.label} />,
                  action: (
                    <Menu
                      ariaLabel={`Actions for ${label}`}
                      items={[
                        {
                          label: 'Delete',
                          icon: <DeleteOutline sx={{ fontSize: 18 }} />,
                          danger: true,
                          onClick: () => {
                            if (isDraftId(row.id)) {
                              dropRow(row.id);
                              toast.info('Draft discarded.');
                              return;
                            }
                            setRemoving(row);
                          },
                        },
                      ]}
                    />
                  ),
                };
              })}
            />
            {shownRows.length === 0 && (
              <p className="px-2 py-3 text-caption text-text-secondary">
                No API call matches &ldquo;{railQuery.trim()}&rdquo;.
              </p>
            )}
          </div>
        </aside>
      )}

        <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col">
          {hasDraft ? (
            <div className="shrink-0 bg-surface px-6 pt-2">
              <Tabs
                aria-label="API call settings"
                value={section}
                onChange={(v) => setSection(v as Section)}
                items={[
                  { value: 'request', label: 'Request', status: requestDone ? 'complete' : 'pending' },
                  { value: 'response', label: 'Response', status: responseDone ? 'complete' : 'pending' },
                  { value: 'advanced', label: 'Advanced' },
                ]}
              />
            </div>
          ) : null}

          {!hasDraft && (
            <div className="grid min-h-0 flex-1 place-items-center px-6">
              <div className="flex max-w-sm flex-col items-center text-center">
                <p className="text-body-sm-strong text-text-primary">No API calls yet</p>
                <p className="mt-1 text-body-sm text-text-secondary">
                  Add the API call IGA makes to {applicationName ?? 'this application'} for {meta?.label ?? 'this event'}.
                </p>
                <div className="mt-5">
                  <Button startIcon={<AddOutlined />} onClick={addEvent}>
                    Add API call
                  </Button>
                </div>
              </div>
            </div>
          )}

      {hasDraft && section === 'request' && (
        <div className="ds-scroll min-h-0 flex-1 overflow-y-auto px-6 py-5">
        <div className="space-y-5">
          <Input
            label="API call name"
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

      {/*
        The response split: the form takes what is left, rather than claiming a fixed 420.

        420 + the preview's 380 came to exactly 800, which is what the detail pane used to be
        when the rail was 240 wide. The rail is 288 now, the pane is 752, and two `shrink-0`
        columns adding up to 800 in a 752 box do not shrink — they run 48px past the drawer's
        edge, where `overflow-hidden` cuts the preview's status chip in half. One fixed column
        and one flexible one survives the next change to either side of it.
      */}
      {hasDraft && section === 'response' && (
        <div className="flex h-full min-h-0 overflow-hidden">
          <div className="ds-scroll min-h-0 min-w-0 flex-1 overflow-y-auto px-6 py-5">
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
            label="API call priority"
            hint="Lower runs first when several API calls run in the same sync."
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

          {/*
            The actions belong to the pane they act on, not to the whole drawer.

            As the Drawer's own footer they spanned all 1040px, which cut the rail off
            above the bottom edge and left a strip of drawer under a column that is
            otherwise full height — the rail reads as a sidebar, and a sidebar that stops
            short of the floor reads as unfinished. Inside the detail pane the rail runs
            to the bottom and Save sits under the form it saves.

            Still only with a draft: without one this is a panel the reader is looking at,
            and Cancel would be the header's ✕ said a second time.
          */}
          {hasDraft && (
            <footer className="flex shrink-0 items-center justify-end gap-2 border-t border-border px-6 py-4">
              <Button variant="secondary" onClick={onClose}>
                Cancel
              </Button>
              <Button onClick={save}>Save</Button>
            </footer>
          )}
        </div>
      </div>

      <Dialog
        open={removing !== null}
        onClose={() => setRemoving(null)}
        title="Remove this API call?"
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
      className="flex h-full w-[360px] shrink-0 flex-col border-l border-border bg-subtle"
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
