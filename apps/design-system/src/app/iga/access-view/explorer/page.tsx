'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import VisibilityOutlined from '@mui/icons-material/VisibilityOutlined';
import PersonOutlined from '@mui/icons-material/PersonOutlined';
import AppsOutlined from '@mui/icons-material/AppsOutlined';
import PeopleOutlined from '@mui/icons-material/PeopleOutlined';
import ShieldOutlined from '@mui/icons-material/ShieldOutlined';
import ViewColumnOutlined from '@mui/icons-material/ViewColumnOutlined';
import HubOutlined from '@mui/icons-material/HubOutlined';
import { ColumnBrowser, Select, SegmentedControl, StatusChip, type ColumnBrowserColumn } from '@ds/components';
import { EntityAvatar, RiskScoreChip, RiskDot } from '@/components/product/directory';
import { AccessTrail, AccessGraph, type AccessTrailStep, type GraphColumn } from '@/components/product/access-view';
import { useSetBreadcrumbs } from '@/lib/breadcrumb';
import {
  listAccessIdentities,
  listAccessApplications,
  listAccessAccounts,
  listAccessEntitlements,
  accessSummary,
  accessLabel,
} from '@/data/access-view';

const PATH_OPTIONS = [
  { value: 'application', label: 'Application Based' },
  { value: 'role', label: 'Role Based (coming soon)', disabled: true },
];

/** Level icons, shared between a column head, its rows, and the trail. */
const LEVEL_ICON = {
  identity: PersonOutlined,
  application: AppsOutlined,
  account: PeopleOutlined,
  entitlement: ShieldOutlined,
} as const;

/** Row tile — a pale brand square carrying the level's glyph. */
function RowTile({ kind }: { kind: keyof typeof LEVEL_ICON }) {
  const Icon = LEVEL_ICON[kind];
  return (
    <span aria-hidden className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-brand-subtle text-icon-brand">
      <Icon sx={{ fontSize: 20 }} />
    </span>
  );
}

/** Child count on a row — a bare figure, since the column head names the unit. */
function CountFigure({ n, of }: { n: number; of: string }) {
  return (
    <span title={`${n} ${of}`} className="shrink-0 text-body-sm-strong tabular-nums text-text-secondary">
      {n}
    </span>
  );
}

const VIEW_OPTIONS = [
  {
    value: 'list' as const,
    label: (
      <span className="flex items-center gap-1.5">
        <ViewColumnOutlined sx={{ fontSize: 16 }} /> Columns
      </span>
    ),
  },
  {
    value: 'graph' as const,
    label: (
      <span className="flex items-center gap-1.5">
        <HubOutlined sx={{ fontSize: 16 }} /> Graph
      </span>
    ),
  },
];

