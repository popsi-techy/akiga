'use client';

import * as React from 'react';
import SearchOutlined from '@mui/icons-material/SearchOutlined';
import FilterListOutlined from '@mui/icons-material/FilterListOutlined';
import AddIcon from '@mui/icons-material/Add';
import PersonAddAltOutlined from '@mui/icons-material/PersonAddAltOutlined';
import {
  DataTable,
  Avatar,
  Button,
  Input,
  Drawer,
  SelectionPanel,
  Menu,
  useToast,
  type Column,
} from '@ds/components';
import { listUserIdentities, resolvePeople, type UserIdentityRow } from '@/data/directory';
import { getOwners, setOwners, type OwnedEntityType } from '@/data/entity-owners';

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
  const toast = useToast();
  const lower = label.toLowerCase();
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
      width: 80,
      render: (o) => (
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

  return (
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
            Add {label}s
          </Button>
        </div>
      </div>

      <div className="min-h-0 flex-1">
        <DataTable<UserIdentityRow>
          columns={columns}
          rows={owners}
          fillHeight
          emptyTitle={`No ${lower}s`}
          emptyMessage={emptyHint ?? `Add ${lower}s to govern this entity.`}
        />
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
