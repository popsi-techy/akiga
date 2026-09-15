'use client';

import * as React from 'react';
import Link from 'next/link';

/**
 * The way out of a row — blue, per §5.1a, never the brand orange.
 *
 * One definition because there were already two: the reconciliation cards had it as a
 * button, Needs attention as a Next `Link`, and both carried the same seven classes by
 * hand. A third copy was about to appear on the overview's inventory card, which is where
 * a treatment stops being a coincidence and starts being a component.
 *
 * It renders whichever element the job needs — an anchor when there is somewhere to go, a
 * button when there is something to open — because those are genuinely different controls
 * and a link that is really a button breaks middle-click and keyboard expectations.
 */
const ROW_LINK_CLASS =
  'shrink-0 rounded-sm text-body-sm-medium text-text-link hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-subtle';

export function RowLink({
  href,
  onClick,
  children,
}: {
  /** Somewhere to navigate. Renders an anchor. */
  href?: string;
  /** Something to open in place. Renders a button. */
  onClick?: () => void;
  children: React.ReactNode;
}) {
  if (href) {
    return (
      <Link href={href} className={ROW_LINK_CLASS}>
        {children}
      </Link>
    );
  }
  return (
    <button type="button" onClick={onClick} className={ROW_LINK_CLASS}>
      {children}
    </button>
  );
}

/** A row's reading and the control that opens it, on one baseline. */
export function RowValue({ children }: { children: React.ReactNode }) {
  return <span className="flex min-w-0 items-center justify-between gap-3">{children}</span>;
}
