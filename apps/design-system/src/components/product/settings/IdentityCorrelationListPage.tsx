'use client';

import * as React from 'react';
import AddOutlined from '@mui/icons-material/AddOutlined';
import LinkOutlined from '@mui/icons-material/LinkOutlined';
import PeopleOutlined from '@mui/icons-material/PeopleOutlined';
import PersonOffOutlined from '@mui/icons-material/PersonOffOutlined';
import TuneOutlined from '@mui/icons-material/TuneOutlined';
import {
  Button,
  Dialog,
  OverflowChips,
  StatTile,
  StatusChip,
  useToast,
  type Column,
  type FilterGroup,
  type FilterSelection,
} from '@ds/components';
import { listAppAccounts, listApplications, listCataloguedApplications } from '@/data/directory';
import {
  correlationModeLabel,
  correlationStrategyLabel,
  deleteCorrelationConfig,
  listCorrelationConfigs,
  type CorrelationConfig,
} from '@/data/identity-correlation';
import { getSystemSettingsSection } from '@/data/system-settings-catalog';
import { DirectoryListPage, EntityAvatar } from '@/components/product/directory';
import { RowActions } from '@/components/product/RowActions';
import { IdentityCorrelationDrawer } from './IdentityCorrelationForm';
import { SettingsDenied, SettingsLoading, useAdminSettings, useSettingsCrumbs } from './SettingsChrome';

const SECTION = getSystemSettingsSection('identity-correlation')!;

function applicationName(id: string, apps: { id: string; name: string }[]) {
  return apps.find((a) => a.id === id)?.name ?? 'Unknown application';
}

