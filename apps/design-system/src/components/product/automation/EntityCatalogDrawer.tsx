'use client';

import * as React from 'react';
import SearchOutlined from '@mui/icons-material/SearchOutlined';
import AppsOutlined from '@mui/icons-material/AppsOutlined';
import { Drawer, Input, Button, Avatar, Checkbox, DataTable, SelectionPanel, type Column } from '@ds/components';
import type { EntitySelection } from '@/data/automation-types';
import { listApps } from '@/data/catalog';
import { RiskScoreChip } from '@/components/product/directory';
import { AppBadge } from '@/components/product/sod/labels';

type EntRow = { id: string; name: string; description: string; risk: number; appId: string; appName: string };

/** Two-tab drawer: multi-select apps (cards), then their entitlements (table). */
export function EntityCatalogDrawer({
  open,
  onClose,
  selected,
  onApply,
}: {
  open: boolean;
  onClose: () => void;
  selected: EntitySelection[];
  onApply: (entitlements: EntitySelection[]) => void;
}) {
  const apps = listApps();
  const [tab, setTab] = React.useState<'apps' | 'entitlements'>('apps');
  const [appSel, setAppSel] = React.useState<Set<string>>(new Set());
  const [entSel, setEntSel] = React.useState<string[]>([]);
  const [appQuery, setAppQuery] = React.useState('');
  const [entQuery, setEntQuery] = React.useState('');

  React.useEffect(() => {
    if (!open) return;
    // Pre-select from the current config: select the entitlements and their apps.
    const entIds = selected.map((e) => e.id);
    const appIds = apps.filter((a) => a.entitlements.some((e) => entIds.includes(e.id))).map((a) => a.id);
    setEntSel(entIds);
    setAppSel(new Set(appIds));
    setTab('apps');
    setAppQuery('');
    setEntQuery('');
  }, [open, selected, apps]);

  const toggleApp = (id: string) =>
    setAppSel((s) => {
      const n = new Set(s);
      if (n.has(id)) {
        n.delete(id);
        // drop entitlements that belonged to the de-selected app
        const gone = new Set(apps.find((a) => a.id === id)?.entitlements.map((e) => e.id));
        setEntSel((prev) => prev.filter((eid) => !gone.has(eid)));
      } else {
        n.add(id);
      }
      return n;
    });

  const entRows: EntRow[] = apps
    .filter((a) => appSel.has(a.id))
    .flatMap((a) => a.entitlements.map((e) => ({ ...e, appId: a.id, appName: a.name })));
  const filteredApps = apps.filter((a) => a.name.toLowerCase().includes(appQuery.trim().toLowerCase()) || a.description.toLowerCase().includes(appQuery.trim().toLowerCase()));
  const q = entQuery.trim().toLowerCase();
  const filteredEnts = entRows.filter((e) => e.name.toLowerCase().includes(q) || e.description.toLowerCase().includes(q) || e.appName.toLowerCase().includes(q));

  const entColumns: Column<EntRow>[] = [
    { id: 'name', header: 'Entitlement', sortable: true, value: (r) => r.name, render: (r) => (<div><div className="text-body-sm-strong text-text-primary">{r.name}</div><div className="text-caption text-text-tertiary">{r.appName}</div></div>) },
    { id: 'description', header: 'Description', render: (r) => <span className="text-text-secondary">{r.description}</span> },
    { id: 'risk', header: 'Risk score', align: 'right', sortable: true, value: (r) => r.risk, render: (r) => <RiskScoreChip score={r.risk} /> },
  ];

  const selectedItems = [
    ...apps
      .filter((a) => appSel.has(a.id))
      .map((a) => ({
        id: a.id,
        icon: <AppBadge app={a.name} size={20} />,
        label: (
          <>
            <span className="text-text-tertiary">{a.name}</span>{' '}
            <span className="text-body-sm-strong text-text-primary">baseline access</span>
          </>
        ),
      })),
    ...entRows
      .filter((e) => entSel.includes(e.id))
      .map((e) => ({
        id: e.id,
        icon: <AppBadge app={e.appName} size={20} />,
        label: (
          <>
            <span className="text-text-tertiary">{e.appName}</span>{' '}
            <span className="text-body-sm-strong text-text-primary">{e.name}</span>
          </>
        ),
      })),
  ];

  const removeSelected = (id: string) => {
    if (appSel.has(id)) toggleApp(id);
    else setEntSel((prev) => prev.filter((x) => x !== id));
  };
  const clearSelected = () => {
    setAppSel(new Set());
    setEntSel([]);
  };
  const selectedCountLabel = () => {
    const appsN = appSel.size;
    const entsN = entSel.length;
    const parts: string[] = [];
    if (appsN > 0) parts.push(`${appsN} app${appsN === 1 ? '' : 's'}`);
    if (entsN > 0) parts.push(`${entsN} entitlement${entsN === 1 ? '' : 's'}`);
    return parts.length ? `${parts.join(', ')} selected` : '0 selected';
  };

  const TabBtn = ({ id, label, count }: { id: 'apps' | 'entitlements'; label: string; count: number }) => (
    <button type="button" onClick={() => setTab(id)} className={['rounded-[5px] px-3 py-1 transition-colors', tab === id ? 'bg-surface text-text-primary shadow-xs' : 'text-text-secondary'].join(' ')}>
      {label} {count > 0 && <span className="text-text-tertiary">({count})</span>}
    </button>
  );

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title="Add Apps & Entitlements"
      subtitle="Pick apps, then choose their entitlements."
      icon={<AppsOutlined sx={{ fontSize: 22, color: 'var(--ds-color-brand-primary)' }} />}
      width={860}
      disablePadding
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button disabled={entSel.length === 0} onClick={() => { onApply(entRows.filter((e) => entSel.includes(e.id)).map((e) => ({ id: e.id, name: e.name, appName: e.appName }))); onClose(); }}>Add {entSel.length ? `(${entSel.length})` : ''}</Button>
        </>
      }
    >
      <div className="flex h-full">
        <div className="flex min-w-0 flex-1 flex-col px-6 py-5">
          <div className="mb-4 flex shrink-0 flex-col gap-3">
            <div className="flex self-start rounded-md bg-subtle p-0.5 text-caption-strong">
              <TabBtn id="apps" label="Apps" count={appSel.size} />
              <TabBtn id="entitlements" label="Entitlements" count={entSel.length} />
            </div>
            <div className="w-full">
              {tab === 'apps' ? (
                <Input placeholder="Search apps" value={appQuery} onChange={(e) => setAppQuery(e.target.value)} startAdornment={<SearchOutlined sx={{ fontSize: 18 }} />} />
              ) : (
                <Input placeholder="Search entitlements" value={entQuery} onChange={(e) => setEntQuery(e.target.value)} startAdornment={<SearchOutlined sx={{ fontSize: 18 }} />} />
              )}
            </div>
          </div>

          {tab === 'apps' ? (
            <div className="ds-scroll -mx-1 grid min-h-0 flex-1 grid-cols-2 content-start gap-3 overflow-y-auto px-1">
              {filteredApps.map((a) => {
                const on = appSel.has(a.id);
                return (
                  <button key={a.id} type="button" onClick={() => toggleApp(a.id)} className={['flex flex-col gap-2 rounded-xl border p-3 text-left transition-colors', on ? 'border-brand bg-surface' : 'border-border bg-surface hover:border-border-strong'].join(' ')}>
                    <div className="flex items-center gap-2.5">
                      <Avatar name={a.name} size="sm" />
                      <span className="min-w-0 flex-1 truncate text-body-sm-strong text-text-primary">{a.name}</span>
                      {/* The card itself is the control — box only, no nested input. */}
                      <Checkbox checked={on} presentational />
                    </div>
                    <p className="truncate text-caption leading-5 text-text-secondary">{a.description}</p>
                  </button>
                );
              })}
            </div>
          ) : appSel.size === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-2 text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-subtle text-icon"><AppsOutlined sx={{ fontSize: 24 }} /></span>
              <div className="text-body-strong text-text-primary">Select apps first</div>
              <p className="max-w-[240px] text-caption leading-5 text-text-secondary">Choose one or more apps on the Apps tab to see their entitlements here.</p>
            </div>
          ) : (
            <div className="min-h-0 flex-1">
              <DataTable<EntRow>
                columns={entColumns}
                rows={filteredEnts}
                selectable
                selectedIds={entSel}
                onSelectionChange={setEntSel}
                fillHeight
                defaultRowsPerPage={25}
                emptyTitle="No entitlements"
                emptyMessage="No entitlements match your search."
              />
            </div>
          )}
        </div>

        <div className="w-[280px] shrink-0 border-l border-border px-6 py-5">
          <SelectionPanel
            title="Selected"
            items={selectedItems}
            onRemove={removeSelected}
            onClearAll={clearSelected}
            countLabel={() => selectedCountLabel()}
            emptyTitle="Nothing selected yet"
            emptyMessage="Select apps and entitlements and they’ll appear here."
          />
        </div>
      </div>
    </Drawer>
  );
}

export default EntityCatalogDrawer;
