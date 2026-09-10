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
  docked = false,
  dock,
  children,
}: {
  avatar: React.ReactNode;
  title: string;
  chips?: React.ReactNode;
  /** One-line caption, or a compact fact row (requested by / for / when). */
  description?: React.ReactNode;
  /**
   * Right-aligned header actions — buttons and a trailing Menu, the same slot the
   * Emergency Access detail carries. Keep it to one or two buttons plus the menu;
   * anything more belongs on the tab that owns it.
   */
  actions?: React.ReactNode;
  /**
   * Omit the strip when the page is one surface — Request Governance puts
   * workflow and facts side by side, so a tab would hide one of them.
   */
  tabs?: TabItem[];
  tab?: string;
  onTab?: (v: string) => void;
  /**
   * Emergency Access frame: full-bleed, tabs on their own rule, room for a
   * right-hand checklist. Stays on while the dock is closed so hiding it does
   * not restyle the page.
   */
  docked?: boolean;
  /** The checklist column. Omit it when the reader has closed it. */
  dock?: React.ReactNode;
  children: React.ReactNode;
}) {
  const withDock = docked || Boolean(dock);

  return (
    <div
      className={
        // 100% is main's content box. Cancel `px-8` / `py-6` so the shell
        // meets the viewport edges — otherwise `overflow-hidden` clips the
        // tab rule 32px short of the right edge.
        withDock
          ? 'flex h-[calc(100%+2*var(--ds-space-6))] min-h-0 -mx-8 -mt-6 -mb-6 overflow-hidden'
          : 'flex h-[calc(100%+2*var(--ds-space-6))] min-h-0 flex-col -mx-8 -mt-6 -mb-6 overflow-hidden'
      }
    >
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        {/* Sticky identity band: 12px above the title block and 12px before the tabs —
            enough air that the block doesn't kiss the topbar or the tab strip, tight
            enough that the band reads as chrome rather than a second page header. */}
        <div
          className={
            withDock
              ? 'shrink-0 bg-canvas px-8 pt-3'
              : 'shrink-0 border-b border-border bg-canvas px-8 pt-3'
          }
        >
          {/* items-center, not items-start: the identity block is two lines (~45px) and the
              action row is one 36px control, so top-aligning left the buttons sitting ~9px
              above the optical centre of the header. */}
          <div className={`mb-3 flex flex-wrap items-center justify-between gap-4`}>
            <div className="flex items-center gap-3">
              {avatar}
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="text-h4 text-text-primary">{title}</h1>
                  {chips}
                </div>
                {description != null && description !== '' && (
                  <div className="mt-px max-w-4xl text-body-sm text-text-secondary">{description}</div>
                )}
              </div>
            </div>
            {actions != null && (
              <div className={`flex shrink-0 items-center ${withDock ? 'gap-3' : 'gap-2'}`}>{actions}</div>
            )}
          </div>
          {!withDock && tabs && tab != null && onTab && (
            <Tabs items={tabs} value={tab} onChange={onTab} noBorder aria-label={`${title} details`} />
          )}
        </div>
        {withDock && tabs && tab != null && onTab && (
          <div className="shrink-0 border-b border-border px-8">
            <Tabs items={tabs} value={tab} onChange={onTab} noBorder aria-label={`${title} details`} />
          </div>
        )}

        <div
          className={
            withDock
              ? 'flex min-h-0 min-w-0 flex-1 flex-col px-8 py-5'
              : 'flex min-h-0 flex-1 flex-col px-8 pt-5'
          }
        >
          {children}
        </div>
      </div>
      {dock}
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
