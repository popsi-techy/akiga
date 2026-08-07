'use client';

import * as React from 'react';

/** Attribute (secondary) · operator · value (primary medium) — shared preview typography. */
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
      <span className="font-medium text-text-primary">{value}</span>
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
