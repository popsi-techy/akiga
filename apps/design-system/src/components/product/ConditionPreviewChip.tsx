'use client';

import * as React from 'react';

/**
 * Attribute (secondary) · operator · value (primary, medium) — shared preview
 * typography.
 *
 * The value takes `font-emphasis-soft` (500) rather than a `-medium` type class
 * because the size is the parent's to set: this label sits in a 13px chip on the
 * eligibility card and in a 12px pill in the workflow lane, so pinning a size here
 * would resize one of them.
 */
export function ConditionPreviewLabel({
  attribute,
  operator = '=',
  value,
}: {
  attribute: string;
  operator?: string;
  value: string;
}) {
  return (
    <span className="min-w-0 truncate">
      <span className="text-text-secondary">{attribute}</span>
      <span className="text-text-tertiary">{` ${operator} `}</span>
      <span className="font-emphasis-soft text-text-primary">{value}</span>
    </span>
  );
}

/** Workflow-style condition chip shell with hierarchical attribute / value type. */
export function ConditionPreviewChip({
  attribute,
  operator = '=',
  value,
  className,
}: {
  attribute: string;
  operator?: string;
  value: string;
  className?: string;
}) {
  return (
    <span
      className={[
        'inline-flex max-w-full min-w-0 items-center rounded-md border border-border bg-subtle px-2.5 py-1.5 text-body-sm leading-snug',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <ConditionPreviewLabel attribute={attribute} operator={operator} value={value} />
    </span>
  );
}

export default ConditionPreviewChip;
