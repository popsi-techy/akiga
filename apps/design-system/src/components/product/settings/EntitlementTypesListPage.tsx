'use client';

import * as React from 'react';
import AddOutlined from '@mui/icons-material/AddOutlined';
import ShieldOutlined from '@mui/icons-material/ShieldOutlined';
import { Button, Dialog, useToast, type Column } from '@ds/components';
import { deleteEntitlementType, listEntitlementTypes, type EntitlementType } from '@/data/entitlement-types';
import { getSystemSettingsSection } from '@/data/system-settings-catalog';
import { DirectoryListPage } from '@/components/product/directory';
import { RowActions } from '@/components/product/RowActions';
import { EntitlementTypeDrawer } from './EntitlementTypeForm';
import { SettingsDenied, SettingsLoading, useAdminSettings, useSettingsCrumbs } from './SettingsChrome';

const SECTION = getSystemSettingsSection('entitlement-types')!;

export function EntitlementTypesListPage() {
  useSettingsCrumbs(SECTION.title);
  const allowed = useAdminSettings();
  const toast = useToast();
  const [rows, setRows] = React.useState<EntitlementType[] | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<EntitlementType | null>(null);
  const [editor, setEditor] = React.useState<string | 'new' | null>(null);

  const refresh = React.useCallback(() => setRows(listEntitlementTypes()), []);
  React.useEffect(() => {
    refresh();
  }, [refresh]);

  if (!allowed) return <SettingsDenied />;
  if (!rows) {
    return <SettingsLoading />;
  }

  const columns: Column<EntitlementType>[] = [
    {
      id: 'name',
      header: 'Name',
      sortable: true,
      value: (r) => r.name,
      render: (r) => (
        <div className="flex items-center gap-3">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-brand-subtle text-icon-brand">
            <ShieldOutlined sx={{ fontSize: 18 }} />
          </span>
          <span className="truncate text-body-sm-strong text-text-primary">{r.name}</span>
        </div>
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      align: 'right',
      width: 88,
      wrap: true,
      render: (r) => (
        <RowActions
          onInfo={() => setEditor(r.id)}
          infoLabel={`Edit ${r.name}`}
          infoTooltip="Edit"
          onRemove={() => setDeleteTarget(r)}
          removeLabel={`Delete ${r.name}`}
          removeTooltip="Delete"
        />
      ),
    },
  ];

  return (
    <div className="flex h-full flex-col">
      <div className="min-h-0 flex-1">
        <DirectoryListPage<EntitlementType>
          title="Entitlement Type Settings"
          description={SECTION.pageDescription}
          hideTitle
          hideFilter
          searchPlaceholder="Search"
          columns={columns}
          rows={rows}
          layout="fixed"
          matches={(r, q) => r.name.toLowerCase().includes(q)}
          onOpen={(id) => setEditor(id)}
          emptyTitle="No entitlement types"
          emptyMessage="Add a type so discovered access can be classified, filtered, and requested."
          actions={
            <Button startIcon={<AddOutlined />} onClick={() => setEditor('new')}>
              Add Entitlement Type
            </Button>
          }
        />
      </div>

      <Dialog
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        tone="danger"
        title={`Delete ${deleteTarget?.name ?? ''}?`}
        confirmLabel="Delete"
        onConfirm={() => {
          if (!deleteTarget) return;
          const name = deleteTarget.name;
          deleteEntitlementType(deleteTarget.id);
          setDeleteTarget(null);
          refresh();
          toast.success(`“${name}” entitlement type deleted`);
        }}
      >
        Existing entitlements of this type stay in place. New access will not be
        classified as this type until you add it again.
      </Dialog>

      <EntitlementTypeDrawer
        key={editor ?? 'closed'}
        open={editor !== null}
        typeId={editor === 'new' || editor === null ? null : editor}
        onClose={() => setEditor(null)}
        onSaved={refresh}
      />
    </div>
  );
}
