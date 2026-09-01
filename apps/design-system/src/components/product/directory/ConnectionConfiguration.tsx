'use client';

import * as React from 'react';
import AddOutlined from '@mui/icons-material/AddOutlined';
import EditOutlined from '@mui/icons-material/EditOutlined';
import DeleteOutline from '@mui/icons-material/DeleteOutline';
import {
  Button,
  Dialog,
  SettingsRow,
  SettingsStack,
  StatusChip,
  Switch,
  Tooltip,
  useToast,
  type StatusIntent,
} from '@ds/components';
import { PeekPanel, PeekSlot } from './PeekPanel';
import { ConnectionEventDrawer } from './ConnectionEventDrawer';
import { AttributeMappingDrawer } from './AttributeMappingDrawer';
import {
  EVENT_KINDS,
  deleteConnectionEvent,
  eventStatus,
  listConnectionEvents,
  missingPieces,
  saveConnectionEvent,
  type ConnectionEvent,
  type EventKind,
  type EventStatus,
} from '@/data/connection-events';
import type { AppAuthorization } from '@/data/provisioning-auth';

const STATUS: Record<EventStatus, { intent: StatusIntent; label: string }> = {
  ready: { intent: 'success', label: 'Connected' },
  partial: { intent: 'warning', label: 'Incomplete' },
  disabled: { intent: 'neutral', label: 'Disabled' },
};

const ICON_ACTION =
  'grid h-7 w-7 shrink-0 place-items-center rounded-md text-icon-subtle transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-subtle';

/**
 * Connection Configuration — the calls IGA makes once it can sign in.
 *
 * The catalog is fixed: one inbound/outbound row per event type. An event type
 * can hold several calls, so Configure opens a panel of that type's calls
 * rather than jumping straight into one — a slot with two calls has no honest
 * "the" event to edit. The panel takes width from the catalog instead of
 * covering it, so the next slot stays one click away.
 *
 * The switch runs the type: off keeps every call configured but stops them.
 */
