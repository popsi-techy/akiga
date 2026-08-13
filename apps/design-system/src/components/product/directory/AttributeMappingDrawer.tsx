'use client';

import * as React from 'react';
import AddOutlined from '@mui/icons-material/AddOutlined';
import InfoOutlined from '@mui/icons-material/InfoOutlined';
import DeleteOutline from '@mui/icons-material/DeleteOutline';
import Tune from '@mui/icons-material/Tune';
import { Button, Drawer, Input, Select, Tooltip, useToast } from '@ds/components';
import {
  ATTRIBUTE_SOURCES,
  IGA_ATTRIBUTES,
  mappingComplete,
  saveConnectionEvent,
  type AttributeMapping,
  type AttributeSource,
  type ConnectionEvent,
} from '@/data/connection-events';

const blankRow = (i: number): AttributeMapping => ({
  id: `m-${Date.now().toString(36)}-${i}`,
  source: 'user-profile',
  applicationField: '',
  igaAttribute: '',
  expression: '',
});

/**
 * Attribute mapping — for each field this application expects, where its value
 * comes from.
 *
 * A wide drawer: the unit of work is a row of four related fields read left to
 * right, so the panel is sized to keep them on one line. Stacked into a column
 * the mapping stops being legible as a mapping.
 *
 * An expression supersedes the attribute picker rather than sitting beside it.
 * `[firstName] + " " + [lastName]` draws on two attributes, so a single-attribute
 * select has no honest answer once one is written — it is disabled and says why.
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
    // Start with one empty row so the table is never a bare header.
    setRows(event.attributes.length > 0 ? event.attributes.map((a) => ({ ...a })) : [blankRow(0)]);
    setTouched(false);
  }, [open, event]);

  const update = (id: string, patch: Partial<AttributeMapping>) =>
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, ...patch } : r)));

  const addRow = () => setRows((rs) => [...rs, blankRow(rs.length)]);
  const removeRow = (id: string) => setRows((rs) => rs.filter((r) => r.id !== id));

  // A row left completely blank is not an error — it is a row you did not fill.
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

  const COLS = 'grid grid-cols-[170px_minmax(0,1fr)_170px_minmax(0,1fr)_36px] gap-2.5';

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
      <div className="space-y-4">
        <div className="flex items-start gap-2.5 rounded-lg border border-[var(--ds-color-status-info-border)] bg-[var(--ds-color-status-info-subtle)] p-4">
          <InfoOutlined
            sx={{ fontSize: 18, color: 'var(--ds-color-status-info-fg)' }}
            className="mt-0.5 shrink-0"
            aria-hidden
          />
          <p className="text-body-sm text-text-secondary">
            <span className="text-body-sm-strong text-text-primary">This mapping is retroactive.</span> The next sync
            rewrites accounts and entitlements already imported from {applicationName} to match it, not only new ones.
          </p>
        </div>

        <div className="flex justify-end">
          <Button variant="secondary" startIcon={<AddOutlined />} onClick={addRow}>
            Add attribute
          </Button>
        </div>

        <div className="ds-scroll overflow-x-auto">
          <div className="min-w-[760px]">
            <div className={`${COLS} items-center border-b border-border pb-2`}>
              {['Source', `${applicationName} field`, 'IGA attribute', 'Transformation', ''].map((h, i) => (
                <span key={i} className="text-caption-strong uppercase tracking-wider text-text-tertiary">
                  {h}
                </span>
              ))}
            </div>

            <div className="divide-y divide-border">
              {rows.map((row) => {
                const hasExpression = row.expression.trim() !== '';
                const bad = touched && started.includes(row) && !mappingComplete(row);
                return (
                  <div key={row.id} className={`${COLS} items-start py-3`}>
                    <Select
                      ariaLabel="Source"
                      options={ATTRIBUTE_SOURCES.map((s) => ({ value: s.value, label: s.label }))}
                      value={row.source}
                      onChange={(v) =>
                        // The attribute list changes with the family, so the old
                        // pick cannot survive the switch.
                        update(row.id, { source: v as AttributeSource, igaAttribute: '' })
                      }
                    />
                    <Input
                      aria-label={`${applicationName} field`}
                      placeholder="e.g. userName"
                      value={row.applicationField}
                      onChange={(e) => update(row.id, { applicationField: e.target.value })}
                      error={bad && !row.applicationField.trim() ? 'Name the field.' : undefined}
                    />
                    <Select
                      ariaLabel="IGA attribute"
                      placeholder="Select"
                      options={IGA_ATTRIBUTES[row.source]}
                      value={hasExpression ? '' : row.igaAttribute}
                      onChange={(v) => update(row.id, { igaAttribute: v })}
                      disabled={hasExpression}
                      helperText={hasExpression ? 'Set by the expression' : undefined}
                      error={bad && row.applicationField.trim() !== '' ? 'Pick one or write an expression.' : undefined}
                    />
                    <Input
                      aria-label="Transformation"
                      // Short, because it repeats down every row. The syntax and
                      // an example live once, under the table.
                      placeholder="Optional"
                      value={row.expression}
                      onChange={(e) => update(row.id, { expression: e.target.value })}
                    />
                    <div className="flex justify-end pt-1">
                      <Tooltip title="Remove">
                        <button
                          type="button"
                          onClick={() => removeRow(row.id)}
                          aria-label={`Remove mapping for ${row.applicationField || 'this field'}`}
                          className="rounded-md p-1.5 text-icon hover:bg-surface-hover hover:text-danger"
                        >
                          <DeleteOutline sx={{ fontSize: 18 }} />
                        </button>
                      </Tooltip>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {rows.length === 0 && (
          <p className="py-6 text-center text-body-sm text-text-secondary">
            No attributes mapped. This event will not write any fields.
          </p>
        )}

        <p className="text-caption text-text-tertiary">
          A transformation is optional. Reference attributes in square brackets and quote literal text — for example{' '}
          <span className="text-text-secondary">[firstName] + &quot; &quot; + [lastName]</span>.
        </p>
      </div>
    </Drawer>
  );
}
