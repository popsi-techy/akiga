'use client';

import * as React from 'react';
import CloseOutlined from '@mui/icons-material/CloseOutlined';
import DescriptionOutlined from '@mui/icons-material/DescriptionOutlined';
import UploadFileOutlined from '@mui/icons-material/UploadFileOutlined';
import { Avatar, Button, Modal, Select, StatusChip } from '@ds/components';
import {
  downloadEntitlementCsvSample,
  importEntitlementsFromCsv,
  parseEntitlementCsv,
} from '@/data/entitlements-store';
import { listEntitlementTypes } from '@/data/entitlement-types';
import { listApplications } from '@/data/directory';

export function ImportEntitlementsCsvModal({
  open,
  onClose,
  onImported,
}: {
  open: boolean;
  onClose: () => void;
  onImported: (count: number) => void;
}) {
  const [file, setFile] = React.useState<File | null>(null);
  const [rowCount, setRowCount] = React.useState<number | null>(null);
  const [applicationId, setApplicationId] = React.useState('');
  const [entitlementTypeId, setEntitlementTypeId] = React.useState('');
  const [touched, setTouched] = React.useState(false);
  const [dragOver, setDragOver] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const apps = React.useMemo(() => listApplications(), [open]);
  const types = React.useMemo(() => listEntitlementTypes(), [open]);

  React.useEffect(() => {
    if (!open) return;
    setFile(null);
    setRowCount(null);
    setApplicationId('');
    setEntitlementTypeId('');
    setTouched(false);
    setDragOver(false);
  }, [open]);

  const appError = touched && !applicationId ? 'Select an application.' : undefined;
  const typeError = touched && !entitlementTypeId ? 'Select an entitlement type.' : undefined;
  const fileError = touched && !file ? 'Choose a CSV file.' : undefined;
  const formatError = touched && file && rowCount === 0 ? 'No valid rows — check the column headers.' : undefined;

  const clearFile = () => {
    setFile(null);
    setRowCount(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  const pickFile = async (next: File | null) => {
    if (!next) return;
    if (!next.name.toLowerCase().endsWith('.csv')) return;
    setFile(next);
    try {
      const rows = parseEntitlementCsv(await next.text());
      setRowCount(rows.length);
    } catch {
      setRowCount(0);
    }
  };

  const upload = async () => {
    setTouched(true);
    if (!file || !applicationId || !entitlementTypeId || !rowCount) return;
    const text = await file.text();
    const rows = parseEntitlementCsv(text);
    if (rows.length === 0) return;
    const created = importEntitlementsFromCsv(rows, applicationId, entitlementTypeId);
    onImported(created.length);
  };

  const ready = Boolean(file && applicationId && entitlementTypeId && rowCount && rowCount > 0);

  return (
    <Modal
      open={open}
      onClose={onClose}
      closePlacement="floating"
      scrollBody={false}
      title="Import Entitlements via CSV"
      width={520}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={upload} disabled={!ready}>
            {ready ? `Import ${rowCount} entitlement${rowCount === 1 ? '' : 's'}` : 'Import'}
          </Button>
        </>
      }
    >
      <div className="space-y-4 pb-1">
        <div className="flex flex-col items-center px-6 pt-1 text-center">
          <div className="relative mb-2">
            <Avatar
              name="CSV import"
              size="md"
              kind="entity"
              icon={<DescriptionOutlined sx={{ fontSize: 20 }} aria-hidden />}
            />
            <span
              className="absolute -bottom-0.5 -right-0.5 grid h-6 w-6 place-items-center rounded-full border-2 border-surface bg-brand text-icon-inverse"
              aria-hidden
            >
              <UploadFileOutlined sx={{ fontSize: 12 }} />
            </span>
          </div>
          <p className="text-h5 text-text-primary">Import Entitlements via CSV</p>
          <p className="mt-0.5 text-caption text-text-secondary">
            Bulk-create entitlements for one application.
          </p>
        </div>

        <input
          ref={inputRef}
          type="file"
          accept=".csv,text/csv"
          className="sr-only"
          onChange={(e) => void pickFile(e.target.files?.item(0) ?? null)}
        />

        {file ? (
          <div className="flex items-center gap-3 rounded-lg border border-border bg-subtle px-3 py-2.5">
            <Avatar name={file.name} size="sm" kind="entity" icon={<DescriptionOutlined sx={{ fontSize: 16 }} />} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-body-sm-strong text-text-primary">{file.name}</p>
              <p className="mt-0.5 flex flex-wrap items-center gap-2 text-caption text-text-secondary">
                {rowCount != null && rowCount > 0 ? (
                  <StatusChip intent="success" dot={false} label={`${rowCount} ready`} />
                ) : (
                  <span className="text-danger">No valid rows</span>
                )}
                <button
                  type="button"
                  onClick={() => inputRef.current?.click()}
                  className="text-body-sm-medium text-text-link hover:underline"
                >
                  Replace
                </button>
              </p>
            </div>
            <button
              type="button"
              onClick={clearFile}
              aria-label={`Remove ${file.name}`}
              className="grid h-8 w-8 shrink-0 place-items-center rounded-md text-icon hover:bg-surface-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-subtle"
            >
              <CloseOutlined sx={{ fontSize: 18 }} aria-hidden />
            </button>
          </div>
        ) : (
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              void pickFile(e.dataTransfer.files.item(0));
            }}
            className={`rounded-lg border border-dashed px-3 py-3 transition-colors ${
              dragOver ? 'border-brand bg-brand-subtle' : 'border-border-strong bg-surface'
            }`}
          >
            <div className="flex items-center gap-3">
              <Avatar
                name="Add CSV file"
                size="sm"
                kind="entity"
                icon={<UploadFileOutlined sx={{ fontSize: 16 }} aria-hidden />}
              />
              <div className="min-w-0 flex-1">
                <p className="text-body-sm-medium text-text-primary">
                  Drop CSV here or{' '}
                  <button
                    type="button"
                    onClick={() => inputRef.current?.click()}
                    className="text-text-link hover:underline"
                  >
                    browse
                  </button>
                </p>
                <p className="mt-0.5 text-caption text-text-tertiary">
                  Columns: name, value, description, risk ·{' '}
                  <button
                    type="button"
                    onClick={downloadEntitlementCsvSample}
                    className="text-text-link hover:underline"
                  >
                    Download sample
                  </button>
                </p>
              </div>
            </div>
          </div>
        )}

        {(fileError || formatError) && (
          <p className="text-caption text-danger">{formatError ?? fileError}</p>
        )}

        <div className="grid gap-3 sm:grid-cols-2">
          <Select
            label="Application"
            required
            size="xs"
            placeholder="Select application"
            value={applicationId}
            onChange={setApplicationId}
            error={appError}
            options={apps.map((a) => ({ value: a.id, label: a.name }))}
          />
          <Select
            label="Entitlement type"
            required
            size="xs"
            placeholder="Select type"
            value={entitlementTypeId}
            onChange={setEntitlementTypeId}
            error={typeError}
            options={types.map((t) => ({ value: t.id, label: t.name }))}
          />
        </div>
      </div>
    </Modal>
  );
}
