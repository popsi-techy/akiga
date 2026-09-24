'use client';

import * as React from 'react';
import { Button, SettingsRow, SettingsStack, StatusChip } from '@ds/components';
import { ConnectionEventDrawer } from './ConnectionEventDrawer';
import { EventAttributeMappingDrawer } from './EventAttributeMappingDrawer';
import { IdentityClassificationCardV2 } from './IdentityClassificationCardV2';
import {
  EVENT_KINDS,
  SCIM_EVENT_KINDS,
  listConnectionEvents,
  type ConnectionEvent,
  type EventKind,
} from '@/data/connection-events';
import { type AppAuthorization } from '@/data/provisioning-auth';
import { applicationIsScimProvisioned } from '@/data/scim-inbound';

/**
 * Connection Configuration — the calls IGA makes once it can sign in.
 *
 * The catalog is fixed: one inbound/outbound row per event type on REST
 * connectors. Configure opens that type's drawer. Enable and disable live on
 * Manage connections so this surface stays setup, not run/pause.
 *
 * SCIM/UMAPI types show three unlabeled slots — User import, Group Import,
 * Group membership — with identity classification above them. Those types have
 * no Advanced rail item and no Manage connections hop; mapping is the only
 * setup they have.
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
  const [rows, setRows] = React.useState<ConnectionEvent[]>([]);
  const [drawerKind, setDrawerKind] = React.useState<EventKind | null>(null);
  const [mappingKind, setMappingKind] = React.useState<EventKind | null>(null);
  const [scimProvisioned, setScimProvisioned] = React.useState(false);
  React.useEffect(() => {
    setScimProvisioned(applicationIsScimProvisioned(applicationId));
  }, [applicationId]);

  const refresh = React.useCallback(() => setRows(listConnectionEvents(applicationId)), [applicationId]);
  React.useEffect(() => refresh(), [refresh]);

  const eventsFor = (kind: EventKind) => rows.filter((r) => r.kind === kind);

  const slotRow = (slot: { value: EventKind; label: string; description?: string }) => {
    const events = eventsFor(slot.value);
    const open = drawerKind === slot.value;
    const mapped = events.reduce((n, e) => n + e.attributes.length, 0);
    const configured = mapped > 0;
    return (
      <SettingsRow
        key={slot.value}
        surface="subtle"
        title={slot.label}
        description={slot.description}
      >
        {scimProvisioned ? (
          <>
            <StatusChip
              intent={configured ? 'success' : 'warning'}
              dot={false}
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
            <StatusChip
              intent={events.length > 0 ? 'success' : 'warning'}
              dot={false}
              label={
                events.length === 0
                  ? 'Not configured'
                  : `${events.length} ${events.length === 1 ? 'call' : 'calls'}`
              }
            />
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
        <div className="ds-scroll min-h-0 flex-1 overflow-y-auto">
          <section className="mb-8">
            <h2 className="text-h5 text-text-primary">Identity classification</h2>
            <div className="mt-4">
              <IdentityClassificationCardV2 applicationId={applicationId} onSaved={onChanged} />
            </div>
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
