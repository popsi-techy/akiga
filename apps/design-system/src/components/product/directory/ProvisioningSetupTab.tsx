'use client';

import * as React from 'react';
import AddOutlined from '@mui/icons-material/AddOutlined';
import SearchOutlined from '@mui/icons-material/SearchOutlined';
import ShieldOutlined from '@mui/icons-material/ShieldOutlined';
import SettingsEthernetOutlined from '@mui/icons-material/SettingsEthernetOutlined';
import EditOutlined from '@mui/icons-material/EditOutlined';
import DeleteOutline from '@mui/icons-material/DeleteOutline';
import LinkOffOutlined from '@mui/icons-material/LinkOffOutlined';
import {
  Button,
  Card,
  DataTable,
  Dialog,
  Input,
  Menu,
  NavList,
  StatusChip,
  useToast,
  type Column,
} from '@ds/components';
import { AuthorizationDrawer } from './AuthorizationDrawer';
import { ConnectionConfiguration } from './ConnectionConfiguration';
import {
  GRANT_TYPES,
  METHOD_LABEL,
  deleteAuthorization,
  listAuthorizations,
  setAuthorized,
  type AppAuthorization,
} from '@/data/provisioning-auth';

type Section = 'authorization' | 'connection';

/**
 * Provisioning Setup — everything the connector needs before it can act on this
 * application. Same shell as Owners: a rail of sections beside one working area,
 * because these are separate jobs done at separate times, not tabs of one form.
 *
 * Authorization comes first in the rail because it comes first in reality —
 * connection settings cannot be tested until IGA can sign in.
 */
