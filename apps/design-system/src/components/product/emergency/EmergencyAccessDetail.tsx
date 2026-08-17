'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import EditOutlined from '@mui/icons-material/EditOutlined';
import BlockOutlined from '@mui/icons-material/BlockOutlined';
import Person from '@mui/icons-material/Person';
import PersonOutline from '@mui/icons-material/PersonOutline';
import Info from '@mui/icons-material/Info';
import WatchLater from '@mui/icons-material/WatchLater';
import HourglassEmptyOutlined from '@mui/icons-material/HourglassEmptyOutlined';
import GroupsOutlined from '@mui/icons-material/GroupsOutlined';
import RepeatOutlined from '@mui/icons-material/RepeatOutlined';
import PauseCircleOutline from '@mui/icons-material/PauseCircleOutline';
import DeleteOutline from '@mui/icons-material/DeleteOutline';
import FilterListOutlined from '@mui/icons-material/FilterListOutlined';
import SearchOutlined from '@mui/icons-material/SearchOutlined';
import AddIcon from '@mui/icons-material/Add';
import PersonAddAltOutlined from '@mui/icons-material/PersonAddAltOutlined';
import HistoryOutlined from '@mui/icons-material/HistoryOutlined';
import CalendarTodayOutlined from '@mui/icons-material/CalendarTodayOutlined';
import CheckCircleOutlined from '@mui/icons-material/CheckCircleOutlined';
import {
  Tabs,
  Card,
  InfoRow,
  InfoRowGroup,
  StatusChip,
  Avatar,
  Button,
  Menu,
  DataTable,
  Dialog,
  Drawer,
  Input,
  SelectionPanel,
  NavList,
  OverflowChips,
  PickerSlot,
  Tooltip,
  useToast,
  type Column,
  type TabItem,
} from '@ds/components';
import {
  getEmergencyAccess,
  getAvailableOwners,
  getEAOwners,
  setEAOwners,
  activateEmergencyAccess,
  deactivateEmergencyAccess,
  deleteEmergencyAccess,
  eaBlockingSteps,
  EA_REQUIRED_STEPS,
  getEAGovernanceTeams,
  setEAGovernanceTeams,
  getEAAssignments,
  listOwnerCandidates,
  type EADetail,
} from '@/data/emergency-access';
import type { SeedEAOwner } from '@/data/seed';
import { listGovernanceTeamRows, type GovernanceTeamRow } from '@/data/directory';
import { TableSelectDrawer } from '@/components/product/automation/TableSelectDrawer';
import { EligibilityCriteriaTab } from '@/components/product/emergency/EligibilityCriteriaTab';
import { AdvancedConfigurationTab } from '@/components/product/emergency/AdvancedConfigurationTab';
import { EmergencyAssignmentsTab } from '@/components/product/emergency/EmergencyAssignmentsTab';
import { EmergencySetupCard } from '@/components/product/emergency/EmergencySetupCard';
import { SetupProgress } from '@/components/product/SetupProgress';
import { formatDateTime } from '@/lib/datetime';

/**
 * The tab strip, with a count on every tab that holds a collection.
 *
 * Counts go through `TabItem.count` rather than being written into the label, so
 * the "(n)" formatting is the DS component's decision and stays identical
 * wherever a counted tab appears.
 *
 * Each count is the total of everything behind the tab, not of the section that
 * happens to open first. Owners covers individual owners **plus** governance
 * teams, and Assignments covers entitlements **plus** technical roles — counting
 * only the first pane would show "Owners (0)" on a profile a governance team
 * owns, which is the tab calling its own contents nothing. Owners uses the same
 * sum `EmergencySetupCard` reads to decide whether the owners step is done, so
 * the tab strip and the checklist cannot disagree.
 *
 * Zero shows rather than hides. On a draft, "Owners (0)" answers the question the
 * reader is asking — an absent count reads as "not counted yet" and makes them
 * open the tab to find out it was empty. `count` is only omitted for the tabs
 * that hold no collection to count.
 *
 * Sessions is deliberately uncounted here: it already reports its own total in
 * the Overview card's "Recent Sessions (24)" heading, and a draft has none by
 * definition.
 */
