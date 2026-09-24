'use client';

import * as React from 'react';
import { Button, SettingsRow, SettingsStack, StatusChip } from '@ds/components';
import { EventAttributeMappingDrawer } from './EventAttributeMappingDrawer';
import { IdentityClassificationCardV2 } from './IdentityClassificationCardV2';
import {
  SCIM_EVENT_KINDS,
  listConnectionEvents,
  type ConnectionEvent,
  type EventKind,
} from '@/data/connection-events';

/**
 * Advanced attribute mapping — identity classification plus the same three
 * mapping slots SCIM Connection configuration uses: User import, Group Import,
 * and Group membership. HTTP calls stay on Connection configuration; this
 * surface only maps fields.
 */
export function AdvancedAttributeMappingPanel({
  applicationId,
  applicationName,
  onChanged,
}: {
  applicationId: string;
  applicationName: string;
  onChanged?: () => void;
}) {
  const [rows, setRows] = React.useState<ConnectionEvent[]>([]);
  const [mappingKind, setMappingKind] = React.useState<EventKind | null>(null);

  const refresh = React.useCallback(
    () => setRows(listConnectionEvents(applicationId)),
    [applicationId],
  );
  React.useEffect(() => refresh(), [refresh]);

  const eventsFor = (kind: EventKind) => rows.filter((r) => r.kind === kind);

  const slotRow = (slot: { value: EventKind; label: string; description?: string }) => {
    const events = eventsFor(slot.value);
    const mapped = events.reduce((n, e) => n + e.attributes.length, 0);
    const configured = mapped > 0;
    return (
      <SettingsRow
        key={slot.value}
        surface="subtle"
        title={slot.label}
        description={slot.description}
      >
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
      </SettingsRow>
    );
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="ds-scroll min-h-0 flex-1 overflow-y-auto">
        <section className="mb-8">
          <h2 className="text-h5 text-text-primary">Identity classification</h2>
          <div className="mt-4">
            <IdentityClassificationCardV2 applicationId={applicationId} onSaved={onChanged} />
          </div>
        </section>
        <div className="mb-3 flex shrink-0 flex-wrap items-center gap-3">
          <h2 className="text-h5 text-text-primary">Events</h2>
        </div>
        <SettingsStack>{SCIM_EVENT_KINDS.map(slotRow)}</SettingsStack>
      </div>

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
