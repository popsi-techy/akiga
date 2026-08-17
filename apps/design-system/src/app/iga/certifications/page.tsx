'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutline from '@mui/icons-material/DeleteOutline';
import EditOutlined from '@mui/icons-material/EditOutlined';
import EventOutlined from '@mui/icons-material/EventOutlined';
import PlayCircleOutlined from '@mui/icons-material/PlayCircleOutlined';
import RocketLaunchOutlined from '@mui/icons-material/RocketLaunchOutlined';
import TaskAltOutlined from '@mui/icons-material/TaskAltOutlined';
import {
  Avatar,
  Button,
  Dialog,
  Menu,
  StatTile,
  StatusChip,
  useToast,
  type Column,
  type FilterGroup,
  type FilterSelection,
} from '@ds/components';
import { DirectoryListPage } from '@/components/product/directory';
import {
  certificationCounts,
  deleteCertification,
  isLaunchable,
  listCertifications,
  setCertificationStatus,
  INTERVAL_LABEL,
  STATUS_LABEL,
  TYPE_LABEL,
  type Certification,
  type CertificationStatus,
} from '@/data/certifications';
import {
  CERT_STATUS_META,
  formatDate,
  formatDateTime,
} from '@/components/product/certifications/certification-labels';

export default function CertificationsListPage() {
  const router = useRouter();
  const toast = useToast();

  // localStorage-backed: null until mounted, so the server and the client agree
  // on the first paint and the store is read only where it exists.
  const [rows, setRows] = React.useState<Certification[] | null>(null);
  const refresh = React.useCallback(() => setRows(listCertifications()), []);
  React.useEffect(() => refresh(), [refresh]);

  const [deleteTarget, setDeleteTarget] = React.useState<Certification | null>(null);
  const counts = rows ? certificationCounts() : { readyToLaunch: 0, scheduled: 0, launched: 0, completed: 0 };

  const launch = (c: Certification) => {
    if (!isLaunchable(c)) {
      toast.error('This certification is not finished — open it to see what is missing.');
      return;
    }
    setCertificationStatus(c.id, 'launched');
    refresh();
    toast.success(`“${c.name}” launched. Reviewers have been notified.`);
  };

  const columns: Column<Certification>[] = [
    {
      id: 'name',
      header: 'Access Certification',
      sortable: true,
      value: (c) => c.name,
      // The certification's initial, not a fixed icon: one glyph repeated down
      // the column is decoration, and the letter at least varies by row.
      render: (c) => (
        <div className="flex items-center gap-3">
          <Avatar name={c.name} size="sm" />
          <div className="min-w-0">
            <div className="truncate text-body-sm-strong text-text-primary">{c.name}</div>
            <div className="truncate text-caption text-text-secondary">{TYPE_LABEL[c.type]} review</div>
          </div>
        </div>
      ),
    },
    {
      id: 'created',
      header: 'Created',
      sortable: true,
      value: (c) => c.createdOn,
      render: (c) => <span className="whitespace-nowrap text-text-secondary">{formatDateTime(c.createdOn)}</span>,
    },
    {
      id: 'interval',
      header: 'Interval',
      sortable: true,
      value: (c) => INTERVAL_LABEL[c.timeline.interval],
      render: (c) => (
        <span className="whitespace-nowrap text-text-secondary">{INTERVAL_LABEL[c.timeline.interval]}</span>
      ),
    },
    {
      id: 'ends',
      header: 'Recurrence Ends',
      sortable: true,
      value: (c) => c.timeline.recurrenceEndOn ?? '',
      // An em dash, not "N/A": a one-time review has no recurrence to end, and
      // "not applicable" makes the reader work out which of the two it is.
      render: (c) =>
        c.timeline.recurrenceEndOn ? (
          <span className="whitespace-nowrap text-text-secondary">{formatDate(c.timeline.recurrenceEndOn)}</span>
        ) : (
          <span className="text-text-disabled">—</span>
        ),
    },
    {
      id: 'status',
      header: 'Status',
      sortable: true,
      value: (c) => c.status,
      render: (c) => <StatusChip intent={CERT_STATUS_META[c.status].intent} label={CERT_STATUS_META[c.status].label} />,
    },
    {
      id: 'actions',
      header: 'Actions',
      align: 'right',
      width: 80,
      render: (c) => (
        <Menu
          items={[
            ...(c.status === 'draft' || c.status === 'readyToLaunch'
              ? [
                  {
                    label: 'Continue setup',
                    icon: <EditOutlined sx={{ fontSize: 18 }} />,
                    onClick: () => router.push(`/iga/certifications/new/custom?id=${c.id}`),
                  },
                  {
                    label: 'Launch now',
                    icon: <PlayCircleOutlined sx={{ fontSize: 18 }} />,
                    onClick: () => launch(c),
                    divider: true,
                  },
                ]
              : []),
            {
              label: 'Delete',
              icon: <DeleteOutline sx={{ fontSize: 18 }} />,
              danger: true,
              onClick: () => setDeleteTarget(c),
            },
          ]}
        />
      ),
    },
  ];

  const filterGroups: FilterGroup[] = [
    {
      id: 'type',
      label: 'Certification Type',
      options: (Object.keys(TYPE_LABEL) as (keyof typeof TYPE_LABEL)[]).map((id) => ({
        id,
        label: TYPE_LABEL[id],
      })),
    },
    {
      id: 'status',
      label: 'Status',
      options: (Object.keys(STATUS_LABEL) as CertificationStatus[]).map((id) => ({
        id,
        label: STATUS_LABEL[id],
      })),
    },
    {
      id: 'interval',
      label: 'Interval',
      options: (Object.keys(INTERVAL_LABEL) as (keyof typeof INTERVAL_LABEL)[]).map((id) => ({
        id,
        label: INTERVAL_LABEL[id],
      })),
    },
  ];

  return (
    <div className="flex h-full flex-col">
      <div className="min-h-0 flex-1">
        <DirectoryListPage<Certification>
          title="Access Certification"
          description="Scheduled reviews where an accountable person confirms the access people still need."
          searchPlaceholder="Search certifications"
          columns={columns}
          rows={rows ?? []}
          matches={(c, q) => c.name.toLowerCase().includes(q) || c.description.toLowerCase().includes(q)}
          filterGroups={filterGroups}
          filterMatches={(c, sel: FilterSelection) =>
            (!sel.type?.length || sel.type.includes(c.type)) &&
            (!sel.status?.length || sel.status.includes(c.status)) &&
            (!sel.interval?.length || sel.interval.includes(c.timeline.interval))
          }
          onOpen={(id) => {
            const c = (rows ?? []).find((x) => x.id === id);
            // Only an unfinished certification has somewhere to go: the wizard it
            // came from. A running one has no detail page yet, so the row does
            // nothing rather than pretending.
            if (c && (c.status === 'draft' || c.status === 'readyToLaunch')) {
              router.push(`/iga/certifications/new/custom?id=${id}`);
            }
          }}
          emptyTitle="No access certifications"
          emptyMessage="Create one to have owners and managers confirm the access their people hold."
          summary={
            // What is happening across the estate, above the list of what caused
            // it. Drafts are not counted — see `certificationCounts`.
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatTile label="Ready to launch" value={counts.readyToLaunch} tone="warning" icon={<PlayCircleOutlined />} hint="Waiting on you" />
              <StatTile label="Scheduled" value={counts.scheduled} tone="info" icon={<EventOutlined />} hint="Starts on its own" />
              <StatTile label="In review" value={counts.launched} tone="brand" icon={<RocketLaunchOutlined />} hint="Reviewers are deciding" />
              <StatTile label="Completed" value={counts.completed} tone="success" icon={<TaskAltOutlined />} hint="Decisions are in" />
            </div>
          }
          actions={
            <Button startIcon={<AddIcon />} onClick={() => router.push('/iga/certifications/new')}>
              Create New Access Certification
            </Button>
          }
        />
      </div>

      <Dialog
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        tone="danger"
        title={`Delete ${deleteTarget?.name}?`}
        confirmLabel="Delete"
        onConfirm={() => {
          if (!deleteTarget) return;
          deleteCertification(deleteTarget.id);
          setDeleteTarget(null);
          refresh();
          toast.success('Access certification deleted');
        }}
      >
        The configuration is removed. Decisions reviewers already made are kept in the audit log.
      </Dialog>
    </div>
  );
}
