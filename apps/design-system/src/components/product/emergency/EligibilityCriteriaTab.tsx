'use client';

import * as React from 'react';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutline from '@mui/icons-material/DeleteOutline';
import FilterListOutlined from '@mui/icons-material/FilterListOutlined';
import KeyboardArrowDown from '@mui/icons-material/KeyboardArrowDown';
import SearchOutlined from '@mui/icons-material/SearchOutlined';
import { Button, Checkbox, Input, Menu, useToast } from '@ds/components';
import {
  getEligibilityGroups,
  setEmergencyAccessEligibility,
  type EligibilityGroup,
} from '@/data/emergency-access';
import { toastEASetupStep } from '@/components/product/emergency/ea-setup-toast';
import { eligibilityGroupDisplayName, touchEligibilityGroup } from '@/data/eligibility-criteria';
import { EligibilityGroupCard } from './EligibilityGroupCard';
import { EligibilityCriteriaDrawer } from './EligibilityCriteriaDrawer';

export function EligibilityCriteriaTab({
  eaId,
  onChanged,
}: {
  eaId: string;
  /** Rules changed — lets a host surface (the V2 stepper) re-read readiness. */
  onChanged?: () => void;
}) {
  const toast = useToast();
  const [groups, setGroups] = React.useState<EligibilityGroup[]>(() => getEligibilityGroups(eaId));
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<EligibilityGroup | null>(null);
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set());
  const [search, setSearch] = React.useState('');

  React.useEffect(() => {
    setGroups(getEligibilityGroups(eaId));
    setSelectedIds(new Set());
    setSearch('');
  }, [eaId]);

  const persist = (next: EligibilityGroup[]) => {
    setGroups(setEmergencyAccessEligibility(eaId, next));
    onChanged?.();
    setSelectedIds((prev) => {
      const ids = new Set(next.map((g) => g.id));
      return new Set([...prev].filter((id) => ids.has(id)));
    });
  };

  const openCreate = () => {
    setEditing(null);
    setDrawerOpen(true);
  };

  const openEdit = (group: EligibilityGroup) => {
    setEditing(group);
    setDrawerOpen(true);
  };

  const handleApply = (group: EligibilityGroup) => {
    const next = touchEligibilityGroup(group);
    const wasDone = groups.length > 0;
    if (editing) {
      persist(groups.map((g) => (g.id === editing.id ? next : g)));
      if (!toastEASetupStep(toast, eaId, 'eligibility', wasDone)) {
        toast.success('Eligibility group updated');
      }
    } else {
      persist([...groups, next]);
      if (!toastEASetupStep(toast, eaId, 'eligibility', wasDone)) {
        toast.success('Eligibility group created');
      }
    }
  };

  const handleDelete = (id: string) => {
    persist(groups.filter((g) => g.id !== id));
    toast.success('Eligibility group removed');
  };

  const filtered = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return groups.map((g, i) => ({ group: g, index: i }));
    return groups
      .map((g, i) => ({ group: g, index: i }))
      .filter(({ group, index }) => eligibilityGroupDisplayName(group, index).toLowerCase().includes(q));
  }, [groups, search]);

  const allSelected = groups.length > 0 && selectedIds.size === groups.length;
  const someSelected = selectedIds.size > 0 && !allSelected;

  const toggleSelectAll = () => {
    if (allSelected) setSelectedIds(new Set());
    else setSelectedIds(new Set(groups.map((g) => g.id)));
  };

  const setSelected = (id: string, selected: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (selected) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  const deleteSelected = () => {
    if (selectedIds.size === 0) return;
    const count = selectedIds.size;
    persist(groups.filter((g) => !selectedIds.has(g.id)));
    setSelectedIds(new Set());
    toast.success(count === 1 ? 'Eligibility group removed' : `${count} eligibility groups removed`);
  };

  const nextGroupNumber = groups.length + 1;

  if (groups.length === 0) {
    return (
      <>
        <div className="flex h-full flex-col items-center justify-center gap-4 px-6 py-16 text-center">
          <span className="grid h-12 w-12 place-items-center rounded-full bg-subtle text-icon">
            <FilterListOutlined sx={{ fontSize: 24 }} />
          </span>
          <div className="space-y-1">
            <div className="text-h5 text-text-primary">No eligibility criteria yet</div>
            <p className="mx-auto max-w-md text-body-sm text-text-secondary">
              Define who can request this emergency profile. Create a group of conditions — people
              matching any group will be eligible.
            </p>
          </div>
          <Button startIcon={<AddIcon />} onClick={openCreate}>
            Create Eligibility Criteria Group
          </Button>
        </div>

        <EligibilityCriteriaDrawer
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          group={editing}
          nextGroupNumber={nextGroupNumber}
          onApply={handleApply}
        />
      </>
    );
  }

  return (
    <div className="ds-scroll h-full overflow-y-auto pr-0.5">
      <div className="space-y-4 pb-6">
        <div className="flex flex-wrap items-center gap-3">
          <div className="min-w-[200px] max-w-sm flex-1">
            <Input
              size="sm"
              placeholder="Search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              startAdornment={<SearchOutlined sx={{ fontSize: 18 }} />}
            />
          </div>
          {selectedIds.size > 0 && (
            <Menu
              ariaLabel="Bulk action"
              trigger={
                <Button
                  variant="secondary"
                  size="sm"
                  endIcon={<KeyboardArrowDown sx={{ fontSize: 18 }} />}
                >
                  Bulk action
                </Button>
              }
              items={[
                {
                  label: 'Delete all',
                  icon: <DeleteOutline sx={{ fontSize: 18 }} />,
                  danger: true,
                  onClick: deleteSelected,
                },
              ]}
            />
          )}
          {/* The action lives here, opposite the search, where every other list in
              the product keeps it. */}
          <div className="ml-auto shrink-0">
            <Button size="sm" startIcon={<AddIcon />} onClick={openCreate}>
              Add Eligibility Group
            </Button>
          </div>
        </div>

        {selectedIds.size > 0 && (
          <Checkbox
            checked={allSelected}
            indeterminate={someSelected}
            onChange={() => toggleSelectAll()}
            ariaLabel="Select all groups"
            label={<span className="text-body-sm text-text-secondary">Select all</span>}
          />
        )}

        <div className="grid grid-cols-1 items-stretch gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map(({ group, index }) => (
            <EligibilityGroupCard
              key={group.id}
              group={group}
              index={index}
              selected={selectedIds.has(group.id)}
              onSelectChange={(selected) => setSelected(group.id, selected)}
              onEdit={() => openEdit(group)}
              onDelete={() => handleDelete(group.id)}
            />
          ))}
        </div>

        {filtered.length === 0 && (
          <p className="py-8 text-center text-body-sm text-text-secondary">No groups match your search.</p>
        )}
      </div>

      <EligibilityCriteriaDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        group={editing}
        nextGroupNumber={nextGroupNumber}
        onApply={handleApply}
      />
    </div>
  );
}

export default EligibilityCriteriaTab;
