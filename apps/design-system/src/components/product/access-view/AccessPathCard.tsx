'use client';

import * as React from 'react';
import ArrowForward from '@mui/icons-material/ArrowForward';
import ChevronRight from '@mui/icons-material/ChevronRight';

/**
 * AccessPathCard — the chooser tile for one access path.
 *
 * The card's job is to make the *shape of the traversal* obvious before the reader
 * commits to it, so the level chain gets its own tinted band rather than being
 * buried in the description. Everything else (title, prose, tags) is ordinary
 * card content ranked by type size.
 */
export function AccessPathCard({
  title,
  levels,
  description,
  tags,
  icon,
  onClick,
  comingSoon = false,
}: {
  title: string;
  /** The traversal, in order — e.g. User Identity → Applications → Accounts. */
  levels: string[];
  description: string;
  tags?: string[];
  icon: React.ReactNode;
  onClick?: () => void;
  /** Render as a non-interactive preview with a "Coming soon" marker. */
  comingSoon?: boolean;
}) {
  const body = (
    <>
      <div className="flex items-start gap-3">
        <span
          aria-hidden
          className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-brand-subtle text-icon-brand"
        >
          {icon}
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="text-h5 font-semibold text-text-primary">{title}</h3>
        </div>
        {comingSoon ? (
          <span className="shrink-0 rounded-pill bg-subtle px-2.5 py-1 text-caption font-semibold text-text-secondary">
            Coming soon
          </span>
        ) : (
          <ArrowForward
            aria-hidden
            sx={{ fontSize: 20 }}
            className="mt-1.5 shrink-0 text-icon transition-transform group-hover:translate-x-0.5 group-hover:text-text-primary"
          />
        )}
      </div>

      {/* The traversal chain — the one thing that distinguishes the paths. */}
      <div className="mt-4 flex flex-wrap items-center gap-x-1.5 gap-y-1 rounded-lg bg-subtle px-3 py-2.5">
        {levels.map((level, i) => (
          <React.Fragment key={level}>
            {i > 0 && <ChevronRight aria-hidden sx={{ fontSize: 15 }} className="text-icon-subtle" />}
            <span className="text-caption font-semibold text-text-primary">{level}</span>
          </React.Fragment>
        ))}
      </div>

      <p className="mt-3.5 text-body-sm leading-6 text-text-secondary">{description}</p>

      {tags && tags.length > 0 && (
        <div className="mt-auto flex flex-wrap items-center gap-1.5 pt-4">
          {tags.map((t) => (
            <span
              key={t}
              className="rounded-pill border border-border bg-surface px-2.5 py-1 text-caption font-medium text-text-secondary"
            >
              {t}
            </span>
          ))}
        </div>
      )}
    </>
  );

  const shell = 'flex h-full flex-col rounded-xl border border-border bg-surface p-5 text-left';

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
