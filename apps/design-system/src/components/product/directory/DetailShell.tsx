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
  rail,
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
  /**
   * A docked navigation rail, which **replaces** the tab strip when passed.
   *
   * Opt-in per page rather than a shell-wide switch: a page earns a rail when its
   * sections outgrow a strip, or when it has setup state to report per section that a
   * strip has no room for. Pages that pass nothing keep the tabs unchanged.
   *
   * `tabs` is still required with a rail — it stays the definition of which sections
   * exist, so the rail can be derived from it instead of hand-kept beside it.
   */
  rail?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-full flex-col">
      {/* Sticky identity band: 12px above the title block and 12px before the tabs —
          enough air that the block doesn't kiss the topbar or the tab strip, tight
          enough that the band reads as chrome rather than a second page header.

          With a rail below, the band's rule is the horizontal half of the frame the
          rail's right border completes, so the two meet as one continuous line. */}
      <div className="shrink-0 -mx-8 -mt-6 border-b border-border bg-canvas px-8 pt-3">
        {/* items-center, not items-start: the identity block is two lines (~45px) and the
            action row is one 36px control, so top-aligning left the buttons sitting ~9px
            above the optical centre of the header. */}
        <div className="mb-3 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {avatar}
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-h4 text-text-primary">{title}</h1>
                {chips}
              </div>
              {description && <p className="mt-px max-w-2xl text-body-sm text-text-secondary">{description}</p>}
            </div>
          </div>
          {actions != null && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
        </div>
        {/* No strip where the rail is: the two would be the same list of sections, and
            the reader would have to work out whether they differ. */}
        {!rail && (
          <Tabs items={tabs} value={tab} onChange={onTab} noBorder aria-label={`${title} details`} />
        )}
      </div>

      {rail ? (
        /* Full-bleed so the rail reaches the left edge and the bottom of the viewport
           rather than floating in a padded box — a docked column that stops short of
           either reads as a card. The page padding comes back inside the content, where
           it belongs to the content and not to the frame: 20px, measured from the rail's
           border rather than the page's, so there is no page title to line up with. */
        <div className="-mx-8 -mb-6 flex min-h-0 flex-1">
          {rail}
          <div className="min-h-0 min-w-0 flex-1 p-5">{children}</div>
        </div>
      ) : (
        <div className="min-h-0 flex-1 pt-5">{children}</div>
      )}
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
