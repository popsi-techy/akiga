'use client';

import * as React from 'react';
import TuneOutlined from '@mui/icons-material/TuneOutlined';
import { Button, Drawer, useToast } from '@ds/components';
import {
  ensureConnectionEventForKind,
  eventKindMeta,
  mappingComplete,
  saveConnectionEvent,
  type AttributeMapping,
  type ConnectionEvent,
  type EventKind,
} from '@/data/connection-events';
import { AttributeMappingEditor, blankMappingRow } from './AttributeMappingEditor';

/**
 * Attribute mapping for one event of a SCIM-provisioned application.
 *
 * These types push over SCIM/UMAPI, so there is no HTTP call to configure — the
 * only thing to set on an event is how its fields map to IGA attributes. This is
 * the standalone editor from the event drawer's Mapping tab, saving into the same
 * per-kind connection event, so a later switch of app type keeps the mapping.
 */
export function EventAttributeMappingDrawer({
  open,
  kind,
  applicationId,
  applicationName,
  onClose,
  onChanged,
}: {
  open: boolean;
  kind: EventKind | null;
  applicationId: string;
  applicationName: string;
  onClose: () => void;
  onChanged: () => void;
}) {
  const toast = useToast();
  // Kept across close so the title/subtitle do not flash blank on the way out.
  const kindRef = React.useRef<EventKind | null>(null);
  if (kind) kindRef.current = kind;
  const displayKind = kind ?? kindRef.current;
  const meta = displayKind ? eventKindMeta(displayKind) : null;

  const [event, setEvent] = React.useState<ConnectionEvent | null>(null);
  const [rows, setRows] = React.useState<AttributeMapping[]>([]);
  const [touched, setTouched] = React.useState(false);
  const openedFor = React.useRef<EventKind | null>(null);

  React.useEffect(() => {
    if (!open || !kind) {
      if (!open) openedFor.current = null;
      return;
    }
    // Only load when this kind's drawer opens — a save refresh must not wipe edits.
    if (openedFor.current === kind) return;
    openedFor.current = kind;
    const e = ensureConnectionEventForKind(applicationId, kind);
    setEvent(e);
    setRows(e.attributes.length > 0 ? e.attributes.map((a) => ({ ...a })) : [blankMappingRow(0)]);
    setTouched(false);
  }, [open, kind, applicationId]);

  const started = rows.filter(
    (r) => r.applicationField.trim() !== '' || r.igaAttribute !== '' || r.expression.trim() !== '',
  );
  const incomplete = started.filter((r) => !mappingComplete(r));

  const save = () => {
    setTouched(true);
    if (incomplete.length > 0) {
      toast.error('Some attribute mappings are still incomplete.');
      return;
    }
    if (!event) return;
    saveConnectionEvent({ ...event, attributes: started });
    toast.success(
      started.length === 0
        ? 'Mapping cleared for this event.'
        : `${started.length} ${started.length === 1 ? 'attribute' : 'attributes'} mapped.`,
    );
    onChanged();
    onClose();
  };

  return (
    <Drawer
      open={open}
      onClose={onClose}
      icon={<TuneOutlined sx={{ fontSize: 22 }} />}
      title={`${meta?.label ?? 'Event'} attribute mapping`}
      subtitle={`Map ${applicationName}'s fields to IGA attributes for this event.`}
      width={860}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={save}>Save mapping</Button>
        </>
      }
    >
      <AttributeMappingEditor
        rows={rows}
        onChange={setRows}
        applicationName={applicationName}
        touched={touched}
      />
    </Drawer>
  );
}