function tabsFor(ea: EADetail): TabItem[] {
  const assignments = getEAAssignments(ea.id);
  return [
    { value: 'overview', label: 'Overview' },
    { value: 'owners', label: 'Owners', count: ea.ownersCount + getEAGovernanceTeams(ea.id).length },
    { value: 'eligibility', label: 'Eligibility Criteria', count: ea.eligibilityGroups.length },
    { value: 'sessions', label: 'Sessions' },
    {
      value: 'assignments',
      label: 'Assignments',
      count: assignments.entitlements.length + assignments.technicalRoles.length,
    },
    { value: 'advanced', label: 'Advanced Configuration' },
  ];
}

function ListRow({ children }: { children: React.ReactNode }) {
  return <div className="flex items-center gap-3 border-b border-border py-3 last:border-0">{children}</div>;
}

function TabPlaceholder({ label }: { label: string }) {
  return (
    <Card className="h-full">
      <div className="flex h-full flex-col items-center justify-center gap-1 py-16 text-center">
        <div className="text-h5 text-text-primary">{label}</div>
        <p className="max-w-sm text-body-sm text-text-secondary">
          This section isn’t built yet. It will reuse the same tables, cards, and forms already in
          the Design System.
        </p>
      </div>
    </Card>
  );
}

function OverviewTab({ ea, onGoToTab }: { ea: EADetail; onGoToTab: (tab: string) => void }) {
  return (
    <div className="ds-scroll h-full overflow-y-auto pr-0.5">
      <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
        {/* A draft has no sessions and cannot get any until it is switched on, so
            the slot carries what to do about that instead. */}
        {ea.isDraft ? (
          <EmergencySetupCard ea={ea} onGoToTab={onGoToTab} />
        ) : (
          <Card title={`Recent Sessions (${ea.sessionsTotal})`} icon={<Person />} padding="none">
            <div>
              {ea.sessions.map((s) => (
                <ListRow key={s.id}>
                  <Avatar name={s.name} size="sm" shape="circle" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-body-strong text-text-primary">{s.name}</div>
                    <div className="truncate text-caption text-text-secondary">{s.subtitle}</div>
                  </div>
                  {s.ongoing ? (
                    <StatusChip intent="success" label={s.when} />
                  ) : (
                    <span className="text-body-sm text-text-secondary">{s.when}</span>
                  )}
                </ListRow>
              ))}
            </div>
          </Card>
        )}

        <div className="space-y-5">
          {/* Draft has nothing to report here: these are the module's defaults,
              not limits anyone chose, and stating them as facts about the profile
              invites a reader to trust numbers no one has looked at. They appear
              once the profile is live — and until then, Advanced Configuration is
              where they are actually set. */}
          {!ea.isDraft && (
            <Card title="Information" icon={<Info />} padding="none">
              <InfoRowGroup>
                <InfoRow icon={<HourglassEmptyOutlined sx={{ fontSize: 18 }} />} label="Max. Duration" value={`${ea.config.maxDurationHrs} Hrs`} />
                <InfoRow icon={<GroupsOutlined sx={{ fontSize: 18 }} />} label="Max. Concurrent Users" value={String(ea.config.maxConcurrent)} />
                <InfoRow icon={<RepeatOutlined sx={{ fontSize: 18 }} />} label="Max. Requests Per Day" value={String(ea.config.maxRequestsPerDay)} />
                <InfoRow icon={<PauseCircleOutline sx={{ fontSize: 18 }} />} label="Cooldown Period" value={`${ea.config.cooldownHrs} Hrs`} />
              </InfoRowGroup>
            </Card>
          )}

          <Card title="Timeline" icon={<WatchLater />} padding="none">
            <InfoRowGroup>
              <InfoRow icon={<HistoryOutlined sx={{ fontSize: 18 }} />} label="Last Updated On" value={formatDateTime(ea.timeline.updatedOn)} />
              <InfoRow icon={<CalendarTodayOutlined sx={{ fontSize: 18 }} />} label="Created On" value={formatDateTime(ea.timeline.createdOn)} />
            </InfoRowGroup>
          </Card>
        </div>
      </div>
    </div>
  );
}

