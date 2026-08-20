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
import DateRangeOutlined from '@mui/icons-material/DateRangeOutlined';
import ScheduleOutlined from '@mui/icons-material/ScheduleOutlined';
import DeleteOutline from '@mui/icons-material/DeleteOutline';
import FilterListOutlined from '@mui/icons-material/FilterListOutlined';
import SearchOutlined from '@mui/icons-material/SearchOutlined';
import AddIcon from '@mui/icons-material/Add';
import PersonAddAltOutlined from '@mui/icons-material/PersonAddAltOutlined';
import HistoryOutlined from '@mui/icons-material/HistoryOutlined';
import CalendarTodayOutlined from '@mui/icons-material/CalendarTodayOutlined';
import OpenInNewOutlined from '@mui/icons-material/OpenInNewOutlined';
import {
  Tabs,
  Card,
  InfoRow,
  InfoRowGroup,
  StatusChip,
  Avatar,
  Button,
  SetupBar,
  Stepper,
  Menu,
  DataTable,
  Dialog,
  Drawer,
  Input,
  SelectionPanel,
  SegmentedControl,
  OverflowChips,
  PickerSlot,
  Tooltip,
  useToast,
  type Column,
  type TabItem,
} from '@ds/components';
import {
  updateEmergencyAccessBasics,
  getEmergencyAccess,
  getAvailableOwners,
  getEAOwners,
  setEAOwners,
  activateEmergencyAccess,
  deactivateEmergencyAccess,
  deleteEmergencyAccess,
  eaBlockingSteps,
  getEAGovernanceTeams,
  setEAGovernanceTeams,
  getEAAssignments,
  listOwnerCandidates,
  getAdvancedConfig,
  EA_WEEKDAYS,
  EA_GUIDED_STEPS,
  firstUnfinishedGuidedTab,
  isEASetupStepDone,
  isRequiredSetupStep,
  type EAAdvancedConfig,
  type EADetail,
  type EASessionView,
} from '@/data/emergency-access';
import type { SeedEAOwner } from '@/data/seed';
import { listGovernanceTeamRows, listUserIdentities, type GovernanceTeamRow } from '@/data/directory';
import { PeekPanel, PeekSlot } from '@/components/product/directory/PeekPanel';
import { IdentityDetailsBody } from '@/components/product/directory/IdentityDetailsBody';
import { infoIcon } from '@/components/product/directory/infoIcons';
import { RowActions } from '@/components/product/RowActions';
import { TableSelectDrawer } from '@/components/product/automation/TableSelectDrawer';
import { EligibilityCriteriaTab } from '@/components/product/emergency/EligibilityCriteriaTab';
import { AdvancedConfigurationTab } from '@/components/product/emergency/AdvancedConfigurationTab';
import { EmergencyAssignmentsTab } from '@/components/product/emergency/EmergencyAssignmentsTab';
import {
  DetailRail,
  type DetailRailGroup,
  type DetailRailRow,
} from '@/components/product/DetailRail';
import {
  emergencySetupSteps,
  type EmergencySetupStep,
} from '@/components/product/emergency/setupSteps';
import { toastEASetupStep } from '@/components/product/emergency/ea-setup-toast';
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
 * sum the setup rail reads to decide whether the owners step is done, so the
 * tab strip and the checklist cannot disagree.
 *
 * Zero shows rather than hides. On a draft, "Owners (0)" answers the question the
 * reader is asking — an absent count reads as "not counted yet" and makes them
 * open the tab to find out it was empty. `count` is only omitted for the tabs
 * that hold no collection to count.
 *
 * Sessions is deliberately uncounted: it already reports its own total in the
 * Overview card's "Recent Sessions (24)" heading.
 */
