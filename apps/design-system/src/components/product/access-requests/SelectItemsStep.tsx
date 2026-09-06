'use client';

import * as React from 'react';
import AddOutlined from '@mui/icons-material/AddOutlined';
import AppsOutlined from '@mui/icons-material/AppsOutlined';
import DeleteOutline from '@mui/icons-material/DeleteOutline';
import {
  Button,
  DataTable,
  Input,
  Menu,
  Select,
  Tooltip,
  type Column,
} from '@ds/components';
import { TableSelectDrawer } from '@/components/product/automation/TableSelectDrawer';
import { EntityAvatar, RiskScoreChip } from '@/components/product/directory';
import type { AccessRequest, AccessRequestItem } from '@/data/access-request-types';
import { requestApplicationIds, requestItems, updateAccessRequest } from '@/data/access-requests';
import {
  listCataloguedApplications,
  listEntitlementRows,
  type ApplicationRow,
  type EntitlementRow,
} from '@/data/directory';

function persist(request: AccessRequest, items: AccessRequestItem[], applicationIds: string[]) {
  return updateAccessRequest(request.id, {
    items,
    applicationIds,
    itemName: items[0]?.entitlementName ?? '',
    appId: items[0]?.applicationId,
    appName: items[0]?.applicationName,
  });
}

