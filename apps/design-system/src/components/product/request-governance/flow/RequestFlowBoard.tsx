'use client';

import * as React from 'react';
import SearchOutlined from '@mui/icons-material/SearchOutlined';
import { Input, PeekSlot } from '@ds/components';
import {
  RESOURCE_TYPE_LABEL,
  approvalFlowComplete,
  itemFlowProgress,
  requestItems,
  visibleApprovalLevels,
  type GovernanceRequest,
  type GovernanceRequestItem,
} from '@/data/request-governance';
import { ApprovalFlowCanvas } from './ApprovalFlowCanvas';
import { LevelDetailPanel } from './LevelDetailPanel';
import { RequestItemCard } from './RequestItemCard';

/**
 * The body of a request — its cart on the left, the selected line's approval flow on the
 * right.
 *
 * It replaced a table of cart lines. A table answered "what is on this request" and
 * nothing else: the flow every line is moving through — which stage, who is holding it,
 * how long it has been there — was one cell of prose per row, and reading it meant opening
 * a drawer per line and holding four drawers in your head.
 *
 * So the cart became a rail and the flow became the page. The rail is the picker and stays
 * scannable — four facts a line; the canvas is where the reading happens. The first line is
 * selected on arrival because an empty canvas beside a full rail is a page asking a
 * question it could have answered itself.
 */
/**
 * The opening band of each column.
 *
 * One height, declared once, so the two columns start on the same line either side of the
 * divider. Only the canvas's band closes with a rule: the rail's separator is the search
 * field under it, and a rule as well would be two separators for one boundary.
 */
const HEADER_BAND = 'flex h-16 shrink-0 items-center';

