'use client';

import * as React from 'react';
import { Button, SettingsRow, SettingsStack, Switch, Tooltip, useToast } from '@ds/components';
import {
  EVENT_KINDS,
  SCIM_EVENT_KINDS,
  ensureConnectionEventForKind,
  listConnectionEvents,
  saveConnectionEvent,
  type ConnectionEvent,
  type EventKind,
} from '@/data/connection-events';
import { applicationIsScimProvisioned } from '@/data/scim-inbound';

/**
 * Manage connections — run or pause each event type. Off keeps the setup;
 * the calls just stop. REST types use the inbound/outbound catalog;
 * SCIM/UMAPI/AD use the three mapping events.
 */
export function ManageConnections({
  applicationId,
  onChanged,
}: {
  applicationId: string;
  onChanged?: () => void;
}) {
  const toast = useToast();
  const [rows, setRows] = React.useState<ConnectionEvent[]>([]);
  const [pending, setPending] = React.useState<Partial<Record<EventKind, boolean>>>({});
  const [scimProvisioned, setScimProvisioned] = React.useState(false);
  React.useEffect(() => {
    setScimProvisioned(applicationIsScimProvisioned(applicationId));
  }, [applicationId]);

  const refresh = React.useCallback(() => setRows(listConnectionEvents(applicationId)), [applicationId]);
  React.useEffect(() => refresh(), [refresh]);

  const eventsFor = (kind: EventKind) => rows.filter((r) => r.kind === kind);
  const savedOn = (kind: EventKind) => eventsFor(kind).some((e) => e.enabled);
  const isOn = (kind: EventKind) => pending[kind] ?? savedOn(kind);
  const dirty = Object.keys(pending).length;

  const toggleSlot = (kind: EventKind, on: boolean) => {
    if (!scimProvisioned && eventsFor(kind).length === 0) return;
    setPending((p) => {
      const next = { ...p };
      if (on === savedOn(kind)) delete next[kind];
      else next[kind] = on;
      return next;
    });
  };

  const saveToggles = () => {
    let changed = 0;
    for (const [kind, on] of Object.entries(pending) as [EventKind, boolean][]) {
      let events = eventsFor(kind);
      if (events.length === 0 && scimProvisioned) {
        events = [ensureConnectionEventForKind(applicationId, kind)];
      }
      for (const e of events) {
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

  const slotRow = (slot: { value: EventKind; label: string; description?: string }) => {
    const configured = scimProvisioned || eventsFor(slot.value).length > 0;
    const on = isOn(slot.value);
    const switchControl = (
      <Switch
        checked={on}
        disabled={!configured}
        onChange={(e) => toggleSlot(slot.value, e.target.checked)}
        inputProps={{
          'aria-label': configured
            ? `${on ? 'Disable' : 'Enable'} ${slot.label}`
            : `${slot.label} is not configured yet`,
        }}
      />
    );
    return (
      <SettingsRow
        key={slot.value}
        surface="subtle"
        title={slot.label}
        description={slot.description}
      >
        {configured ? (
          switchControl
        ) : (
          <Tooltip title="Set this up under Connection configuration first.">
            <span className="inline-flex">{switchControl}</span>
          </Tooltip>
        )}
      </SettingsRow>
    );
  };

  const inbound = EVENT_KINDS.filter((s) => s.direction === 'inbound');
  const outbound = EVENT_KINDS.filter((s) => s.direction === 'outbound');

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="mb-3 flex shrink-0 flex-wrap items-center gap-3">
        <h2 className="text-h5 text-text-primary">Connections</h2>
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
        {scimProvisioned ? (
          <SettingsStack>{SCIM_EVENT_KINDS.map(slotRow)}</SettingsStack>
        ) : (
          <>
            <h3 className="mb-2 text-overline text-text-tertiary">Inbound</h3>
            <SettingsStack>{inbound.map(slotRow)}</SettingsStack>
            <h3 className="mb-2 mt-5 text-overline text-text-tertiary">Outbound</h3>
            <SettingsStack>{outbound.map(slotRow)}</SettingsStack>
          </>
        )}
      </div>
    </div>
  );
}
