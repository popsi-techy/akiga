'use client';

import * as React from 'react';
import AddIcon from '@mui/icons-material/Add';
import SearchOutlined from '@mui/icons-material/SearchOutlined';
import LaptopOutlined from '@mui/icons-material/LaptopOutlined';
import ShieldOutlined from '@mui/icons-material/ShieldOutlined';
import {
  Button,
  Card,
  DataTable,
  InfoRow,
  InfoRowGroup,
  Input,
  NavList,
  OverflowChips,
  PickerSlot,
  SegmentedControl,
  useToast,
  type Column,
} from '@ds/components';
import { AppBadge } from '../sod/labels';
import { PeekPanel, PeekSlot } from '../directory/PeekPanel';
import { RowActions } from '../RowActions';
import { EntityCatalogDrawer } from '../automation/EntityCatalogDrawer';
import { TableSelectDrawer } from '../automation/TableSelectDrawer';
import { listApps, listTechnicalRoles } from '@/data/catalog';
import { getEAAssignments, setEAAssignments, type EAAssignments } from '@/data/emergency-access';
import { toastEASetupStep } from '@/components/product/emergency/ea-setup-toast';
import type { EntitySelection } from '@/data/automation-types';
import { RiskScoreChip } from '@/components/product/directory';

type Kind = keyof EAAssignments;

const META: Record<
  Kind,
  { label: string; entity: string; empty: string; hint: string; editHint: string; icon: React.ReactNode }
> = {
  entitlements: {
    label: 'Entitlements',
    entity: 'entitlement',
    empty: 'No entitlements granted',
    hint: 'Single permissions, handed over for one session then taken back.',
    editHint: 'Edit which permissions this access hands over.',
    icon: <ShieldOutlined />,
  },
  technicalRoles: {
    label: 'Technical Roles',
    entity: 'technical role',
    empty: 'No technical roles granted',
    hint: 'Bundles of entitlements — quicker to grant, wider to hold.',
    editHint: 'Edit which bundles this access hands over.',
    icon: <LaptopOutlined />,
  },
};

/** `n entitlements` / `1 entitlement`, from the singular in `META`. */
const countLabel = (n: number, entity: string) => `${n} ${entity}${n === 1 ? '' : 's'} selected`;

/**
 * Everything both surfaces need from the store, so the tab and the wizard's slots
 * read and write assignments exactly the same way.
 */
function useAssignments(eaId: string, onChanged?: () => void) {
  const toast = useToast();
  const [assignments, setAssignments] = React.useState<EAAssignments>({
    entitlements: [],
    technicalRoles: [],
  });
  // Session-memory store, so read it after mount like the other EA tabs.
  React.useEffect(() => setAssignments(getEAAssignments(eaId)), [eaId]);
  const patch = (next: Partial<EAAssignments>) => {
    const wasDone = assignments.entitlements.length + assignments.technicalRoles.length > 0;
    const saved = setEAAssignments(eaId, { ...assignments, ...next });
    setAssignments(saved);
    onChanged?.();
    toastEASetupStep(toast, eaId, 'assignments', wasDone);
  };
  return { assignments, patch };
}

/**
 * The two catalog pickers, shared by both surfaces below.
 *
 * `open` is the kind whose drawer is showing, or null — one piece of state rather
 * than a boolean per drawer, because only one can be open and two booleans can
 * disagree about that.
 */
function AssignmentDrawers({
  open,
  onClose,
  assignments,
  patch,
}: {
  open: Kind | null;
  onClose: () => void;
  assignments: EAAssignments;
  patch: (next: Partial<EAAssignments>) => void;
}) {
  return (
    <>
      {/* The same catalog pickers the workflow builder and birthright policies use. */}
      <EntityCatalogDrawer
        open={open === 'entitlements'}
        onClose={onClose}
        selected={assignments.entitlements}
        onApply={(entitlements) => patch({ entitlements })}
      />
      <TableSelectDrawer
        open={open === 'technicalRoles'}
        onClose={onClose}
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
    </>
  );
}