export function ConnectionConfiguration({
  applicationId,
  applicationName,
  authorizations,
  onChanged,
}: {
  applicationId: string;
  applicationName: string;
  authorizations: AppAuthorization[];
  onChanged?: () => void;
}) {
  const toast = useToast();
  const [rows, setRows] = React.useState<ConnectionEvent[]>([]);
  const [openKind, setOpenKind] = React.useState<EventKind | null>(null);
  const [editing, setEditing] = React.useState<ConnectionEvent | null>(null);
  const [drawerKind, setDrawerKind] = React.useState<EventKind | null>(null);
  const [mapping, setMapping] = React.useState<ConnectionEvent | null>(null);
  const [removing, setRemoving] = React.useState<ConnectionEvent | null>(null);
  /** Switches the user has flipped but not yet saved, by event type. */
  const [pending, setPending] = React.useState<Partial<Record<EventKind, boolean>>>({});

  const refresh = React.useCallback(() => setRows(listConnectionEvents(applicationId)), [applicationId]);
  React.useEffect(() => refresh(), [refresh]);

  const eventsFor = (kind: EventKind) => rows.filter((r) => r.kind === kind);

  /** What the store says today — a type is on when any of its calls is. */
  const savedOn = (kind: EventKind) => eventsFor(kind).some((e) => e.enabled);
  /** What the switch shows: the staged value if there is one, else the store. */
  const isOn = (kind: EventKind) => pending[kind] ?? savedOn(kind);

  const dirty = Object.keys(pending).length;

  const addEvent = (kind: EventKind) => {
    setEditing(null);
    setDrawerKind(kind);
  };

  const toggleSlot = (kind: EventKind, on: boolean) => {
    if (eventsFor(kind).length === 0) {
      // Nothing to switch on yet — open the slot so there is something to enable.
      setOpenKind(kind);
      return;
    }
    setPending((p) => {
      const next = { ...p };
      // Flipped back to where it started, so there is nothing left to save.
      if (on === savedOn(kind)) delete next[kind];
      else next[kind] = on;
      return next;
    });
  };

  const saveToggles = () => {
    let changed = 0;
    for (const [kind, on] of Object.entries(pending) as [EventKind, boolean][]) {
      for (const e of eventsFor(kind)) {
        saveConnectionEvent({ ...e, enabled: on });
        changed += 1;
      }
    }
    setPending({});
    refresh();
    onChanged?.();
    toast.success(
      changed === 0
        ? 'Nothing to save.'
        : `${changed} ${changed === 1 ? 'call' : 'calls'} updated. Takes effect on the next sync.`,
    );
  };

  const confirmRemove = () => {
    if (!removing) return;
    deleteConnectionEvent(removing.id);
    // The staged switch for this type may now have no calls to apply to.
    setPending((p) => {
      const next = { ...p };
      delete next[removing.kind];
      return next;
    });
    setRemoving(null);
    refresh();
    onChanged?.();
    toast.success('Call removed. IGA no longer makes it.');
  };

  const slotRow = (slot: (typeof EVENT_KINDS)[number]) => {
    const events = eventsFor(slot.value);
    const on = isOn(slot.value);
    const open = openKind === slot.value;
    return (
      <SettingsRow
        key={slot.value}
        surface="subtle"
        title={slot.label}
        description={
          events.length === 0
            ? 'Not configured'
            : `${events.length} ${events.length === 1 ? 'call' : 'calls'}`
        }
      >
        <Button
          variant="secondary"
          size="xs"
          aria-label={`Configure ${slot.label}`}
          aria-expanded={open}
          onClick={() => setOpenKind(open ? null : slot.value)}
        >
          Configure
        </Button>
        <Switch
          checked={on}
          onChange={(e) => toggleSlot(slot.value, e.target.checked)}
          inputProps={{ 'aria-label': `${on ? 'Disable' : 'Enable'} ${slot.label}` }}
        />
      </SettingsRow>
    );
  };

  const inbound = EVENT_KINDS.filter((s) => s.direction === 'inbound');
  const outbound = EVENT_KINDS.filter((s) => s.direction === 'outbound');
  const openSlot = EVENT_KINDS.find((s) => s.value === openKind);
  const openEvents = openKind ? eventsFor(openKind) : [];

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* Switching a type on or off is a batch: you set the whole catalog the way
          you want the connector to run, then commit it once. Everything reached
          through Configure saves itself — those drawers have their own Save. */}
      <div className="mb-3 flex shrink-0 flex-wrap items-center gap-3">
        <h2 className="text-h5 text-text-primary">Events</h2>
        {/* Beside the heading rather than inside it: a heading that rewrites
            itself stops being a landmark. Silent until there is something to say. */}
        <p role="status" className="text-body-sm text-text-secondary">
          {dirty > 0 && `${dirty} unsaved ${dirty === 1 ? 'change' : 'changes'}`}
        </p>
        <div className="ml-auto">
          <Button disabled={dirty === 0} onClick={saveToggles}>
            Save changes
          </Button>
        </div>
      </div>

      <div className="flex min-h-0 flex-1">
        <div className="ds-scroll min-h-0 min-w-0 flex-1 overflow-y-auto">
          <h3 className="mb-2 text-overline text-text-tertiary">Inbound</h3>
          <SettingsStack>{inbound.map(slotRow)}</SettingsStack>
          <h3 className="mb-2 mt-5 text-overline text-text-tertiary">Outbound</h3>
          <SettingsStack>{outbound.map(slotRow)}</SettingsStack>
        </div>

        <PeekSlot open={openSlot != null} width={400}>
          {openSlot && (
            <PeekPanel
              title={openSlot.label}
              subtitle={openSlot.direction === 'inbound' ? 'Inbound' : 'Outbound'}
              onClose={() => setOpenKind(null)}
              footer={
                <Button
                  fullWidth
                  variant="secondary"
                  startIcon={<AddOutlined />}
                  onClick={() => addEvent(openSlot.value)}
                >
                  Add event
                </Button>
              }
            >
              {openEvents.length === 0 ? (
                <div className="px-2 py-10 text-center">
                  <p className="text-body-sm-strong text-text-primary">No calls yet</p>
                  <p className="mt-1 text-caption text-text-secondary">
                    Add the API call IGA makes to {applicationName} for this event.
                  </p>
                </div>
              ) : (
                <ul className="space-y-2 py-2">
                  {openEvents.map((e) => (
                    <EventCard
                      key={e.id}
                      event={e}
                      enabled={isOn(e.kind)}
                      onEdit={() => {
                        setEditing(e);
                        setDrawerKind(e.kind);
                      }}
                      onMap={() => setMapping(e)}
                      onRemove={() => setRemoving(e)}
                    />
                  ))}
                </ul>
              )}
            </PeekPanel>
          )}
        </PeekSlot>
      </div>

      <ConnectionEventDrawer
        open={drawerKind !== null}
        applicationId={applicationId}
        authorizations={authorizations}
        existing={editing}
        initialKind={drawerKind ?? undefined}
        onClose={() => {
          setDrawerKind(null);
          setEditing(null);
        }}
        onSaved={() => {
          setDrawerKind(null);
          setEditing(null);
          refresh();
          onChanged?.();
        }}
      />

      <AttributeMappingDrawer
        open={mapping !== null}
        event={mapping}
        applicationName={applicationName}
        onClose={() => setMapping(null)}
        onSaved={() => {
          setMapping(null);
          refresh();
          onChanged?.();
        }}
      />

      <Dialog
        open={removing !== null}
        onClose={() => setRemoving(null)}
        title="Remove this call?"
        confirmLabel="Remove"
        tone="danger"
        onConfirm={confirmRemove}
      >
        {removing?.name} stops running immediately and its attribute mapping is deleted. The accounts and entitlements
        it already imported are kept.
      </Dialog>
    </div>
  );
}

