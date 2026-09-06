'use client';

import * as React from 'react';
import Tune from '@mui/icons-material/Tune';
import { Button, Drawer, useToast } from '@ds/components';
import { mappingComplete, saveConnectionEvent, type AttributeMapping, type ConnectionEvent } from '@/data/connection-events';
import { AttributeMappingEditor, blankMappingRow } from './AttributeMappingEditor';

/**
 * Attribute mapping — for each field this application expects, where its value
 * comes from. A wide drawer so a row of four related fields stays on one line.
 */
export function AttributeMappingDrawer({
  open,
  event,
  applicationName,
  onClose,
  onSaved,
}: {
  open: boolean;
  event: ConnectionEvent | null;
  applicationName: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const toast = useToast();
  const [rows, setRows] = React.useState<AttributeMapping[]>([]);
  const [touched, setTouched] = React.useState(false);

  React.useEffect(() => {
    if (!open || !event) return;
    setRows(event.attributes.length > 0 ? event.attributes.map((a) => ({ ...a })) : [blankMappingRow(0)]);
    setTouched(false);
  }, [open, event]);

  const started = rows.filter(
    (r) => r.applicationField.trim() !== '' || r.igaAttribute !== '' || r.expression.trim() !== '',
  );
  const incomplete = started.filter((r) => !mappingComplete(r));

  const save = () => {
    setTouched(true);
    if (incomplete.length > 0) return;
    if (!event) return;
    saveConnectionEvent({ ...event, attributes: started });
    toast.success(
      started.length === 0
        ? 'Mapping cleared. This event has nothing to write.'
        : `${started.length} ${started.length === 1 ? 'attribute' : 'attributes'} mapped.`,
    );
    onSaved();
  };

  return (
    <Drawer
      open={open}
      onClose={onClose}
      icon={<Tune sx={{ fontSize: 22 }} />}
      title="Attribute mapping"
      subtitle={`For each field ${applicationName} expects, choose what IGA sends it.`}
      width={920}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={save}>Save</Button>
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
