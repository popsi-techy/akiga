'use client';

import * as React from 'react';
import TuneOutlined from '@mui/icons-material/TuneOutlined';
import RestartAltOutlined from '@mui/icons-material/RestartAltOutlined';
import { Button, Drawer, Tooltip, useToast } from '@ds/components';
import {
  ensureConnectionEventForKind,
  getDefaultMapping,
  scimEventLabel,
  mappingComplete,
  saveConnectionEvent,
  setDefaultMapping,
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
  const titleKind = displayKind ? scimEventLabel(displayKind) : 'Event';

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

  /** Load the default mapping back into the editor (unsaved until Save mapping). */
  const resetToDefaults = () => {
    if (!displayKind) return;
    const defaults = getDefaultMapping(applicationId, displayKind);
    setRows(defaults.length > 0 ? defaults : [blankMappingRow(0)]);
    setTouched(false);
    toast.info('Loaded the default mapping. Save to apply it.');
  };

  /** Promote the current mapping to be this event's default going forward. */
  const setAsDefault = () => {
    setTouched(true);
    if (incomplete.length > 0) {
      toast.error('Finish the mapping before setting it as the default.');
      return;
    }
    if (!displayKind) return;
    setDefaultMapping(applicationId, displayKind, started);
    toast.success('Saved as the default mapping for this event.');
  };

  return (
    <Drawer
      open={open}
      onClose={onClose}
      icon={<TuneOutlined sx={{ fontSize: 22 }} />}
      title={`${titleKind} attribute mapping`}
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
      disablePadding
    >
      {/* The editor is its own card with a pinned header and footer, so the drawer body
          does not scroll — it just gives the card room to breathe on every side. The
          mapping-level actions sit directly above the card, no divider between. */}
      <div className="flex min-h-0 flex-1 flex-col px-6 pb-5 pt-4">
        <div className="mb-3 flex shrink-0 items-center justify-end gap-2">
          <Tooltip title="Reset to defaults">
            <Button
              variant="tertiary"
              size="sm"
              iconOnly
              aria-label="Reset to defaults"
              onClick={resetToDefaults}
            >
              <RestartAltOutlined sx={{ fontSize: 18 }} />
            </Button>
          </Tooltip>
          <Button variant="secondary" size="sm" onClick={setAsDefault}>
            Save as default template
          </Button>
        </div>
        <AttributeMappingEditor
          rows={rows}
          onChange={setRows}
          applicationName={applicationName}
          touched={touched}
          fillHeight
        />
      </div>
    </Drawer>
  );
}
