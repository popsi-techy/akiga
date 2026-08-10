'use client';

import * as React from 'react';
import Link from 'next/link';
import { Tabs, Button, DataTable, InfoRow, InfoRowGroup, type TabItem, type Column } from '@ds/components';

/** Re-export DS InfoRow helpers for Directory detail Information cards. */
export { InfoRow, InfoRowGroup };

/**
 * Sticky bleed header (avatar + title + chips + description + actions) + tabs +
 * a fill-height content region — the shared frame for every Directory detail page.
 *
 * There is no back link: the app frame's breadcrumb already sits directly above
 * this header and names the list it came from, so a second way back was the same
 * navigation stated twice, four pixels apart.
 */
export function DetailShell({
  avatar,
  title,
  chips,
  description,
  actions,
  tabs,
  tab,
  onTab,
  children,
}: {
  avatar: React.ReactNode;
  title: string;
  chips?: React.ReactNode;
  description?: string;
  /**
   * Right-aligned header actions — buttons and a trailing Menu, the same slot the
   * Emergency Access detail carries. Keep it to one or two buttons plus the menu;
   * anything more belongs on the tab that owns it.
   */
  actions?: React.ReactNode;
  tabs: TabItem[];
  tab: string;
  onTab: (v: string) => void;
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-full flex-col">
      <div className="shrink-0 -mx-8 -mt-6 border-b border-border bg-canvas px-8 pt-5">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            {avatar}
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-h3 leading-tight text-text-primary">{title}</h1>
                {chips}
              </div>
              {description && <p className="mt-0.5 max-w-2xl text-body-sm text-text-secondary">{description}</p>}
            </div>
          </div>
          {actions != null && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
        </div>
        <Tabs items={tabs} value={tab} onChange={onTab} noBorder aria-label={`${title} details`} />
      </div>
      <div className="min-h-0 flex-1 pt-5">{children}</div>
    </div>
  );
}

/** Detail "not found" state with a Back link. */
export function DetailNotFound({ title, backHref, backLabel }: { title: string; backHref: string; backLabel: string }) {
  return (
    <div className="mx-auto max-w-2xl py-16 text-center">
      <h1 className="text-h3 text-text-primary">{title}</h1>
      <p className="mt-2 text-body text-text-secondary">This item doesn’t exist or was removed.</p>
      <div className="mt-4 flex justify-center">
        <Link href={backHref}>
          <Button variant="secondary">{backLabel}</Button>
        </Link>
      </div>
    </div>
  );
}

/** A relationship tab's table — fill-height, row-click cross-navigates. */
export function RelationTable<Row extends { id: string }>({
  columns,
  rows,
  onRowClick,
  emptyTitle,
  emptyMessage,
}: {
  columns: Column<Row>[];
  rows: Row[];
  onRowClick?: (row: Row) => void;
  emptyTitle: string;
  emptyMessage: string;
}) {
  return (
    <div className="h-full">
      <DataTable<Row> columns={columns} rows={rows} onRowClick={onRowClick} fillHeight emptyTitle={emptyTitle} emptyMessage={emptyMessage} />
    </div>
  );
}
