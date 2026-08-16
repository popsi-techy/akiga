'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import SearchOutlined from '@mui/icons-material/SearchOutlined';
import PersonOutline from '@mui/icons-material/PersonOutline';
import GroupsOutlined from '@mui/icons-material/GroupsOutlined';
import FilterListOutlined from '@mui/icons-material/FilterListOutlined';
import AddIcon from '@mui/icons-material/Add';
import PersonAddAltOutlined from '@mui/icons-material/PersonAddAltOutlined';
import InfoOutlined from '@mui/icons-material/InfoOutlined';
import OpenInNewOutlined from '@mui/icons-material/OpenInNewOutlined';
import {
  DataTable,
  Avatar,
  Button,
  Card,
  Input,
  Drawer,
  NavList,
  SelectionPanel,
  Menu,
  Tooltip,
  useToast,
  type Column,
} from '@ds/components';
import {
  listGoverningTeams,
  canGovernanceTeamsOwn,
  listUserIdentities,
  resolvePeople,
  type GovernanceTeamRow,
  type UserIdentityRow,
} from '@/data/directory';
import { getOwners, setOwners, type OwnedEntityType } from '@/data/entity-owners';
import { PeekPanel, PeekSlot } from './PeekPanel';
import { IdentityDetailsBody } from './IdentityDetailsBody';

/**
 * The "Assigned Owners" / "Reviewers" tab, shared by every governable Directory
 * entity. Owners are User Identities; assignments persist in the entity-owners
 * store (seeded from the entity's initial ownerIds). Modeled on the Emergency
 * Access owners pattern (search + Add drawer with a Selection panel).
 */
