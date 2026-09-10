'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import AddOutlined from '@mui/icons-material/AddOutlined';
import EditOutlined from '@mui/icons-material/EditOutlined';
import ScheduleOutlined from '@mui/icons-material/ScheduleOutlined';
import {
  Avatar,
  Button,
  Menu,
  OverflowChips,
  StatusChip,
  useToast,
  type Column,
  type FilterGroup,
} from '@ds/components';
import {
  applicationAccountable,
  listDirectoryCatalogApplications,
  listOnboardedApplicationRows,
  listVisibleDirectoryApplications,
  type AccountableParty,
  type ApplicationRow,
} from '@/data/directory';
import { getOnboardedApplication, type OnboardedApplication } from '@/data/applications-store';
import { ApplicationBasicDetailsDrawer, DirectoryListPage, EntityAvatar } from '@/components/product/directory';
import { lastSyncAt } from '@/data/reconciliation';
import { formatDateTime } from '@/components/product/sod/labels';

const AUTH_CHIP = {
  authorized: { label: 'Authorized', intent: 'success' as const },
  pending: { label: 'Not authorized', intent: 'warning' as const },
};

const METRIC_ICON = { fontSize: 16 } as const;

/**
 * Someone accountable in the Owners cell: the mark, then the name.
 *
 * Not the default tinted chip. A pill around a name says "one of a set of values"; these
 * are parties, and the mark is what the rest of the product uses to say so — the same
 * thing `IdentityCell` does in a table whose subject *is* the person. Passing it through
 * `renderItem` also drops the group pill, so the cell reads as a face and a name with the
 * `+n` after it rather than a capsule the eye has to open.
 *
 * The shape carries the kind, per the avatar rule: a person is round, a Governance Team is
 * square. That distinction is the whole reason both belong in one cell — "who answers for
 * this" is one question, and whether the answer is a human or a body is worth seeing at a
 * glance rather than in a separate column.
 */
function OwnerChip({ party }: { party: AccountableParty }) {
  return (
    <span className="inline-flex min-w-0 items-center gap-2">
      <Avatar name={party.name} size="xs" kind={party.kind === 'team' ? 'entity' : 'person'} />
      <span className="truncate text-body-sm text-text-primary" title={party.name}>
        {party.name}
      </span>
    </span>
  );
}

/**
 * When the connector last looked at this application.
 *
 * `Never synced` is stated rather than dashed, because for a freshly onboarded application
 * it is the whole story rather than a missing value — and it is set in tertiary, since an
 * absence should not read as loudly as a date.
 *
 * Formatted with the same `formatDateTime` the Reconciliation tab uses, so the same fact
 * reads identically in the list and on the page the cell links to.
 */
function LastSyncedCell({
  name,
  lastSync,
  href,
}: {
  name: string;
  /** ISO instant, or null when the application has never synced. */
  lastSync: string | null;
  href: string;
}) {
  const when = lastSync ? formatDateTime(lastSync) : 'Never synced';
  return (
    <Link
      href={href}
      onClick={(e) => e.stopPropagation()}
      aria-label={`Open reconciliation for ${name}: ${lastSync ? `last synced ${when}` : 'never synced'}`}
      className="inline-flex min-w-0 items-center gap-1.5 text-text-primary hover:text-text-link"
    >
      <ScheduleOutlined sx={METRIC_ICON} className="shrink-0 text-icon-subtle" aria-hidden />
      <span
        className={['truncate tabular-nums text-body-sm', lastSync ? '' : 'text-text-tertiary'].join(' ')}
      >
        {when}
      </span>
    </Link>
  );
}

