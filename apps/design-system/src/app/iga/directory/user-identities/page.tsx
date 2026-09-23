'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import {
  Button,
  Dialog,
  DirectoryListPage,
  IdentityCell,
  Select,
  StatusChip,
  useToast,
  type Column,
} from '@ds/components';
import { listUserIdentities, type UserIdentityRow } from '@/data/directory';
import { IdentityKindChip, IDENTITY_STATUS, RiskScoreChip } from '@/components/product/directory';
import { assignManager, getManagerOverrides, resolveManagerId } from '@/data/manager-assignment';

/** The Workforce row, with its resolved manager merged on for the Manager column. */
type Row = UserIdentityRow & { managerId?: string; managerName?: string };

export default function UserIdentitiesListPage() {
  const router = useRouter();
  const toast = useToast();

  const base = React.useMemo(() => listUserIdentities(), []);
  const nameById = React.useMemo(() => new Map(base.map((r) => [r.id, r.name])), [base]);

  // Managers assigned from here persist in localStorage; read after mount and merge,
  // so the server and first client render agree on the seed defaults (no hydration flash).
  const [overrides, setOverrides] = React.useState<Record<string, string>>({});
  React.useEffect(() => setOverrides(getManagerOverrides()), []);

  const rows: Row[] = React.useMemo(
    () =>
      base.map((r) => {
        const managerId = resolveManagerId(r.id, overrides);
        return { ...r, managerId, managerName: managerId ? nameById.get(managerId) : undefined };
      }),
    [base, overrides, nameById],
  );

  // Row selection + the assign-manager dialog it drives.
  const [selectedIds, setSelectedIds] = React.useState<string[]>([]);
  const [assignOpen, setAssignOpen] = React.useState(false);
  const [managerChoice, setManagerChoice] = React.useState('');

  // Anyone on the payroll can be a manager — the pick list, minus the people being assigned.
  const managerOptions = React.useMemo(
    () =>
      base
        .filter((r) => r.kind === 'internal' && !selectedIds.includes(r.id))
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((r) => ({ value: r.id, label: `${r.name} · ${r.jobTitle}` })),
    [base, selectedIds],
  );

  const openAssign = () => {
    setManagerChoice('');
    setAssignOpen(true);
  };

  const confirmAssign = () => {
    if (!managerChoice) {
      toast.error('Choose a manager to assign.');
      return;
    }
    const count = selectedIds.length;
    assignManager(selectedIds, managerChoice);
    setOverrides(getManagerOverrides());
    setAssignOpen(false);
    setSelectedIds([]);
    toast.success(
      `${count} ${count === 1 ? 'person' : 'people'} now report to ${nameById.get(managerChoice)}.`,
    );
  };

  const columns: Column<Row>[] = [
    {
      id: 'name',
      header: 'Name',
      sortable: true,
      width: '30%',
      // Two lines — name over email — so it opts out of the single-line default.
      wrap: true,
      value: (r) => r.name,
      render: (r) => <IdentityCell name={r.name} email={r.email} />,
    },
    // Before Department, not after Status: whether someone is on the payroll
    // changes how the rest of the row should be read, so it belongs beside the
    // name rather than at the end with the measurements.
    { id: 'kind', header: 'Type', sortable: true, width: 130, wrap: true, value: (r) => (r.kind === 'external' ? 'External' : 'Workforce'), render: (r) => <IdentityKindChip kind={r.kind} /> },
    { id: 'department', header: 'Department', sortable: true, width: '14%', value: (r) => r.department, render: (r) => <span className="text-text-secondary">{r.department}</span> },
    {
      id: 'manager',
      header: 'Manager',
      sortable: true,
      width: '18%',
      value: (r) => r.managerName ?? '',
      render: (r) =>
        r.managerName ? (
          <span className="text-text-secondary">{r.managerName}</span>
        ) : (
          <span className="text-text-tertiary">—</span>
        ),
    },
    { id: 'status', header: 'Status', sortable: true, width: 110, wrap: true, value: (r) => IDENTITY_STATUS[r.status].label, render: (r) => <StatusChip intent={IDENTITY_STATUS[r.status].intent} label={IDENTITY_STATUS[r.status].label} /> },
    { id: 'risk', header: 'Risk', sortable: true, align: 'right', width: 110, wrap: true, value: (r) => r.riskScore, render: (r) => <RiskScoreChip score={r.riskScore} /> },
  ];

  return (
    <>
      <DirectoryListPage<Row>
        title="Workforce"
        description="Everyone who holds access — the workforce, and the externals working alongside them."
        searchPlaceholder="Search people"
        columns={columns}
        rows={rows}
        // Every column declares a share, so the longer "Workforce" chip cannot push
        // Risk off the end the way it did under auto layout.
        layout="fixed"
        matches={(r, q) => r.name.toLowerCase().includes(q) || r.email.toLowerCase().includes(q) || r.department.toLowerCase().includes(q) || r.jobTitle.toLowerCase().includes(q) || (r.managerName ?? '').toLowerCase().includes(q)}
        onOpen={(id) => router.push(`/iga/directory/user-identities/${id}`)}
        emptyTitle="No user identities found"
        emptyMessage="No people match your search."
        downloadable
        selectable
        selectedIds={selectedIds}
        onSelectionChange={setSelectedIds}
        selectionNoun="person"
        selectionActions={
          <Button variant="secondary" size="sm" onClick={openAssign}>
            Assign manager
          </Button>
        }
      />

      <Dialog
        open={assignOpen}
        onClose={() => setAssignOpen(false)}
        title={`Assign a manager to ${selectedIds.length} ${selectedIds.length === 1 ? 'person' : 'people'}`}
        confirmLabel="Assign manager"
        onConfirm={confirmAssign}
      >
        <p className="mb-4">Everyone selected will report to the manager you choose. This replaces any current manager.</p>
        <Select
          label="Manager"
          ariaLabel="Manager"
          placeholder="Select a manager"
          options={managerOptions}
          value={managerChoice}
          onChange={setManagerChoice}
          required
        />
      </Dialog>
    </>
  );
}