export function EntityOwnersTab({
  entityType,
  entityId,
  seedOwnerIds,
  label = 'Owner',
  emptyHint,
}: {
  entityType: OwnedEntityType;
  entityId: string;
  seedOwnerIds: string[];
  label?: string;
  emptyHint?: string;
}) {
  const router = useRouter();
  const toast = useToast();
  const lower = label.toLowerCase();
  // Peek at an owner in place — the table stays visible and the panel swaps.
  const [peek, setPeek] = React.useState<UserIdentityRow | null>(null);
  /**
   * Ownership has two shapes, and the rail is how you switch between them: named
   * individuals, and the Governance Teams whose charter covers this entity. One
   * merged table would hide the distinction that matters at audit — who personally
   * answers for this, versus which body does.
   */
  const [view, setView] = React.useState<'individual' | 'teams'>('individual');
  /**
   * Some entities have no team half of ownership at all — a governance team
   * cannot be owned by one, and an SoD policy answers to named people. Those
   * drop the rail rather than offer a view that is empty by definition.
   */
  const canHaveTeams = canGovernanceTeamsOwn(entityType);
  const teams = listGoverningTeams(entityType, entityId);
  // Render seed defaults on the server; sync from the store after mount (no hydration mismatch).
  const [ownerIds, setOwnerIds] = React.useState<string[]>(seedOwnerIds);
  React.useEffect(() => {
    setOwnerIds(getOwners(entityType, entityId, seedOwnerIds));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entityType, entityId]);
  const persist = (ids: string[]) => {
    setOwnerIds(ids);
    setOwners(entityType, entityId, ids);
  };

  const [search, setSearch] = React.useState('');
  const owners = resolvePeople(ownerIds).filter(
    (o) => o.name.toLowerCase().includes(search.toLowerCase()) || o.email.toLowerCase().includes(search.toLowerCase()),
  );

  const [addOpen, setAddOpen] = React.useState(false);
  const [addSearch, setAddSearch] = React.useState('');
  const [selected, setSelected] = React.useState<string[]>([]);
  const candidates = listUserIdentities().filter((u) => !ownerIds.includes(u.id));
  const available = candidates.filter(
    (o) => o.name.toLowerCase().includes(addSearch.toLowerCase()) || o.email.toLowerCase().includes(addSearch.toLowerCase()),
  );
  const selectedItems = candidates
    .filter((o) => selected.includes(o.id))
    .map((o) => ({ id: o.id, label: o.name, sublabel: o.email, icon: <Avatar name={o.name} size="sm" /> }));

  const openAdd = () => {
    setSelected([]);
    setAddSearch('');
    setAddOpen(true);
  };
  const applyAdd = () => {
    const n = selected.length;
    persist(Array.from(new Set([...ownerIds, ...selected])));
    setAddOpen(false);
    toast.success(`${n} ${lower}${n > 1 ? 's' : ''} added`);
  };

  const personCell = (o: UserIdentityRow) => (
    <div className="flex items-center gap-3">
      <Avatar name={o.name} size="sm" />
      <div className="min-w-0">
        <div className="truncate text-body-sm-strong text-text-primary">{o.name}</div>
        <div className="truncate text-caption text-text-secondary">{o.jobTitle}</div>
      </div>
    </div>
  );

  const columns: Column<UserIdentityRow>[] = [
    { id: 'name', header: label, sortable: true, value: (o) => o.name, render: personCell },
    { id: 'email', header: 'Email', sortable: true, value: (o) => o.email, render: (o) => <span className="text-text-secondary">{o.email}</span> },
    {
      id: 'actions',
      header: 'Actions',
      align: 'right',
      width: 104,
      render: (o) => (
        // Two actions, in the order you reach for them: read who this is, then
        // act on them. The peek is its own button rather than a menu item so it
        // costs one click, which is the point of a peek.
        <div className="flex items-center justify-end gap-1">
          <Tooltip title="View details">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setPeek(o);
              }}
              aria-label={`View details for ${o.name}`}
              className="rounded-md p-1 text-icon-subtle transition-colors hover:bg-surface-hover hover:text-text-brand"
            >
              <InfoOutlined sx={{ fontSize: 18 }} />
            </button>
          </Tooltip>
          <Menu
            items={[
              { label: 'Message', onClick: () => toast.info(`Message ${o.name}`) },
              {
                label: `Remove ${lower}`,
                danger: true,
                onClick: () => {
                  persist(ownerIds.filter((x) => x !== o.id));
                  toast.success(`${o.name} removed`);
                },
              },
            ]}
          />
        </div>
      ),
    },
  ];
  const addColumns: Column<UserIdentityRow>[] = [
    {
      id: 'name',
      header: 'Name',
      sortable: true,
      value: (o) => o.name,
      render: (o) => (
        <div className="flex items-center gap-3">
          <Avatar name={o.name} size="sm" />
          <span className="text-body-sm-strong text-text-primary">{o.name}</span>
        </div>
      ),
    },
    { id: 'email', header: 'Email', sortable: true, value: (o) => o.email, render: (o) => <span className="text-text-secondary">{o.email}</span> },
  ];

  const teamColumns: Column<GovernanceTeamRow>[] = [
    {
      id: 'name',
      header: 'Governance Team',
      sortable: true,
      value: (t) => t.name,
      render: (t) => (
        <div className="flex items-center gap-3">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-subtle text-icon">
            <GroupsOutlined sx={{ fontSize: 18 }} />
          </span>
          <div className="min-w-0">
            <div className="truncate text-body-sm-strong text-text-primary">{t.name}</div>
            <div className="truncate text-caption text-text-secondary">{t.description}</div>
          </div>
        </div>
      ),
    },
    { id: 'members', header: 'Members', align: 'right', width: 120, sortable: true, value: (t) => t.reviewerCount, render: (t) => <span className="text-body-sm tabular-nums text-text-primary">{t.reviewerCount}</span> },
  ];

  return (
    <div className={`grid h-full gap-5 ${canHaveTeams ? 'lg:grid-cols-[264px_minmax(0,1fr)]' : ''}`}>
      {/* padding="sm" (16px), not "none": `none` keeps a 20px gutter meant for flush
          rows with dividers, and stacking it with a wrapper and the item's own px-3
          pushed the label 42px off the card edge. NavList items are self-padded, so
          the container just needs to clear them — the app sidebar uses the same
          12–16px rhythm.

          Dropped entirely when there is only one kind to show: a rail with a
          single item that is always selected is a control that does nothing, and
          it costs the table 264px to say so. */}
      {canHaveTeams && (
        <Card padding="sm" className="h-full">
          <NavList
            ariaLabel="Owner type"
            value={view}
            onChange={(id) => setView(id as 'individual' | 'teams')}
            items={[
              { id: 'individual', icon: <PersonOutline sx={{ fontSize: 18 }} />, label: `Individual ${label}s`, count: ownerIds.length },
              { id: 'teams', icon: <GroupsOutlined sx={{ fontSize: 18 }} />, label: 'Governance Teams', count: teams.length },
            ]}
          />
        </Card>
      )}

      <div className="flex h-full min-h-0 flex-col">
      <div className="mb-4 flex shrink-0 flex-wrap items-center gap-3">
        <div className="w-full max-w-sm">
          <Input placeholder="Search" value={search} onChange={(e) => setSearch(e.target.value)} startAdornment={<SearchOutlined sx={{ fontSize: 18 }} />} />
        </div>
        <Button variant="secondary" startIcon={<FilterListOutlined />} onClick={() => toast.info('Filters coming soon')}>
          Filter
        </Button>
        {view === 'individual' && (
          <div className="ml-auto">
            <Button startIcon={<AddIcon />} onClick={openAdd}>
              Add {label}s
            </Button>
          </div>
        )}
      </div>

      <div className="flex min-h-0 flex-1">
        {view === 'individual' ? (
          <>
            <div className="min-w-0 flex-1">
              <DataTable<UserIdentityRow>
                columns={columns}
                rows={owners}
                fillHeight
                onRowClick={(o) => setPeek(o)}
                emptyTitle={`No ${lower}s`}
                emptyMessage={emptyHint ?? `Add ${lower}s to govern this entity.`}
              />
            </div>
            <PeekSlot open={peek !== null}>
              {peek && (
                <PeekPanel
                  avatar={<Avatar name={peek.name} size="md" shape="circle" />}
                  title={peek.name}
                  subtitle={`This ${lower}’s identity and access`}
                  onClose={() => setPeek(null)}
                  footer={
                    <Button
                      variant="secondary"
                      fullWidth
                      startIcon={<OpenInNewOutlined sx={{ fontSize: 18 }} />}
                      onClick={() => router.push(`/iga/directory/user-identities/${peek.id}`)}
                    >
                      Open identity page
                    </Button>
                  }
                >
                  <IdentityDetailsBody identity={peek} surface="bare" />
                </PeekPanel>
              )}
            </PeekSlot>
          </>
        ) : (
          <DataTable<GovernanceTeamRow>
            columns={teamColumns}
            rows={teams.filter((t) => t.name.toLowerCase().includes(search.toLowerCase()))}
            fillHeight
            emptyTitle="No governance teams"
            emptyMessage="No Governance Team lists this entity in its charter. Team ownership is assigned on the team."
          />
        )}
      </div>
      </div>

      <Drawer
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title={`Add ${label}s`}
        subtitle="Owners and reviewers are User Identities."
        icon={<PersonAddAltOutlined sx={{ fontSize: 22, color: 'var(--ds-color-brand-primary)' }} />}
        width={780}
        disablePadding
        footer={
          <>
            <Button variant="secondary" onClick={() => setAddOpen(false)}>
              Cancel
            </Button>
            <Button disabled={selected.length === 0} onClick={applyAdd}>
              Add {label}s
            </Button>
          </>
        }
      >
        <div className="flex h-full">
          <div className="flex min-w-0 flex-1 flex-col px-6 py-5">
            <div className="mb-4 flex shrink-0 items-center gap-3">
              <div className="flex-1">
                <Input placeholder="Search people" value={addSearch} onChange={(e) => setAddSearch(e.target.value)} startAdornment={<SearchOutlined sx={{ fontSize: 18 }} />} />
              </div>
            </div>
            <div className="min-h-0 flex-1">
              <DataTable<UserIdentityRow>
                columns={addColumns}
                rows={available}
                selectable
                selectedIds={selected}
                onSelectionChange={setSelected}
                fillHeight
                defaultRowsPerPage={25}
                emptyTitle="No people found"
                emptyMessage="Try a different search."
              />
            </div>
          </div>
          <div className="w-[280px] shrink-0 border-l border-border px-6 py-5">
            <SelectionPanel
              title={`Selected ${label}s`}
              items={selectedItems}
              onRemove={(id) => setSelected((prev) => prev.filter((x) => x !== id))}
              onClearAll={() => setSelected([])}
              countLabel={(n) => `${n} ${lower}${n > 1 ? 's' : ''} selected`}
              emptyTitle={`No ${lower}s selected`}
              emptyMessage="Select people from the list and they’ll appear here."
            />
          </div>
        </div>
      </Drawer>
    </div>
  );
}

export default EntityOwnersTab;
