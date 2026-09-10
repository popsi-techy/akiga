'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import AddOutlined from '@mui/icons-material/AddOutlined';
import SearchOutlined from '@mui/icons-material/SearchOutlined';
import { Button, Input, useToast } from '@ds/components';
import type { AppAccountRow, EntitlementRow } from '@/data/directory';
import { RelationTable } from './DetailShell';
import { accountColumns, entitlementColumns } from './relationColumns';
import { AddAppAccountDrawer } from './AddAppAccountDrawer';
import { AddEntitlementDrawer } from './AddEntitlementDrawer';
import { EntitlementAddActions } from './EntitlementAddActions';
import { ImportEntitlementsCsvModal } from './ImportEntitlementsCsvModal';

function InventoryToolbar({
  search,
  onSearch,
  placeholder,
  actions,
}: {
  search: string;
  onSearch: (value: string) => void;
  placeholder: string;
  actions: React.ReactNode;
}) {
  return (
    <div className="mb-4 flex shrink-0 flex-wrap items-center gap-3">
      <div className="w-full max-w-sm">
        <Input
          placeholder={placeholder}
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          startAdornment={<SearchOutlined sx={{ fontSize: 18 }} />}
        />
      </div>
      <div className="ml-auto">{actions}</div>
    </div>
  );
}

export function ApplicationAccountsTab({
  applicationId,
  applicationName,
  accounts,
  onChanged,
}: {
  applicationId: string;
  applicationName: string;
  accounts: AppAccountRow[];
  onChanged: () => void;
}) {
  const router = useRouter();
  const toast = useToast();
  const [search, setSearch] = React.useState('');
  const [addOpen, setAddOpen] = React.useState(false);

  const q = search.trim().toLowerCase();
  const filtered = q
    ? accounts.filter(
        (r) =>
          r.accountName.toLowerCase().includes(q) ||
          r.email.toLowerCase().includes(q) ||
          (r.identityName?.toLowerCase().includes(q) ?? false),
      )
    : accounts;

  return (
    <div className="flex h-full min-h-0 flex-col">
      <InventoryToolbar
        search={search}
        onSearch={setSearch}
        placeholder="Search accounts"
        actions={
          <Button startIcon={<AddOutlined />} onClick={() => setAddOpen(true)}>
            Add App Account
          </Button>
        }
      />
      <div className="min-h-0 flex-1">
        <RelationTable
          columns={accountColumns}
          rows={filtered}
          onRowClick={(r) => router.push(`/iga/directory/app-accounts/${r.id}`)}
          emptyTitle={q ? 'No matching accounts' : 'No app accounts'}
          emptyMessage={
            q ? 'No accounts match your search.' : 'No accounts exist in this application yet.'
          }
        />
      </div>
      <AddAppAccountDrawer
        open={addOpen}
        applicationId={applicationId}
        applicationName={applicationName}
        onClose={() => setAddOpen(false)}
        onCreated={() => {
          setAddOpen(false);
          onChanged();
          toast.success('App account created.');
        }}
      />
    </div>
  );
}

export function ApplicationEntitlementsTab({
  applicationId,
  entitlements,
  onChanged,
}: {
  applicationId: string;
  entitlements: EntitlementRow[];
  onChanged: () => void;
}) {
  const router = useRouter();
  const toast = useToast();
  const [search, setSearch] = React.useState('');
  const [addOpen, setAddOpen] = React.useState(false);
  const [importOpen, setImportOpen] = React.useState(false);

  const q = search.trim().toLowerCase();
  const filtered = q
    ? entitlements.filter(
        (r) => r.name.toLowerCase().includes(q) || r.description.toLowerCase().includes(q),
      )
    : entitlements;

  return (
    <div className="flex h-full min-h-0 flex-col">
      <InventoryToolbar
        search={search}
        onSearch={setSearch}
        placeholder="Search entitlements"
        actions={
          <EntitlementAddActions onAdd={() => setAddOpen(true)} onImportCsv={() => setImportOpen(true)} />
        }
      />
      <div className="min-h-0 flex-1">
        <RelationTable
          columns={entitlementColumns}
          rows={filtered}
          onRowClick={(r) => router.push(`/iga/directory/entitlements/${r.id}`)}
          emptyTitle={q ? 'No matching entitlements' : 'No entitlements'}
          emptyMessage={
            q ? 'No entitlements match your search.' : 'This application exposes no entitlements yet.'
          }
        />
      </div>
      <AddEntitlementDrawer
        open={addOpen}
        lockedApplicationId={applicationId}
        onClose={() => setAddOpen(false)}
        onCreated={() => {
          setAddOpen(false);
          onChanged();
          toast.success('Entitlement created.');
        }}
      />
      <ImportEntitlementsCsvModal
        open={importOpen}
        lockedApplicationId={applicationId}
        onClose={() => setImportOpen(false)}
        onImported={(count) => {
          setImportOpen(false);
          onChanged();
          toast.success(`${count} entitlement${count === 1 ? '' : 's'} imported.`);
        }}
      />
    </div>
  );
}