/**
 * What this profile grants, as two picker slots — for the V2 creation stepper.
 *
 * The tab below is the wrong shape for a wizard column: a 240px rail beside a
 * three-column table, squeezed into the space left over by the progress rail,
 * scrolls sideways and clips its own empty-state copy. None of that detail is
 * what the step is asking, either — the step asks *what does this hand over*, and
 * a count with the first name in it answers that.
 *
 * Same component the access-certification wizard picks applications with, and the
 * same drawers the tab uses, so what is configured here and what is maintained
 * later cannot drift apart.
 */
export function EmergencyAssignmentsPicker({
  eaId,
  onChanged,
}: {
  eaId: string;
  onChanged?: () => void;
}) {
  const { assignments, patch } = useAssignments(eaId, onChanged);
  const [open, setOpen] = React.useState<Kind | null>(null);

  return (
    // Full width of whatever holds it. A reading-width cap here held the content
    // short of the buttons that act on it, so the surface looked like it had a
    // right margin its own footer did not — and these rows are icon-and-control,
    // not prose, so there is no line length to protect.
    <div className="space-y-4">
      {(['entitlements', 'technicalRoles'] as Kind[]).map((kind) => {
        const items = assignments[kind];
        const meta = META[kind];
        return (
          <PickerSlot
            key={kind}
            icon={meta.icon}
            title={items.length === 0 ? meta.empty : countLabel(items.length, meta.entity)}
            hint={items.length === 0 ? meta.hint : meta.editHint}
            summary={items.length > 0 ? <OverflowChips items={items} /> : undefined}
            {...(items.length === 0
              ? {
                  action: (
                    <Button variant="secondary" startIcon={<AddIcon />} onClick={() => setOpen(kind)}>
                      Add {meta.label}
                    </Button>
                  ),
                }
              : { onEdit: () => setOpen(kind), editLabel: `Edit ${meta.label.toLowerCase()}` })}
          />
        );
      })}

      {/* Neither slot is required on its own — `eaBlockingSteps` asks for at least
          one of the two. That used to be spelled out here in a footnote; the rule
          still lives in `data/emergency-access`, and the preview step names whatever
          is actually still missing, so nothing depends on this being restated. */}
      <AssignmentDrawers open={open} onClose={() => setOpen(null)} assignments={assignments} patch={patch} />
    </div>
  );
}

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
export function EmergencyAssignmentsTab({
  eaId,
  onChanged,
  switcher = 'segments',
}: {
  eaId: string;
  /** What this grants changed — lets a host surface re-read readiness. */
  onChanged?: () => void;
  /**
   * How the two assignment kinds are chosen.
   *
   * `segments` — compact, for V2.
   * `rail` — NavList in a card, for V1.
   */
  switcher?: 'segments' | 'rail';
}) {
  const toast = useToast();
  const [kind, setKind] = React.useState<Kind>('entitlements');
  const [search, setSearch] = React.useState('');
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  /** The row whose details are open in the peek panel beside the table. */
  const [peek, setPeek] = React.useState<EntitySelection | null>(null);
  const { assignments, patch } = useAssignments(eaId, onChanged);

  const meta = META[kind];
  const current = assignments[kind];
  const roleById = React.useMemo(() => new Map(listTechnicalRoles().map((r) => [r.id, r])), []);
  const entitlementById = React.useMemo(() => {
    const map = new Map<string, { description: string; risk: number }>();
    for (const app of listApps()) {
      for (const e of app.entitlements) {
        map.set(e.id, { description: e.description, risk: e.risk });
      }
    }
    return map;
  }, []);
  const detailFor = (r: EntitySelection) =>
    kind === 'technicalRoles' ? roleById.get(r.id) : entitlementById.get(r.id);
  const q = search.trim().toLowerCase();
  const filtered = q
    ? current.filter((r) => {
        const detail = detailFor(r);
        return (
          r.name.toLowerCase().includes(q) ||
          (r.appName ?? '').toLowerCase().includes(q) ||
          (detail?.description ?? '').toLowerCase().includes(q)
        );
      })
    : current;
  const remove = (id: string) =>
    patch({ [kind]: current.filter((i) => i.id !== id) } as Partial<EAAssignments>);

  const columns: Column<EntitySelection>[] = [
    {
      id: 'name',
      header: meta.label.replace(/s$/, ''),
      sortable: true,
      // Avatar + name: overflow:hidden on the cell would clip the mark's ring.
      wrap: true,
      value: (r) => r.name,
      render: (r) => (
        <div className="flex min-w-0 items-center gap-3">
          {/* An entitlement belongs to an app and shows its mark; a technical
              role is the app-shaped thing itself, so it gets the glyph. */}
          {r.appName ? (
            <AppBadge app={r.appName} size={28} />
          ) : (
            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-md bg-brand-subtle text-brand">
              <LaptopOutlined sx={{ fontSize: 16 }} />
            </span>
          )}
          <span className="min-w-0 truncate text-body-sm-strong text-text-primary">{r.name}</span>
        </div>
      ),
    },
    /*
      Application and Description stand down while the panel is open.

      The panel takes 380px of a ~776px region, which is not enough for five columns —
      they overflowed, and the first thing to scroll out of reach was the Actions cell
      holding the button that had just been pressed. Since the panel states both fields
      itself, dropping them is not a loss of information: the table keeps what you scan
      by, the panel holds what you opened it for. This is the ordinary master–detail
      trade, made explicit rather than left to a hidden scrollbar.
    */
    ...(kind === 'entitlements' && peek === null
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
    ...(peek === null
      ? [
          {
            id: 'description',
            header: 'Description',
            sortable: true,
            value: (r: EntitySelection) => detailFor(r)?.description ?? '',
            render: (r: EntitySelection) => {
              const description = detailFor(r)?.description ?? '—';
              return (
                <span className="block truncate text-text-secondary" title={description}>
                  {description}
                </span>
              );
            },
          },
        ]
      : []),
    {
      id: 'risk',
      header: 'Risk Score',
      sortable: true,
      width: 140,
      wrap: true,
      value: (r) => detailFor(r)?.risk ?? -1,
      render: (r) => {
        const risk = detailFor(r)?.risk;
        return risk == null ? (
          <span className="text-text-disabled">—</span>
        ) : (
          <RiskScoreChip score={risk} />
        );
      },
    },
    {
      id: 'actions',
      header: 'Actions',
      align: 'right' as const,
      width: 88,
      wrap: true,
      render: (r: EntitySelection) => (
        <RowActions
          onInfo={() => setPeek(r)}
          infoLabel={`View details for ${r.name}`}
          onRemove={() => {
            remove(r.id);
            if (peek?.id === r.id) setPeek(null);
            toast.success(`${r.name} removed`);
          }}
          removeLabel={`Remove ${r.name}`}
          removeTooltip={`Remove ${meta.entity}`}
        />
      ),
    },
  ];

  const isBlank = current.length === 0;

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div
        className={
          switcher === 'rail'
            ? 'grid min-h-0 flex-1 grid-cols-[240px_minmax(0,1fr)] gap-5'
            : 'flex min-h-0 flex-1 flex-col'
        }
      >
      {switcher === 'rail' ? (
        // 4px (2xs) clears the selected outline from a 240px rail without
        // spending 16px of the column on gutter. The card fills the column
        // so the rail and the table share one height.
        <Card padding="2xs" className="h-full min-h-0 w-[240px]">
          <NavList
            ariaLabel="Assignment type"
            value={kind}
            onChange={(id) => {
              setKind(id as Kind);
              setSearch('');
              setPeek(null);
            }}
            items={[
              {
                id: 'entitlements',
                icon: <ShieldOutlined sx={{ fontSize: 18 }} />,
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
      ) : (
      <div className="mb-5 flex shrink-0 flex-wrap items-center gap-3">
        <SegmentedControl<Kind>
          ariaLabel="Assignment type"
          value={kind}
          onChange={(next) => {
            setKind(next);
            setSearch('');
            setPeek(null);
          }}
          options={[
            { value: 'entitlements', label: 'Entitlements', count: assignments.entitlements.length },
            {
              value: 'technicalRoles',
              label: 'Technical Roles',
              count: assignments.technicalRoles.length,
            },
          ]}
        />
      </div>
      )}

      {isBlank ? (
        /* No search, no header row: a table with nothing under it reads as a failed
           load rather than as "nothing granted yet". The switcher stays so they can
           still reach the other kind. */
        <div className="grid min-h-0 flex-1 place-items-center">
          <div className="flex max-w-md flex-col items-center px-6 py-10 text-center">
            <h2 className="text-h5 text-text-primary">{meta.empty}</h2>
            <p className="mt-1.5 text-body-sm text-text-secondary">
              Add {meta.entity}s and anyone who activates this access receives them for the length
              of their session.
            </p>
            <div className="mt-5">
              <Button startIcon={<AddIcon />} onClick={() => setDrawerOpen(true)}>
                Add {meta.label}
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          {/* 20px below the switcher, 12px below the toolbar: the switcher chooses which
              dataset you are looking at, the toolbar acts within it. The larger gap binds the
              toolbar and its table into one unit under the switcher, rather than leaving three
              bands equally spaced and equally related. */}
          <div className="mb-3 flex shrink-0 flex-wrap items-center gap-3">
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
          {/* The panel takes width from the table rather than covering it, so the row you
              opened stays visible and the next one is a click away — pick another and the
              panel swaps. Same slot the directory's peeks use, so the chrome cannot drift. */}
          <div className="flex min-h-0 flex-1">
            <div className="min-h-0 min-w-0 flex-1">
              <DataTable<EntitySelection>
                columns={columns}
                rows={filtered}
                layout="fixed"
                fillHeight
                emptyTitle={`No ${meta.entity} matches`}
                emptyMessage={`Nothing granted by this access is called “${search.trim()}”.`}
              />
            </div>

            <PeekSlot open={peek !== null}>
              {peek && (
                <PeekPanel
                  avatar={
                    peek.appName ? (
                      <AppBadge app={peek.appName} size={32} />
                    ) : (
                      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-brand-subtle text-brand">
                        <LaptopOutlined sx={{ fontSize: 18 }} />
                      </span>
                    )
                  }
                  title={peek.name}
                  subtitle={peek.appName ?? 'Technical role'}
                  onClose={() => setPeek(null)}
                >
                  {detailFor(peek)?.description && (
                    <p className="pt-3 text-body-sm text-text-secondary">
                      {detailFor(peek)?.description}
                    </p>
                  )}
                  <div className="pt-3">
                    <InfoRowGroup>
                      <InfoRow
                        label="Type"
                        value={kind === 'technicalRoles' ? 'Technical role' : 'Entitlement'}
                      />
                      {peek.appName && (
                        <InfoRow label="Application" value={peek.appName} />
                      )}
                      <InfoRow
                        label="Risk Score"
                        value={
                          detailFor(peek)?.risk == null ? (
                            '—'
                          ) : (
                            <RiskScoreChip score={detailFor(peek)!.risk} />
                          )
                        }
                      />
                    </InfoRowGroup>
                  </div>
                </PeekPanel>
              )}
            </PeekSlot>
          </div>
        </div>
      )}
      </div>

      <AssignmentDrawers
        open={drawerOpen ? kind : null}
        onClose={() => setDrawerOpen(false)}
        assignments={assignments}
        patch={patch}
      />
    </div>
  );
}
