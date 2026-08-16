'use client';

import * as React from 'react';
import AddIcon from '@mui/icons-material/Add';
import SearchOutlined from '@mui/icons-material/SearchOutlined';
import DeleteOutline from '@mui/icons-material/DeleteOutline';
import ShieldOutlined from '@mui/icons-material/ShieldOutlined';
import VpnKeyOutlined from '@mui/icons-material/VpnKeyOutlined';
import LaptopOutlined from '@mui/icons-material/LaptopOutlined';
import { Button, Card, DataTable, Input, Menu, NavList, useToast, type Column } from '@ds/components';
import { AppBadge } from '../sod/labels';
import { EntityCatalogDrawer } from '../automation/EntityCatalogDrawer';
import { TableSelectDrawer } from '../automation/TableSelectDrawer';
import { listTechnicalRoles } from '@/data/catalog';
import { getEAAssignments, setEAAssignments, type EAAssignments } from '@/data/emergency-access';
import type { EntitySelection } from '@/data/automation-types';

type Kind = keyof EAAssignments;

const META: Record<Kind, { label: string; entity: string; empty: string; hint: string }> = {
  entitlements: {
    label: 'Entitlements',
    entity: 'entitlement',
    empty: 'No entitlements granted',
    hint: 'Individual permissions handed over for the length of a session, then taken back.',
  },
  technicalRoles: {
    label: 'Technical Roles',
    entity: 'technical role',
    empty: 'No technical roles granted',
    hint: 'Bundles of entitlements within one application — quicker to grant, wider to hold.',
  },
};

/**
 * What this break-glass profile grants.
 *
 * Same two-pane shape as Owners: a rail of kinds beside the table of what is
 * granted. One merged table would hide the distinction that matters at review —
 * a single permission and a bundle of them are not the same amount of trust.
 *
 * No business roles here, unlike a birthright policy: a business role is a job
 * description, and nobody is temporarily given a job.
 */
export function EmergencyAssignmentsTab({ eaId }: { eaId: string }) {
  const toast = useToast();
  const [kind, setKind] = React.useState<Kind>('entitlements');
  const [search, setSearch] = React.useState('');
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [assignments, setAssignments] = React.useState<EAAssignments>({
    entitlements: [],
    technicalRoles: [],
  });

  // Session-memory store, so read it after mount like the other EA tabs.
  React.useEffect(() => setAssignments(getEAAssignments(eaId)), [eaId]);

  const patch = (next: Partial<EAAssignments>) =>
    setAssignments(setEAAssignments(eaId, { ...assignments, ...next }));

  const meta = META[kind];
  const current = assignments[kind];
  const q = search.trim().toLowerCase();
  const filtered = q
    ? current.filter((r) => r.name.toLowerCase().includes(q) || (r.appName ?? '').toLowerCase().includes(q))
    : current;
  const remove = (id: string) =>
    patch({ [kind]: current.filter((i) => i.id !== id) } as Partial<EAAssignments>);

  const columns: Column<EntitySelection>[] = [
    {
      id: 'name',
      header: meta.label.replace(/s$/, ''),
      sortable: true,
      value: (r) => r.name,
      render: (r) => (
        <div className="flex items-center gap-3">
          {/* An entitlement belongs to an app and shows its mark; a technical
              role is the app-shaped thing itself, so it gets the glyph. */}
          {r.appName ? (
            <AppBadge app={r.appName} size={28} />
          ) : (
            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-md bg-brand-subtle text-brand">
              <LaptopOutlined sx={{ fontSize: 16 }} />
            </span>
          )}
          <span className="truncate text-body-sm-strong text-text-primary">{r.name}</span>
        </div>
      ),
    },
    ...(kind === 'entitlements'
      ? [
          {
            id: 'application',
            header: 'Application',
            sortable: true,
            value: (r: EntitySelection) => r.appName ?? '',
            render: (r: EntitySelection) => <span className="text-text-secondary">{r.appName ?? '—'}</span>,
          },
        ]
      : []),
    {
      id: 'actions',
      header: 'Actions',
      align: 'right' as const,
      width: 80,
      render: (r: EntitySelection) => (
        <Menu
          items={[
            {
              label: `Remove ${meta.entity}`,
              icon: <DeleteOutline sx={{ fontSize: 18 }} />,
              danger: true,
              onClick: () => {
                remove(r.id);
                toast.success(`${r.name} removed`);
              },
            },
          ]}
        />
      ),
    },
  ];

  return (
    <div className="grid h-full gap-5 lg:grid-cols-[264px_minmax(0,1fr)]">
      <Card padding="sm" className="h-full">
        <NavList
          ariaLabel="Assignment type"
          value={kind}
          onChange={(id) => setKind(id as Kind)}
          items={[
            {
              id: 'entitlements',
              icon: <VpnKeyOutlined sx={{ fontSize: 18 }} />,
              label: 'Entitlements',
              count: assignments.entitlements.length,
            },
            {
              id: 'technicalRoles',
              icon: <LaptopOutlined sx={{ fontSize: 18 }} />,
              label: 'Technical Roles',
              count: assignments.technicalRoles.length,
            },
          ]}
        />
      </Card>

      <div className="flex h-full min-h-0 flex-col">
        <div className="mb-4 flex shrink-0 flex-wrap items-center gap-3">
          <div className="w-full max-w-sm">
            <Input
              placeholder={`Search ${meta.entity}s`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              startAdornment={<SearchOutlined sx={{ fontSize: 18 }} />}
            />
          </div>
          <div className="ml-auto">
            <Button startIcon={<AddIcon />} onClick={() => setDrawerOpen(true)}>
              Add {meta.label}
            </Button>
          </div>
        </div>
        <div className="min-h-0 flex-1">
          <DataTable<EntitySelection>
            columns={columns}
            rows={filtered}
            fillHeight
            emptyTitle={search ? `No ${meta.entity} matches` : meta.empty}
            emptyMessage={
              search
                ? `Nothing granted by this access is called “${search.trim()}”.`
                : // The hint that used to sit above the table: it is only worth
                  // reading when there is nothing else to read.
                  `${meta.hint} Add ${meta.entity}s and anyone who activates this access receives them for the length of their session.`
            }
          />
        </div>
      </div>

      {/* The same catalog pickers the workflow builder and birthright policies use. */}
      <EntityCatalogDrawer
        open={drawerOpen && kind === 'entitlements'}
        onClose={() => setDrawerOpen(false)}
        selected={assignments.entitlements}
        onApply={(entitlements) => patch({ entitlements })}
      />
      <TableSelectDrawer
        open={drawerOpen && kind === 'technicalRoles'}
        onClose={() => setDrawerOpen(false)}
        title="Add Technical Roles"
        subtitle="Select the roles this access hands over."
        icon={<ShieldOutlined sx={{ fontSize: 22, color: 'var(--ds-color-brand-primary)' }} />}
        nameHeader="Technical role"
        entity="technical role"
        rows={listTechnicalRoles()}
        selectedIds={assignments.technicalRoles.map((r) => r.id)}
        onApply={(ids) =>
          patch({
            technicalRoles: listTechnicalRoles()
              .filter((r) => ids.includes(r.id))
              .map((r) => ({ id: r.id, name: r.name })),
          })
        }
      />
    </div>
  );
}
