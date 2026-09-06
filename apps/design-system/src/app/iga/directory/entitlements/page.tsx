'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@ds/components';
import type { Column } from '@ds/components';
import { listEntitlementRows, type EntitlementRow } from '@/data/directory';
import {
  DirectoryListPage,
  EntityAvatar,
  RiskScoreChip,
  AddEntitlementDrawer,
  ImportEntitlementsCsvModal,
  EntitlementAddActions,
} from '@/components/product/directory';

export default function EntitlementsListPage() {
  const router = useRouter();
  const toast = useToast();
  const [rows, setRows] = React.useState<EntitlementRow[]>([]);
  const [loaded, setLoaded] = React.useState(false);
  const [addOpen, setAddOpen] = React.useState(false);
  const [importOpen, setImportOpen] = React.useState(false);

  const refresh = React.useCallback(() => setRows(listEntitlementRows()), []);

  React.useEffect(() => {
    refresh();
    setLoaded(true);
  }, [refresh]);

  const columns: Column<EntitlementRow>[] = [
    {
      id: 'name',
      header: 'Entitlement Name',
      sortable: true,
      value: (r) => r.name,
      render: (r) => (
        <div className="flex items-center gap-3">
          <EntityAvatar kind="entitlement" name={r.name} />
          <span className="text-body-sm-strong text-text-primary">{r.name}</span>
        </div>
      ),
    },
    {
      id: 'description',
      header: 'Description',
      value: (r) => r.description,
      render: (r) => <span className="text-text-secondary">{r.description}</span>,
    },
    {
      id: 'application',
      header: 'Application',
      sortable: true,
      value: (r) => r.applicationName,
      render: (r) => <span className="text-text-secondary">{r.applicationName}</span>,
    },
    {
      id: 'risk',
      header: 'Risk Score',
      sortable: true,
      align: 'right',
      value: (r) => r.risk,
      render: (r) => <RiskScoreChip score={r.risk} />,
    },
  ];

  return (
    <>
      <DirectoryListPage<EntitlementRow>
        title="Entitlements"
        description="Permissions and access rights within an application."
        searchPlaceholder="Search entitlements"
        columns={columns}
        rows={loaded ? rows : []}
        downloadable
        matches={(r, q) =>
          r.name.toLowerCase().includes(q) ||
          r.description.toLowerCase().includes(q) ||
          r.applicationName.toLowerCase().includes(q)
        }
        onOpen={(id) => router.push(`/iga/directory/entitlements/${id}`)}
        emptyTitle="No entitlements found"
        emptyMessage="No entitlements match your search."
        actions={
          <EntitlementAddActions onAdd={() => setAddOpen(true)} onImportCsv={() => setImportOpen(true)} />
        }
      />

      <AddEntitlementDrawer
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onCreated={(id) => {
          setAddOpen(false);
          refresh();
          toast.success('Entitlement created.');
          router.push(`/iga/directory/entitlements/${id}`);
        }}
      />

      <ImportEntitlementsCsvModal
        open={importOpen}
        onClose={() => setImportOpen(false)}
        onImported={(count) => {
          setImportOpen(false);
          refresh();
          toast.success(`${count} entitlement${count === 1 ? '' : 's'} imported.`);
        }}
      />
    </>
  );
}
