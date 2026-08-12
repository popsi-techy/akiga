'use client';

import * as React from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import AddIcon from '@mui/icons-material/Add';
import CheckCircleOutlined from '@mui/icons-material/CheckCircleOutlined';
import PauseCircleOutlined from '@mui/icons-material/PauseCircleOutlined';
import DeleteOutline from '@mui/icons-material/DeleteOutline';
import ShieldOutlined from '@mui/icons-material/ShieldOutlined';
import BadgeOutlined from '@mui/icons-material/BadgeOutlined';
import VpnKeyOutlined from '@mui/icons-material/VpnKeyOutlined';
import LaptopOutlined from '@mui/icons-material/LaptopOutlined';
import BusinessOutlined from '@mui/icons-material/BusinessOutlined';
import {
  Avatar,
  Button,
  Card,
  DataTable,
  Dialog,
  Menu,
  NavList,
  StatusChip,
  Tabs,
  useToast,
  type Column,
  type TabItem,
} from '@ds/components';
import { AppBadge } from '@/components/product/sod/labels';
import { EntityCatalogDrawer } from '@/components/product/automation/EntityCatalogDrawer';
import { TableSelectDrawer } from '@/components/product/automation/TableSelectDrawer';
import { listTechnicalRoles, listBusinessRoles } from '@/data/catalog';
import type { EntitySelection } from '@/data/automation-types';
import {
  getBirthrightPolicy,
  updateBirthrightPolicy,
  deleteBirthrightPolicy,
  grantCount,
  type BirthrightPolicy,
} from '@/data/birthright';
import { useSetBreadcrumbs } from '@/lib/breadcrumb';

const LIST_HREF = '/iga/birthright';

/**
 * One tab today. It is here because a birthright policy will grow other faces —
 * the identities it matched, its grant history — and a page that gains its first
 * tab later re-teaches its own navigation. The count rides on the tab so the
 * total is legible without reading the rail.
 */
const TABS: TabItem[] = [{ value: 'assignments', label: 'Assignments' }];

/** The three kinds of thing a policy can grant. */
type Kind = 'entitlements' | 'technicalRoles' | 'businessRoles';

