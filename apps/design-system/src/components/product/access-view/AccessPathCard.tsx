'use client';

import * as React from 'react';
import ArrowForward from '@mui/icons-material/ArrowForward';
import ChevronRight from '@mui/icons-material/ChevronRight';
import { StatusChip } from '@ds/components';

export interface AccessPathLevel {
  label: string;
  /** 14px outlined glyph naming the entity at this level. */
  icon: React.ReactNode;
}

/**
 * AccessPathCard — the chooser tile for one access path.
 *
 * The card's job is to make the *shape of the traversal* obvious before the reader
 * commits to it, so the level chain is the middle of the three tiers and gets its own
 * band. That band is dash-bordered on purpose: a solid fill would read as content the
 * reader can act on, where this is a route diagram — a description of where the path
 * will take them.
 *
 * Three tiers, nothing more (visual-language §4: three type levels per region):
 * title → chain → prose, with the tags as a quiet footer.
 */
export function AccessPathCard({
  title,
  levels,
  description,
  tags,
  onClick,
  comingSoon = false,
}: {
  title: string;
  /** The traversal, in order — e.g. User Identity → Applications → Accounts. */
  levels: AccessPathLevel[];
  description: string;
  tags?: string[];
  onClick?: () => void;
  /** Render as a non-interactive preview with a "Coming soon" marker. */
  comingSoon?: boolean;
}) {
  const body = (
    <>
      <div className="flex items-start gap-3">
        <h3 className="min-w-0 flex-1 text-h4 text-text-primary">{title}</h3>
        {comingSoon ? (
          <span className="mt-1 shrink-0 rounded-pill bg-subtle px-2.5 py-1 text-caption-strong text-text-secondary">
            Coming soon
          </span>
        ) : (
          <ArrowForward
            aria-hidden
            sx={{ fontSize: 18 }}
            className="mt-1 shrink-0 text-icon transition-transform group-hover:translate-x-0.5 group-hover:text-text-primary"
          />
        )}
      </div>

      {/* The traversal — the one thing that distinguishes the paths. */}
      {/* Caption-scale, not body-scale: this is a diagram of a route, and at 13px a
          four-level chain cannot hold one line inside a half-width card. Reading it as
          one line is the whole point, so the type gives way, not the layout. */}
      <div className="mt-4 flex flex-wrap items-center gap-x-1.5 gap-y-1.5 rounded-md border border-dashed border-border-strong px-3 py-2.5">
        {levels.map((level, i) => (
          <React.Fragment key={level.label}>
            {i > 0 && <ChevronRight aria-hidden sx={{ fontSize: 14 }} className="text-icon-subtle" />}
            <span className="inline-flex items-center gap-1">
              <span aria-hidden className="grid shrink-0 place-items-center text-icon">
                {level.icon}
              </span>
              <span className="whitespace-nowrap text-caption-strong text-text-primary">
                {level.label}
              </span>
            </span>
          </React.Fragment>
        ))}
      </div>

      <p className="mt-4 text-body leading-6 text-text-secondary">{description}</p>

      {tags && tags.length > 0 && (
        <div className="mt-auto flex flex-wrap items-center gap-2 pt-4">
          {/* Info-tinted, not grey: these name the *kinds of thing* the path traverses.
              Blue reads as "entity type" here unambiguously because the chooser shows
              no status chips — the constraint the visual language sets on taxonomy
              tinting (§5.2). `StatusChip` rather than a local pill, so the tag tracks
              the system's chip shape, type step, and verified contrast. */}
          {tags.map((t) => (
            <StatusChip key={t} intent="info" dot={false} label={t} />
          ))}
        </div>
      )}
    </>
  );

  // `text-body` is explicit: the interactive variant is a <button>, whose browser
  // default font-size is 13.33px — off our scale, and inherited by anything inside
  // that does not set its own size.
  const shell = 'flex h-full flex-col rounded-lg border border-border bg-surface p-5 text-left text-body';

  if (comingSoon) {
    return <div className={shell}>{body}</div>;
  }
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group ${shell} transition-all hover:border-border-strong hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-subtle`}
    >
      {body}
    </button>
  );
}

export default AccessPathCard;
