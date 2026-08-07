import * as React from 'react';

/**
 * PlaceholderPage — a calm, premium "not built yet" screen: a real page header
 * plus a centered empty state. Used for persona pages that are intentionally
 * empty for now. Hierarchy from spacing + type, not boxes.
 */
export function PlaceholderPage({
  title,
  subtitle,
  icon,
  emptyTitle,
  emptyMessage,
}: {
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  emptyTitle: string;
  emptyMessage: string;
}) {
  return (
    <div className="mx-auto flex h-full max-w-5xl flex-col">
      <div className="shrink-0">
        <h1 className="text-h2 font-bold tracking-tight text-text-primary">{title}</h1>
        {subtitle && <p className="mt-1 text-body text-text-secondary">{subtitle}</p>}
      </div>
      <div className="flex flex-1 items-center justify-center">
        <div className="flex max-w-sm flex-col items-center gap-3 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-subtle text-icon">{icon}</span>
          <div className="text-h5 font-semibold text-text-primary">{emptyTitle}</div>
          <p className="text-body-sm leading-6 text-text-secondary">{emptyMessage}</p>
        </div>
      </div>
    </div>
  );
}

export default PlaceholderPage;
