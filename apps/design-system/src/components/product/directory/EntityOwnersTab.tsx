'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import SearchOutlined from '@mui/icons-material/SearchOutlined';
import PersonOutline from '@mui/icons-material/PersonOutline';
import GroupsOutlined from '@mui/icons-material/GroupsOutlined';
import TuneOutlined from '@mui/icons-material/TuneOutlined';
import AddIcon from '@mui/icons-material/Add';
import PersonAddAltOutlined from '@mui/icons-material/PersonAddAltOutlined';
import OpenInNewOutlined from '@mui/icons-material/OpenInNewOutlined';
import {
  DataTable,
  Avatar,
  IdentityCell,
  Button,
  Card,
  Input,
  Drawer,
  NavList,
  SelectionPanel,
  Tooltip,
  InfoRow,
  InfoRowGroup,
  useToast,
  type Column,
} from '@ds/components';
import {
  listGoverningTeams,
  listTeamsNotGoverning,
  addGoverningTeams,
  removeGoverningTeam,
  canGovernanceTeamsOwn,
  listUserIdentities,
  resolvePeople,
  type GovernanceTeamRow,
  type UserIdentityRow,
} from '@/data/directory';
import { getOwners, setOwners, type OwnedEntityType } from '@/data/entity-owners';
import { PeekPanel, PeekSlot } from './PeekPanel';
import { IdentityDetailsBody } from './IdentityDetailsBody';
import { infoIcon } from './infoIcons';
import { RowActions } from '@/components/product/RowActions';
import { TableSelectDrawer } from '@/components/product/automation/TableSelectDrawer';

/** How the empty copy names the thing being owned. */
const ENTITY_NOUN: Record<OwnedEntityType, string> = {
  application: 'application',
  entitlement: 'entitlement',
  'technical-role': 'technical role',
  'business-role': 'business role',
  'governance-team': 'governance team',
  'sod-policy': 'SoD policy',
};
const entityNoun = (t: OwnedEntityType) => ENTITY_NOUN[t];

/**
 * The "Assigned Owners" / "Reviewers" tab, shared by every governable Directory
 * entity. Owners come from the workforce; assignments persist in the entity-owners
 * store (seeded from the entity's initial ownerIds).
 *
 * The two owner kinds and the table chrome match Emergency Access: a 240px
 * NavList rail, a centred empty page (not an empty table), a filter icon, and
 * RowActions that peek without charging a kebab click.
 */
