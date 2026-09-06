'use client';

import * as React from 'react';
import AddOutlined from '@mui/icons-material/AddOutlined';
import DeleteOutline from '@mui/icons-material/DeleteOutline';
import { Button, Input, Select, Tooltip } from '@ds/components';
import {
  ATTRIBUTE_SOURCES,
  IGA_ATTRIBUTES,
  mappingComplete,
  type AttributeMapping,
  type AttributeSource,
} from '@/data/connection-events';

export const blankMappingRow = (i: number): AttributeMapping => ({
  id: `m-${Date.now().toString(36)}-${i}`,
  source: 'user-profile',
  applicationField: '',
  igaAttribute: '',
  expression: '',
});

/**
 * The mapping table itself — used in the event drawer Mapping tab and the
 * standalone mapping drawer. Save lives with the parent; this only edits rows.
 */
export function AttributeMappingEditor({
  rows,
  onChange,
  applicationName,
  touched,
}: {
  rows: AttributeMapping[];
  onChange: (rows: AttributeMapping[]) => void;
  applicationName: string;
  touched?: boolean;
}) {
  const update = (id: string, patch: Partial<AttributeMapping>) =>
    onChange(rows.map((r) => (r.id === id ? { ...r, ...patch } : r)));

  const addRow = () => onChange([...rows, blankMappingRow(rows.length)]);
  const removeRow = (id: string) => onChange(rows.filter((r) => r.id !== id));

  const started = rows.filter(
    (r) => r.applicationField.trim() !== '' || r.igaAttribute !== '' || r.expression.trim() !== '',
  );

  const COLS = 'grid grid-cols-[170px_minmax(0,1fr)_170px_minmax(0,1fr)_36px] gap-2.5';

  return (
    <div className="space-y-4">
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
              const bad = Boolean(touched && started.includes(row) && !mappingComplete(row));
              return (
                <div key={row.id} className={`${COLS} items-start py-3`}>
                  <Select
                    ariaLabel="Source"
                    options={ATTRIBUTE_SOURCES.map((s) => ({ value: s.value, label: s.label }))}
                    value={row.source}
                    onChange={(v) =>
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
                    error={
                      bad && row.applicationField.trim() !== ''
                        ? 'Pick one or write an expression.'
                        : undefined
                    }
                  />
                  <Input
                    aria-label="Transformation"
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
  );
}