export function ProvisioningSetupTab({
  applicationId,
  applicationName,
  onChanged,
}: {
  applicationId: string;
  applicationName: string;
  onChanged?: () => void;
}) {
  const toast = useToast();
  const [section, setSection] = React.useState<Section>('authorization');
  const [rows, setRows] = React.useState<AppAuthorization[]>([]);
  const [search, setSearch] = React.useState('');
  const [editing, setEditing] = React.useState<AppAuthorization | null>(null);
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [removing, setRemoving] = React.useState<AppAuthorization | null>(null);

  // Stored in localStorage, so it can only be read after mount.
  const refresh = React.useCallback(() => setRows(listAuthorizations(applicationId)), [applicationId]);
  React.useEffect(() => refresh(), [refresh]);

  const q = search.trim().toLowerCase();
  const filtered = q ? rows.filter((r) => METHOD_LABEL[r.method].toLowerCase().includes(q)) : rows;

  const grantLabel = (r: AppAuthorization) =>
    r.method === 'oauth2'
      ? GRANT_TYPES.find((g) => g.value === r.oauth?.grantType)?.label ?? '—'
      : 'Not applicable';

  const authorize = (r: AppAuthorization) => {
    setAuthorized(r.id, true);
    refresh();
    onChanged?.();
    toast.success(`Connected to this application with ${METHOD_LABEL[r.method]}.`);
  };

  const confirmRemove = () => {
    if (!removing) return;
    deleteAuthorization(removing.id);
    setRemoving(null);
    refresh();
    onChanged?.();
    toast.success('Authorization removed. IGA can no longer reach this application.');
  };

  const columns: Column<AppAuthorization>[] = [
    {
      id: 'method',
      header: 'Method',
      sortable: true,
      value: (r) => METHOD_LABEL[r.method],
      render: (r) => (
        <div className="flex items-center gap-3">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-brand-subtle text-icon-brand">
            <ShieldOutlined sx={{ fontSize: 18 }} />
          </span>
          <span className="text-body-sm-strong text-text-primary">{METHOD_LABEL[r.method]}</span>
        </div>
      ),
    },
    {
      id: 'grant',
      header: 'Grant Type',
      sortable: true,
      width: 200,
      value: grantLabel,
      render: (r) => (
        <span className={r.method === 'oauth2' ? 'text-text-secondary' : 'text-text-tertiary'}>{grantLabel(r)}</span>
      ),
    },
    {
      id: 'status',
      header: 'Status',
      sortable: true,
      width: 150,
      value: (r) => (r.authorized ? 'authorized' : 'not-authorized'),
      render: (r) =>
        r.authorized ? (
          <StatusChip intent="success" label="Connected" />
        ) : (
          <StatusChip intent="warning" label="Not connected" />
        ),
    },
    {
      id: 'connect',
      header: '',
      width: 150,
      value: () => '',
      render: (r) => (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            authorize(r);
          }}
          className="text-body-sm-strong text-text-link hover:underline"
        >
          {r.authorized ? 'Reconnect' : 'Connect'}
        </button>
      ),
    },
    {
      id: 'actions',
      header: '',
      width: 64,
      value: () => '',
      render: (r) => (
        <div className="flex justify-end" onClick={(e) => e.stopPropagation()}>
          <Menu
            items={[
              {
                label: 'Edit',
                icon: <EditOutlined sx={{ fontSize: 18 }} />,
                onClick: () => {
                  setEditing(r);
                  setDrawerOpen(true);
                },
              },
              ...(r.authorized
                ? [
                    {
                      label: 'Disconnect',
                      icon: <LinkOffOutlined sx={{ fontSize: 18 }} />,
                      onClick: () => {
                        setAuthorized(r.id, false);
                        refresh();
                        toast.info('Disconnected. The credentials are kept.');
                      },
                    },
                  ]
                : []),
              {
                label: 'Remove',
                icon: <DeleteOutline sx={{ fontSize: 18 }} />,
                danger: true,
                onClick: () => setRemoving(r),
              },
            ]}
          />
        </div>
      ),
    },
  ];

  return (
    <div className="grid h-full gap-5 lg:grid-cols-[264px_minmax(0,1fr)]">
      <Card padding="sm" className="h-full">
        <NavList
          ariaLabel="Provisioning setup section"
          value={section}
          onChange={(id) => setSection(id as Section)}
          items={[
            {
              id: 'authorization',
              icon: <ShieldOutlined sx={{ fontSize: 18 }} />,
              label: 'Authorization',
              count: rows.length,
            },
            {
              id: 'connection',
              icon: <SettingsEthernetOutlined sx={{ fontSize: 18 }} />,
              label: 'Connection Configuration',
            },
          ]}
        />
      </Card>

      <div className="flex h-full min-h-0 flex-col">
        {section === 'authorization' ? (
          <>
            <div className="mb-4 flex shrink-0 flex-wrap items-center gap-3">
              <div className="w-full max-w-sm">
                <Input
                  placeholder="Search methods"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  startAdornment={<SearchOutlined sx={{ fontSize: 18 }} />}
                />
              </div>
              <div className="ml-auto">
                <Button
                  startIcon={<AddOutlined />}
                  onClick={() => {
                    setEditing(null);
                    setDrawerOpen(true);
                  }}
                >
                  Add Authorization
                </Button>
              </div>
            </div>
            <div className="min-h-0 flex-1">
              <DataTable<AppAuthorization>
                columns={columns}
                rows={filtered}
                fillHeight
                emptyTitle="No authorization yet"
                emptyMessage="IGA cannot reach this application until it knows how to sign in. Add an authorization method to start provisioning."
              />
            </div>
          </>
        ) : (
          <ConnectionConfiguration
            applicationId={applicationId}
            applicationName={applicationName}
            authorizations={rows}
            onChanged={onChanged}
          />
        )}
      </div>

      <AuthorizationDrawer
        open={drawerOpen}
        applicationId={applicationId}
        existing={editing}
        onClose={() => setDrawerOpen(false)}
        onSaved={() => {
          setDrawerOpen(false);
          refresh();
          onChanged?.();
        }}
      />

      <Dialog
        open={removing !== null}
        onClose={() => setRemoving(null)}
        title="Remove this authorization?"
        confirmLabel="Remove"
        tone="danger"
        onConfirm={confirmRemove}
      >
        Provisioning stops immediately and the stored credentials are deleted. You will need to enter them again to
        reconnect.
      </Dialog>
    </div>
  );
}