/**
 * Who answers for this profile, as two picker slots — for the V2 creation stepper.
 *
 * Same reasoning as `EmergencyAssignmentsPicker`: the tab below is a 264px rail
 * beside a table, which needs a page's width and gets a wizard column. The step
 * asks *who answers for this*, and a count with the first name in it answers that.
 *
 * Both halves use `TableSelectDrawer`, which preselects and replaces — so the step
 * can take an owner back out as well as put one in. The tab's own "Add Owners"
 * drawer only appends, and relies on its table's row menu for removal; with no
 * table here, appending alone would let a reader add the wrong person and be stuck
 * with them until they reached the detail page.
 */
export function EmergencyOwnersPicker({ ea, onChanged }: { ea: EADetail; onChanged: () => void }) {
  const [owners, setOwners] = React.useState<SeedEAOwner[]>([]);
  const [teamIds, setTeamIds] = React.useState<string[]>([]);
  const [open, setOpen] = React.useState<'people' | 'teams' | null>(null);

  // Session memory, so read both after mount like every other EA surface.
  React.useEffect(() => {
    setOwners(getEAOwners(ea.id));
    setTeamIds(getEAGovernanceTeams(ea.id));
  }, [ea.id]);

  const candidates = listOwnerCandidates();
  const allTeams = listGovernanceTeamRows();

  const commitOwners = (ids: string[]) => {
    setOwners(setEAOwners(ea.id, candidates.filter((o) => ids.includes(o.id))));
    onChanged();
  };
  const commitTeams = (ids: string[]) => {
    setTeamIds(setEAGovernanceTeams(ea.id, ids));
    onChanged();
  };

  const slots = [
    {
      key: 'people' as const,
      icon: <PersonOutline sx={{ fontSize: 22 }} />,
      empty: 'No owners named',
      emptyHint: 'A named owner answers for this access day to day.',
      editHint: 'Edit who answers for this access day to day.',
      addLabel: 'Add Owners',
      items: owners.map((o) => ({ id: o.id, name: o.name })),
      entity: 'owner',
    },
    {
      key: 'teams' as const,
      icon: <GroupsOutlined sx={{ fontSize: 22 }} />,
      empty: 'No governance teams',
      emptyHint: 'A team answers for this access at review, where an owner answers day to day.',
      editHint: 'Edit which teams answer for this at review.',
      addLabel: 'Add Governance Teams',
      items: allTeams.filter((t) => teamIds.includes(t.id)).map((t) => ({ id: t.id, name: t.name })),
      entity: 'governance team',
    },
  ];

  return (
    <div className="max-w-3xl space-y-4">
      {slots.map((s) => (
        <PickerSlot
          key={s.key}
          icon={s.icon}
          title={
            s.items.length === 0
              ? s.empty
              : `${s.items.length} ${s.entity}${s.items.length === 1 ? '' : 's'} selected`
          }
          hint={s.items.length === 0 ? s.emptyHint : s.editHint}
          summary={s.items.length > 0 ? <OverflowChips items={s.items} /> : undefined}
          {...(s.items.length === 0
            ? {
                action: (
                  <Button variant="secondary" startIcon={<AddIcon />} onClick={() => setOpen(s.key)}>
                    {s.addLabel}
                  </Button>
                ),
              }
            : { onEdit: () => setOpen(s.key), editLabel: `Edit ${s.entity}s` })}
        />
      ))}

      {/* Neither is required to switch the access on — `EA_REQUIRED_CHECKS` leaves
          ownership out on purpose, because blocking break-glass access on a
          missing owner would stop someone turning it on during an incident. Worth
          saying so, or the reader assumes the step is another gate. */}
      <p className="text-caption text-text-tertiary">
        Optional, and worth doing anyway: ownership is what makes this reviewable later. It can be
        set after the access is switched on.
      </p>

      <TableSelectDrawer
        open={open === 'people'}
        onClose={() => setOpen(null)}
        title="Add Owners"
        subtitle="Select people to add as owners of this emergency access."
        icon={<PersonAddAltOutlined sx={{ fontSize: 22, color: 'var(--ds-color-brand-primary)' }} />}
        nameHeader="Owner"
        descriptionHeader="Email"
        entity="owner"
        showRisk={false}
        rows={candidates.map((o) => ({ id: o.id, name: o.name, description: o.email }))}
        selectedIds={owners.map((o) => o.id)}
        onApply={commitOwners}
      />
      <TableSelectDrawer
        open={open === 'teams'}
        onClose={() => setOpen(null)}
        title="Add Governance Teams"
        subtitle="Teams that answer for this access at review."
        icon={<GroupsOutlined sx={{ fontSize: 22, color: 'var(--ds-color-brand-primary)' }} />}
        nameHeader="Governance Team"
        entity="governance team"
        rows={allTeams}
        selectedIds={teamIds}
        onApply={commitTeams}
      />
    </div>
  );
}