export default function BirthrightPolicyDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const toast = useToast();
  const [policy, setPolicy] = React.useState<BirthrightPolicy | null>(null);
  const [loaded, setLoaded] = React.useState(false);
  const [tab, setTab] = React.useState('assignments');
  const [kind, setKind] = React.useState<Kind>('entitlements');
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [deactivateOpen, setDeactivateOpen] = React.useState(false);

  React.useEffect(() => {
    setPolicy(getBirthrightPolicy(params.id));
    setLoaded(true);
  }, [params.id]);

  useSetBreadcrumbs(
    policy ? [{ label: 'Birthright Policies', href: LIST_HREF }, { label: policy.name }] : null,
  );

  /** Every edit persists immediately — there is no Save on this page, because a
      bundle has nothing to stage: adding a role either grants it or it doesn't. */
  const patch = (next: Partial<BirthrightPolicy>) => {
    if (!policy) return;
    setPolicy(updateBirthrightPolicy({ ...policy, ...next }));
  };

  if (loaded && !policy) {
    return (
      <div className="mx-auto max-w-2xl py-16 text-center">
        <h1 className="text-h3 text-text-primary">Birthright policy not found</h1>
        <p className="mt-2 text-body text-text-secondary">This policy doesn’t exist or was deleted.</p>
        <div className="mt-4 flex justify-center">
          <Link href={LIST_HREF}>
            <Button variant="secondary">Back to Birthright Policies</Button>
          </Link>
        </div>
      </div>
    );
  }
  if (!policy) return null;

  const grants = grantCount(policy);
  const items: Record<Kind, EntitySelection[]> = {
    entitlements: policy.entitlements,
    technicalRoles: policy.technicalRoles,
    businessRoles: policy.businessRoles,
  };
  const current = items[kind];

  const remove = (id: string) => patch({ [kind]: current.filter((i) => i.id !== id) } as Partial<BirthrightPolicy>);

  const META: Record<Kind, { label: string; entity: string; empty: string; hint: string }> = {
    entitlements: {
      label: 'Entitlements',
      entity: 'entitlement',
      empty: 'No entitlements granted',
      hint: 'Application permissions granted directly to every matching identity.',
    },
    technicalRoles: {
      label: 'Technical Roles',
      entity: 'technical role',
      empty: 'No technical roles granted',
      hint: 'Bundles of entitlements within a single application.',
    },
    businessRoles: {
      label: 'Business Roles',
      entity: 'business role',
      empty: 'No business roles granted',
      hint: 'Job-shaped bundles that span applications.',
    },
  };
  const meta = META[kind];

  /** Columns differ only in the leading visual — an entitlement carries its app. */
  const columns: Column<EntitySelection>[] = [
    {
      id: 'name',
      header: meta.label.replace(/s$/, ''),
      sortable: true,
      value: (r) => r.name,
      render: (r) => (
        <div className="flex items-center gap-3">
          {r.appName ? (
            <AppBadge app={r.appName} size={28} />
          ) : (
            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-md bg-brand-subtle text-brand">
              {kind === 'technicalRoles' ? <LaptopOutlined sx={{ fontSize: 16 }} /> : <BusinessOutlined sx={{ fontSize: 16 }} />}
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

  const activate = () => {
    if (grants === 0) {
      toast.error('Assign at least one entitlement or role first');
      return;
    }
    patch({ status: 'active' });
    toast.success(`“${policy.name}” activated`);
  };

  /**
   * Deactivating is asymmetric with activating, so it confirms and activating
   * does not: turning a policy on grants access going forward, which the next
   * run makes visible. Turning it off changes nothing you can see — the people
   * who already have the access keep it — so the only signal that it stopped is
   * the absence of grants nobody is watching for.
   */
  const deactivate = () => {
    patch({ status: 'draft' });
    setDeactivateOpen(false);
    toast.success(`“${policy.name}” deactivated`);
  };

  return (
    <div className="flex h-full flex-col">
      {/* Sticky top: identity + actions + tabs. No bottom padding — the tab
          underline lands on the header's border, as on the other detail pages. */}
      <div className="-mx-8 -mt-6 shrink-0 border-b border-border bg-canvas px-8 pt-3">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Avatar name={policy.name} initials={policy.name.charAt(0).toUpperCase()} size="md" />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-h4 text-text-primary">{policy.name}</h1>
                <StatusChip
                  intent={policy.status === 'active' ? 'success' : 'neutral'}
                  label={policy.status === 'active' ? 'Active' : 'Draft'}
                />
                {grants === 0 && <StatusChip intent="warning" label="Grants nothing" />}
              </div>
              <p className="mt-px max-w-2xl text-body-sm text-text-secondary">
                {policy.description || 'No description.'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {policy.status === 'draft' ? (
              <Button
                variant="secondary"
                startIcon={<CheckCircleOutlined />}
                onClick={activate}
                disabled={grants === 0}
                title={grants === 0 ? 'Assign at least one entitlement or role first' : undefined}
              >
                Activate
              </Button>
            ) : (
              <Button
                variant="secondary"
                startIcon={<PauseCircleOutlined />}
                onClick={() => setDeactivateOpen(true)}
              >
                Deactivate
              </Button>
            )}
            <Menu
              items={[
                {
                  label: 'Delete',
                  icon: <DeleteOutline sx={{ fontSize: 18 }} />,
                  danger: true,
                  onClick: () => setDeleteOpen(true),
                },
              ]}
            />
          </div>
        </div>
        <Tabs
          items={TABS.map((t) => ({ ...t, count: grants }))}
          value={tab}
          onChange={setTab}
          noBorder
          aria-label="Birthright policy details"
        />
      </div>

      {/* Tab content — the Owners two-pane: rail of kinds, table of what's granted. */}
      <div className="min-h-0 flex-1 pt-5">
        {tab === 'assignments' && (
          <div className="grid h-full gap-5 lg:grid-cols-[264px_minmax(0,1fr)]">
            <Card padding="sm" className="h-full">
              <NavList
                ariaLabel="Assignment type"
                value={kind}
                onChange={(id) => setKind(id as Kind)}
                items={[
                  { id: 'entitlements', icon: <VpnKeyOutlined sx={{ fontSize: 18 }} />, label: 'Entitlements', count: policy.entitlements.length },
                  { id: 'technicalRoles', icon: <LaptopOutlined sx={{ fontSize: 18 }} />, label: 'Technical Roles', count: policy.technicalRoles.length },
                  { id: 'businessRoles', icon: <BusinessOutlined sx={{ fontSize: 18 }} />, label: 'Business Roles', count: policy.businessRoles.length },
                ]}
              />
            </Card>

            <div className="flex h-full min-h-0 flex-col">
              <div className="mb-4 flex shrink-0 flex-wrap items-center gap-3">
                <p className="min-w-0 flex-1 text-body-sm text-text-secondary">{meta.hint}</p>
                <Button startIcon={<AddIcon />} onClick={() => setDrawerOpen(true)}>
                  Add {meta.label}
                </Button>
              </div>
              <div className="min-h-0 flex-1">
                <DataTable<EntitySelection>
                  columns={columns}
                  rows={current}
                  fillHeight
                  emptyTitle={meta.empty}
                  emptyMessage={`Add ${meta.entity}s and every identity this policy matches will receive them automatically.`}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Drawers — the same catalog pickers the workflow builder uses. */}
      <EntityCatalogDrawer
        open={drawerOpen && kind === 'entitlements'}
        onClose={() => setDrawerOpen(false)}
        selected={policy.entitlements}
        onApply={(entitlements) => patch({ entitlements })}
      />
      <TableSelectDrawer
        open={drawerOpen && kind === 'technicalRoles'}
        onClose={() => setDrawerOpen(false)}
        title="Add Technical Roles"
        subtitle="Select one or more technical roles."
        icon={<ShieldOutlined sx={{ fontSize: 22, color: 'var(--ds-color-brand-primary)' }} />}
        nameHeader="Technical role"
        entity="technical role"
        rows={listTechnicalRoles()}
        selectedIds={policy.technicalRoles.map((r) => r.id)}
        onApply={(ids) =>
          patch({
            technicalRoles: listTechnicalRoles()
              .filter((r) => ids.includes(r.id))
              .map((r) => ({ id: r.id, name: r.name })),
          })
        }
      />
      <TableSelectDrawer
        open={drawerOpen && kind === 'businessRoles'}
        onClose={() => setDrawerOpen(false)}
        title="Add Business Roles"
        subtitle="Select one or more business roles."
        icon={<BadgeOutlined sx={{ fontSize: 22, color: 'var(--ds-color-brand-primary)' }} />}
        nameHeader="Business role"
        entity="business role"
        rows={listBusinessRoles()}
        selectedIds={policy.businessRoles.map((r) => r.id)}
        onApply={(ids) =>
          patch({
            businessRoles: listBusinessRoles()
              .filter((r) => ids.includes(r.id))
              .map((r) => ({ id: r.id, name: r.name })),
          })
        }
      />

      <Dialog
        open={deactivateOpen}
        onClose={() => setDeactivateOpen(false)}
        title="Deactivate this policy?"
        confirmLabel="Deactivate"
        cancelLabel="Keep active"
        onConfirm={deactivate}
      >
        New and updated identities will stop receiving this access, and the policy returns to{' '}
        <strong className="text-text-primary">Draft</strong> so you can keep editing it. Anyone who
        already has the {grants} item{grants === 1 ? '' : 's'} it grants{' '}
        <strong className="text-text-primary">keeps them</strong> — deactivating never revokes.
      </Dialog>

      <Dialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title="Delete this birthright policy?"
        tone="danger"
        confirmLabel="Delete"
        onConfirm={() => {
          deleteBirthrightPolicy(policy.id);
          toast.success(`“${policy.name}” deleted`);
          router.push(LIST_HREF);
        }}
      >
        <strong className="text-text-primary">{policy.name}</strong> will be permanently removed.
        Identities keep access it already granted — this stops future grants only. This cannot be
        undone.
      </Dialog>
    </div>
  );
}