export default function AccessViewExplorerPage() {
  const router = useRouter();
  useSetBreadcrumbs([{ label: 'Access View', href: '/iga/access-view' }, { label: 'Access View Explorer' }]);
  const [view, setView] = React.useState<'list' | 'graph'>('list');

  // One selection per level. A pick at any level invalidates everything below it,
  // so the setters clear downstream rather than leaving a stale deeper path.
  const [identityId, setIdentityId] = React.useState<string | null>(null);
  const [applicationId, setApplicationId] = React.useState<string | null>(null);
  const [accountId, setAccountId] = React.useState<string | null>(null);
  const [entitlementId, setEntitlementId] = React.useState<string | null>(null);

  const identities = React.useMemo(() => listAccessIdentities(), []);
  const applications = React.useMemo(
    () => (identityId ? listAccessApplications(identityId) : []),
    [identityId],
  );
  const accounts = React.useMemo(
    () => (identityId && applicationId ? listAccessAccounts(identityId, applicationId) : []),
    [identityId, applicationId],
  );
  const entitlements = React.useMemo(() => (accountId ? listAccessEntitlements(accountId) : []), [accountId]);

  const selectIdentity = (id: string) => {
    setIdentityId(id);
    setApplicationId(null);
    setAccountId(null);
    setEntitlementId(null);
  };
  const selectApplication = (id: string) => {
    setApplicationId(id);
    setAccountId(null);
    setEntitlementId(null);
  };
  const selectAccount = (id: string) => {
    setAccountId(id);
    setEntitlementId(null);
  };

  const columns: ColumnBrowserColumn[] = [
    {
      id: 'identities',
      title: 'User Identities',
      icon: <PersonOutlined sx={{ fontSize: 20 }} />,
      // People get their initials, not a generic person glyph — a face-name is the
      // one thing in this hierarchy a reader recognises without reading.
      items: identities.map((it) => ({
        ...it,
        leading: <EntityAvatar kind="user" name={it.label} />,
        trailing: <CountFigure n={it.count ?? 0} of="applications" />,
      })),
      selectedId: identityId,
      onSelect: selectIdentity,
      searchPlaceholder: 'Search User Identities',
      emptyMessage: 'No identities match your search.',
    },
    {
      id: 'applications',
      title: 'Applications',
      icon: <AppsOutlined sx={{ fontSize: 20 }} />,
      items: applications.map((it) => ({
        ...it,
        leading: <EntityAvatar kind="application" name={it.label} />,
        trailing: <CountFigure n={it.count ?? 0} of="entitlements" />,
      })),
      selectedId: applicationId,
      onSelect: selectApplication,
      searchPlaceholder: 'Search Applications',
      emptyMessage: 'No applications match your search.',
      awaitingMessage: identityId
        ? 'This identity holds no application accounts.'
        : 'Select a user identity to see their applications.',
    },
    {
      id: 'accounts',
      title: 'Accounts',
      icon: <PeopleOutlined sx={{ fontSize: 20 }} />,
      items: accounts.map((it) => ({
        ...it,
        leading: <RowTile kind="account" />,
        trailing: <CountFigure n={it.count ?? 0} of="entitlements" />,
      })),
      selectedId: accountId,
      onSelect: selectAccount,
      searchPlaceholder: 'Search Accounts',
      emptyMessage: 'No accounts match your search.',
      awaitingMessage: 'Select an application to see the accounts in it.',
    },
    {
      id: 'entitlements',
      title: 'Entitlements',
      icon: <ShieldOutlined sx={{ fontSize: 20 }} />,
      disclose: false, // leaf level — nothing to open past an entitlement
      // Risk rides along as a score-only chip: the full "Critical (88)" chip would
      // eat the label's width in a quarter-width column, and the hue already
      // carries the tier. The title spells out what the bare number is.
      items: entitlements.map((it) => ({
        ...it,
        leading: <RowTile kind="entitlement" />,
        trailing:
          it.risk != null ? (
            <span title={`Risk score ${it.risk}`} className="shrink-0">
              <RiskScoreChip score={it.risk} showLabel={false} />
            </span>
          ) : undefined,
      })),
      selectedId: entitlementId,
      onSelect: setEntitlementId,
      searchPlaceholder: 'Search Entitlements',
      emptyMessage: 'No entitlements match your search.',
      awaitingMessage: accountId
        ? 'This account holds no entitlements.'
        : 'Select an account to see the entitlements it grants.',
    },
  ];

  const icon = (kind: keyof typeof LEVEL_ICON) => {
    const Icon = LEVEL_ICON[kind];
    return <Icon sx={{ fontSize: 16 }} />;
  };
  const trail: AccessTrailStep[] = [];
  if (identityId) trail.push({ level: 'User Identity', label: accessLabel('identity', identityId), icon: icon('identity') });
  if (applicationId) trail.push({ level: 'Application', label: accessLabel('application', applicationId), icon: icon('application') });
  if (accountId) trail.push({ level: 'Account', label: accessLabel('account', accountId), icon: icon('account') });
  if (entitlementId) {
    trail.push({
      level: 'Entitlement',
      label: entitlements.find((e) => e.id === entitlementId)?.label ?? entitlementId,
      icon: icon('entitlement'),
    });
  }

  const selectedIdentity = identities.find((i) => i.id === identityId);
  const summary = identityId ? accessSummary(identityId) : null;

  /**
   * Graph columns mirror the list exactly — same order, same selections — except the
   * first, which narrows to the one identity under examination. Empty levels are
   * dropped by AccessGraph, so the scene grows as the reader drills.
   */
  const graphColumns: GraphColumn[] = [
    {
      id: 'identity',
      label: 'Identity',
      nodes: selectedIdentity
        ? [
            {
              id: selectedIdentity.id,
              label: selectedIdentity.label,
              sublabel: selectedIdentity.caption,
              tags: selectedIdentity.tags,
              leading: <EntityAvatar kind="user" name={selectedIdentity.label} size="md" />,
            },
          ]
        : [],
      selectedId: identityId,
    },
    {
      id: 'applications',
      label: 'Applications',
      nodes: applications.map((it) => ({
        id: it.id,
        label: it.label,
        sublabel: it.sublabel,
        count: it.count,
        leading: <EntityAvatar kind="application" name={it.label} />,
      })),
      selectedId: applicationId,
      onSelect: selectApplication,
    },
    {
      id: 'accounts',
      label: 'Accounts',
      nodes: accounts.map((it) => ({
        id: it.id,
        label: it.label,
        sublabel: it.sublabel,
        count: it.count,
        leading: <RowTile kind="account" />,
      })),
      selectedId: accountId,
      onSelect: selectAccount,
    },
    {
      id: 'entitlements',
      label: 'Entitlements',
      // A dot, not the numeric chip: the column heading already says these are
      // entitlements, so the leading slot is better spent on the one thing that
      // ranks them — and the freed width lets the full name render.
      nodes: entitlements.map((it) => ({
        id: it.id,
        label: it.label,
        sublabel: it.sublabel,
        leading: it.risk != null ? <RiskDot score={it.risk} /> : undefined,
      })),
      selectedId: entitlementId,
      onSelect: setEntitlementId,
    },
  ];

  const truncateTrail = (count: number) => {
    if (count <= 1) {
      setApplicationId(null);
      setAccountId(null);
      setEntitlementId(null);
    } else if (count === 2) {
      setAccountId(null);
      setEntitlementId(null);
    } else if (count === 3) {
      setEntitlementId(null);
    }
  };

  // Canvas layout: cancel the shell's page padding and claim the full frame height,
  // so nothing on the page scrolls except each column's row list.
  return (
    <div className="-mx-8 -my-6 flex h-[calc(100%+3rem)] flex-col">
      <header className="flex shrink-0 items-center justify-between gap-4 px-5 py-2.5">
        <div className="flex min-w-0 items-center gap-3">
          <span aria-hidden className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-brand-subtle text-icon-brand">
            <VisibilityOutlined sx={{ fontSize: 20 }} />
          </span>
          <h1 className="min-w-0 truncate text-h4 text-text-primary">Access Overview</h1>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <SegmentedControl
            size="sm"
            options={VIEW_OPTIONS}
            value={view}
            onChange={setView}
            ariaLabel="Explorer view"
          />
          {/* Caption + field as one attached control: the label is not a form label
              here, it names the value sitting next to it in a dense toolbar. */}
          <div className="flex items-center">
            <span className="rounded-l-md border border-border bg-sunken px-3.5 py-[7px] text-body-sm-strong text-text-primary">
              Access Path
            </span>
            <div className="w-[168px]">
              <Select
                attached="left"
                value="application"
                options={PATH_OPTIONS}
                ariaLabel="Access path"
                onChange={(v) => {
                  if (v !== 'application') router.push('/iga/access-view');
                }}
              />
            </div>
          </div>
        </div>
      </header>

      <AccessTrail
        steps={trail}
        onTruncate={truncateTrail}
        emptyHint="Pick a user identity to start tracing their access."
        trailing={
          summary && (
            <span className="flex items-center gap-1.5">
              <StatusChip intent="neutral" label={`Apps ${summary.applications}`} />
              <StatusChip intent="neutral" label={`Entitlements ${summary.entitlements}`} />
              <StatusChip
                intent={summary.highRisk > 0 ? 'danger' : 'success'}
                label={`High risk ${summary.highRisk}`}
              />
            </span>
          )
        }
      />

      {view === 'list' ? (
        <div className="flex min-h-0 flex-1">
          <ColumnBrowser columns={columns} />
        </div>
      ) : (
        <div className="flex min-h-0 flex-1">
          {/* The identity picker keeps its place and its behaviour across views — it
              is the same ColumnBrowser column, just on its own. Picking a person is
              a list job at any scale; the graph starts where the subject is known. */}
          <div className="flex w-[300px] shrink-0 flex-col border-r border-border">
            <ColumnBrowser columns={[columns[0]]} />
          </div>
          <div className="min-w-0 flex-1">
            <AccessGraph
              columns={graphColumns}
              emptyMessage="Select a user identity to map their access."
            />
          </div>
        </div>
      )}
    </div>
  );
}
