'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import AddOutlined from '@mui/icons-material/AddOutlined';
import { Button, Dialog, Menu, StatusChip, useToast, type Column, type StatusIntent } from '@ds/components';
import {
  deleteEmailType,
  listEmailTypes,
  updateEmailType,
  EMAIL_TYPE_STATUS_LABEL,
  type EmailType,
  type EmailTypeStatus,
} from '@/data/email-types';
import { getEmailTemplate } from '@/data/email-templates';
import { getSystemSettingsSection } from '@/data/system-settings-catalog';
import { DirectoryListPage } from '@/components/product/directory';
import { formatDateTime } from '@/lib/datetime';
import { SettingsDenied, SettingsLoading, useAdminSettings, useSettingsCrumbs } from '../SettingsChrome';

const SECTION = getSystemSettingsSection('email')!;

/**
 * Three states, three intents.
 *
 * Draft is `caution`, not `info`: it is the one state that means "this is not sending",
 * which a reader scanning a list needs to catch. Inactive is neutral — it was live once
 * and was deliberately switched off, which is a settled state rather than a warning.
 */
const STATUS_INTENT: Record<EmailTypeStatus, StatusIntent> = {
  draft: 'caution',
  active: 'success',
  inactive: 'neutral',
};

/** What the menu offers depends on where the type is in its life. */
function transitionsFor(status: EmailTypeStatus): { to: EmailTypeStatus; label: string }[] {
  switch (status) {
    case 'draft':
      return [{ to: 'active', label: 'Activate' }];
    case 'active':
      return [{ to: 'inactive', label: 'Deactivate' }];
    case 'inactive':
      return [
        { to: 'active', label: 'Activate' },
        { to: 'draft', label: 'Move back to draft' },
      ];
  }
}

export function EmailTypesListPage() {
  useSettingsCrumbs(SECTION.title);
  const allowed = useAdminSettings();
  const router = useRouter();
  const toast = useToast();
  const [rows, setRows] = React.useState<EmailType[] | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<EmailType | null>(null);

  // `localStorage`-backed, so it is empty during SSR and full on the client — read it
  // after mount or the two renders disagree and React throws a hydration error.
  const refresh = React.useCallback(() => setRows(listEmailTypes()), []);
  React.useEffect(() => {
    refresh();
  }, [refresh]);

  if (!allowed) return <SettingsDenied />;
  if (!rows) return <SettingsLoading />;

  const setStatus = (row: EmailType, to: EmailTypeStatus) => {
    updateEmailType(row.id, { status: to });
    refresh();
    toast.success(`“${row.name}” is now ${EMAIL_TYPE_STATUS_LABEL[to].toLowerCase()}`);
  };

  const columns: Column<EmailType>[] = [
    {
      id: 'name',
      header: 'Email type',
      sortable: true,
      width: '34%',
      wrap: true,
      value: (r) => r.name,
      render: (r) => (
        <div className="min-w-0">
          <div className="truncate text-body-sm-strong text-text-primary">{r.name}</div>
          <div className="truncate text-caption text-text-secondary">
            {r.description || 'No description'}
          </div>
        </div>
      ),
    },
    {
      id: 'source',
      header: 'Started from',
      sortable: true,
      width: '20%',
      value: (r) =>
        r.sourceTemplateId ? getEmailTemplate(r.sourceTemplateId)?.name ?? r.sourceTemplateId : 'Scratch',
      render: (r) => (
        <span className="text-text-secondary">
          {r.sourceTemplateId
            ? getEmailTemplate(r.sourceTemplateId)?.name ?? r.sourceTemplateId
            : 'Written from scratch'}
        </span>
      ),
    },
    {
      id: 'status',
      header: 'Status',
      sortable: true,
      width: 140,
      value: (r) => EMAIL_TYPE_STATUS_LABEL[r.status],
      render: (r) => (
        <StatusChip intent={STATUS_INTENT[r.status]} label={EMAIL_TYPE_STATUS_LABEL[r.status]} />
      ),
    },
    {
      id: 'updated',
      header: 'Last updated',
      sortable: true,
      width: 190,
      value: (r) => r.updatedAt,
      render: (r) => <span className="text-text-secondary">{formatDateTime(r.updatedAt)}</span>,
    },
    {
      id: 'actions',
      header: 'Actions',
      align: 'right',
      width: 80,
      render: (r) => (
        <Menu
          items={[
            { label: 'Edit', onClick: () => router.push(`/iga/configurations/email/${r.id}`) },
            ...transitionsFor(r.status).map((t) => ({
              label: t.label,
              onClick: () => setStatus(r, t.to),
            })),
            { label: 'Delete', danger: true, onClick: () => setDeleteTarget(r) },
          ]}
        />
      ),
    },
  ];

  const addButton = (
    <Button startIcon={<AddOutlined />} onClick={() => router.push('/iga/configurations/email/templates')}>
      Add email type
    </Button>
  );

  return (
    <div className="flex h-full flex-col">
      <div className="min-h-0 flex-1">
        <DirectoryListPage<EmailType>
          title="Email"
          description={SECTION.pageDescription}
          hideTitle
          hideFilter
          searchPlaceholder="Search email types"
          columns={columns}
          rows={rows}
          layout="fixed"
          matches={(r, q) =>
            r.name.toLowerCase().includes(q) || r.description.toLowerCase().includes(q)
          }
          onOpen={(id) => router.push(`/iga/configurations/email/${id}`)}
          emptyTitle="No email types yet"
          emptyMessage="Start from one of the templates miniOrange ships, or write your own. Nothing is sent until you activate it."
          // In the empty state the button sits in the middle of the table, where the
          // reader is already looking; the toolbar copy stays for every state after that.
          emptyAction={addButton}
          actions={rows.length > 0 ? addButton : undefined}
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
          deleteEmailType(deleteTarget.id);
          setDeleteTarget(null);
          refresh();
          toast.success(`“${name}” deleted`);
        }}
      >
        <p className="text-body-sm text-text-secondary">
          The wording is removed for good. Anything currently sending this email falls back to the
          shipped template.
        </p>
      </Dialog>
    </div>
  );
}
