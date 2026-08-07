'use client';

import * as React from 'react';

/**
 * Shared configuration-panel primitives for the Automation builders.
 * Hierarchy comes from quiet group labels, hairline dividers, and vertical
 * rhythm — not bordered boxes or bold text. Keep field labels medium/muted;
 * reserve the one strong weight for node/panel titles.
 */

/** Quiet uppercase micro-label that opens a group. */
export function GroupLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-3 text-caption font-semibold uppercase tracking-[0.07em] text-text-tertiary">
      {children}
    </div>
  );
}

/** A configuration group: optional label + content, separated by a hairline. */
export function ConfigSection({
  label,
  first,
  children,
}: {
  label?: React.ReactNode;
  first?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section className={first ? 'pb-5' : 'border-t border-border py-5'}>
      {label && <GroupLabel>{label}</GroupLabel>}
      {children}
    </section>
  );
}

/** Medium, muted field label (never semibold). */
export function FieldLabel({ children }: { children: React.ReactNode }) {
  return <div className="mb-1.5 text-body-sm font-medium text-text-secondary">{children}</div>;
}

/** Muted helper line under a control. */
export function Hint({ children }: { children: React.ReactNode }) {
  return <p className="mt-2 text-caption leading-5 text-text-tertiary">{children}</p>;
}

/** Calm empty state (replaces dashed placeholder boxes). */
export function EmptyState({
  icon,
  title,
  message,
}: {
  icon?: React.ReactNode;
  title: string;
  message: string;
}) {
  return (
    <div className="flex flex-col items-center gap-2 px-4 py-12 text-center">
      {icon && (
        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-subtle text-icon">
          {icon}
        </span>
      )}
      <div className="text-body-sm font-medium text-text-primary">{title}</div>
      <p className="max-w-[220px] text-caption leading-5 text-text-secondary">{message}</p>
    </div>
  );
}