export function EntityOwnersTab({
  entityType,
  entityId,
  seedOwnerIds,
  label = 'Owner',
  emptyHint,
  onChanged,
}: {
  entityType: OwnedEntityType;
  entityId: string;
  seedOwnerIds: string[];
  label?: string;
  emptyHint?: string;
  onChanged?: () => void;
}) {
  const router = useRouter();
  const toast = useToast();
  const lower = label.toLowerCase();
  /**
   * The row whose details are open beside the table — a person or a team, never both.
   *
   * One piece of state rather than two, because the panel is one slot: two would let a
   * stale person sit behind a team, and closing one would reveal the other.
   */
  const [peek, setPeek] = React.useState<
    { kind: 'owner'; row: UserIdentityRow } | { kind: 'team'; row: GovernanceTeamRow } | null
  >(null);
  /**
   * Ownership has two shapes, and the rail is how you switch between them: named
   * individuals, and the Governance Teams whose charter covers this entity. One
   * merged table would hide the distinction that matters at audit — who personally
   * answers for this, versus which body does.
   */
  const [view, setView] = React.useState<'individual' | 'teams'>('individual');
  React.useEffect(() => setPeek(null), [view]);
  /**
   * Some entities have no team half of ownership at all — a governance team
   * cannot be owned by one, and an SoD policy answers to named people. Those
   * drop the rail rather than offer a view that is empty by definition.
   */
  const canHaveTeams = canGovernanceTeamsOwn(entityType);
  /*
    Team ownership is store-backed now, so it is read after mount like the individual
    owners below it — read during render, the server would answer with the seed charter
    and the client with the store.
  */
  const [teams, setTeams] = React.useState<GovernanceTeamRow[]>([]);
  const refreshTeams = React.useCallback(() => {
    setTeams(canGovernanceTeamsOwn(entityType) ? listGoverningTeams(entityType, entityId) : []);
  }, [entityType, entityId]);
  React.useEffect(refreshTeams, [refreshTeams]);
  // Render seed defaults on the server; sync from the store after mount (no hydration mismatch).
  const [ownerIds, setOwnerIds] = React.useState<string[]>(seedOwnerIds);
  React.useEffect(() => {
    setOwnerIds(getOwners(entityType, entityId, seedOwnerIds));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entityType, entityId]);
  const persist = (ids: string[]) => {
    setOwnerIds(ids);
    setOwners(entityType, entityId, ids);
    onChanged?.();
  };

  const [search, setSearch] = React.useState('');
  const owners = resolvePeople(ownerIds).filter(
    (o) => o.name.toLowerCase().includes(search.toLowerCase()) || o.email.toLowerCase().includes(search.toLowerCase()),
  );
  const teamRows = teams.filter((t) => t.name.toLowerCase().includes(search.toLowerCase()));

  const [addOpen, setAddOpen] = React.useState(false);
  const [addSearch, setAddSearch] = React.useState('');
  const [selected, setSelected] = React.useState<string[]>([]);
  const candidates = listUserIdentities().filter((u) => !ownerIds.includes(u.id));
  const available = candidates.filter(
    (o) => o.name.toLowerCase().includes(addSearch.toLowerCase()) || o.email.toLowerCase().includes(addSearch.toLowerCase()),
  );
  const selectedItems = candidates
    .filter((o) => selected.includes(o.id))
    .map((o) => ({ id: o.id, label: o.name, sublabel: o.email, icon: <Avatar name={o.name} size="sm" kind="person" /> }));

  const openAdd = () => {
    setSelected([]);
    setAddSearch('');
    setAddOpen(true);
  };

  /*
    Adding a team writes the entity into that team's charter — the relation lives on the
    team, and `addGoverningTeams` is what keeps that fact out of this component. What the
    reader does here is the same gesture as adding a person, which is the whole point:
    both halves of ownership are editable from the thing being owned.
  */
  const [addTeamsOpen, setAddTeamsOpen] = React.useState(false);
  const teamCandidates = React.useMemo(
    () => (addTeamsOpen ? listTeamsNotGoverning(entityType, entityId) : []),
    [addTeamsOpen, entityType, entityId],
  );
  const applyAddTeams = (ids: string[]) => {
    addGoverningTeams(entityType, entityId, ids);
    refreshTeams();
    setAddTeamsOpen(false);
    onChanged?.();
    toast.success(`${ids.length} governance team${ids.length > 1 ? 's' : ''} added`);
  };
  const applyAdd = () => {
    const n = selected.length;
    persist(Array.from(new Set([...ownerIds, ...selected])));
    setAddOpen(false);
    toast.success(`${n} ${lower}${n > 1 ? 's' : ''} added`);
  };

  /* Same rule as Emergency Access: an empty half is a page, not a table with no
     rows. Search and a header over nothing read as a failed load. */
  const isBlank = view === 'individual' ? ownerIds.length === 0 : teams.length === 0;

  const columns: Column<UserIdentityRow>[] = [
    {
      id: 'name',
      header: label,
      sortable: true,
      wrap: true,
      value: (o) => o.name,
      render: (o) => <IdentityCell name={o.name} email={o.email} />,
    },
    {
      id: 'actions',
      header: 'Actions',
      align: 'right',
      width: 88,
      render: (o) => (
        <RowActions
          onInfo={() => setPeek({ kind: 'owner', row: o })}
          infoLabel={`View details for ${o.name}`}
          onRemove={() => {
            persist(ownerIds.filter((x) => x !== o.id));
            if (peek?.kind === 'owner' && peek.row.id === o.id) setPeek(null);
            toast.success(`${o.name} removed`);
          }}
          removeLabel={`Remove ${o.name}`}
          removeTooltip={`Remove ${lower}`}
        />
      ),
    },
  ];
  const addColumns: Column<UserIdentityRow>[] = [
    {
      id: 'name',
      header: 'Name',
      sortable: true,
      wrap: true,
      value: (o) => o.name,
      render: (o) => <IdentityCell name={o.name} email={o.email} />,
    },
  ];

  const teamColumns: Column<GovernanceTeamRow>[] = [
    {
      id: 'name',
      header: 'Governance Team',
      sortable: true,
      value: (t) => t.name,
      // The team's initial, not a fixed icon: one glyph repeated down the column
      // is decoration, and the letter at least varies by row.
      render: (t) => (
        <div className="flex items-center gap-3">
          <Avatar name={t.name} size="s" />
          <div className="min-w-0">
            <div className="truncate text-body-sm-strong text-text-primary">{t.name}</div>
            {peek === null && (
              <div className="truncate text-caption text-text-secondary">{t.description}</div>
            )}
          </div>
        </div>
      ),
    },
    ...(peek === null
      ? [
          {
            id: 'members',
            header: 'Reviewers',
            align: 'right' as const,
            width: 120,
            sortable: true,
            value: (t: GovernanceTeamRow) => t.reviewerCount,
            render: (t: GovernanceTeamRow) => (
              <span className="text-body-sm tabular-nums text-text-primary">{t.reviewerCount}</span>
            ),
          },
        ]
      : []),
    {
      id: 'actions',
      header: 'Actions',
      align: 'right',
      width: 88,
      // The same pair the individual rows carry. A team row that could only be
      // inspected, next to person rows that could be removed, was the asymmetry that
      // made this half look like a read-only report.
      render: (t) => (
        <RowActions
          onInfo={() => setPeek({ kind: 'team', row: t })}
          infoLabel={`View details for ${t.name}`}
          onRemove={() => {
            removeGoverningTeam(entityType, entityId, t.id);
            refreshTeams();
            if (peek?.kind === 'team' && peek.row.id === t.id) setPeek(null);
            onChanged?.();
            toast.success(`${t.name} removed`);
          }}
          removeLabel={`Remove ${t.name}`}
          removeTooltip="Remove governance team"
        />
      ),
    },
  ];

  const rail = canHaveTeams ? (
    // 4px (2xs) clears the selected outline from a 240px rail without
    // spending 16px of the column on gutter. The card fills the column
    // so the rail and the table share one height.
    <Card padding="2xs" className="h-full min-h-0 w-[240px]">
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
  ) : null;

  const emptyCopy =
    view === 'individual'
      ? {
          title: `No ${lower}s`,
          message: emptyHint ?? `Add ${lower}s to govern this entity.`,
          action: `Add ${label}s`,
        }
      : {
          title: 'No governance teams',
          /*
            This used to read "Team ownership is assigned on the team" and send the reader
            to the Governance Teams list. Both halves of that were wrong: the team's own
            Owned Applications tab is a read-only table with no Add either, so the
            sentence named a place where the job also could not be done — and there was no
            reason for the asymmetry in the first place. The charter is a many-to-many
            relation and this is one of its two legitimate ends.
          */
          message: `No Governance Team is accountable for this ${entityNoun(entityType)} yet. A team answers for it as a body, alongside any named ${lower}s.`,
          action: 'Add Governance Teams',
        };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div
        className={
          canHaveTeams
            ? 'grid min-h-0 flex-1 grid-cols-[240px_minmax(0,1fr)] gap-5'
            : 'flex min-h-0 flex-1 flex-col'
        }
      >
        {rail}

        <div className="flex min-h-0 flex-1 flex-col">
          {isBlank ? (
            <div className="grid min-h-0 flex-1 place-items-center">
              <div className="flex max-w-md flex-col items-center px-6 py-10 text-center">
                <h2 className="text-h5 text-text-primary">{emptyCopy.title}</h2>
                <p className="mt-1.5 text-body-sm text-text-secondary">{emptyCopy.message}</p>
                <div className="mt-5">
                  <Button
                    startIcon={<AddIcon />}
                    onClick={view === 'individual' ? openAdd : () => setAddTeamsOpen(true)}
                  >
                    {emptyCopy.action}
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="mb-3 flex shrink-0 flex-wrap items-center gap-3">
                <div className="w-full max-w-sm">
                  <Input
                    placeholder="Search"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    startAdornment={<SearchOutlined sx={{ fontSize: 18 }} />}
                  />
                </div>
                <Tooltip title="Filter">
                  <button
                    type="button"
                    aria-label="Filter"
                    onClick={() => toast.info('Filters coming soon')}
                    className="grid h-9 w-9 shrink-0 place-items-center rounded-md text-icon hover:bg-surface-hover hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-subtle"
                  >
                    <TuneOutlined sx={{ fontSize: 20 }} />
                  </button>
                </Tooltip>
                <div className="ml-auto">
                  {view === 'individual' ? (
                    <Button startIcon={<AddIcon />} onClick={openAdd}>
                      Add {label}s
                    </Button>
                  ) : (
                    <Button startIcon={<AddIcon />} onClick={() => setAddTeamsOpen(true)}>
                      Add Governance Teams
                    </Button>
                  )}
                </div>
              </div>

              <div className="flex min-h-0 flex-1">
                <div className="min-h-0 min-w-0 flex-1">
                  {view === 'individual' ? (
                    <DataTable<UserIdentityRow>
                      columns={columns}
                      rows={owners}
                      fillHeight
                      onRowClick={(o) => setPeek({ kind: 'owner', row: o })}
                      emptyTitle={`No ${lower}s`}
                      emptyMessage={emptyHint ?? `Add ${lower}s to govern this entity.`}
                    />
                  ) : (
                    <DataTable<GovernanceTeamRow>
                      columns={teamColumns}
                      rows={teamRows}
                      fillHeight
                      onRowClick={(t) => setPeek({ kind: 'team', row: t })}
                      emptyTitle="No governance teams"
                      emptyMessage="No Governance Team lists this entity in its charter. Team ownership is assigned on the team."
                    />
                  )}
                </div>

                <PeekSlot open={peek !== null}>
                  {peek?.kind === 'owner' && (
                    <PeekPanel
                      avatar={<Avatar name={peek.row.name} size="md" kind="person" />}
                      title={peek.row.name}
                      subtitle={`This ${lower}’s identity and access`}
                      onClose={() => setPeek(null)}
                      footer={
                        <Button
                          variant="secondary"
                          fullWidth
                          startIcon={<OpenInNewOutlined sx={{ fontSize: 18 }} />}
                          onClick={() => router.push(`/iga/directory/user-identities/${peek.row.id}`)}
                        >
                          Open identity page
                        </Button>
                      }
                    >
                      <IdentityDetailsBody identity={peek.row} surface="bare" />
                    </PeekPanel>
                  )}
                  {peek?.kind === 'team' && (
                    <PeekPanel
                      avatar={<Avatar name={peek.row.name} size="md" kind="entity" />}
                      title={peek.row.name}
                      subtitle="Answers for this entity at review"
                      onClose={() => setPeek(null)}
                      footer={
                        <Button
                          variant="secondary"
                          fullWidth
                          startIcon={<OpenInNewOutlined sx={{ fontSize: 18 }} />}
                          onClick={() => router.push(`/iga/directory/governance-teams/${peek.row.id}`)}
                        >
                          Open team page
                        </Button>
                      }
                    >
                      <p className="pt-3 text-body-sm text-text-secondary">{peek.row.description}</p>
                      <div className="pt-3">
                        <InfoRowGroup>
                          <InfoRow
                            icon={infoIcon.reviewer}
                            label="Reviewers"
                            value={String(peek.row.reviewerCount)}
                          />
                        </InfoRowGroup>
                      </div>
                    </PeekPanel>
                  )}
                </PeekSlot>
              </div>
            </>
          )}
        </div>
      </div>

      {/* `TableSelectDrawer` rather than a second hand-rolled two-pane drawer: search,
          pagination, the running selection and the footer are all identical to the people
          picker, and only the rows differ. */}
      <TableSelectDrawer
        open={addTeamsOpen}
        onClose={() => setAddTeamsOpen(false)}
        title="Add Governance Teams"
        subtitle={`A team answers for this ${entityNoun(entityType)} as a body at review.`}
        icon={<GroupsOutlined sx={{ fontSize: 22, color: 'var(--ds-color-brand-primary)' }} />}
        nameHeader="Governance Team"
        entity="governance team"
        entityPlural="governance teams"
        rows={teamCandidates.map((t) => ({ id: t.id, name: t.name, description: t.description }))}
        selectedIds={[]}
        onApply={applyAddTeams}
        showRisk={false}
      />

      <Drawer
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title={`Add ${label}s`}
        subtitle="Owners and reviewers come from the workforce."
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
