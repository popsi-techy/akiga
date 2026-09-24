'use client';

import * as React from 'react';
import AddOutlined from '@mui/icons-material/AddOutlined';
import DeleteOutline from '@mui/icons-material/DeleteOutline';
import InfoOutlined from '@mui/icons-material/InfoOutlined';
import { Button, Input, Select, Tooltip } from '@ds/components';
import {
  ALL_IGA_ATTRIBUTES,
  ATTRIBUTE_TYPES,
  attributeTypeOf,
  formatDateSample,
  mappingComplete,
  needsDateFormat,
  sourceForIgaAttribute,
  type AttributeMapping,
  type MappingAttributeType,
} from '@/data/connection-events';

/** Read once — column-level format gate: mismatch skips updating this field on sync. */
const SOURCE_DATE_PATTERN_HINT =
  'Enter how dates are written in the application field — for example dd/MM/yyyy or yyyy-MM-dd. On sync, IGA checks the column against this pattern. If it does not match, this field is not updated.';

export const blankMappingRow = (i: number): AttributeMapping => ({
  id: `m-${Date.now().toString(36)}-${i}`,
  source: 'user-profile',
  attributeType: 'predefined',
  applicationField: '',
  igaAttribute: '',
  expression: '',
});

const COLS = 'grid grid-cols-[150px_170px_minmax(0,1fr)_minmax(0,1fr)_36px] gap-2.5';

const HEADER_DEFS: { label: string; hint?: string }[] = [
  { label: 'Attribute type' },
  { label: 'IGA attribute' },
  { label: 'App attribute' },
  {
    label: 'Transformation',
    hint: 'Optional. Reference attributes in square brackets and quote literal text — for example [firstName] + " " + [lastName].',
  },
  { label: '' },
];

function HeaderCells() {
  return (
    <>
      {HEADER_DEFS.map((h, i) => (
        <span
          key={i}
          className="flex items-center gap-1 text-caption-strong uppercase tracking-wider text-text-tertiary"
        >
          {h.label}
          {h.hint && (
            <Tooltip title={h.hint}>
              <span tabIndex={0} aria-label={h.hint} className="inline-flex shrink-0 text-icon-subtle">
                <InfoOutlined sx={{ fontSize: 14 }} />
              </span>
            </Tooltip>
          )}
        </span>
      ))}
    </>
  );
}

/**
 * The mapping table itself — used in the event drawer Mapping tab and the
 * standalone mapping drawer. Save lives with the parent; this only edits rows.
 *
 * `fillHeight` frames it as a bordered card that owns its height: the column header stays
 * pinned at the top, the rows scroll between, and Add attribute stays pinned at the bottom.
 * Without it, the table lays out inline and the surrounding surface handles scrolling.
 */