export function SelectItemsStep({
  request,
  onChange,
}: {
  request: AccessRequest;
  onChange: (next: AccessRequest) => void;
}) {
  const items = requestItems(request);
  const appIds = requestApplicationIds(request);
  const apps = React.useMemo(
    () => listCataloguedApplications().filter((a) => appIds.includes(a.id)),
    [appIds],
  );
  const [selectedAppId, setSelectedAppId] = React.useState<string | null>(appIds[0] ?? null);
  const [appDrawer, setAppDrawer] = React.useState(false);
  const [entDrawer, setEntDrawer] = React.useState(false);
  const [entQuery, setEntQuery] = React.useState('');

  React.useEffect(() => {
    if (selectedAppId && appIds.includes(selectedAppId)) return;
    setSelectedAppId(appIds[0] ?? null);
  }, [appIds, selectedAppId]);

  const catalog = listCataloguedApplications().filter((a) => a.entitlementCount > 0);
  const selectedApp = apps.find((a) => a.id === selectedAppId) ?? null;
  const appEntitlements = items.filter((i) => i.applicationId === selectedAppId);
  const q = entQuery.trim().toLowerCase();
  const visibleEnts = q
    ? appEntitlements.filter(
        (i) =>
          i.entitlementName.toLowerCase().includes(q) || (i.description ?? '').toLowerCase().includes(q),
      )
    : appEntitlements;

  const addApps = (ids: string[]) => {
    const updated = persist(
      request,
      items.filter((i) => ids.includes(i.applicationId)),
      ids,
    );
    if (updated) {
      onChange(updated);
      setSelectedAppId(ids[ids.length - 1] ?? selectedAppId);
    }
    setAppDrawer(false);
  };

  const addEntitlements = (ids: string[]) => {
    const catalogEnts = listEntitlementRows();
    const kept = items.filter((i) => i.applicationId !== selectedAppId);
    const added = catalogEnts.filter((e) => ids.includes(e.id)).map(toItem);
    const nextAppIds = selectedAppId && !appIds.includes(selectedAppId) ? [...appIds, selectedAppId] : appIds;
    const updated = persist(request, [...kept, ...added], nextAppIds);
    if (updated) onChange(updated);
    setEntDrawer(false);
  };

  const removeApp = (appId: string) => {
    const updated = persist(
      request,
      items.filter((i) => i.applicationId !== appId),
      appIds.filter((id) => id !== appId),
    );
    if (updated) onChange(updated);
  };

  const removeEntitlement = (entitlementId: string) => {
    const updated = persist(
      request,
      items.filter((i) => i.entitlementId !== entitlementId),
      appIds,
    );
    if (updated) onChange(updated);
  };

  const setDuration = (entitlementId: string, kind: 'permanent' | 'temporary') => {
    const updated = persist(
      request,
      items.map((i) => (i.entitlementId === entitlementId ? { ...i, accessDurationKind: kind } : i)),
      appIds,
    );
    if (updated) onChange(updated);
  };

  if (apps.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 py-16 text-center">
        <span className="grid h-14 w-14 place-items-center rounded-2xl bg-subtle text-icon-brand">
          <AppsOutlined sx={{ fontSize: 28 }} />
        </span>
        <h2 className="text-h4 text-text-primary">No applications selected</h2>
        <p className="max-w-sm text-body-sm text-text-secondary">
          Choose applications within which you want entitlements.
        </p>
        <Button variant="secondary" startIcon={<AddOutlined />} onClick={() => setAppDrawer(true)}>
          Add Applications
        </Button>
        <AppPicker open={appDrawer} onClose={() => setAppDrawer(false)} catalog={catalog} selectedIds={appIds} onApply={addApps} />
      </div>
    );
  }

  const columns: Column<AccessRequestItem & { id: string }>[] = [
    {
      id: 'name',
      header: 'Entitlement',
      sortable: true,
      wrap: true,
      value: (r) => r.entitlementName,
      render: (r) => (
        <div className="flex min-w-0 items-center gap-2.5">
          <EntityAvatar kind="entitlement" name={r.entitlementName} />
          <div className="min-w-0">
            <div className="truncate text-body-sm-strong text-text-primary">{r.entitlementName}</div>
            {r.description && (
              <div className="truncate text-caption text-text-secondary">{r.description}</div>
            )}
          </div>
        </div>
      ),
    },
    {
      id: 'risk',
      header: 'Risk',
      sortable: true,
      value: (r) => r.risk ?? 0,
      render: (r) => (r.risk != null ? <RiskScoreChip score={r.risk} /> : <span className="text-text-secondary">—</span>),
    },
    {
      id: 'duration',
      header: 'Access duration',
      render: (r) => (
        <Select
          size="sm"
          ariaLabel={`Access duration for ${r.entitlementName}`}
          value={r.accessDurationKind}
          onChange={(v) => setDuration(r.entitlementId, v as 'permanent' | 'temporary')}
          options={[
            { value: 'permanent', label: 'Permanent Access' },
            { value: 'temporary', label: 'Temporary Access' },
          ]}
        />
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      align: 'right',
      width: 88,
      render: (r) => (
        <Tooltip title={`Remove ${r.entitlementName}`}>
          <button
            type="button"
            aria-label={`Remove ${r.entitlementName}`}
            onClick={(e) => {
              e.stopPropagation();
              removeEntitlement(r.entitlementId);
            }}
            className="rounded-md p-1 text-icon-subtle transition-colors hover:bg-[var(--ds-color-status-danger-subtle)] hover:text-danger focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-subtle"
          >
            <DeleteOutline sx={{ fontSize: 18 }} />
          </button>
        </Tooltip>
      ),
    },
  ];

  const drawerEntRows = selectedAppId
    ? listEntitlementRows().filter((e) => e.applicationId === selectedAppId)
    : [];

  return (
    <div className="flex h-full min-h-0 gap-4">
      <section className="flex w-[280px] shrink-0 flex-col rounded-xl border border-border bg-surface">
        <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
          <h2 className="text-h5 text-text-primary">Applications</h2>
          <Button variant="tertiary" size="sm" startIcon={<AddOutlined />} onClick={() => setAppDrawer(true)}>
            Add
          </Button>
        </div>
        <ul className="ds-scroll min-h-0 flex-1 overflow-y-auto p-2">
          {apps.map((app) => {
            const selected = app.id === selectedAppId;
            return (
              <li key={app.id}>
                <div
                  className={[
                    'flex items-center gap-2 rounded-lg border px-2.5 py-2',
                    selected ? 'border-brand bg-surface' : 'border-transparent hover:bg-surface-hover',
                  ].join(' ')}
                >
                  <button
                    type="button"
                    onClick={() => setSelectedAppId(app.id)}
                    className="flex min-w-0 flex-1 items-center gap-2.5 text-left"
                  >
                    <EntityAvatar kind="application" name={app.name} appType={app.appType} />
                    <span className="min-w-0 truncate text-body-sm-medium text-text-primary">{app.name}</span>
                  </button>
                  <Menu
                    ariaLabel={`Actions for ${app.name}`}
                    items={[{ label: 'Remove', danger: true, onClick: () => removeApp(app.id) }]}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="flex min-w-0 flex-1 flex-col rounded-xl border border-border bg-surface">
        <div className="flex flex-wrap items-center gap-3 border-b border-border px-4 py-3">
          <div className="flex min-w-0 items-center gap-2">
            {selectedApp && <EntityAvatar kind="application" name={selectedApp.name} appType={selectedApp.appType} />}
            <h2 className="truncate text-h5 text-text-primary">
              {selectedApp ? `${selectedApp.name} selected entitlements` : 'Selected entitlements'}
            </h2>
          </div>
          <div className="ml-auto flex min-w-0 flex-1 items-center justify-end gap-2">
            <div className="w-full max-w-xs">
              <Input
                placeholder="Search entitlements"
                value={entQuery}
                onChange={(e) => setEntQuery(e.target.value)}
                size="sm"
              />
            </div>
            <Button variant="secondary" size="sm" startIcon={<AddOutlined />} onClick={() => setEntDrawer(true)}>
              Add Entitlements
            </Button>
          </div>
        </div>
        <div className="min-h-0 flex-1 p-3">
          <DataTable<AccessRequestItem & { id: string }>
            columns={columns}
            rows={visibleEnts.map((r) => ({ ...r, id: r.entitlementId }))}
            fillHeight
            emptyTitle="No entitlements selected"
            emptyMessage="Add entitlements from this application to include them in the request."
            emptyAction={
              <Button variant="secondary" startIcon={<AddOutlined />} onClick={() => setEntDrawer(true)}>
                Add Entitlements
              </Button>
            }
          />
        </div>
      </section>

      <AppPicker open={appDrawer} onClose={() => setAppDrawer(false)} catalog={catalog} selectedIds={appIds} onApply={addApps} />
      <TableSelectDrawer
        open={entDrawer}
        onClose={() => setEntDrawer(false)}
        title="Add entitlements"
        subtitle={selectedApp ? `Choose permissions in ${selectedApp.name}.` : 'Choose permissions.'}
        nameHeader="Entitlement"
        entity="entitlement"
        selectedIds={appEntitlements.map((i) => i.entitlementId)}
        rows={drawerEntRows.map((e) => ({
          id: e.id,
          name: e.name,
          description: e.description,
          risk: e.risk,
        }))}
        onApply={addEntitlements}
      />
    </div>
  );
}

function toItem(e: EntitlementRow): AccessRequestItem {
  return {
    entitlementId: e.id,
    entitlementName: e.name,
    applicationId: e.applicationId,
    applicationName: e.applicationName,
    description: e.description,
    risk: e.risk,
    accessDurationKind: 'permanent',
  };
}

function AppPicker({
  open,
  onClose,
  catalog,
  selectedIds,
  onApply,
}: {
  open: boolean;
  onClose: () => void;
  catalog: ApplicationRow[];
  selectedIds: string[];
  onApply: (ids: string[]) => void;
}) {
  return (
    <TableSelectDrawer
      open={open}
      onClose={onClose}
      title="Add applications"
      subtitle="Choose applications within which you want entitlements."
      nameHeader="Application"
      entity="application"
      selectedIds={selectedIds}
      rows={catalog.map((a) => ({
        id: a.id,
        name: a.name,
        description: a.description,
      }))}
      showRisk={false}
      onApply={onApply}
    />
  );
}