export function RequestFlowBoard({
  row,
  selectedItemId,
  onSelectItem,
}: {
  row: GovernanceRequest;
  /** The line to show. Falls back to the first — an unknown id is a stale deep link,
   *  not an empty canvas. */
  selectedItemId?: string | null;
  onSelectItem?: (item: GovernanceRequestItem) => void;
}) {
  const items = requestItems(row);
  const [levelIndex, setLevelIndex] = React.useState<number | null>(null);
  const [query, setQuery] = React.useState('');

  const selected: GovernanceRequestItem | undefined =
    items.find((i) => i.id === selectedItemId) ?? items[0];

  // Level 2 of one line is not level 2 of another, and a request opened from another id
  // shares nothing with the panel that was open on it.
  React.useEffect(() => {
    setLevelIndex(null);
  }, [row.id, selected?.id]);

  const progress = selected ? itemFlowProgress(row, selected) : null;
  const inFlight = items.filter((i) => !itemFlowProgress(row, i).complete).length;

  // The search narrows the rail and nothing else. A line the reader is looking at stays on
  // the canvas even once it has been typed out of the list — losing the thing you were
  // reading because you went looking for something else is not a filter, it is a bug.
  const q = query.trim().toLowerCase();
  const shown = q
    ? items.filter((i) =>
        [i.resourceName, i.resourceDetail, i.appName, RESOURCE_TYPE_LABEL[i.resourceType]]
          .filter(Boolean)
          .some((v) => String(v).toLowerCase().includes(q)),
      )
    : items;

  if (!selected || !progress) {
    return (
      <div className="grid h-full place-items-center">
        <p className="text-body-sm text-text-secondary">This request has no catalog items yet.</p>
      </div>
    );
  }

  const levels = visibleApprovalLevels(progress.view);
  const openLevel = levelIndex === null ? null : levels[levelIndex] ?? null;

  return (
    /* Full-bleed out of the shell's page gutter. The board is a docked split, not a pair
       of cards on a page: the rule between the columns is the only edge either of them
       needs, and giving each one a border and a 20px gutter as well spent ~60px of the
       canvas on chrome that said nothing. */
    <div className="-mx-8 -mt-5 flex h-[calc(100%+var(--ds-space-5))] min-h-0">
      {/* 300 is the floor a card needs for a name beside a status chip; the wider step
          buys the name back from the chip once there is room to spare. `xl` rather than
          a viewport guess: this rail sits beside the app sidebar and the canvas. */}
      <aside className="flex min-h-0 w-[300px] shrink-0 flex-col border-r border-border xl:w-[336px]">
        {/* Both columns open with a band of the same height, so the two start on the same
            line either side of the divider. */}
        <div className={`${HEADER_BAND} justify-between px-6`}>
          <h2 className="text-overline uppercase text-text-tertiary">Requested items</h2>
          <span className="shrink-0 text-caption text-text-secondary">
            {items.length === 1 ? '1 item' : `${items.length} items`}
            {inFlight > 0 ? ` · ${inFlight} in flight` : ''}
          </span>
        </div>
        {/* The separator between the rail's title and its list — a control rather than a
            rule, so the boundary earns its pixels. Only where there is more than one line
            to search: over a cart of one it would be a field that can do nothing. */}
        {items.length > 1 && (
          <div className="shrink-0 px-6 pb-4">
            <Input
              placeholder="Search items"
              aria-label="Search requested items"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              startAdornment={<SearchOutlined sx={{ fontSize: 18 }} />}
            />
          </div>
        )}

        <div className="ds-scroll flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-6 pb-5">
          {shown.map((item) => (
            <RequestItemCard
              key={item.id}
              item={item}
              progress={itemFlowProgress(row, item)}
              selected={item.id === selected.id}
              onSelect={() => onSelectItem?.(item)}
            />
          ))}
          {shown.length === 0 && (
            <p className="text-body-sm text-text-secondary">
              Nothing on this request matches “{query.trim()}”.
            </p>
          )}
        </div>
      </aside>

      <section className="flex min-h-0 min-w-0 flex-1 flex-col">
        <header className={`${HEADER_BAND} border-b border-border px-8`}>
          <div className="min-w-0">
            <h2 className="truncate text-h5 text-text-primary">{selected.resourceName}</h2>
            {/* The chain's length is only claimable once it is finished — see
                `visibleApprovalLevels`. Until then the header counts what has happened,
                not what is supposed to. */}
            <p className="mt-0.5 truncate text-caption text-text-secondary">
              {[
                'Approval flow',
                approvalFlowComplete(progress.view)
                  ? `${levels.length} ${levels.length === 1 ? 'level' : 'levels'} · complete`
                  : levels.length === 0
                    ? 'not started'
                    : `level ${levels.length} in review`,
              ].join(' · ')}
            </p>
          </div>
        </header>

        {/* The level panel docks beside the flow and below the header, so the header keeps
            saying which line is on the board while a level is open. */}
        {/* `overflow-x-auto` is the release valve for the floor below: the flow keeps a
            readable width and the docked panel keeps its own, and on a window too narrow
            for both the board scrolls sideways rather than crushing the nodes to one word
            a line. It never appears at a width anyone administers from. */}
        <div className="flex min-h-0 flex-1 overflow-x-auto">
          {/* The flow's own ground. White nodes on a white page read as a list; on the
              subtle ground they read as a diagram — the same ground the workflow builder's
              canvas uses, so the two canvases in the product are one idea. */}
          <div className="ds-scroll min-h-0 min-w-[420px] flex-1 overflow-y-auto bg-subtle px-8 py-6">
            <ApprovalFlowCanvas
              progress={progress}
              selectedLevelIndex={levelIndex}
              onSelectLevel={(i) => setLevelIndex((prev) => (prev === i ? null : i))}
            />
          </div>

          <PeekSlot open={Boolean(openLevel)} width={380} flush>
            {openLevel && levelIndex !== null && (
              <LevelDetailPanel
                itemName={selected.resourceName}
                hop={openLevel}
                index={levelIndex}
                progress={progress}
                onClose={() => setLevelIndex(null)}
              />
            )}
          </PeekSlot>
        </div>
      </section>
    </div>
  );
}
