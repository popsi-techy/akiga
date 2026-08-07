'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import SearchOutlined from '@mui/icons-material/SearchOutlined';
import FilterListOutlined from '@mui/icons-material/FilterListOutlined';
import AddIcon from '@mui/icons-material/Add';
import VpnKeyOutlined from '@mui/icons-material/VpnKeyOutlined';
import VisibilityOutlined from '@mui/icons-material/VisibilityOutlined';
import EditOutlined from '@mui/icons-material/EditOutlined';
import BlockOutlined from '@mui/icons-material/BlockOutlined';
import {
  DataTable,
  StatusChip,
  Avatar,
  Button,
  Input,
  Menu,
  Drawer,
  useToast,
  type Column,
} from '@ds/components';
import { getEmergencyAccessList, type EARow } from '@/data/emergency-access';

export default function EmergencyAccessListPage() {
  const router = useRouter();
  const toast = useToast();
  const [search, setSearch] = React.useState('');
  const [createOpen, setCreateOpen] = React.useState(false);

  const all = getEmergencyAccessList();
  const rows = all.filter((r) => r.name.toLowerCase().includes(search.trim().toLowerCase()));

  const open = (id: string) => router.push(`/iga/emergency/${id}`);

  const columns: Column<EARow>[] = [
    {
      id: 'name',
      header: 'Emergency Access',
      sortable: true,
      value: (r) => r.name,
      render: (r) => (
        <div className="flex items-center gap-3">
          <Avatar name={r.name} initials={r.initial} size="sm" />
          <span className="font-medium text-text-primary">{r.name}</span>
        </div>
      ),
    },
    {
      id: 'status',
      header: 'Status',
      sortable: true,
      value: (r) => r.status.label,
      render: (r) => <StatusChip intent={r.status.intent} label={r.status.label} />,
    },
    {
      id: 'risk',
      header: 'Risk Score',
      render: (r) =>
        r.risk ? (
          <StatusChip intent={r.risk.intent} dot={false} label={r.risk.label} />
        ) : (
          <span className="text-text-disabled">N/A</span>
        ),
    },
    {
      id: 'activeUsers',
      header: 'Active Users',
      sortable: true,
      value: (r) => r.activeUsers ?? -1,
      render: (r) =>
        r.activeUsers == null ? <span className="text-text-disabled">N/A</span> : r.activeUsers,
    },
    {
      id: 'actions',
      header: 'Actions',
      align: 'right',
      width: 80,
      render: (r) => {
        const isActive = r.status.label === 'Active';
        return (
          <Menu
            items={[
              { label: 'View details', icon: <VisibilityOutlined sx={{ fontSize: 18 }} />, onClick: () => open(r.id) },
              { label: 'Edit basic details', icon: <EditOutlined sx={{ fontSize: 18 }} />, onClick: () => toast.info('Edit basic details'), divider: true },
              {
                label: isActive ? 'Deactivate' : 'Activate',
                icon: <BlockOutlined sx={{ fontSize: 18 }} />,
                danger: isActive,
                onClick: () => toast.success(`${r.name} ${isActive ? 'deactivated' : 'activated'}`),
              },
            ]}
          />
        );
      },
    },
  ];

  return (
    <div className="flex h-full flex-col">
      <div className="mb-5 shrink-0">
        <h1 className="text-h2 font-bold text-text-primary">Emergency Access</h1>
        <p className="mt-1 text-body text-text-secondary">
          Track and manage time-bound, break-glass access to critical systems from one central table.
        </p>
      </div>

      <div className="mb-4 flex shrink-0 flex-wrap items-center gap-3">
        <div className="w-full max-w-sm">
          <Input
            placeholder="Search by application"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            startAdornment={<SearchOutlined sx={{ fontSize: 18 }} />}
          />
        </div>
        <Button variant="secondary" startIcon={<FilterListOutlined />} onClick={() => toast.info('Filters coming soon')}>
          Filter
        </Button>
        <div className="ml-auto">
          <Button startIcon={<AddIcon />} onClick={() => setCreateOpen(true)}>
            Create Emergency Access
          </Button>
        </div>
      </div>

      <div className="min-h-0 flex-1">
        <DataTable<EARow>
          columns={columns}
          rows={rows}
          onRowClick={(r) => open(r.id)}
          fillHeight
          emptyTitle="No emergency access found"
          emptyMessage="Create emergency access to grant time-bound, break-glass access to critical systems."
        />
      </div>

      <Drawer
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Emergency access basic details"
        subtitle="Provide name and description."
        icon={<VpnKeyOutlined sx={{ fontSize: 22, color: 'var(--ds-color-brand-primary)' }} />}
        footer={
          <>
            <Button variant="secondary" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                setCreateOpen(false);
                toast.success('Emergency access created');
              }}
            >
              Continue
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input label="Name" required placeholder="role_name" size="sm" />
          <Input label="Description" required placeholder="description" size="sm" multiline minRows={3} />
        </div>
      </Drawer>
    </div>
  );
}
