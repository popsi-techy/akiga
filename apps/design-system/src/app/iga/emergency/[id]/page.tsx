'use client';

import * as React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import EditOutlined from '@mui/icons-material/EditOutlined';
import BlockOutlined from '@mui/icons-material/BlockOutlined';
import Person from '@mui/icons-material/Person';
import PersonOutline from '@mui/icons-material/PersonOutline';
import Info from '@mui/icons-material/Info';
import Schedule from '@mui/icons-material/Schedule';
import HourglassEmptyOutlined from '@mui/icons-material/HourglassEmptyOutlined';
import GroupsOutlined from '@mui/icons-material/GroupsOutlined';
import RepeatOutlined from '@mui/icons-material/RepeatOutlined';
import PauseCircleOutline from '@mui/icons-material/PauseCircleOutline';
import ContentCopyOutlined from '@mui/icons-material/ContentCopyOutlined';
import DeleteOutline from '@mui/icons-material/DeleteOutline';
import FilterListOutlined from '@mui/icons-material/FilterListOutlined';
import SearchOutlined from '@mui/icons-material/SearchOutlined';
import AddIcon from '@mui/icons-material/Add';
import PersonAddAltOutlined from '@mui/icons-material/PersonAddAltOutlined';
import HistoryOutlined from '@mui/icons-material/HistoryOutlined';
import CalendarTodayOutlined from '@mui/icons-material/CalendarTodayOutlined';
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
  useToast,
  type Column,
} from '@ds/components';
import { getEmergencyAccess, getAvailableOwners, type EADetail } from '@/data/emergency-access';
import type { SeedEAOwner } from '@/data/seed';
import { EligibilityCriteriaTab } from '@/components/product/emergency/EligibilityCriteriaTab';
import { AdvancedConfigurationTab } from '@/components/product/emergency/AdvancedConfigurationTab';

const TABS = [
  { value: 'overview', label: 'Overview' },
  { value: 'owners', label: 'Owners' },
  { value: 'eligibility', label: 'Eligibility Criteria' },
  { value: 'sessions', label: 'Sessions' },
  { value: 'assignments', label: 'Assignments' },
  { value: 'advanced', label: 'Advanced Configuration' },
];

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

function OverviewTab({ ea }: { ea: EADetail }) {
  return (
    <div className="ds-scroll h-full overflow-y-auto pr-0.5">
      <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
        <Card
          title={`Recent Sessions (${ea.sessionsTotal})`}
          icon={<Person />}
          padding="none"
        >
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

        <div className="space-y-5">
          <Card title="Information" icon={<Info />} padding="none">
            <InfoRowGroup>
              <InfoRow icon={<HourglassEmptyOutlined sx={{ fontSize: 18 }} />} label="Max. Duration" value={`${ea.config.maxDurationHrs} Hrs`} />
              <InfoRow icon={<GroupsOutlined sx={{ fontSize: 18 }} />} label="Max. Concurrent Users" value={String(ea.config.maxConcurrent)} />
              <InfoRow icon={<RepeatOutlined sx={{ fontSize: 18 }} />} label="Max. Requests Per Day" value={String(ea.config.maxRequestsPerDay)} />
              <InfoRow icon={<PauseCircleOutline sx={{ fontSize: 18 }} />} label="Cooldown Period" value={`${ea.config.cooldownHrs} Hrs`} />
            </InfoRowGroup>
          </Card>

          <Card title="Timeline" icon={<Schedule />} padding="none">
            <InfoRowGroup>
              <InfoRow icon={<HistoryOutlined sx={{ fontSize: 18 }} />} label="Last Updated On" value={ea.timeline.updatedOn} />
              <InfoRow icon={<CalendarTodayOutlined sx={{ fontSize: 18 }} />} label="Created On" value={ea.timeline.createdOn} />
            </InfoRowGroup>
          </Card>
        </div>
      </div>
    </div>
  );
}