function tabsFor(ea: EADetail, dropOverview: boolean): TabItem[] {
  const assignments = getEAAssignments(ea.id);
  const tabs: TabItem[] = [
    {
      value: 'overview',
      label: 'Overview',
    },
    { value: 'sessions', label: 'Sessions' },
    {
      value: 'assignments',
      label: 'Assignments',
      count: assignments.entitlements.length + assignments.technicalRoles.length,
    },
    { value: 'eligibility', label: 'Eligibility Criteria', count: ea.eligibilityGroups.length },
    { value: 'owners', label: 'Owners', count: ea.ownersCount + getEAGovernanceTeams(ea.id).length },
    { value: 'advanced', label: 'Advanced Configuration' },
  ];
  /**
   * A draft has no Sessions tab. A session only exists because someone requested this
   * access, and nobody can request a profile that has never been switched on — so the
   * tab could only ever hold an explanation of why it is empty. Naming the state in the
   * strip and then charging a click to read an apology is worse than not offering it:
   * the tab appears, with real rows behind it, the moment the profile goes live.
   *
   * A V1 draft also has no Overview tab: its only draft content was the setup checklist,
   * and that is now docked to the left of every tab. Dropping it rather than leaving it
   * empty is the point — there is no Setup page to return to. It comes back once the
   * profile is live, where Overview is a real summary and has nothing to do with setup.
   */
  return tabs.filter(
    (t) => !(t.value === 'sessions' && ea.isDraft) && !(t.value === 'overview' && dropOverview),
  );
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

/**
 * Who has actually used this access, and when.
 *
 * The audit question this tab exists for. Break-glass is judged after the fact — the
 * point of a profile is that someone can grant themselves something dangerous, so the
 * record of who did is the control. A placeholder here was the one tab where "not
 * built yet" cost the reader something real.
 *
 * Three columns and no more: who, whether they still hold it, and when. The seed
 * carries `when` as a rendered string rather than an instant, so nothing here computes
 * a duration — inventing one from a display string is how a number nobody can defend
 * ends up in an audit view.
 *
 * Rows open the person, not the session. A session is an event with nothing behind it;
 * the identity is where a reviewer goes next — and the row would otherwise be a dead
 * end, which this page's own rule forbids.
 */
function SessionsTab({ ea }: { ea: EADetail }) {
  const router = useRouter();

  const columns: Column<EASessionView>[] = [
    {
      id: 'who',
      header: 'Requester',
      sortable: true,
      width: '46%',
      wrap: true,
      value: (r) => r.name,
      render: (r) => (
        <div className="flex items-center gap-3">
          <Avatar name={r.name} size="sm" kind="person" />
          <div className="min-w-0">
            <div className="truncate text-body-sm-medium text-text-primary">{r.name}</div>
            <div className="truncate text-caption text-text-secondary">{r.subtitle}</div>
          </div>
        </div>
      ),
    },
    {
      id: 'state',
      header: 'Status',
      sortable: true,
      width: 140,
      wrap: true,
      value: (r) => (r.ongoing ? 'Ongoing' : 'Ended'),
      // `success` for a live session, not `warning`: someone holding break-glass
      // access right now is the system working, and tinting it as a problem would
      // teach a reviewer to read every ongoing session as an incident.
      render: (r) =>
        r.ongoing ? (
          <StatusChip intent="success" label="Ongoing" />
        ) : (
          <StatusChip intent="neutral" label="Ended" />
        ),
    },
    {
      id: 'when',
      header: 'When',
      sortable: true,
      width: '34%',
      value: (r) => r.when,
    },
  ];

  return (
    <DataTable<EASessionView>
      columns={columns}
      rows={ea.sessions}
      onRowClick={(r) => router.push(`/iga/directory/user-identities/${r.identityId}`)}
      layout="fixed"
      fillHeight
      emptyTitle="No sessions yet"
      emptyMessage="Nobody has requested this access. Sessions appear here as people use it."
    />
  );
}

function sessionLengthLabel(hrs: number): string {
  if (hrs >= 24 && hrs % 24 === 0) {
    const days = hrs / 24;
    return `${days} Day${days === 1 ? '' : 's'}`;
  }
  return `${hrs} Hr${hrs === 1 ? '' : 's'}`;
}

function allowedDaysLabel(cfg: EAAdvancedConfig): string {
  if (cfg.days.length === 7) return 'Any Day';
  const key = [...cfg.days].sort().join(',');
  if (key === 'fri,mon,thu,tue,wed') return 'Weekdays';
  if (key === 'sat,sun') return 'Weekends';
  const days = EA_WEEKDAYS.filter((d) => cfg.days.includes(d.id)).map((d) => d.short);
  return days.join(', ') || 'Not set';
}

function formatClock(value: string): string {
  const [hours, minutes] = value.split(':').map(Number);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return value;
  const period = hours >= 12 ? 'PM' : 'AM';
  const hour = hours % 12 || 12;
  return `${String(hour).padStart(2, '0')}:${String(minutes).padStart(2, '0')} ${period}`;
}

function requestWindowLabel(cfg: EAAdvancedConfig): string {
  if (cfg.windowStart === cfg.windowEnd) return 'All day';
  return `${formatClock(cfg.windowStart)} - ${formatClock(cfg.windowEnd)}`;
}

/**
 * The summary. It is no longer also a setup surface.
 *
 * Every version now guides setup somewhere else — V1 in the docked rail, V2 in its
 * wizard, V3 in the floating bar — so Overview only ever renders for a profile whose
 * setup is not the question. That is why nothing here branches on `isDraft` any more:
 * the branches existed for a draft that can no longer reach this tab.
 */
function OverviewTab({ ea }: { ea: EADetail }) {
  const cfg = getAdvancedConfig(ea.id);

  return (
    <div className="ds-scroll h-full overflow-y-auto pr-0.5">
      <div className="grid items-start gap-5 lg:grid-cols-[1fr_340px]">
        <Card title={`Recent Sessions (${ea.sessionsTotal})`} icon={<Person />} padding="none">
          <div>
            {ea.sessions.map((s) => (
              <ListRow key={s.id}>
                <Avatar name={s.name} size="sm" kind="person" />
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

        <div className="space-y-5">
          <Card title="Advanced Configuration Info" icon={<Info />} padding="none">
            <InfoRowGroup>
              <InfoRow
                icon={<DateRangeOutlined sx={{ fontSize: 18 }} />}
                label="Allowed Days"
                value={allowedDaysLabel(cfg)}
                valueWrap
              />
              <InfoRow
                icon={<ScheduleOutlined sx={{ fontSize: 18 }} />}
                label="Request Window"
                value={requestWindowLabel(cfg)}
              />
              <InfoRow
                icon={<HourglassEmptyOutlined sx={{ fontSize: 18 }} />}
                label="Max. Duration"
                value={sessionLengthLabel(cfg.maxDurationHrs)}
              />
              <InfoRow
                icon={<GroupsOutlined sx={{ fontSize: 18 }} />}
                label="Max. Concurrent Users"
                value={String(cfg.maxConcurrent)}
              />
            </InfoRowGroup>
          </Card>

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
 * Editing the two fields the profile is identified by.
 *
 * A drawer rather than a tab or an inline form: this is a short, self-contained edit
 * reached from two different places — the header button and the setup checklist — and
 * a tab would make the reader leave whatever they were reading to perform it. It also
 * keeps the pair together; name and description are read as one thing everywhere they
 * appear, so they are edited as one thing.
 *
 * Local draft state, committed on save. Typing straight into the store would make
 * Cancel meaningless and would repaint the header on every keystroke.
 */
function BasicDetailsDrawer({
  open,
  ea,
  onClose,
  onSaved,
}: {
  open: boolean;
  ea: EADetail;
  onClose: () => void;
  onSaved: () => void;
}) {
  const toast = useToast();
  const [name, setName] = React.useState(ea.name);
  const [description, setDescription] = React.useState(ea.description);

  // Re-seed each time it opens, so a cancelled edit does not persist as the starting
  // point of the next one.
  React.useEffect(() => {
    if (open) {
      setName(ea.name);
      setDescription(ea.description);
    }
  }, [open, ea.name, ea.description]);

  const valid = name.trim() !== '' && description.trim() !== '';

  const save = () => {
    if (!valid) return;
    const wasDone = ea.name.trim() !== '' && ea.description.trim() !== '';
    updateEmergencyAccessBasics(ea.id, { name, description });
    if (!toastEASetupStep(toast, ea.id, 'basic', wasDone)) {
      toast.success('Basic details saved.');
    }
    onSaved();
    onClose();
  };

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title="Basic details"
      subtitle="What this access is called, and what it is for."
      icon={<EditOutlined sx={{ fontSize: 22, color: 'var(--ds-color-brand-primary)' }} />}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          {/* Both fields are required because activation already demands them — the
              same gate `eaBlockingSteps` reads. Letting this save an empty
              description would hand the reader a profile that cannot go live and no
              hint as to why. */}
          <Button disabled={!valid} onClick={save}>
            Save
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Input
          label="Name"
          required
          size="sm"
          hint="Shown wherever this access is requested or reviewed."
          placeholder="e.g. Bitbucket production"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <Input
          label="Description"
          required
          size="sm"
          multiline
          minRows={3}
          hint="Read by whoever approves the request. Say what it is for, and when it should be used."
          placeholder="What this access is for, and when it should be used"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>
    </Drawer>
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
  const toast = useToast();
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
    const wasDone = owners.length > 0;
    setOwners(setEAOwners(ea.id, candidates.filter((o) => ids.includes(o.id))));
    onChanged();
    toastEASetupStep(toast, ea.id, 'owners', wasDone);
  };
  const commitTeams = (ids: string[]) => {
    setTeamIds(setEAGovernanceTeams(ea.id, ids));
    onChanged();
  };

  const slots = [
    {
      key: 'people' as const,
      icon: <PersonOutline />,
      empty: 'No owners named',
      emptyHint: 'A named owner answers for this access day to day.',
      editHint: 'Edit who answers for this access day to day.',
      addLabel: 'Add Owners',
      items: owners.map((o) => ({ id: o.id, name: o.name })),
      entity: 'owner',
    },
    {
      key: 'teams' as const,
      icon: <GroupsOutlined />,
      empty: 'No governance teams',
      emptyHint: 'A team answers for this access at review, where an owner answers day to day.',
      editHint: 'Edit which teams answer for this at review.',
      addLabel: 'Add Governance Teams',
      items: allTeams.filter((t) => teamIds.includes(t.id)).map((t) => ({ id: t.id, name: t.name })),
      entity: 'governance team',
    },
  ];

  return (
    // Full width of whatever holds it. A reading-width cap here held the content
    // short of the buttons that act on it, so the surface looked like it had a
    // right margin its own footer did not — and these rows are icon-and-control,
    // not prose, so there is no line length to protect.
    <div className="space-y-4">
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
          ownership out on purpose, because blocking break-glass access on a missing
          owner would stop someone turning it on during an incident. That used to be
          spelled out here in a footnote; the rail carries it instead, by simply not
          marking this step required while the others wear an asterisk. */}
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
  const router = useRouter();
  const toast = useToast();
  const [view, setView] = React.useState<'individual' | 'teams'>('individual');
  const [search, setSearch] = React.useState('');
  /**
   * The row whose details are open beside the table — a person or a team, never both.
   *
   * One piece of state rather than two, because the panel is one slot: two would let a
   * stale person sit behind a team, and closing one would reveal the other.
   */
  const [peek, setPeek] = React.useState<
    { kind: 'owner'; row: SeedEAOwner } | { kind: 'team'; row: GovernanceTeamRow } | null
  >(null);
  // Switching halves changes what the table lists, so a panel about the other half
  // would be describing a row that is no longer on screen.
  React.useEffect(() => setPeek(null), [view]);

  // Session-memory store, read after mount like the rest of this module. Held in
  // state rather than read from `ea` so adding an owner shows up here and on the
  // Overview checklist without a round trip through the page.
  const [owners, setOwners] = React.useState<SeedEAOwner[]>([]);
  React.useEffect(() => setOwners(getEAOwners(ea.id)), [ea.id]);
  const persistOwners = (next: SeedEAOwner[]) => {
    const wasDone = owners.length > 0;
    setOwners(setEAOwners(ea.id, next));
    onChanged();
    toastEASetupStep(toast, ea.id, 'owners', wasDone);
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
    .map((o) => ({ id: o.id, label: o.name, sublabel: o.email, icon: <Avatar name={o.name} size="sm" kind="person" /> }));
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
  /**
   * Owner ids are identity ids — `emergencyOwners` is built from `userIdentities` — so the
   * directory holds the full record for every one of them. Looking it up lets the panel
   * reuse `IdentityDetailsBody` rather than restating a thinner version of the same
   * person; the fallback covers an owner the directory does not know about.
   */
  const identityById = React.useMemo(() => new Map(listUserIdentities().map((u) => [u.id, u])), []);

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
            {/* The description drops out while the panel is open, along with the
                Reviewers column below: the panel carries both, and the ~416px it leaves
                is not enough for a two-line name cell, a count and the actions. */}
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
      render: (t) => (
        <RowActions
          onInfo={() => setPeek({ kind: 'team', row: t })}
          infoLabel={`View details for ${t.name}`}
          onRemove={() => {
            persistTeams(teamIds.filter((x) => x !== t.id));
            if (peek?.kind === 'team' && peek.row.id === t.id) setPeek(null);
            toast.success(`${t.name} removed`);
          }}
          removeLabel={`Remove ${t.name}`}
          removeTooltip="Remove team"
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
          <Avatar name={o.name} size="sm" kind="person" />
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
          <Avatar name={o.name} size="sm" kind="person" />
          <span className="text-body-sm-strong text-text-primary">{o.name}</span>
        </div>
      ),
    },
    /* Email stands down while the panel is open — the panel carries it, in the subtitle
       and again in the record, and four columns plus a checkbox do not fit in the ~416px
       the panel leaves. Without this the Actions cell scrolled out of reach, taking the
       button that had just been pressed with it. */
    ...(peek === null
      ? [
          {
            id: 'email',
            header: 'Email',
            sortable: true,
            value: (o: SeedEAOwner) => o.email,
            render: (o: SeedEAOwner) => <span className="text-text-secondary">{o.email}</span>,
          },
        ]
      : []),
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
            persistOwners(owners.filter((x) => x.id !== o.id));
            if (peek?.kind === 'owner' && peek.row.id === o.id) setPeek(null);
            toast.success(`${o.name} removed`);
          }}
          removeLabel={`Remove ${o.name}`}
          removeTooltip="Remove owner"
        />
      ),
    },
  ];

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* The two halves of ownership are a segmented control at the top, for the same
          reasons as Assignments: it is a choice between two, it does not need a 264px
          column and the page's full height to state that, and a `NavList` beside the
          navigation rail made a pane switcher look like more navigation. */}
      {/* 20px below the switcher, 12px below the toolbar: the switcher chooses which
          dataset you are looking at, the toolbar acts within it. The larger gap binds the
          toolbar and its table into one unit under the switcher, rather than leaving three
          bands equally spaced and equally related. */}
      <div className="mb-5 flex shrink-0 flex-wrap items-center gap-3">
        <SegmentedControl<'individual' | 'teams'>
          ariaLabel="Owner type"
          value={view}
          onChange={setView}
          options={[
            { value: 'individual', label: 'Individual Owners', count: ea.ownersCount },
            { value: 'teams', label: 'Governance Teams', count: teamIds.length },
          ]}
        />
      </div>

      <div className="flex min-h-0 flex-1 flex-col">
        <div className="mb-3 flex shrink-0 flex-wrap items-center gap-3">
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

        {/* Same slot the Assignments tab and the directory's peeks use: the panel takes
            width from the table rather than covering it, so the row stays visible and
            picking another swaps the contents. */}
        <div className="flex min-h-0 flex-1">
          <div className="min-h-0 min-w-0 flex-1">
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

          <PeekSlot open={peek !== null}>
            {peek?.kind === 'owner' && (
              <PeekPanel
                avatar={<Avatar name={peek.row.name} size="md" kind="person" />}
                title={peek.row.name}
                subtitle={peek.row.email}
                onClose={() => setPeek(null)}
                footer={
                  /* An owner is an identity the directory already holds a record for, so
                     the panel ends where that record begins rather than dead-ending on a
                     name and an address. */
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
                {/* The directory's own body for a person, `bare` because the panel is
                    already the box — so an owner reads the same here as it does there,
                    instead of this tab inventing a shorter version of the same record. */}
                {identityById.get(peek.row.id) ? (
                  <IdentityDetailsBody identity={identityById.get(peek.row.id)!} surface="bare" />
                ) : (
                  <div className="pt-3">
                    <InfoRowGroup>
                      <InfoRow icon={infoIcon.person} label="Name" value={peek.row.name} />
                      <InfoRow icon={infoIcon.email} label="Email" value={peek.row.email} />
                    </InfoRowGroup>
                  </div>
                )}
              </PeekPanel>
            )}
            {peek?.kind === 'team' && (
              <PeekPanel
                avatar={<Avatar name={peek.row.name} size="md" kind="entity" />}
                title={peek.row.name}
                subtitle="Answers for this access at review"
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
                if (owners.length > 0) {
                  toast.success(`${added.length} owner${added.length === 1 ? '' : 's'} added`);
                }
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
 * The Emergency Access detail screen, shared by every version of the module.
 *
 * The versions differ in how a draft is *finished* — V1 a checklist tab, V2 a
 * create stepper, V3 a floating bar under the real tabs. Once the profile is
 * live, this is one screen, so it lives here rather than being copied.
 *
 * `basePath` is the version that opened it: the same profile can be reached from
 * any list, and leaving (delete, not-found) must go back where you came from.
 */
export function EmergencyAccessDetail({ id, basePath }: { id: string; basePath: string }) {
  /**
   * V1 only, for now — the owner is comparing the modules side by side, so the
   * Setup tab rename lands on one of them first. `basePath` is already how this
   * component knows which version opened it.
   */
  const isV1 = basePath === '/iga/emergency';
  const isV3 = basePath === '/iga/emergency-v3';

  const [basicsOpen, setBasicsOpen] = React.useState(false);
  const router = useRouter();
  const toast = useToast();
  const [tab, setTab] = React.useState(() => {
    // V1 and V3 both open a draft on the work rather than on a summary — V3 because
    // its bar drives the tabs, V1 because it has no Overview tab while it is a draft.
    if (!isV3 && !isV1) return 'overview';
    const draft = getEmergencyAccess(id);
    return draft?.isDraft ? firstUnfinishedGuidedTab(draft) : 'overview';
  });
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
    setTab('overview');
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

  /**
   * V1 navigates in the rail instead of a tab strip, in both states. `showSetupRail` is
   * the narrower question of whether that rail is also the setup checklist — which is
   * what drops Overview from a draft, since the checklist replaced what Overview held.
   */
  const showRail = isV1;
  const showSetupRail = isV1 && ea.isDraft;

  /**
   * The tab actually shown, which is not always the one in state.
   *
   * Which tabs exist depends on the profile's state, so a value in `tab` can stop being
   * offered underneath the reader: deactivating a live profile removes Sessions, and on
   * V1 removes Overview as well, while both are legitimately current beforehand. Rather
   * than name the vanishing tabs — the list has changed twice already — this asks the
   * strip whether it still lists the current value and falls back when it does not.
   * Normalising once here means no render site has to guard against a tab the strip does
   * not show, which would otherwise put a summary under a strip that does not list it.
   */
  const visibleTabs = tabsFor(ea, showSetupRail);
  const shownTab = visibleTabs.some((t) => t.value === tab)
    ? tab
    : ea.isDraft
      ? firstUnfinishedGuidedTab(ea)
      : 'overview';

  /**
   * What the rail lists — one derivation, not one per state.
   *
   * A live profile shows the same grouped, ticked list a draft does; it just gains the
   * sections that are not setup steps at the top. That is deliberate: the rail does not
   * restyle itself when a profile is switched on, it grows two rows. And the ticks keep
   * earning their place afterwards — "this active break-glass profile still has no
   * owners" is exactly the gap an admin should be able to see without opening anything.
   *
   * Nothing here is a hand-kept list. Steps come from the step definition and non-step
   * sections from the same `tabsFor` list the strip would have rendered, so the rail
   * cannot offer a section the page does not have, or miss one it does. Each side brings
   * its own label, which is why the wording does not shift from "Eligibility criteria" to
   * "Eligibility Criteria" the moment the profile activates.
   *
   * Counts come along in both states. The strip used to carry them, and a draft filling
   * in assignments wants the running total as much as a live profile does — the tick says
   * whether a step is done, the count says how much is behind it.
   */
  const countFor = (tab: string) => visibleTabs.find((t) => t.value === tab)?.count;
  const setupSteps = emergencySetupSteps(ea);
  const stepRow = (step: EmergencySetupStep): DetailRailRow => ({
    id: step.id,
    label: step.label,
    tab: step.tab,
    count: countFor(step.tab),
    done: step.done,
    doneLabel: step.doneLabel,
  });

  const railGroups: DetailRailGroup[] = [
    {
      rows: visibleTabs
        .filter((t) => !setupSteps.some((s) => s.tab === t.value))
        .map((t) => ({ id: t.value, label: t.label, tab: t.value, count: t.count })),
    },
    {
      heading: 'Required to activate',
      headingHint: 'these steps gate activation',
      rows: setupSteps.filter((s) => s.required && s.id !== 'basic').map(stepRow),
    },
    {
      heading: 'Additional',
      headingHint: 'optional, and does not block activation',
      rows: setupSteps.filter((s) => !s.required).map(stepRow),
    },
  ].filter((g) => g.rows.length > 0);

  const guidedTabIndex = EA_GUIDED_STEPS.findIndex((s) => s.tab === shownTab);
  const guidedIndex =
    guidedTabIndex >= 0
      ? guidedTabIndex
      : EA_GUIDED_STEPS.findIndex((s) => s.tab === firstUnfinishedGuidedTab(ea));
  const guidedStep = EA_GUIDED_STEPS[Math.max(0, guidedIndex)];
  const atLastGuided = guidedIndex >= EA_GUIDED_STEPS.length - 1;
  const nextBlocked =
    isRequiredSetupStep(guidedStep.id) && !isEASetupStepDone(guidedStep.id, ea);
  const canActivate = blocking.length === 0;
  const showSetupBar = isV3 && ea.isDraft;

  const goGuided = (index: number) => {
    const next = EA_GUIDED_STEPS[index];
    if (next) setTab(next.tab);
  };

  return (
    <div className="flex h-full flex-col">
      {/*
        The page header, full-bleed.

        It only draws its own rule when the setup rail is docked below it: that rule is
        the horizontal half of the frame the rail's right border completes, so the two
        lines meet and read as one continuous boundary. Without a rail there is nothing
        to meet, and a line here would be a second one directly above the tab strip's.
      */}
      <div
        className={`shrink-0 -mx-8 -mt-6 bg-canvas px-8 pt-3 ${
          showRail ? 'border-b border-border' : ''
        }`}
      >
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
            {/* Was a `toast.info` stub. It opens the real editor now — the same one
                the setup checklist's "Edit details" reaches, so there is one place
                these two fields are changed. */}
            <Button variant="secondary" startIcon={<EditOutlined />} onClick={() => setBasicsOpen(true)}>
              Basic Details
            </Button>
            {/* A draft has never been on, so the only thing to offer is turning it on —
                and only once it would actually work.

                A plain button that is simply disabled until then. It used to carry a
                progress ring and a "N required steps to activate" label, from when the
                header was the only place the reader could learn how far along the setup
                was. The docked rail reports that now, step by step, so a second meter in
                the button was the same state said twice — and the button's own job, which
                is the one action, was the half that got crowded out. The tooltip still
                names what is missing for anyone who reaches for it. */}
            {ea.isDraft && !isV3 ? (
              <Tooltip
                title={
                  blocking.length > 0
                    ? `Add ${blocking.join(' and ')} before this can be activated.`
                    : 'Let eligible people request this access'
                }
              >
                <span>
                  <Button disabled={blocking.length > 0} onClick={activate}>
                    Activate
                  </Button>
                </span>
              </Tooltip>
            ) : !ea.isDraft ? (
              <Button variant="secondary" startIcon={<BlockOutlined />} onClick={() => setDeactivateOpen(true)}>
                Deactivate
              </Button>
            ) : null}
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
      </div>

      {/*
        Everything below the header: the docked rail, and the tabs-plus-content column
        beside it.

        Full-bleed on three sides (`-mx-8 -mb-6` cancels the layout's page padding) so
        the rail reaches the left edge and the bottom of the viewport instead of floating
        in a padded box — a docked column that stops short of either would read as a card.
        The padding comes back inside the right-hand column, where it belongs to the
        content rather than to the frame.

        On the versions that still have a tab strip it lives in that column, not above the
        pair, so it would start to the right of a rail rather than over it.
      */}
      <div className={`-mx-8 flex min-h-0 flex-1 ${showRail ? '-mb-6' : ''}`}>
        {showRail && (
          <DetailRail
            ariaLabel={showSetupRail ? 'Setup checklist' : 'Profile sections'}
            groups={railGroups}
            currentTab={shownTab}
            onGoTo={(row) => {
              setTab(row.tab);
            }}
          />
        )}
        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          {/* No tab strip where the rail is: the two were the same list, and V1 keeps the
              rail. A vertical list has room the strip does not — per-row completion on a
              draft, and counts that do not compete with the label for width. V2 and V3
              still navigate here. Name and description live on the header, not as a
              rail row. */}
          {!showRail && (
            <div className="shrink-0 border-b border-border px-8">
              <Tabs
                items={visibleTabs}
                value={shownTab}
                onChange={setTab}
                noBorder
                aria-label="Emergency access details"
              />
            </div>
          )}
          {/* A 20px gutter on all four sides where the rail is docked. The content's edges
              are measured from the rail's border, not the page's, so there is no page
              title above it to line up with — 32px was the layout's page margin inherited
              by a region that is not the page.

              `pb-5` only pairs with the `-mb-6` above: it puts back, inside the content,
              the bottom padding the full-bleed cancelled. Without a rail the layout's own
              padding is still in force and adding it again would double it — and V3's
              setup bar sits below this block, which a negative margin would overlap. */}
          <div
            className={
              showRail ? 'min-h-0 min-w-0 flex-1 p-5' : 'min-h-0 min-w-0 flex-1 px-8 pt-5'
            }
          >
        {shownTab ==='overview' && (
          <OverviewTab ea={ea} />
        )}
        {shownTab ==='owners' && <EmergencyOwnersTab ea={ea} onChanged={bump} />}
        {shownTab ==='eligibility' && <EligibilityCriteriaTab eaId={ea.id} onChanged={bump} />}
        {shownTab ==='sessions' && <SessionsTab ea={ea} />}
        {shownTab ==='assignments' && <EmergencyAssignmentsTab eaId={id} onChanged={bump} />}
        {shownTab ==='advanced' && <AdvancedConfigurationTab eaId={ea.id} onChanged={bump} />}
          </div>
        </div>
      </div>

      {showSetupBar && (
        <div className="shrink-0 pt-3">
          <SetupBar
            progress={
              <Stepper
                steps={EA_GUIDED_STEPS.map((s) => ({ label: s.label }))}
                current={Math.max(0, guidedIndex)}
                onStepClick={goGuided}
                showBack={false}
              />
            }
            actions={
              <>
                <Button
                  variant="secondary"
                  disabled={guidedIndex <= 0}
                  onClick={() => goGuided(guidedIndex - 1)}
                >
                  Back
                </Button>
                {!atLastGuided && (
                  <Tooltip
                    title={
                      nextBlocked
                        ? `Add ${guidedStep.label.toLowerCase()} before continuing.`
                        : 'Go to the next setup step'
                    }
                  >
                    <span>
                      <Button
                        variant={canActivate ? 'secondary' : 'primary'}
                        disabled={nextBlocked}
                        onClick={() => goGuided(guidedIndex + 1)}
                      >
                        Next
                      </Button>
                    </span>
                  </Tooltip>
                )}
              </>
            }
            primary={
              canActivate ? (
                <Button onClick={activate}>Activate</Button>
              ) : undefined
            }
          />
        </div>
      )}

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
          const again = getEmergencyAccess(ea.id);
          setTab(isV3 && again ? firstUnfinishedGuidedTab(again) : 'overview');
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

      {/* `bump` on save, the same reducer every other mutation on this page uses —
          the header's name reads from the store on render, so one re-render
          updates it. */}
      <BasicDetailsDrawer
        open={basicsOpen}
        ea={ea}
        onClose={() => setBasicsOpen(false)}
        onSaved={bump}
      />
    </div>
  );
}