/** Exported so the V2 stepper can ask the same question the tab does. */
export function EmergencyOwnersTab({ ea, onChanged }: { ea: EADetail; onChanged: () => void }) {
  const toast = useToast();
  const [view, setView] = React.useState<'individual' | 'teams'>('individual');
  const [search, setSearch] = React.useState('');

  // Session-memory store, read after mount like the rest of this module. Held in
  // state rather than read from `ea` so adding an owner shows up here and on the
  // Overview checklist without a round trip through the page.
  const [owners, setOwners] = React.useState<SeedEAOwner[]>([]);
  React.useEffect(() => setOwners(getEAOwners(ea.id)), [ea.id]);
  const persistOwners = (next: SeedEAOwner[]) => {
    setOwners(setEAOwners(ea.id, next));
    onChanged();
  };

  const rows = owners.filter(
    (o) => o.name.toLowerCase().includes(search.toLowerCase()) || o.email.toLowerCase().includes(search.toLowerCase()),
  );

  // "Add Owners" drawer: searchable, multi-select table of available people.
  const [addOpen, setAddOpen] = React.useState(false);
  const [addSearch, setAddSearch] = React.useState('');
  const [selectedToAdd, setSelectedToAdd] = React.useState<string[]>([]);
  const candidates = getAvailableOwners(ea.id).filter((o) => !owners.some((x) => x.id === o.id));
  const available = candidates.filter(
    (o) =>
      o.name.toLowerCase().includes(addSearch.toLowerCase()) ||
      o.email.toLowerCase().includes(addSearch.toLowerCase()),
  );
  // The "Selected" side panel reads from the full candidate list, so items stay
  // visible even when a search hides their row from the table.
  const selectedItems = candidates
    .filter((o) => selectedToAdd.includes(o.id))
    .map((o) => ({ id: o.id, label: o.name, sublabel: o.email, icon: <Avatar name={o.name} size="sm" /> }));
  const openAdd = () => {
    setSelectedToAdd([]);
    setAddSearch('');
    setAddOpen(true);
  };

  // Governance-team ownership: session memory, read after mount like the rest.
  const [teamDrawerOpen, setTeamDrawerOpen] = React.useState(false);
  const [teamIds, setTeamIds] = React.useState<string[]>([]);
  React.useEffect(() => setTeamIds(getEAGovernanceTeams(ea.id)), [ea.id]);
  /**
   * Team edits have to tell the parent, exactly as owner edits do.
   *
   * They did not, which went unnoticed while nothing outside this tab counted
   * teams. The owner count in the tab label does, and so does the Overview
   * checklist, so a team added here would have left both showing the old number
   * until something else forced a render.
   */
  const persistTeams = (next: string[]) => {
    setTeamIds(setEAGovernanceTeams(ea.id, next));
    onChanged();
  };
  const allTeams = listGovernanceTeamRows();
  const teamRows = allTeams.filter(
    (t) => teamIds.includes(t.id) && t.name.toLowerCase().includes(search.toLowerCase()),
  );

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
          <Avatar name={t.name} size="sm" />
          <div className="min-w-0">
            <div className="truncate text-body-sm-strong text-text-primary">{t.name}</div>
            <div className="truncate text-caption text-text-secondary">{t.description}</div>
          </div>
        </div>
      ),
    },
    {
      id: 'members',
      header: 'Reviewers',
      align: 'right',
      width: 120,
      sortable: true,
      value: (t) => t.reviewerCount,
      render: (t) => <span className="text-body-sm tabular-nums text-text-primary">{t.reviewerCount}</span>,
    },
    {
      id: 'actions',
      header: 'Actions',
      align: 'right',
      width: 80,
      render: (t) => (
        <Menu
          items={[
            {
              label: 'Remove team',
              icon: <DeleteOutline sx={{ fontSize: 18 }} />,
              danger: true,
              onClick: () => {
                persistTeams(teamIds.filter((x) => x !== t.id));
                toast.success(`${t.name} removed`);
              },
            },
          ]}
        />
      ),
    },
  ];

  const addColumns: Column<SeedEAOwner>[] = [
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

  const columns: Column<SeedEAOwner>[] = [
    {
      id: 'name',
      header: 'Owners',
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
    {
      id: 'actions',
      header: 'Actions',
      align: 'right',
      width: 80,
      render: (o) => (
        <Menu
          items={[
            { label: 'Message', onClick: () => toast.info(`Message ${o.name}`) },
            {
              label: 'Remove owner',
              danger: true,
              onClick: () => {
                persistOwners(owners.filter((x) => x.id !== o.id));
                toast.success(`${o.name} removed`);
              },
            },
          ]}
        />
      ),
    },
  ];

  return (
    <div className="grid h-full gap-5 lg:grid-cols-[264px_minmax(0,1fr)]">
      {/* Left: toggles inside a container */}
      <Card padding="sm" className="h-full">
        <NavList
          ariaLabel="Owner type"
          value={view}
          onChange={(id) => setView(id as 'individual' | 'teams')}
          items={[
            { id: 'individual', icon: <PersonOutline sx={{ fontSize: 18 }} />, label: 'Individual Owners', count: ea.ownersCount },
            { id: 'teams', icon: <GroupsOutlined sx={{ fontSize: 18 }} />, label: 'Governance Teams', count: teamIds.length },
          ]}
        />
      </Card>

      {/* Right: toolbar + fill-height table */}
      <div className="flex h-full min-h-0 flex-col">
        <div className="mb-4 flex shrink-0 flex-wrap items-center gap-3">
          <div className="w-full max-w-sm">
            <Input placeholder="Search" value={search} onChange={(e) => setSearch(e.target.value)} startAdornment={<SearchOutlined sx={{ fontSize: 18 }} />} />
          </div>
          <Button variant="secondary" startIcon={<FilterListOutlined />} onClick={() => toast.info('Filters coming soon')}>
            Filter
          </Button>
          <div className="ml-auto">
            {/* The rail decides what "add" means: the button acts on whichever
                half of ownership you are looking at. */}
            <Button
              startIcon={<AddIcon />}
              onClick={view === 'individual' ? openAdd : () => setTeamDrawerOpen(true)}
            >
              {view === 'individual' ? 'Add Owners' : 'Add Governance Teams'}
            </Button>
          </div>
        </div>

        <div className="min-h-0 flex-1">
          {view === 'individual' ? (
            <DataTable<SeedEAOwner>
              columns={columns}
              rows={rows}
              selectable
              fillHeight
              emptyTitle="No owners"
              emptyMessage="Add individual owners to govern this emergency access."
            />
          ) : (
            <DataTable<GovernanceTeamRow>
              columns={teamColumns}
              rows={teamRows}
              fillHeight
              emptyTitle="No governance teams"
              emptyMessage="A team answers for this access at review, where a named owner answers for it day to day."
            />
          )}
        </div>
      </div>

      <TableSelectDrawer
        open={teamDrawerOpen}
        onClose={() => setTeamDrawerOpen(false)}
        title="Add Governance Teams"
        subtitle="Teams that answer for this access at review."
        icon={<GroupsOutlined sx={{ fontSize: 22, color: 'var(--ds-color-brand-primary)' }} />}
        nameHeader="Governance Team"
        entity="governance team"
        rows={allTeams}
        selectedIds={teamIds}
        onApply={(ids) => persistTeams(ids)}
      />

      {/* Add Owners drawer — searchable, multi-select table of available people */}
      <Drawer
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title="Add Owners"
        subtitle="Select people to add as owners of this emergency access."
        icon={<PersonAddAltOutlined sx={{ fontSize: 22, color: 'var(--ds-color-brand-primary)' }} />}
        width={780}
        disablePadding
        footer={
          <>
            <Button variant="secondary" onClick={() => setAddOpen(false)}>
              Cancel
            </Button>
            <Button
              disabled={selectedToAdd.length === 0}
              onClick={() => {
                const added = candidates.filter((o) => selectedToAdd.includes(o.id));
                persistOwners([...owners, ...added]);
                setAddOpen(false);
                toast.success(`${added.length} owner${added.length === 1 ? '' : 's'} added`);
              }}
            >
              Add Owners
            </Button>
          </>
        }
      >
        <div className="flex h-full">
          {/* Left: search + selectable table */}
          <div className="flex min-w-0 flex-1 flex-col px-6 py-5">
            <div className="mb-4 flex shrink-0 items-center gap-3">
              <div className="flex-1">
                <Input
                  placeholder="Search people"
                  value={addSearch}
                  onChange={(e) => setAddSearch(e.target.value)}
                  startAdornment={<SearchOutlined sx={{ fontSize: 18 }} />}
                />
              </div>
              <Button variant="secondary" startIcon={<FilterListOutlined />} onClick={() => toast.info('Filters coming soon')}>
                Filter
              </Button>
            </div>
            <div className="min-h-0 flex-1">
              <DataTable<SeedEAOwner>
                columns={addColumns}
                rows={available}
                selectable
                selectedIds={selectedToAdd}
                onSelectionChange={setSelectedToAdd}
                fillHeight
                defaultRowsPerPage={25}
                emptyTitle="No people found"
                emptyMessage="Try a different search."
              />
            </div>
          </div>

          {/* Right: what you've selected */}
          <div className="w-[280px] shrink-0 border-l border-border px-6 py-5">
            <SelectionPanel
              title="Selected Owners"
              items={selectedItems}
              onRemove={(id) => setSelectedToAdd((prev) => prev.filter((x) => x !== id))}
              onClearAll={() => setSelectedToAdd([])}
              countLabel={(n) => `${n} owner${n > 1 ? 's' : ''} selected`}
              emptyTitle="No owners selected"
              emptyMessage="Select people from the list and they’ll appear here."
            />
          </div>
        </div>
      </Drawer>
    </div>
  );
}

/**
 * The Emergency Access detail screen, shared by both versions of the module.
 *
 * V1 and V2 differ only in how a profile is *created* — V1 opens a drawer and
 * drops you on a draft with a checklist, V2 walks a stepper and drops you on an
 * active profile. Once the profile exists, there is one screen for it, so this
 * lives here rather than being copied into a second route.
 *
 * `basePath` is the version that opened it: the same profile can be reached from
 * either list, and leaving (delete, not-found) must go back where you came from.
 */
export function EmergencyAccessDetail({ id, basePath }: { id: string; basePath: string }) {
  const router = useRouter();
  const toast = useToast();
  const [tab, setTab] = React.useState('overview');
  const [deactivateOpen, setDeactivateOpen] = React.useState(false);
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  // Bumped after activation so the page re-reads the session-memory status.
  const [, bump] = React.useReducer((n: number) => n + 1, 0);

  const ea = getEmergencyAccess(id);
  const blocking = ea ? eaBlockingSteps(ea) : [];

  const activate = () => {
    if (!ea || blocking.length > 0) return;
    activateEmergencyAccess(ea.id);
    toast.success(`“${ea.name}” is active. It can now be requested.`);
    bump();
    setTab('sessions');
  };

  if (!ea) {
    return (
      <div className="mx-auto max-w-2xl py-16 text-center">
        <h1 className="text-h3 text-text-primary">Emergency access not found</h1>
        <p className="mt-2 text-body text-text-secondary">This item doesn’t exist or was removed.</p>
        <div className="mt-4 flex justify-center">
          <Link href={basePath}>
            <Button variant="secondary">Back to Emergency Access</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* Sticky top: header + tabs, with a full-width line below */}
      <div className="shrink-0 -mx-8 -mt-6 border-b border-border bg-canvas px-8 pt-3">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Avatar name={ea.name} initials={ea.initial} size="md" />
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-h4 text-text-primary">{ea.name}</h1>
                {ea.risk && <StatusChip intent={ea.risk.intent} dot={false} label={ea.risk.label} />}
                <StatusChip intent={ea.status.intent} label={ea.status.label} />
              </div>
              <p className="mt-px text-body-sm text-text-secondary">{ea.description}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Beside the button it gates, so "why is Activate dead" and "how far
                off am I" are answered in the same glance. Drafts only: once live
                there is nothing left to count. */}
            {ea.isDraft && (
              <SetupProgress done={EA_REQUIRED_STEPS - blocking.length} total={EA_REQUIRED_STEPS} />
            )}
            <Button variant="secondary" startIcon={<EditOutlined />} onClick={() => toast.info('Edit basic details')}>
              Basic Details
            </Button>
            {/* A draft has never been on, so the only thing to offer is turning
                it on — and only once it would actually work. Same rule as the
                Overview checklist, from one definition. */}
            {ea.isDraft ? (
              <Tooltip
                title={
                  blocking.length > 0
                    ? `Add ${blocking.join(' and ')} before this can be activated.`
                    : 'Let eligible people request this access'
                }
              >
                <span>
                  <Button
                    startIcon={<CheckCircleOutlined />}
                    disabled={blocking.length > 0}
                    onClick={activate}
                  >
                    Activate
                  </Button>
                </span>
              </Tooltip>
            ) : (
              <Button variant="secondary" startIcon={<BlockOutlined />} onClick={() => setDeactivateOpen(true)}>
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
        <Tabs items={tabsFor(ea)} value={tab} onChange={setTab} noBorder aria-label="Emergency access details" />
      </div>

      {/* Tab content — fills the remaining height */}
      <div className="min-h-0 flex-1 pt-5">
        {tab === 'overview' && <OverviewTab ea={ea} onGoToTab={setTab} />}
        {tab === 'owners' && <EmergencyOwnersTab ea={ea} onChanged={bump} />}
        {tab === 'eligibility' && <EligibilityCriteriaTab eaId={ea.id} />}
        {tab === 'sessions' && <TabPlaceholder label="Sessions" />}
        {tab === 'assignments' && <EmergencyAssignmentsTab eaId={id} />}
        {tab === 'advanced' && <AdvancedConfigurationTab eaId={ea.id} />}
      </div>

      <Dialog
        open={deactivateOpen}
        onClose={() => setDeactivateOpen(false)}
        tone="danger"
        title={`Deactivate ${ea.name}?`}
        confirmLabel="Deactivate"
        onConfirm={() => {
          setDeactivateOpen(false);
          deactivateEmergencyAccess(ea.id);
          toast.success(`“${ea.name}” deactivated. It is a draft again.`);
          bump();
          setTab('overview');
        }}
      >
        Active users will lose emergency access immediately. This action is logged and the access can
        be re-activated later.
      </Dialog>

      <Dialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        tone="danger"
        title={`Delete ${ea.name}?`}
        confirmLabel="Delete"
        onConfirm={() => {
          setDeleteOpen(false);
          deleteEmergencyAccess(ea.id);
          toast.success(`“${ea.name}” deleted`);
          // Nothing left to show on this page — its subject is gone.
          router.push(basePath);
        }}
      >
        {ea.isDraft
          ? 'The profile and everything configured on it are removed. Nothing has been granted under it, so nobody loses access.'
          : 'Anyone holding access through this profile keeps it until their session ends, and nobody can request it again. Sessions already granted stay in the audit log.'}
      </Dialog>
    </div>
  );
}
