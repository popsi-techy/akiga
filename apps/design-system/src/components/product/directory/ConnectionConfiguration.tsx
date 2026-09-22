'use client';

import * as React from 'react';
import {
  Button,
  Card,
  SettingsRow,
  SettingsStack,
  StatusChip,
  Switch,
  useToast,
} from '@ds/components';
import { ConnectionEventDrawer } from './ConnectionEventDrawer';
import { EventAttributeMappingDrawer } from './EventAttributeMappingDrawer';
import { IdentityClassificationCard } from './IdentityClassificationCard';
import { IdentityClassificationCardV2 } from './IdentityClassificationCardV2';
import { IdentityClassificationCardV3 } from './IdentityClassificationCardV3';
import {
  EVENT_KINDS,
  SCIM_EVENT_KINDS,
  listConnectionEvents,
  saveConnectionEvent,
  type ConnectionEvent,
  type EventKind,
} from '@/data/connection-events';
import { type AppAuthorization } from '@/data/provisioning-auth';
import { applicationIsScimProvisioned } from '@/data/scim-inbound';

/**
 * Connection Configuration — the calls IGA makes once it can sign in.
 *
 * The catalog is fixed: one inbound/outbound row per event type on REST
 * connectors. SCIM/UMAPI types show three unlabeled slots — User import,
 * Group Import, Group membership — because those types do not split work
 * into HTTP direction.
 *
 * Configure opens that type's drawer — calls on the left, the selected call
 * on the right — so adding and editing stay on one surface.
 *
 * On SCIM/UMAPI types, identity classification sits above that catalog:
 * those types have no Advanced rail item, and mapping already lives on each
 * event.
 *
 * The switch runs the type on REST connectors: off keeps every call configured
 * but stops them. SCIM/UMAPI rows have no switch and no Save — mapping is the
 * only setup those types have.
 */
export function ConnectionConfiguration({
  applicationId,
  applicationName,
  authorizations,
  onChanged,
  classificationVersion = 'v1',
}: {
  applicationId: string;
  applicationName: string;
  authorizations: AppAuthorization[];
  onChanged?: () => void;
  /** Which identity-classification layout to render (SCIM/UMAPI only). */
  classificationVersion?: 'v1' | 'v2' | 'v3';
}) {
  const toast = useToast();
  const [rows, setRows] = React.useState<ConnectionEvent[]>([]);
  const [drawerKind, setDrawerKind] = React.useState<EventKind | null>(null);
  /** The event whose attribute mapping is open — SCIM/UMAPI types only. */
  const [mappingKind, setMappingKind] = React.useState<EventKind | null>(null);
  /** Switches the user has flipped but not yet saved, by event type. */
  const [pending, setPending] = React.useState<Partial<Record<EventKind, boolean>>>({});
  /**
   * Whether this application provisions over SCIM/UMAPI. Read after mount —
   * it resolves from the onboarding store, which only exists on the client.
   */
  const [scimProvisioned, setScimProvisioned] = React.useState(false);
  React.useEffect(() => {
    setScimProvisioned(applicationIsScimProvisioned(applicationId));
  }, [applicationId]);

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

  const slotRow = (slot: { value: EventKind; label: string; description?: string }) => {
    const events = eventsFor(slot.value);
    const on = isOn(slot.value);
    const open = drawerKind === slot.value;
    const mapped = events.reduce((n, e) => n + e.attributes.length, 0);
    const configured = mapped > 0;
    return (
      <SettingsRow
        key={slot.value}
        surface="subtle"
        title={slot.label}
        description={
          scimProvisioned
            ? slot.description
            : events.length === 0
              ? 'Not configured'
              : `${events.length} ${events.length === 1 ? 'call' : 'calls'}`
        }
      >
        {scimProvisioned ? (
          <>
            <StatusChip
              intent={configured ? 'success' : 'warning'}
              label={`${mapped} ${mapped === 1 ? 'attribute' : 'attributes'} mapped`}
            />
            <Button
              variant="secondary"
              size="xs"
              aria-label={`${configured ? 'Edit' : 'Map'} attributes for ${slot.label}`}
              onClick={() => setMappingKind(slot.value)}
            >
              {configured ? 'Edit attributes' : 'Map attributes'}
            </Button>
          </>
        ) : (
          <>
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
          </>
        )}
      </SettingsRow>
    );
  };

  const inbound = EVENT_KINDS.filter((s) => s.direction === 'inbound');
  const outbound = EVENT_KINDS.filter((s) => s.direction === 'outbound');

  const eventsToolbar = (
    <div className="mb-3 flex shrink-0 flex-wrap items-center gap-3">
      <h2 className="text-h5 text-text-primary">Events</h2>
      {!scimProvisioned && (
        <>
          <p role="status" className="text-body-sm text-text-secondary">
            {dirty > 0 && `${dirty} unsaved ${dirty === 1 ? 'change' : 'changes'}`}
          </p>
          <div className="ml-auto">
            <Button disabled={dirty === 0} onClick={saveToggles}>
              Save changes
            </Button>
          </div>
        </>
      )}
    </div>
  );

  const eventsStacks = scimProvisioned ? (
    <SettingsStack>{SCIM_EVENT_KINDS.map(slotRow)}</SettingsStack>
  ) : (
    <>
      <h3 className="mb-2 text-overline text-text-tertiary">Inbound</h3>
      <SettingsStack>{inbound.map(slotRow)}</SettingsStack>
      <h3 className="mb-2 mt-5 text-overline text-text-tertiary">Outbound</h3>
      <SettingsStack>{outbound.map(slotRow)}</SettingsStack>
    </>
  );

  return (
    <div className="flex h-full min-h-0 flex-col">
      {scimProvisioned ? (
        // SCIM/UMAPI: classification sits with the connection, above the event
        // catalog. There is no Advanced nav on these types — mapping lives on
        // each event — so this is the only place identity typing is set.
        <div className="ds-scroll min-h-0 flex-1 overflow-y-auto">
          <section className="mb-8">
            <h2 className="text-h5 text-text-primary">Identity classification</h2>
            {classificationVersion === 'v2' ? (
              // v2 owns its own grey rows, so it needs no bordered card around it.
              <div className="mt-4">
                <IdentityClassificationCardV2 applicationId={applicationId} onSaved={onChanged} />
              </div>
            ) : classificationVersion === 'v3' ? (
              <div className="mt-4">
                <IdentityClassificationCardV3
                  applicationId={applicationId}
                  applicationName={applicationName}
                  onSaved={onChanged}
                />
              </div>
            ) : (
              <Card padding="md" className="mt-4">
                <IdentityClassificationCard applicationId={applicationId} onSaved={onChanged} />
              </Card>
            )}
          </section>
          {eventsToolbar}
          {eventsStacks}
        </div>
      ) : (
        <>
          {eventsToolbar}
          <div className="ds-scroll min-h-0 flex-1 overflow-y-auto">{eventsStacks}</div>
        </>
      )}

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

      <EventAttributeMappingDrawer
        open={mappingKind !== null}
        kind={mappingKind}
        applicationId={applicationId}
        applicationName={applicationName}
        onClose={() => setMappingKind(null)}
        onChanged={() => {
          refresh();
          onChanged?.();
        }}
      />
    </div>
  );
}
