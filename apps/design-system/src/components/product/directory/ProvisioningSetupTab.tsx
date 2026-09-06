'use client';

import * as React from 'react';
import AddOutlined from '@mui/icons-material/AddOutlined';
import SearchOutlined from '@mui/icons-material/SearchOutlined';
import ShieldOutlined from '@mui/icons-material/ShieldOutlined';
import KeyOutlined from '@mui/icons-material/KeyOutlined';
import LanOutlined from '@mui/icons-material/LanOutlined';
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
import { ScimInboundPanel } from './ScimInboundPanel';
import {
  GRANT_TYPES,
  METHOD_LABEL,
  deleteAuthorization,
  listAuthorizations,
  setAuthorized,
  type AppAuthorization,
} from '@/data/provisioning-auth';
import { listConnectionEvents } from '@/data/connection-events';
import { applicationHasScimInbound } from '@/data/scim-inbound';

type Section = 'authorization' | 'connection';

/**
 * Provisioning — everything the connector needs before it can act on this
 * application. Authorization, then connection configuration: sign-in has to
 * exist before a call can be tested.
 *
 * The two jobs sit in a 240px NavList rail, same as Owners — a section
 * switcher beside the work, not a segmented control above it.
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
  const [eventCount, setEventCount] = React.useState(0);

  const refresh = React.useCallback(() => {
    setRows(listAuthorizations(applicationId));
    setEventCount(listConnectionEvents(applicationId).length);
  }, [applicationId]);
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

  const noneYet = rows.length === 0;
  const showScimInbound = applicationHasScimInbound(applicationId);

  const openAdd = () => {
    setEditing(null);
    setDrawerOpen(true);
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
    <div className="flex h-full min-h-0 flex-col">
    <div className="grid min-h-0 flex-1 grid-cols-[240px_minmax(0,1fr)] gap-5">
      {/* 4px (2xs) clears the selected outline from a 240px rail without
          spending 16px of the column on gutter. Same card as Owners. */}
      <Card padding="2xs" className="h-full min-h-0 w-[240px]">
        <NavList
          ariaLabel="Provisioning section"
          value={section}
          onChange={(id) => setSection(id as Section)}
          items={[
            {
              id: 'authorization',
              icon: <KeyOutlined sx={{ fontSize: 18 }} />,
              label: 'Authorization',
              count: rows.length,
            },
            {
              id: 'connection',
              icon: <LanOutlined sx={{ fontSize: 18 }} />,
              label: 'Connection configuration',
              count: eventCount,
            },
          ]}
        />
      </Card>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        {section === 'authorization' && (
          <div className="flex min-h-0 min-w-0 flex-1 gap-5">
            <div className="flex min-h-0 min-w-0 flex-1 flex-col">
              {noneYet ? (
                <div className="grid min-h-0 flex-1 place-items-center">
                  <div className="flex max-w-md flex-col items-center px-6 py-10 text-center">
                    <h2 className="text-h5 text-text-primary">No authorization yet</h2>
                    <p className="mt-1.5 text-body-sm text-text-secondary">
                      IGA cannot reach this application until it knows how to sign in. Add an
                      authorization method to start provisioning.
                    </p>
                    <div className="mt-5">
                      <Button startIcon={<AddOutlined />} onClick={openAdd}>
                        Add Authorization
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <div className="mb-3 flex shrink-0 flex-wrap items-center gap-3">
                    <div className="w-full max-w-sm">
                      <Input
                        placeholder="Search methods"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        startAdornment={<SearchOutlined sx={{ fontSize: 18 }} />}
                      />
                    </div>
                    <div className="ml-auto">
                      <Button startIcon={<AddOutlined />} onClick={openAdd}>
                        Add Authorization
                      </Button>
                    </div>
                  </div>
                  <div className="min-h-0 flex-1">
                    <DataTable<AppAuthorization>
                      columns={columns}
                      rows={filtered}
                      fillHeight
                      emptyTitle="No methods match"
                      emptyMessage="Try a different search, or add an authorization method."
                    />
                  </div>
                </>
              )}
            </div>
            {showScimInbound ? <ScimInboundPanel applicationId={applicationId} /> : null}
          </div>
        )}
        {/* No scroller here: the section is a catalog beside a peek panel, and it
            owns the scroll on the catalog column so the panel keeps full height. */}
        {section === 'connection' && (
          <div className="min-h-0 flex-1">
            <ConnectionConfiguration
              applicationId={applicationId}
              applicationName={applicationName}
              authorizations={rows}
              onChanged={() => {
                refresh();
                onChanged?.();
              }}
            />
          </div>
        )}
      </div>
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
