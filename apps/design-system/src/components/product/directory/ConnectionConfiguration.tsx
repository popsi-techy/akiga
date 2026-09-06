'use client';

import * as React from 'react';
import {
  Button,
  SettingsRow,
  SettingsStack,
  Switch,
  useToast,
} from '@ds/components';
import { ConnectionEventDrawer } from './ConnectionEventDrawer';
import {
  EVENT_KINDS,
  listConnectionEvents,
  saveConnectionEvent,
  type ConnectionEvent,
  type EventKind,
} from '@/data/connection-events';
import { type AppAuthorization } from '@/data/provisioning-auth';

/**
 * Connection Configuration — the calls IGA makes once it can sign in.
 *
 * The catalog is fixed: one inbound/outbound row per event type. Configure
 * opens that type's drawer — calls on the left, the selected call on the
 * right — so adding and editing stay on one surface.
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
  const [drawerKind, setDrawerKind] = React.useState<EventKind | null>(null);
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

  const toggleSlot = (kind: EventKind, on: boolean) => {
    if (eventsFor(kind).length === 0) {
      setDrawerKind(kind);
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

  const slotRow = (slot: (typeof EVENT_KINDS)[number]) => {
    const events = eventsFor(slot.value);
    const on = isOn(slot.value);
    const open = drawerKind === slot.value;
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
          onClick={() => setDrawerKind(open ? null : slot.value)}
          sx={
            open
              ? {
                  borderColor: 'var(--ds-color-brand-primary)',
                  backgroundColor: 'var(--ds-color-surface-default)',
                  '&:hover': {
                    borderColor: 'var(--ds-color-brand-primary)',
                    backgroundColor: 'var(--ds-color-surface-default)',
                  },
                }
              : undefined
          }
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

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="mb-3 flex shrink-0 flex-wrap items-center gap-3">
        <h2 className="text-h5 text-text-primary">Events</h2>
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

      <ConnectionEventDrawer
        open={drawerKind !== null}
        kind={drawerKind}
        events={drawerKind ? eventsFor(drawerKind) : []}
        applicationId={applicationId}
        applicationName={applicationName}
        authorizations={authorizations}
        onClose={() => setDrawerKind(null)}
        onChanged={() => {
          refresh();
          onChanged?.();
        }}
      />
    </div>
  );
}