/**
 * One configured call. A grey well rather than a Card — the panel around it is
 * already the bordered white box, and a card inside a card states the boundary
 * twice.
 */
function EventCard({
  event,
  enabled,
  onEdit,
  onMap,
  onRemove,
}: {
  event: ConnectionEvent;
  /** The slot switch as it currently reads, staged changes included, so the
   *  chip cannot say Connected while the switch beside it says off. */
  enabled: boolean;
  onEdit: () => void;
  onMap: () => void;
  onRemove: () => void;
}) {
  const status = STATUS[eventStatus({ ...event, enabled })];
  const gaps = missingPieces(event);
  const mapped = event.attributes.length;

  return (
    <li className="rounded-md bg-subtle p-3">
      <div className="flex items-start justify-between gap-2">
        <p className="min-w-0 flex-1 truncate text-body-sm-strong text-text-primary">{event.name}</p>
        <div className="flex shrink-0 items-center gap-0.5">
          <Tooltip title="Edit call">
            <button
              type="button"
              onClick={onEdit}
              aria-label={`Edit ${event.name}`}
              className={`${ICON_ACTION} hover:bg-surface hover:text-text-brand`}
            >
              <EditOutlined sx={{ fontSize: 17 }} />
            </button>
          </Tooltip>
          <Tooltip title="Remove call">
            <button
              type="button"
              onClick={onRemove}
              aria-label={`Remove ${event.name}`}
              className={`${ICON_ACTION} hover:bg-surface hover:text-danger`}
            >
              <DeleteOutline sx={{ fontSize: 17 }} />
            </button>
          </Tooltip>
        </div>
      </div>

      <p className="mt-0.5 truncate text-caption text-text-secondary">
        <span className="tabular-nums">{event.method}</span>
        {' · '}
        {event.url.trim() === '' ? <span className="text-text-tertiary">No endpoint yet</span> : event.url}
      </p>

      <div className="mt-2.5 flex flex-wrap items-center gap-2">
        <StatusChip intent={status.intent} label={status.label} />
        <button
          type="button"
          onClick={onMap}
          className="text-caption-medium text-text-link hover:underline"
        >
          {mapped === 0 ? 'Map attributes' : `${mapped} mapped`}
        </button>
      </div>

      {gaps.length > 0 && enabled && (
        <p className="mt-2 text-caption text-text-secondary">Still needs {gaps.join(' and ')}.</p>
      )}
    </li>
  );
}
