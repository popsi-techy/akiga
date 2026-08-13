'use client';

import * as React from 'react';
import Shield from '@mui/icons-material/Shield';
import ShieldOutlined from '@mui/icons-material/ShieldOutlined';
import SearchOutlined from '@mui/icons-material/SearchOutlined';
import { Button, DataTable, Drawer, Input, SelectionPanel, Switch, Tooltip, useToast, type Column } from '@ds/components';
import InfoOutlined from '@mui/icons-material/InfoOutlined';
import { RiskScoreChip } from './RiskScoreChip';
import { saveBaseline, type AccessBaseline } from '@/data/baselines';
import type { EntitlementRow } from '@/data/directory';

/**
 * Create or edit a baseline.
 *
 * Two panes: the catalog to choose from, and what you have chosen. The right
 * rail exists because the choice is the deliverable here — a baseline is only
 * its contents, and scrolling a checkbox list to recall what you ticked is how
 * one gets left out.
 */
export function BaselineDrawer({
  open,
  applicationId,
  entitlements,
  existing,
  onClose,
  onSaved,
}: {
  open: boolean;
  applicationId: string;
  /** The application's entitlements — the only things a baseline can contain. */
  entitlements: EntitlementRow[];
  existing: AccessBaseline | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const toast = useToast();
  const [name, setName] = React.useState('');
  const [isDefault, setIsDefault] = React.useState(false);
  const [picked, setPicked] = React.useState<Set<string>>(new Set());
  const [search, setSearch] = React.useState('');
  const [touched, setTouched] = React.useState(false);

  React.useEffect(() => {
    if (!open) return;
    setName(existing?.name ?? '');
    setIsDefault(existing?.isDefault ?? false);
    setPicked(new Set(existing?.entitlementIds ?? []));
    setSearch('');
    setTouched(false);
  }, [open, existing]);

  const q = search.trim().toLowerCase();
  const filtered = q ? entitlements.filter((e) => e.name.toLowerCase().includes(q)) : entitlements;

  const toggle = (id: string) =>
    setPicked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const valid = name.trim() !== '' && picked.size > 0;

  const save = () => {
    setTouched(true);
    if (!valid) return;
    saveBaseline({
      id: existing?.id,
      applicationId,
      name: name.trim(),
      entitlementIds: [...picked],
      isDefault,
    });
    toast.success(existing ? 'Baseline updated.' : `“${name.trim()}” created.`);
    onSaved();
  };

  const columns: Column<EntitlementRow>[] = [
    {
      id: 'name',
      header: 'Entitlement',
      sortable: true,
      value: (r) => r.name,
      render: (r) => (
        <div className="flex items-center gap-3">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-brand-subtle text-icon-brand">
            <ShieldOutlined sx={{ fontSize: 18 }} />
          </span>
          <div className="min-w-0">
            <div className="truncate text-body-sm-strong text-text-primary">{r.name}</div>
            <div className="truncate text-caption text-text-secondary">{r.description}</div>
          </div>
        </div>
      ),
    },
    {
      id: 'risk',
      header: 'Risk Score',
      sortable: true,
      width: 130,
      value: (r) => r.risk,
      render: (r) => <RiskScoreChip score={r.risk} />,
    },
  ];

  return (
    <Drawer
      open={open}
      onClose={onClose}
      icon={<Shield sx={{ fontSize: 22 }} />}
      title={existing ? 'Edit baseline' : 'Create baseline'}
      subtitle="The access this application is expected to grant."
      width={980}
      disablePadding
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={save} disabled={!valid}>
            {existing ? 'Save baseline' : `Create baseline (${picked.size})`}
          </Button>
        </>
      }
    >
      <div className="flex h-full min-h-0">
        <div className="flex min-w-0 flex-1 flex-col gap-4 px-6 py-5">
          <div className="space-y-4 rounded-xl border border-border p-4">
            <Input
              label="Baseline name"
              required
              hint="Used in drift reports, so name it after the population it describes — “Standard access”, “Finance approvers”."
              placeholder="e.g. Standard access"
              value={name}
              onChange={(e) => setName(e.target.value)}
              error={touched && !name.trim() ? 'Name the baseline.' : undefined}
            />
            <div className="flex items-center gap-3">
              <Switch
                id="baseline-default"
                checked={isDefault}
                onChange={(e) => setIsDefault(e.target.checked)}
                inputProps={{ 'aria-label': 'Set as default baseline' }}
              />
              <label htmlFor="baseline-default" className="flex items-center gap-1.5 text-body-sm-strong text-text-primary">
                Set as default
                <Tooltip title="The baseline used when nothing else is specified. Only one per application — turning this on takes the flag off the current default.">
                  <span
                    tabIndex={0}
                    aria-label="The baseline used when nothing else is specified. Only one per application."
                    className="inline-flex shrink-0 text-icon-subtle"
                  >
                    <InfoOutlined sx={{ fontSize: 15 }} />
                  </span>
                </Tooltip>
              </label>
            </div>
          </div>

          <Input
            placeholder="Search entitlements"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            startAdornment={<SearchOutlined sx={{ fontSize: 18 }} />}
          />

          <div className="min-h-0 flex-1">
            <DataTable<EntitlementRow>
              columns={columns}
              rows={filtered}
              fillHeight
              selectable
              // Controlled: a search filters the rows, and the picks made before
              // it must survive that — the table only ever shows a subset.
              selectedIds={[...picked]}
              onSelectionChange={(ids) => setPicked(new Set(ids))}
              emptyTitle="No entitlements"
              emptyMessage={
                entitlements.length === 0
                  ? 'This application exposes no entitlements yet, so there is nothing to baseline.'
                  : 'No entitlement matches your search.'
              }
            />
          </div>

          {touched && picked.size === 0 && (
            <p className="text-body-sm text-danger">Choose at least one entitlement.</p>
          )}
        </div>

        <div className="w-[280px] shrink-0 border-l border-border px-6 py-5">
          <SelectionPanel
            title="Selected"
            items={entitlements
              .filter((e) => picked.has(e.id))
              .map((e) => ({ id: e.id, label: e.name, sublabel: e.applicationName }))}
            onRemove={(id) => toggle(id)}
            onClearAll={() => setPicked(new Set())}
            countLabel={(n) => `${n} ${n === 1 ? 'entitlement' : 'entitlements'}`}
            emptyTitle="Nothing selected"
            emptyMessage="Tick the entitlements this application is expected to grant."
          />
        </div>
      </div>
    </Drawer>
  );
}