function OwnersTab({ ea }: { ea: EADetail }) {
  const toast = useToast();
  const [view, setView] = React.useState<'individual' | 'groups'>('individual');
  const [search, setSearch] = React.useState('');
  const rows = ea.owners.filter(
    (o) => o.name.toLowerCase().includes(search.toLowerCase()) || o.email.toLowerCase().includes(search.toLowerCase()),
  );

  // "Add Owners" drawer: searchable, multi-select table of available people.
  const [addOpen, setAddOpen] = React.useState(false);
  const [addSearch, setAddSearch] = React.useState('');
  const [selectedToAdd, setSelectedToAdd] = React.useState<string[]>([]);
  const candidates = getAvailableOwners(ea.id);
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
            { label: 'Remove owner', danger: true, onClick: () => toast.success(`${o.name} removed`) },
          ]}
        />
      ),
    },
  ];

  return (
    <div className="grid h-full gap-5 lg:grid-cols-[248px_1fr]">
      {/* Left: toggles inside a container */}
      <Card padding="none" className="h-full">
        <div className="p-2">
          <NavList
            ariaLabel="Owner type"
            value={view}
            onChange={(id) => setView(id as 'individual' | 'groups')}
            items={[
              { id: 'individual', icon: <PersonOutline sx={{ fontSize: 18 }} />, label: 'Individual Owners', count: ea.ownersCount },
              { id: 'groups', icon: <GroupsOutlined sx={{ fontSize: 18 }} />, label: 'Governance Groups', count: ea.governanceGroupsCount },
            ]}
          />
        </div>
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
            <Button startIcon={<AddIcon />} onClick={openAdd}>
              Add Owners
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
            <TabPlaceholder label="Governance Groups" />
          )}
        </div>
      </div>

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
                const n = selectedToAdd.length;
                setAddOpen(false);
                toast.success(`${n} owner${n > 1 ? 's' : ''} added`);
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

export default function EmergencyAccessDetailPage() {
  const params = useParams();
  const id = String(params.id);
  const toast = useToast();
  const [tab, setTab] = React.useState('overview');
  const [deactivateOpen, setDeactivateOpen] = React.useState(false);

  const ea = getEmergencyAccess(id);

  if (!ea) {
    return (
      <div className="mx-auto max-w-2xl py-16 text-center">
        <h1 className="text-h3 text-text-primary">Emergency access not found</h1>
        <p className="mt-2 text-body text-text-secondary">This item doesn’t exist or was removed.</p>
        <div className="mt-4 flex justify-center">
          <Link href="/iga/emergency">
            <Button variant="secondary">Back to Emergency Access</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* Sticky top: header + tabs, with a full-width line below */}
      <div className="shrink-0 -mx-8 -mt-6 border-b border-border bg-canvas px-8 pt-5">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <Avatar name={ea.name} initials={ea.initial} size="md" />
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-h3 leading-tight text-text-primary">{ea.name}</h1>
                {ea.risk && <StatusChip intent={ea.risk.intent} dot={false} label={ea.risk.label} />}
                <StatusChip intent={ea.status.intent} label={ea.status.label} />
              </div>
              <p className="mt-0.5 text-body-sm text-text-secondary">{ea.description}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="secondary" startIcon={<EditOutlined />} onClick={() => toast.info('Edit basic details')}>
              Basic Details
            </Button>
            <Button variant="secondary" startIcon={<BlockOutlined />} onClick={() => setDeactivateOpen(true)}>
              Deactivate
            </Button>
            <Menu
              items={[
                { label: 'Duplicate', icon: <ContentCopyOutlined sx={{ fontSize: 18 }} />, onClick: () => toast.info('Duplicated'), divider: true },
                { label: 'Delete', icon: <DeleteOutline sx={{ fontSize: 18 }} />, danger: true, onClick: () => toast.error('Deleted') },
              ]}
            />
          </div>
        </div>
        <Tabs items={TABS} value={tab} onChange={setTab} noBorder aria-label="Emergency access details" />
      </div>

      {/* Tab content — fills the remaining height */}
      <div className="min-h-0 flex-1 pt-5">
        {tab === 'overview' && <OverviewTab ea={ea} />}
        {tab === 'owners' && <OwnersTab ea={ea} />}
        {tab === 'eligibility' && <EligibilityCriteriaTab eaId={ea.id} />}
        {tab === 'sessions' && <TabPlaceholder label="Sessions" />}
        {tab === 'assignments' && <TabPlaceholder label="Assignments" />}
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
          toast.success(`${ea.name} deactivated`);
        }}
      >
        Active users will lose emergency access immediately. This action is logged and the access can
        be re-activated later.
      </Dialog>
    </div>
  );
}