export function AttributeMappingEditor({
  rows,
  onChange,
  applicationName,
  touched,
  fillHeight = false,
}: {
  rows: AttributeMapping[];
  onChange: (rows: AttributeMapping[]) => void;
  applicationName: string;
  touched?: boolean;
  fillHeight?: boolean;
}) {
  const update = (id: string, patch: Partial<AttributeMapping>) =>
    onChange(rows.map((r) => (r.id === id ? { ...r, ...patch } : r)));

  const addRow = () => onChange([...rows, blankMappingRow(rows.length)]);
  const removeRow = (id: string) => onChange(rows.filter((r) => r.id !== id));

  const started = rows.filter(
    (r) => r.applicationField.trim() !== '' || r.igaAttribute !== '' || r.expression.trim() !== '',
  );

  const rowCells = (row: AttributeMapping) => {
    const hasExpression = row.expression.trim() !== '';
    const kind = attributeTypeOf(row);
    const bad = Boolean(touched && started.includes(row) && !mappingComplete(row));
    const dated = needsDateFormat(row);
    const sample = dated ? formatDateSample(row.dateFormat ?? '') : null;
    return (
      <>
        <Select
          ariaLabel="Attribute type"
          options={ATTRIBUTE_TYPES.map((t) => ({ value: t.value, label: t.label }))}
          value={kind}
          onChange={(v) => {
            const next = v as MappingAttributeType;
            if (next === 'custom') {
              update(row.id, { attributeType: 'custom', source: 'custom-user' });
              return;
            }
            const known = ALL_IGA_ATTRIBUTES.some((a) => a.value === row.igaAttribute);
            update(row.id, {
              attributeType: 'predefined',
              source: known ? sourceForIgaAttribute(row.igaAttribute) : 'user-profile',
              igaAttribute: known ? row.igaAttribute : '',
            });
          }}
        />
        <div className="flex items-start gap-2">
          <div className="min-w-0 flex-1">
            {kind === 'custom' ? (
              <Input
                aria-label="IGA attribute"
                placeholder="e.g. costCentre"
                value={hasExpression ? '' : row.igaAttribute}
                onChange={(e) => update(row.id, { igaAttribute: e.target.value, dateFormat: undefined })}
                disabled={hasExpression}
                helperText={hasExpression ? 'Set by the expression' : undefined}
                error={
                  bad && row.applicationField.trim() !== '' && !hasExpression && row.igaAttribute.trim() === ''
                    ? 'Name the IGA attribute or write an expression.'
                    : undefined
                }
              />
            ) : (
              <Select
                ariaLabel="IGA attribute"
                placeholder="Select"
                options={ALL_IGA_ATTRIBUTES}
                value={hasExpression ? '' : row.igaAttribute}
                onChange={(v) =>
                  update(row.id, {
                    igaAttribute: v,
                    source: sourceForIgaAttribute(v),
                    dateFormat: undefined,
                  })
                }
                disabled={hasExpression}
                helperText={hasExpression ? 'Set by the expression' : undefined}
                error={
                  bad && row.applicationField.trim() !== '' && !hasExpression && row.igaAttribute === ''
                    ? 'Pick one or write an expression.'
                    : undefined
                }
              />
            )}
          </div>
          {dated && (
            <div className="w-[104px] shrink-0">
              <Input
                aria-label="Column date pattern"
                placeholder="dd/MM/yyyy"
                value={row.dateFormat ?? ''}
                onChange={(e) => update(row.id, { dateFormat: e.target.value })}
                endAdornment={
                  <Tooltip title={SOURCE_DATE_PATTERN_HINT}>
                    <span
                      tabIndex={0}
                      aria-label={SOURCE_DATE_PATTERN_HINT}
                      className="inline-flex shrink-0 text-icon-subtle"
                    >
                      <InfoOutlined sx={{ fontSize: 14 }} />
                    </span>
                  </Tooltip>
                }
                helperText={sample ? `e.g. ${sample}` : undefined}
                error={bad && (row.dateFormat ?? '').trim() === '' ? 'Enter the column date pattern.' : undefined}
              />
            </div>
          )}
        </div>
        <Input
          aria-label={`${applicationName} attribute`}
          placeholder="e.g. userName"
          value={row.applicationField}
          onChange={(e) => update(row.id, { applicationField: e.target.value })}
          error={bad && !row.applicationField.trim() ? 'Name the field.' : undefined}
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
      </>
    );
  };

  const emptyState = (
    <p className="py-8 text-center text-body-sm text-text-secondary">
      No attributes mapped. This event will not write any fields.
    </p>
  );

  if (fillHeight) {
    return (
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-border bg-surface">
        {/* Pinned column header. */}
        <div className={`${COLS} shrink-0 items-center border-b border-border bg-subtle px-4 py-3`}>
          <HeaderCells />
        </div>

        {/* Scrolling rows. */}
        <div className="ds-scroll min-h-0 flex-1 overflow-y-auto px-4">
          {rows.length === 0
            ? emptyState
            : rows.map((row) => (
                <div key={row.id} className={`${COLS} items-start py-3`}>
                  {rowCells(row)}
                </div>
              ))}
        </div>

        {/* Pinned add control. */}
        <div className="shrink-0 border-t border-border px-4 py-3">
          <Button variant="secondary" size="sm" startIcon={<AddOutlined />} onClick={addRow}>
            Add attribute
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="ds-scroll overflow-x-auto">
        <div className="min-w-[700px]">
          <div className={`${COLS} items-center border-b border-border pb-2`}>
            <HeaderCells />
          </div>
          <div>
            {rows.map((row) => (
              <div key={row.id} className={`${COLS} items-start py-3`}>
                {rowCells(row)}
              </div>
            ))}
          </div>
        </div>
      </div>

      {rows.length === 0 && emptyState}

      <Button variant="secondary" size="sm" startIcon={<AddOutlined />} onClick={addRow}>
        Add attribute
      </Button>
    </div>
  );
}
