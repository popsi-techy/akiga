'use client';

import * as React from 'react';
import AddOutlined from '@mui/icons-material/AddOutlined';
import {
  Button,
  Dialog,
  StatusChip,
  useToast,
  type Column,
  type FilterGroup,
  type FilterSelection,
} from '@ds/components';
import {
  CUSTOM_ATTRIBUTE_FIELD_TYPES,
  customAttributeFieldTypeLabel,
  deleteCustomAttribute,
  listCustomAttributes,
  type CustomAttribute,
} from '@/data/custom-attributes';
import { getSystemSettingsSection } from '@/data/system-settings-catalog';
import { DirectoryListPage } from '@/components/product/directory';
import { RowActions } from '@/components/product/RowActions';
import { CustomAttributeDrawer } from './CustomAttributeForm';
import { SettingsDenied, SettingsLoading, useAdminSettings, useSettingsCrumbs } from './SettingsChrome';

const SECTION = getSystemSettingsSection('custom-attributes')!;

function yesNo(value: boolean) {
  return value ? 'Yes' : 'No';
}

export function CustomAttributesListPage() {
  useSettingsCrumbs(SECTION.title);
  const allowed = useAdminSettings();
  const toast = useToast();
  const [rows, setRows] = React.useState<CustomAttribute[] | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<CustomAttribute | null>(null);
  const [editor, setEditor] = React.useState<string | 'new' | null>(null);

  const refresh = React.useCallback(() => setRows(listCustomAttributes()), []);
  React.useEffect(() => {
    refresh();
  }, [refresh]);

  if (!allowed) return <SettingsDenied />;
  if (!rows) {
    return <SettingsLoading />;
  }

  const filterGroups: FilterGroup[] = [
    {
      id: 'type',
      label: 'Field type',
      optionHeader: 'Field type',
      options: CUSTOM_ATTRIBUTE_FIELD_TYPES.map((t) => ({ id: t.value, label: t.label })),
    },
  ];

  const columns: Column<CustomAttribute>[] = [
    {
      id: 'displayName',
      header: 'Display Name',
      sortable: true,
      value: (r) => r.displayName,
      render: (r) => (
        <span className="truncate text-body-sm-strong text-text-primary">{r.displayName}</span>
      ),
    },
    {
      id: 'attributeName',
      header: 'Attribute Name',
      sortable: true,
      width: 180,
      value: (r) => r.attributeName,
      render: (r) => <span className="truncate text-body-sm text-text-secondary">{r.attributeName}</span>,
    },
    {
      id: 'fieldType',
      header: 'Field Type',
      sortable: true,
      width: 140,
      value: (r) => customAttributeFieldTypeLabel(r.fieldType),
      render: (r) => (
        <StatusChip intent="neutral" dot={false} label={customAttributeFieldTypeLabel(r.fieldType)} />
      ),
    },
    {
      id: 'required',
      header: 'Required',
      sortable: true,
      width: 110,
      value: (r) => yesNo(r.required),
      render: (r) => <span className="text-text-secondary">{yesNo(r.required)}</span>,
    },
    {
      id: 'unique',
      header: 'Unique',
      sortable: true,
      width: 100,
      value: (r) => yesNo(r.unique),
      render: (r) => <span className="text-text-secondary">{yesNo(r.unique)}</span>,
    },
    {
      id: 'correlation',
      header: 'Correlation',
      sortable: true,
      width: 120,
      value: (r) => yesNo(r.correlation),
      render: (r) => <span className="text-text-secondary">{yesNo(r.correlation)}</span>,
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
          infoLabel={`Edit ${r.displayName}`}
          infoTooltip="Edit"
          onRemove={() => setDeleteTarget(r)}
          removeLabel={`Delete ${r.displayName}`}
          removeTooltip="Delete"
        />
      ),
    },
  ];

  return (
    <div className="flex h-full flex-col">
      <div className="min-h-0 flex-1">
        <DirectoryListPage<CustomAttribute>
          title={SECTION.title}
          description={SECTION.pageDescription}
          hideTitle
          hideFilter
          searchPlaceholder="Search by display or attribute name"
          columns={columns}
          rows={rows}
          layout="fixed"
          matches={(r, q) =>
            r.displayName.toLowerCase().includes(q) ||
            r.attributeName.toLowerCase().includes(q) ||
            r.description.toLowerCase().includes(q) ||
            customAttributeFieldTypeLabel(r.fieldType).toLowerCase().includes(q)
          }
          filterGroups={filterGroups}
          filterMatches={(r, sel: FilterSelection) =>
            !sel.type?.length || sel.type.includes(r.fieldType)
          }
          onOpen={(id) => setEditor(id)}
          emptyTitle="No custom attributes"
          emptyMessage="Add a field so identities and accounts can store values your source systems do not provide."
          actions={
            <Button startIcon={<AddOutlined />} onClick={() => setEditor('new')}>
              Add Custom Attribute
            </Button>
          }
        />
      </div>

      <Dialog
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        tone="danger"
        title={`Delete ${deleteTarget?.displayName ?? ''}?`}
        confirmLabel="Delete"
        onConfirm={() => {
          if (!deleteTarget) return;
          const name = deleteTarget.displayName;
          deleteCustomAttribute(deleteTarget.id);
          setDeleteTarget(null);
          refresh();
          toast.success(`“${name}” attribute deleted`);
        }}
      >
        This removes the schema. Values already stored on identities and accounts are
        left in place until the next sync.
      </Dialog>

      <CustomAttributeDrawer
        open={editor !== null}
        attributeId={editor === 'new' || editor === null ? null : editor}
        onClose={() => setEditor(null)}
        onSaved={refresh}
      />
    </div>
  );
}
