'use client';

import * as React from 'react';
import SearchOutlined from '@mui/icons-material/SearchOutlined';
import { AppIcon, Input, PeekSlot, ProgressRing, StatusChip } from '@ds/components';
import { RiskScoreChip } from '@/components/product/directory';
import { ResourceTypeAvatar } from '../labels';
import { ToneChip, itemOutcome, worstOutcome } from './flowVocabulary';
import {
  RESOURCE_TYPE_LABEL,
  RESOURCE_TYPE_PLURAL,
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
const HEADER_BAND = 'flex h-16 shrink-0';

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

  /**
   * Every line's progress, read once.
   *
   * The count, the segment line and the cards all want it, and calling
   * `itemFlowProgress` per consumer walked the cart three times for one answer — which is
   * also how three places start disagreeing about whether a line is done.
   */
  const flow = React.useMemo(
    () => new Map(items.map((i) => [i.id, itemFlowProgress(row, i)])),
    [items, row],
  );
  const progress = selected ? flow.get(selected.id) ?? null : null;
  const inFlight = items.filter((i) => !flow.get(i.id)?.complete).length;

  /**
   * One cart, one kind of thing — so the rail names it once, in its heading, instead of
   * repeating it on every card below. A cart holding more than one kind falls back to the
   * generic noun, because a heading that names only the first line's type would be wrong
   * about the rest.
   */
  const types = new Set(items.map((i) => i.resourceType));
  const railHeading =
    types.size === 1
      ? `Requested ${RESOURCE_TYPE_PLURAL[items[0].resourceType].toLowerCase()}`
      : 'Requested items';

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

  // Entitlements only. An entitlement is defined *inside* one application, so its name is
  // ambiguous without it — "Write" means nothing until you know which system. A technical
  // role bundles access that can span applications, so prefixing it with one of them would
  // claim a scope it does not have, and an application is its own name.
  const parentApp = selected.resourceType === 'entitlement' ? selected.appName ?? null : null;
  // A cart of one has nothing to search and nothing to group, so the rail keeps neither
  // the field nor the section labels — and the title band then owns the closing rule.
  const searchable = items.length > 1;

  /**
   * The cart's worst condition, for the band above the list — but only when it is worse
   * than simply waiting, which the count beside it already says.
   */
  const worst = worstOutcome(
    items.map((i) => {
      const p = flow.get(i.id)!;
      return itemOutcome(p.view, p.slaStatus);
    }),
  );
  const alarm = worst && (worst.tone === 'failed' || worst.tone === 'breached' || worst.tone === 'risk')
    ? worst
    : null;
  const allDone = inFlight === 0;

  const card = (item: GovernanceRequestItem) => (
    <RequestItemCard
      key={item.id}
      item={item}
      progress={flow.get(item.id)!}
      selected={item.id === selected.id}
      onSelect={() => onSelectItem?.(item)}
    />
  );

  const levels = visibleApprovalLevels(progress.view);
  const openLevel = levelIndex === null ? null : levels[levelIndex] ?? null;

  return (
    /* Full-bleed out of the shell's page gutter. The board is a docked split, not a pair
       of cards on a page: the rule between the columns is the only edge either of them
       needs, and giving each one a border and a 20px gutter as well spent ~60px of the
       canvas on chrome that said nothing. */
    <div className="-mx-8 -mt-5 flex h-[calc(100%+var(--ds-space-5))] min-h-0">
      {/*
        * Measured in the page, not computed on paper — the arithmetic came out 4px light
        * twice. A card's title row spends 209px of the rail before a letter is drawn: the
        * rail's 24px gutters, the card's 16px padding, the 28px mark, the gaps either side
        * of the text, and the widest risk chip, "Critical (88)" at 79. The catalogue's
        * longest name, "Production Administrator", is 169 at `text-body-strong`, which
        * puts the floor at 378. 380 is that with room, and 400 gives the next long name
        * somewhere to go.
        *
        * 300 was the floor from when the card carried no risk chip on that row. Keeping it
        * and shrinking the chip instead traded the name — the one thing the rail exists to
        * show — for a fact that had nowhere better to be.
        *
        * `xl` rather than a viewport guess: this rail sits beside the app sidebar and the
        * canvas, so what matters is the container, not the window.
        */}
      <aside className="flex min-h-0 w-[380px] shrink-0 flex-col border-r border-border xl:w-[400px]">
        {/*
          * Band one — what this list is.
          *
          * A real heading, not a third grey overline. The band used to stack an overline,
          * a caption and a rule at the same 12px weight, so nothing in it led and the
          * reader had three quiet lines to sort through before reaching the cards. The
          * name now carries the weight, the count hangs under it, and the overline is
          * freed for the level below — the section labels inside the list — which is what
          * makes those read as subordinate to this rather than as its equals.
          *
          * Same 64px as the canvas header, so the two columns still open level.
          */}
        <div
          className={[
            HEADER_BAND,
            'flex-col justify-center px-6',
            searchable ? '' : 'border-b border-border',
          ].join(' ')}
        >
          {/* Name left, tally right — the two halves of "what is in here". The count used
              to hang under the heading, which made the band a stack of three left-aligned
              lines with nothing to stop on; opposite the name it reads as the heading's
              answer. */}
          <div className="flex items-center justify-between gap-3">
            <h2 className="min-w-0 truncate text-body-sm-strong text-text-primary">
              {railHeading}
            </h2>

            <span
              className="flex shrink-0 items-center gap-1.5 text-caption text-text-secondary"
              // The ring's track and its completion tick inherit `currentColor`. Neutral
              // while work is outstanding, so the grey track reads as "not yet" and only
              // the arc carries colour; green once the cart is done, which is what turns
              // the ring's closing tick green rather than leaving it a grey mark on a
              // finished list.
              style={allDone ? { color: 'var(--ds-color-status-success-fill)' } : undefined}
            >
              <ProgressRing
                value={items.length - inFlight}
                total={items.length}
                size={16}
                accent="var(--ds-color-status-success-fill)"
              />
              {/* How much is left, against how much there is. "2 items · 1 in flight" made
                  the reader subtract to learn the thing they came for; the ratio says it
                  outright, and the denominator is still the total. */}
              {inFlight > 0
                ? `${inFlight} of ${items.length} pending`
                : `${items.length === 1 ? '1' : items.length} completed`}
            </span>
          </div>

          {/*
            * The one thing this band can say that the cards cannot: whether anything in
            * the list is in trouble.
            *
            * On its own line because the row above is full, and because an alarm earns a
            * line. Only when it is worse than waiting — a chip saying "Pending" beside a
            * sentence saying "2 of 2 pending" would be the same fact twice, and a band
            * that always carries a chip stops meaning anything when it does.
            */}
          {alarm && (
            <div className="mt-1.5 flex">
              <ToneChip tone={alarm.tone} label={alarm.label} />
            </div>
          )}
        </div>

        {/*
          * Band two — what you can do to the list, closed by the rule that starts it.
          *
          * The search was floating between the title and the cards with nothing either
          * side of it, so the rail was one undivided column of small grey things. The rule
          * goes *under* the control, not over it: above, it would be a second separator
          * for a boundary the change of weight already draws.
          */}
        {searchable && (
          <div className="shrink-0 border-b border-border px-6 pb-4">
            <Input
              placeholder="Search items"
              aria-label="Search requested items"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              startAdornment={<SearchOutlined sx={{ fontSize: 18 }} />}
            />
          </div>
        )}

        <div className="ds-scroll min-h-0 flex-1 overflow-y-auto px-6 py-5">
          {/* One column, in the order the cart was filed. Splitting it under "Pending" and
              "Completed" headings cut a two-card rail into two one-card lists, which is
              more structure than a cart of this size has in it — each card already says
              its own state, and the band above says how many are left. */}
          <div className="flex flex-col gap-3">{shown.map(card)}</div>

          {shown.length === 0 && (
            <p className="text-body-sm text-text-secondary">
              Nothing on this request matches “{query.trim()}”.
            </p>
          )}
        </div>
      </aside>

      <section className="flex min-h-0 min-w-0 flex-1 flex-col">
        {/* Chips sit against the name, not at the far edge: they qualify it, and a header
            that pushes them to the right reads as two unrelated things on one line. */}
        <header className={`${HEADER_BAND} items-center gap-2.5 border-b border-border px-8`}>
          {/* An application and an entitlement both belong to a vendor, so they wear its
              logo — the same mark the reader already knows from the catalogue. `surface`
              rather than the default tile: this band is white, so the logo sits on the
              header rather than in a box of its own.

              A technical role belongs to no single application, so there is no logo to
              wear. It takes the tile the request table gives it — the glyph on its amber
              ground — rather than a bare glyph, which on a white band read as an
              unfinished image slot beside the vendor marks it alternates with. */}
          {selected.resourceType === 'role' ? (
            <ResourceTypeAvatar type="role" name={selected.resourceName} />
          ) : (
            <AppIcon
              app={selected.resourceType === 'application' ? selected.resourceName : selected.appName}
              logoFrom={selected.appType}
              size={22}
              variant="surface"
            />
          )}
          {/* Where the entitlement lives leads, and the entitlement follows it. The app is
              set in the secondary colour: it is the address, not the protagonist — the
              reader came for PROD_DEPLOY, GitHub only says where to find it. */}
          <h2 className="max-w-full truncate text-h5 text-text-primary">
            {parentApp && (
              <>
                <span className="text-text-secondary">{parentApp}</span>
                <span aria-hidden className="text-text-tertiary">
                  {' – '}
                </span>
              </>
            )}
            {selected.resourceName}
          </h2>
          {/* What kind of thing it is, and how risky. The type tag takes §5.2's taxonomy
              tint — `info`, dotless, so it inherits the chip's verified contrast rather
              than becoming a local pill. It sits in the header band, above the rule and
              away from the level chips on the canvas, which is what keeps blue readable
              as "a kind of thing" here. The risk chip is a status object and keeps its
              ramp. */}
          <div className="flex shrink-0 items-center gap-1.5">
            <StatusChip intent="info" dot={false} label={RESOURCE_TYPE_LABEL[selected.resourceType]} />
            <RiskScoreChip score={progress.view.riskScore} />
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