export default function ApplicationsListPage() {
  const router = useRouter();
  const toast = useToast();
  // The catalog paints straight away; onboarded applications and hidden
  // catalog ids live in localStorage, so they can only be read after mount —
  // reading them during render would give the server one list and the client
  // another.
  const [onboarded, setOnboarded] = React.useState<ApplicationRow[]>([]);
  const [catalog, setCatalog] = React.useState<ApplicationRow[]>(() => listDirectoryCatalogApplications());
  const [editing, setEditing] = React.useState<OnboardedApplication | null>(null);

  const refresh = React.useCallback(() => {
    setOnboarded(listOnboardedApplicationRows());
    setCatalog(listVisibleDirectoryApplications());
  }, []);
  React.useEffect(refresh, [refresh]);

  const apps = React.useMemo(() => [...onboarded, ...catalog], [onboarded, catalog]);

  /**
   * One category today. The modal is built for several, so the shape is here
   * ready for Owner / Risk once those exist as filters.
   */
  const filterGroups: FilterGroup[] = [
    {
      id: 'application',
      label: 'Application',
      optionHeader: 'Application',
      searchPlaceholder: 'Search',
      options: apps.map((a) => ({
        id: a.id,
        label: a.name,
        icon: <EntityAvatar kind="application" name={a.name} appType={a.appType} />,
      })),
    },
  ];

  const open = (id: string) => router.push(`/iga/directory/applications/${id}`);

  const columns: Column<ApplicationRow>[] = [
    {
      id: 'name',
      header: 'App Name',
      sortable: true,
      wrap: true,
      value: (r) => r.name,
      render: (r) => (
        <div className="flex min-w-0 items-center gap-2.5">
          <EntityAvatar kind="application" name={r.name} appType={r.appType} />
          <div className="min-w-0">
            <div className="truncate text-body-sm-strong text-text-primary">{r.name}</div>
            <div className="truncate text-caption text-text-secondary" title={r.appType}>
              {r.appType}
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'discoverySource',
      header: 'Discovery source',
      sortable: true,
      width: 150,
      value: (r) => r.discoverySource,
      render: (r) => <StatusChip intent="info" label={r.discoverySource} dot={false} />,
    },
    {
      id: 'authorizationStatus',
      header: 'Authorization Status',
      sortable: true,
      width: 170,
      value: (r) => r.authorizationStatus,
      render: (r) => {
        const chip = AUTH_CHIP[r.authorizationStatus];
        return <StatusChip intent={chip.intent} label={chip.label} />;
      },
    },
    {
      id: 'owners',
      header: 'Owners',
      sortable: true,
      wrap: true,
      width: 200,
      value: (r) => applicationAccountable(r.id).map((o) => o.name).join(', '),
      render: (r) => {
        const owners = applicationAccountable(r.id);
        if (owners.length === 0) {
          // A dash says "nothing here" and leaves the gap. The row already
          // opens the application; this link is the next useful step — the
          // Owners tab, where the empty page has the Add control. Named for
          // the column, not the page: "+ Add application" would send the
          // reader to onboard a second system from a cell about people.
          return (
            <Link
              href={`/iga/directory/applications/${r.id}?tab=owners`}
              onClick={(e) => e.stopPropagation()}
              aria-label={`Add an owner for ${r.name}`}
              className="rounded-sm text-body-sm text-text-link hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-subtle"
            >
              + Add owner
            </Link>
          );
        }
        return (
          <OverflowChips
            items={owners}
            max={1}
            renderItem={(o) => <OwnerChip party={o} />}
          />
        );
      },
    },
    {
      id: 'reconciliation',
      header: 'Last Synced',
      sortable: true,
      width: 176,
      /*
        Sorted ascending, a never-synced application comes first: the question this column
        gets sorted for is "what has IGA not looked at lately", and never is the extreme of
        that rather than a value to shuffle in among the recent ones.
      */
      value: (r) => lastSyncAt(r.id) ?? '',
      render: (r) => (
        <LastSyncedCell
          name={r.name}
          lastSync={lastSyncAt(r.id)}
          href={`/iga/directory/applications/${r.id}?tab=reconciliation`}
        />
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      align: 'right',
      width: 56,
      render: (r) => (
        <Menu
          ariaLabel={`Actions for ${r.name}`}
          items={[
            {
              label: 'Edit Basic Details',
              icon: <EditOutlined sx={{ fontSize: 18 }} />,
              onClick: () => {
                const app = getOnboardedApplication(r.id);
                if (app) {
                  setEditing(app);
                  return;
                }
                toast.info('Edit basic details');
              },
            },
          ]}
        />
      ),
    },
  ];
  return (
    <>
      <DirectoryListPage<ApplicationRow>
        title="Applications"
        description="Systems integrated with the IGA platform."
        searchPlaceholder="Search applications"
        columns={columns}
        rows={apps}
        matches={(r, q) =>
          r.name.toLowerCase().includes(q) ||
          r.appType.toLowerCase().includes(q) ||
          (r.description ?? '').toLowerCase().includes(q) ||
          r.discoverySource.toLowerCase().includes(q) ||
          // Teams too: searching "Compliance Team" should find what it answers for.
          applicationAccountable(r.id).some((o) => o.name.toLowerCase().includes(q))
        }
        onOpen={open}
        emptyTitle="No applications found"
        emptyMessage="No applications match your search."
        actions={
          <Button startIcon={<AddOutlined />} onClick={() => router.push('/iga/directory/applications/onboard')}>
            Onboard new application
          </Button>
        }
        filterGroups={filterGroups}
        filterMatches={(r, s) => {
          const picked = s.application ?? [];
          return picked.length === 0 || picked.includes(r.id);
        }}
      />

      {editing ? (
        <ApplicationBasicDetailsDrawer
          open
          app={editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            refresh();
            toast.success('Basic details saved.');
          }}
        />
      ) : null}
    </>
  );
}
