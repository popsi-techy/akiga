'use client';

import * as React from 'react';
import WarningRounded from '@mui/icons-material/WarningRounded';
import { AppIcon } from '@ds/components';
import { RiskScoreChip } from '@/components/product/directory';
import {
  slaSettlement,
  type GovernanceRequestItem,
  type ItemFlowProgress,
} from '@/data/request-governance';
import { ResourceTypeAvatar } from '../labels';
import { FLOW_COLOR, ToneChip, itemOutcome } from './flowVocabulary';

/**
 * One cart line in the rail.
 *
 * Three bands, in the order a reader uses them: **what it is**, **how far it has got**,
 * **where it stands**. The rail's job is to let someone pick the line worth opening, and
 * that decision is made top-down.
 *
 * The previous card had two left edges — the name began at 44px, hung off its mark, while
 * every row under it began at the card's own 16px — so nothing in it lined up with
 * anything else. It also spent four evenly-spaced bands on four facts, one of them a lone
 * chip on a row of its own, which is a form rather than a card: with every band the same
 * height and the same weight, nothing led and the eye had to read all four to find the one
 * it wanted.
 *
 * Now there is one text column hung off one mark, and the bands are unequal on purpose —
 * identity sits tight, then a wider gap, then the two metadata rows.
 *
 * The whole card is the control: a list row that happens to be drawn as a card, so the
 * affordance is the card, not a link inside it.
 */
export function RequestItemCard({
  item,
  progress,
  selected,
  onSelect,
}: {
  item: GovernanceRequestItem;
  progress: ItemFlowProgress;
  selected: boolean;
  onSelect: () => void;
}) {
  const { view, doneCount, total, complete, slaStatus, slaClock } = progress;
  const outcome = itemOutcome(view, slaStatus);
  const tone = outcome.tone;

  /**
   * The line under the name — where the thing lives, and only where that is a real
   * question.
   *
   * An entitlement is defined *inside* one application, so its name is ambiguous without
   * it: "Write" means nothing until you know which system. An application and a technical
   * role are their own names. The same rule the canvas header uses.
   *
   * It briefly carried `resourceDetail` for those two, to give every card a second line
   * and keep a list of them even. That was the wrong trade: the subtitle has about 20
   * characters here, so every role card read "Technical role — mana…" — the same four
   * useless words on each, cut before reaching anything that distinguished them. Cards
   * within one cart are all the same resource type now, so they stay even regardless.
   */
  const subtitle = item.resourceType === 'entitlement' ? item.appName ?? null : null;

  /**
   * The clock, in the same register whether the line is running or done.
   *
   * A running line says how long it has — "51h 8m left", "63h 59m overdue". A finished one
   * used to say "SLA met", which is the raw field name the service-desk tools expose
   * (ServiceNow and Jira Service Management both surface Met/Breached verbatim) and reads
   * as a system value rather than as something that happened. It also broke the pairing:
   * every other state in this slot is a sentence about time.
   *
   * Late is worth saying out loud. A line that landed after its target still landed, and a
   * governance record that only ever reports the good ending is not a record.
   */
  const settlement = complete ? slaSettlement(view) : null;
  const clock = complete
    ? settlement === 'late'
      ? 'Completed late'
      : 'Completed on time'
    : slaClock;

  const slaColor =
    slaStatus === 'breached' || settlement === 'late'
      ? 'var(--ds-color-status-danger-fg)'
      : slaStatus === 'at_risk'
        ? 'var(--ds-color-status-warning-fg)'
        : 'var(--ds-color-text-secondary)';

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-current={selected ? 'true' : undefined}
      className={[
        'w-full rounded-xl border bg-surface p-4 text-left transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-subtle',
        // The brand border is the whole selected signal — a lift as well made the card
        // look like it had left the rail it is a row of.
        selected ? 'border-brand' : 'border-border hover:border-border-strong',
      ].join(' ')}
    >
      {/* 1 — what it is.
          Every mark is a 28px tile, so a column of cards has one silhouette down its left
          edge however the resources differ: a vendor logo inside a hairline for anything
          that belongs to an application, and the amber type tile — the same one the
          request table and the canvas header use — for a technical role, which belongs to
          no single one. A bare 20px glyph beside a bordered logo read as an image that had
          failed to load. */}
      {/* Centred on one line, top-aligned on two. A 28px mark beside a 20px name left the
          name riding high in the row — visibly off against the tile it sits next to. The
          other half of the rule matters just as much: once there is a subtitle the block is
          taller than the mark, and centring would float the mark between the two lines
          instead of setting it against the name it belongs to. */}
      <div
        className={[
          'flex min-w-0 gap-2.5',
          subtitle ? 'items-start' : 'items-center',
        ].join(' ')}
      >
        {item.resourceType === 'role' ? (
          <ResourceTypeAvatar type="role" name={item.resourceName} />
        ) : (
          <AppIcon
            app={item.resourceType === 'application' ? item.resourceName : item.appName}
            logoFrom={item.appType}
            size={28}
            variant="outlined"
          />
        )}

        <div className="min-w-0 flex-1">
          <p
            className="flex min-w-0 items-center gap-1 text-body-medium text-text-primary"
            title={item.resourceName}
          >
            <span className="min-w-0 truncate">{item.resourceName}</span>
            {/* Inline after the name, not a chip of its own: a conflict is a fact about
                *this* resource, and a chip for it cost the name a third of its width. The word is still there for a screen reader. */}
            {view.sodConflict && (
              <span className="inline-flex shrink-0 items-center" title={view.sodSummary ?? 'SoD conflict'}>
                <WarningRounded
                  aria-hidden
                  sx={{ fontSize: 15, color: 'var(--ds-color-status-warning-fill)' }}
                />
                <span className="sr-only">SoD conflict</span>
              </span>
            )}
          </p>
          {subtitle && (
            <p className="mt-0.5 truncate text-caption text-text-secondary" title={subtitle}>
              {subtitle}
            </p>
          )}
        </div>

        {/* Opposite the name, where an attribute of the thing belongs. It sat beside the
            pips for one round, because at a 300px rail the full label left about 100px for
            "Payment Release". The rail is wider now instead: the fix for a chip crowding a
            name is room, not a worse place to put the chip. */}
        <span className="shrink-0">
          <RiskScoreChip score={view.riskScore} />
        </span>
      </div>

      {/* 2 — how far it has got.
          One continuous rule, divided into a segment per lifecycle stage. It is still the
          stages that decide where the colour stops — a line is at a stage, never at 37% of
          one — but the divisions are a change of colour rather than a gap, so the rule
          reads as one object. Spaced apart they read as four loose dashes, and at a 4px
          height the gaps were competing with the fill for attention.

          The fill takes the outcome's colour, so a rail scanned at arm's length and the
          canvas read closely never disagree about which line is in trouble. */}
      <div className="mt-4 flex h-1 overflow-hidden rounded-pill" aria-hidden>
        {Array.from({ length: total }).map((_, i) => (
          <span
            key={i}
            className="h-full flex-1"
            style={{
              background: i < doneCount ? FLOW_COLOR[tone] : 'var(--ds-color-border-subtle)',
            }}
          />
        ))}
      </div>

      {/* 3 — where it stands. Outcome and clock on one baseline: the two facts that decide
          whether this is the line to open. */}
      <div className="mt-3 flex items-center justify-between gap-2">
        <ToneChip tone={tone} label={outcome.label} />
        <span className="shrink-0 tabular-nums text-caption" style={{ color: slaColor }}>
          {clock}
        </span>
      </div>
    </button>
  );
}