export function IdentityCorrelationListPage() {
  useSettingsCrumbs(SECTION.title);
  const allowed = useAdminSettings();
  const toast = useToast();
  const [rows, setRows] = React.useState<CorrelationConfig[] | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<CorrelationConfig | null>(null);
  const [editor, setEditor] = React.useState<string | 'new' | null>(null);
  const [apps, setApps] = React.useState(listCataloguedApplications);
  const accounts = React.useMemo(() => listAppAccounts(), []);

  const refresh = React.useCallback(() => setRows(listCorrelationConfigs()), []);
  React.useEffect(() => {
    refresh();
    setApps(listApplications());
  }, [refresh]);

  if (!allowed) return <SettingsDenied />;
  if (!rows) {
    return <SettingsLoading />;
  }

  const correlated = accounts.filter((a) => !a.orphan).length;
  const orphans = accounts.filter((a) => a.orphan).length;
  const nameOf = (id: string) => applicationName(id, apps);

  const filterGroups: FilterGroup[] = [
    {
      id: 'application',
      label: 'Application',
      optionHeader: 'Application',
      searchPlaceholder: 'Search',
      options: [...new Map(rows.map((r) => [r.applicationId, nameOf(r.applicationId)])).entries()].map(
        ([id, label]) => ({
          id,
          label,
          icon: <EntityAvatar kind="application" name={label} />,
        }),
      ),
    },
    {
      id: 'type',
      label: 'Matching mode',
      optionHeader: 'Matching mode',
      options: [
        { id: 'multi', label: 'Multi' },
        { id: 'chained', label: 'Chained' },
      ],
    },
  ];

  const columns: Column<CorrelationConfig>[] = [
    {
      id: 'application',
      header: 'Application',
      sortable: true,
      value: (r) => nameOf(r.applicationId),
      render: (r) => (
        <div className="flex items-center gap-3">
          <EntityAvatar kind="application" name={nameOf(r.applicationId)} />
          <span className="truncate text-body-sm-strong text-text-primary">{nameOf(r.applicationId)}</span>
        </div>
      ),
    },
    {
      id: 'type',
      header: 'Matching mode',
      sortable: true,
      width: 140,
      value: (r) => correlationModeLabel(r.matchingMode),
      render: (r) => (
        <StatusChip intent="neutral" dot={false} label={correlationModeLabel(r.matchingMode)} />
      ),
    },
    {
      id: 'confidence',
      header: 'Confidence',
      sortable: true,
      width: 120,
      value: (r) => r.confidenceThreshold,
      render: (r) => <span className="text-text-secondary">{r.confidenceThreshold}%</span>,
    },
    {
      id: 'strategies',
      header: 'Matchers',
      wrap: true,
      value: (r) => r.strategies.map((s) => correlationStrategyLabel(s.kind)).join(', '),
      render: (r) => (
        <OverflowChips
          items={r.strategies
            .filter((s) => s.enabled)
            .sort((a, b) => a.priority - b.priority)
            .map((s) => ({ id: s.id, name: correlationStrategyLabel(s.kind) }))}
          max={2}
          emptyLabel="None enabled"
        />
      ),
    },
    {
      id: 'autoLink',
      header: 'Auto-link',
      sortable: true,
      width: 110,
      value: (r) => (r.autoLink ? 'Yes' : 'No'),
      render: (r) => <span className="text-text-secondary">{r.autoLink ? 'Yes' : 'No'}</span>,
    },
    {
      id: 'manualOverride',
      header: 'Manual override',
      sortable: true,
      width: 140,
      value: (r) => (r.manualOverride ? 'Yes' : 'No'),
      render: (r) => <span className="text-text-secondary">{r.manualOverride ? 'Yes' : 'No'}</span>,
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
          infoLabel={`Edit ${nameOf(r.applicationId)}`}
          infoTooltip="Edit"
          onRemove={() => setDeleteTarget(r)}
          removeLabel={`Delete ${nameOf(r.applicationId)}`}
          removeTooltip="Delete"
        />
      ),
    },
  ];

  return (
    <div className="flex h-full flex-col">
      <div className="min-h-0 flex-1">
        <DirectoryListPage<CorrelationConfig>
          title={SECTION.title}
          description={SECTION.description}
          hideTitle
          hideFilter
          searchPlaceholder="Search by application or matcher"
          columns={columns}
          rows={rows}
          layout="fixed"
          matches={(r, q) => {
            const name = nameOf(r.applicationId).toLowerCase();
            const matchers = r.strategies.map((s) => correlationStrategyLabel(s.kind).toLowerCase()).join(' ');
            return name.includes(q) || matchers.includes(q) || r.matchingMode.includes(q);
          }}
          filterGroups={filterGroups}
          filterMatches={(r, sel: FilterSelection) =>
            (!sel.application?.length || sel.application.includes(r.applicationId)) &&
            (!sel.type?.length || sel.type.includes(r.matchingMode))
          }
          onOpen={(id) => setEditor(id)}
          emptyTitle="No correlation configurations"
          emptyMessage="Create one so discovered application accounts can be matched to identities."
          summary={
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatTile
                label="Configurations"
                value={rows.length}
                tone="brand"
                icon={<TuneOutlined />}
                hint="Rules on this page"
              />
              <StatTile
                label="App accounts"
                value={accounts.length}
                tone="info"
                icon={<PeopleOutlined />}
                hint="In the directory"
                href="/iga/directory/app-accounts"
              />
              <StatTile
                label="Correlated"
                value={correlated}
                tone="success"
                icon={<LinkOutlined />}
                hint="Linked to an identity"
                href="/iga/directory/app-accounts"
              />
              <StatTile
                label="Orphan accounts"
                value={orphans}
                tone="warning"
                icon={<PersonOffOutlined />}
                hint="No identity yet"
                href="/iga/directory/app-accounts"
              />
            </div>
          }
          actions={
            <Button startIcon={<AddOutlined />} onClick={() => setEditor('new')}>
              Create configuration
            </Button>
          }
        />
      </div>

      <Dialog
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        tone="danger"
        title={`Delete ${deleteTarget ? nameOf(deleteTarget.applicationId) : ''} correlation?`}
        confirmLabel="Delete"
        onConfirm={() => {
          if (!deleteTarget) return;
          const name = nameOf(deleteTarget.applicationId);
          deleteCorrelationConfig(deleteTarget.id);
          setDeleteTarget(null);
          refresh();
          toast.success(`“${name}” correlation deleted`);
        }}
      >
        Accounts already linked stay linked. New accounts in this application will not match
        automatically until you add another configuration.
      </Dialog>

      <IdentityCorrelationDrawer
        open={editor !== null}
        configId={editor === 'new' || editor === null ? null : editor}
        onClose={() => setEditor(null)}
        onSaved={refresh}
      />
    </div>
  );
}
