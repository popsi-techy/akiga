'use client';

import * as React from 'react';
import AddOutlined from '@mui/icons-material/AddOutlined';
import DeleteOutline from '@mui/icons-material/DeleteOutline';
import EditOutlined from '@mui/icons-material/EditOutlined';
import KeyOutlined from '@mui/icons-material/KeyOutlined';
import LinkOutlined from '@mui/icons-material/LinkOutlined';
import TuneOutlined from '@mui/icons-material/TuneOutlined';
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
  saveConnectionEvent,
  type ConnectionEvent,
  type EventKind,
  type EventStatus,
} from '@/data/connection-events';
import { METHOD_LABEL, type AppAuthorization } from '@/data/provisioning-auth';

// "Ready", not "Connected": the Authorization tab already spends "Connected" on
// whether credentials work, and a call can be unrunnable on a working connection.
const STATUS: Record<EventStatus, { intent: StatusIntent; label: string }> = {
  ready: { intent: 'success', label: 'Ready' },
  partial: { intent: 'warning', label: 'Incomplete' },
  disabled: { intent: 'neutral', label: 'Disabled' },
};

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

  /** Named the way the event drawer's picker names it, so the card and the field
   *  behind it agree. `null` when the call has no authorization, or points at one
   *  that has since been deleted — both are the same gap to the reader. */
  const authLabel = (id: string | null) => {
    const auth = authorizations.find((a) => a.id === id);
    return auth ? METHOD_LABEL[auth.method] : null;
  };

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
      <div className="flex min-h-0 flex-1">
        {/* Heading, dirty count, and Save are inside the left column, not above
            both of it and the panel. They belong to the catalog — Save commits
            the switches in the list, and nothing in the panel — so they narrow
            with it when a slot opens. It also stops the panel starting a row
            lower than the thing it was opened from. */}
        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          {/* Switching a type on or off is a batch: you set the whole catalog the
              way you want the connector to run, then commit it once. Everything
              reached through Configure saves itself — those drawers have their
              own Save. */}
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

          <div className="ds-scroll min-h-0 flex-1 overflow-y-auto">
            <h3 className="mb-2 text-overline text-text-tertiary">Inbound</h3>
            <SettingsStack>{inbound.map(slotRow)}</SettingsStack>
            <h3 className="mb-2 mt-5 text-overline text-text-tertiary">Outbound</h3>
            <SettingsStack>{outbound.map(slotRow)}</SettingsStack>
          </div>
        </div>

        <PeekSlot open={openSlot != null} width={300}>
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
                      authLabel={authLabel(e.authorizationId)}
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
        applicationName={applicationName}
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
 * One line of the card's middle block: an icon, and what this call has for that
 * requirement. Missing turns the line amber rather than grey, so the reason the
 * chip says Incomplete is the line your eye lands on — grey would file the gap
 * next to the facts that are fine.
 */
function Fact({ icon, children, missing = false }: { icon: React.ReactNode; children: React.ReactNode; missing?: boolean }) {
  return (
    <li className={`flex items-center gap-2 ${missing ? 'text-warning' : 'text-text-secondary'}`}>
      <span className={`shrink-0 ${missing ? '' : 'text-icon-subtle'}`} aria-hidden>
        {icon}
      </span>
      <span className="min-w-0 truncate text-caption">{children}</span>
    </li>
  );
}

/**
 * One configured call.
 *
 * A sunken inset, not a Card: the panel around it is already the bordered white
 * box, and the visual language forbids a card inside a card (§3.2).
 *
 * Three blocks: who it is and how it is doing, what it is made of, what you can
 * do to it. The middle block is the trick — its three lines are exactly the
 * three things `missingPieces` checks, so the card explains its own status
 * instead of restating it in prose. Nothing here is a sentence to read; it is a
 * short column to scan, and an amber line is the gap.
 *
 * Actions sit on the surface rather than in a kebab: there are three, the panel
 * holds a handful of cards, and mapping is the one people come here to do.
 */
function EventCard({
  event,
  enabled,
  authLabel,
  onEdit,
  onMap,
  onRemove,
}: {
  event: ConnectionEvent;
  /** The slot switch as it currently reads, staged changes included, so the
   *  chip cannot say Ready while the switch beside it says off. */
  enabled: boolean;
  /** The authorization this call signs in with, named as the drawer names it. */
  authLabel: string | null;
  onEdit: () => void;
  onMap: () => void;
  onRemove: () => void;
}) {
  const status = STATUS[eventStatus({ ...event, enabled })];
  const mapped = event.attributes.length;
  const url = event.url.trim();

  return (
    <li className="rounded-lg bg-sunken px-4 py-3">
      <div className="flex items-start gap-2">
        <h4 className="min-w-0 flex-1 truncate text-body-sm-strong text-text-primary">{event.name}</h4>
        <StatusChip intent={status.intent} label={status.label} />
      </div>

      <ul className="mt-2.5 space-y-1.5">
        <Fact icon={<LinkOutlined sx={{ fontSize: 16 }} />} missing={url === ''}>
          {url === '' ? 'No endpoint set' : `${event.method} · ${url}`}
        </Fact>
        <Fact icon={<KeyOutlined sx={{ fontSize: 16 }} />} missing={authLabel === null}>
          {authLabel ?? 'No authorization'}
        </Fact>
        <Fact icon={<TuneOutlined sx={{ fontSize: 16 }} />} missing={mapped === 0}>
          {mapped === 0 ? 'No attributes mapped' : `${mapped} ${mapped === 1 ? 'attribute' : 'attributes'} mapped`}
        </Fact>
      </ul>

      {/* No leading icon on the labelled button: at the panel's 300px the row is
          ~226px wide, and the icon is the 20px that makes "Map attributes" wrap
          inside its own border. The two icon buttons beside it carry the icon
          language anyway. */}
      <div className="mt-3 flex items-center gap-2">
        <Button variant="secondary" size="xs" className="whitespace-nowrap" onClick={onMap}>
          Map attributes
        </Button>
        {/* Named for the row, not the icon: a screen reader running the panel
            hears "Edit Accounts Fetch", not eight identical "Edit"s. */}
        <div className="ml-auto flex items-center gap-2">
          <Tooltip title="Edit call">
            <Button iconOnly variant="secondary" size="xs" aria-label={`Edit ${event.name}`} onClick={onEdit}>
              <EditOutlined sx={{ fontSize: 16 }} />
            </Button>
          </Tooltip>
          <Tooltip title="Remove call">
            <Button iconOnly variant="secondary" size="xs" aria-label={`Remove ${event.name}`} onClick={onRemove}>
              <DeleteOutline sx={{ fontSize: 16 }} />
            </Button>
          </Tooltip>
        </div>
      </div>
    </li>
  );
}
