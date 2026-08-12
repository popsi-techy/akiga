'use client';

import * as React from 'react';
import CloseOutlined from '@mui/icons-material/CloseOutlined';
import SearchOutlined from '@mui/icons-material/SearchOutlined';
import AccessTimeOutlined from '@mui/icons-material/AccessTimeOutlined';
import DeleteOutlineOutlined from '@mui/icons-material/DeleteOutlineOutlined';
import HistoryOutlined from '@mui/icons-material/HistoryOutlined';
import { Dialog, Input, Menu, StatusChip, useToast } from '@ds/components';

/** Minimal envelope shared by approval policies and workflows. */
export type VersionedDoc = {
  id: string;
  status: 'draft' | 'active';
  createdAt?: string;
  updatedAt?: string;
};

type VersionRow = {
  id: string;
  name: string;
  at: string;
  status: 'active' | 'draft';
};

function formatVersionAt(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString(undefined, {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** Demo history for the builder rail — durable versioning is not wired yet. */
function seedVersions(doc: VersionedDoc): VersionRow[] {
  const base = new Date(doc.updatedAt || doc.createdAt || Date.now()).getTime();
  const day = 24 * 60 * 60 * 1000;
  const rows: VersionRow[] = [];
  for (let n = 6; n >= 1; n -= 1) {
    const offset = (6 - n) * 3 * day;
    rows.push({
      id: `${doc.id}-v${n}`,
      name: `Version ${n}`,
      at: new Date(base - offset).toISOString(),
      status: n === 6 && doc.status === 'active' ? 'active' : 'draft',
    });
  }
  // Draft docs still need a tip-of-stack card.
  if (doc.status !== 'active' && rows[0]) {
    rows[0] = { ...rows[0], status: 'draft' };
  }
  return rows;
}

/**
 * Right-rail version history for automation builders — search, active tip,
 * earlier drafts. Overflow → Delete (confirmed).
 */
export function VersionsPanel({
  doc,
  onClose,
}: {
  doc: VersionedDoc | null;
  onClose: () => void;
}) {
  const toast = useToast();
  const [query, setQuery] = React.useState('');
  const [versions, setVersions] = React.useState<VersionRow[]>(() =>
    doc ? seedVersions(doc) : [],
  );
  const [pendingDelete, setPendingDelete] = React.useState<VersionRow | null>(null);

  React.useEffect(() => {
    setVersions(doc ? seedVersions(doc) : []);
    setQuery('');
    setPendingDelete(null);
  }, [doc?.id, doc?.status, doc?.updatedAt]);

  const q = query.trim().toLowerCase();
  const filtered = q
    ? versions.filter((v) => v.name.toLowerCase().includes(q))
    : versions;

  const current =
    filtered.find((v) => v.status === 'active') ??
    (doc?.status !== 'active' ? filtered[0] : undefined);
  const others = filtered.filter((v) => v.id !== current?.id);
  const draftCount = others.filter((v) => v.status === 'draft').length;

  const confirmDelete = () => {
    if (!pendingDelete) return;
    const removed = pendingDelete;
    setVersions((prev) => prev.filter((v) => v.id !== removed.id));
    setPendingDelete(null);
    toast.success(`${removed.name} deleted`);
  };

  return (
    <aside className="flex w-[340px] shrink-0 flex-col border-l border-border bg-surface">
      <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
        <div className="min-w-0 text-body-strong text-text-primary">Versions</div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close versions"
          className="grid h-8 w-8 shrink-0 place-items-center rounded-md text-icon hover:bg-surface-hover"
        >
          <CloseOutlined sx={{ fontSize: 18 }} />
        </button>
      </div>

      <div className="px-4 pb-0 pt-3">
        <Input
          placeholder="Search by Version Name"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          startAdornment={<SearchOutlined sx={{ fontSize: 18 }} />}
          aria-label="Search by version name"
        />
      </div>

      <div className="ds-scroll min-h-0 flex-1 overflow-y-auto px-4 py-4">
        {!doc || versions.length === 0 ? (
          <EmptyVersions />
        ) : filtered.length === 0 ? (
          <div className="grid min-h-[160px] place-items-center text-center">
            <div>
              <div className="text-body-strong text-text-primary">No matching versions</div>
              <p className="mt-1 text-caption text-text-secondary">Try a different name.</p>
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            <section>
              <h3 className="mb-2.5 text-caption-strong text-text-secondary">Active Version</h3>
              {current ? (
                <VersionCard
                  version={current}
                  emphasized
                  onDelete={() => setPendingDelete(current)}
                />
              ) : (
                <div className="rounded-lg border border-dashed border-border bg-subtle px-3 py-4 text-center">
                  <p className="text-caption text-text-secondary">No activated version yet.</p>
                </div>
              )}
            </section>

            {others.length > 0 && (
              <section>
                <div className="mb-2.5 flex items-baseline justify-between gap-2">
                  <h3 className="text-caption-strong text-text-secondary">Other Versions</h3>
                  <span className="text-caption text-text-tertiary tabular-nums">
                    {draftCount} draft{draftCount === 1 ? '' : 's'}
                  </span>
                </div>
                <ul className="m-0 flex list-none flex-col gap-2.5 p-0">
                  {others.map((v) => (
                    <li key={v.id}>
                      <VersionCard version={v} onDelete={() => setPendingDelete(v)} />
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>
        )}
      </div>

      <Dialog
        open={Boolean(pendingDelete)}
        onClose={() => setPendingDelete(null)}
        title={`Delete ${pendingDelete?.name ?? 'version'}?`}
        tone="danger"
        confirmLabel="Delete"
        cancelLabel="Keep"
        onConfirm={confirmDelete}
      >
        {pendingDelete?.status === 'active'
          ? 'This is the currently activated version. Deleting it cannot be undone in this demo.'
          : 'This draft will be removed from the version list. This cannot be undone in this demo.'}
      </Dialog>
    </aside>
  );
}

function VersionCard({
  version,
  emphasized = false,
  onDelete,
}: {
  version: VersionRow;
  emphasized?: boolean;
  onDelete: () => void;
}) {
  return (
    <article
      className={[
        'rounded-lg px-3 py-3 transition-colors',
        emphasized
          ? 'bg-[var(--ds-color-status-info-subtle)]'
          : 'bg-subtle hover:bg-sunken',
      ].join(' ')}
    >
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="text-body-sm-strong text-text-primary">{version.name}</h4>
            {version.status === 'active' && <StatusChip intent="success" label="Active" />}
          </div>
          <div className="mt-1.5 flex items-center gap-1.5 text-caption text-text-secondary">
            <AccessTimeOutlined sx={{ fontSize: 14 }} className="shrink-0 text-icon" aria-hidden />
            <time dateTime={version.at}>{formatVersionAt(version.at)}</time>
          </div>
        </div>
        <Menu
          ariaLabel={`Actions for ${version.name}`}
          items={[
            {
              label: 'Delete',
              icon: <DeleteOutlineOutlined sx={{ fontSize: 18 }} />,
              danger: true,
              onClick: onDelete,
            },
          ]}
        />
      </div>
    </article>
  );
}

function EmptyVersions() {
  return (
    <div className="grid min-h-[200px] place-items-center text-center">
      <div>
        <span className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-subtle text-icon">
          <HistoryOutlined sx={{ fontSize: 24 }} />
        </span>
        <div className="text-body-strong text-text-primary">No versions yet</div>
        <p className="mx-auto mt-1 max-w-[240px] text-caption text-text-secondary">
          Activate to publish a version. Earlier drafts will appear here.
        </p>
      </div>
    </div>
  );
}

export default VersionsPanel;
