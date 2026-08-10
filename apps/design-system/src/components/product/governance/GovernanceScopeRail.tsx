'use client';

import * as React from 'react';
import KeyboardDoubleArrowLeft from '@mui/icons-material/KeyboardDoubleArrowLeft';
import KeyboardDoubleArrowRight from '@mui/icons-material/KeyboardDoubleArrowRight';
import SummarizeOutlined from '@mui/icons-material/SummarizeOutlined';
import { kindIcon } from './entity-visuals';
import {
  DOMAIN_KINDS,
  DOMAIN_LABEL,
  KIND_LABEL,
  type GovDomain,
  type GovEntityKind,
} from '@/data/governance-types';

const DOMAINS: GovDomain[] = ['organization', 'access', 'policies', 'governance'];

/**
 * The governance domains, and the entity kinds inside each.
 *
 * One rail for both views, which is what makes the scope survive a view switch:
 * choosing "Applications" here decides what the Explorer lists *and* what the Map
 * is allowed to draw. Counts are of entities that pass the current filters, so the
 * rail doubles as the answer to "did my filter actually match anything?".
 */
export function GovernanceScopeRail({
  counts,
  activeKind,
  onSelectKind,
  collapsed,
  onToggleCollapsed,
  onOpenSummary,
}: {
  counts: Record<GovEntityKind, { total: number; findings: number }>;
  activeKind: GovEntityKind | null;
  onSelectKind: (kind: GovEntityKind | null) => void;
  collapsed: boolean;
  onToggleCollapsed: () => void;
  onOpenSummary: () => void;
}) {
  if (collapsed) {
    return (
      <div className="flex w-11 shrink-0 flex-col items-center border-r border-border bg-surface pt-3">
        <button
          type="button"
          onClick={onToggleCollapsed}
          aria-label="Expand governance scope"
          className="grid h-7 w-7 place-items-center rounded text-icon transition-colors hover:bg-surface-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-subtle"
        >
          <KeyboardDoubleArrowRight sx={{ fontSize: 18 }} />
        </button>
      </div>
    );
  }

  return (
    <div className="flex w-[236px] shrink-0 flex-col border-r border-border bg-surface">
      <div className="flex shrink-0 items-center justify-between px-4 py-3">
        <span className="text-overline uppercase text-text-tertiary">Governance domains</span>
        <button
          type="button"
          onClick={onToggleCollapsed}
          aria-label="Collapse governance scope"
          className="grid h-6 w-6 place-items-center rounded text-icon transition-colors hover:bg-surface-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-subtle"
        >
          <KeyboardDoubleArrowLeft sx={{ fontSize: 18 }} />
        </button>
      </div>

      <div className="ds-scroll min-h-0 flex-1 overflow-y-auto px-2 pb-3">
        <button
          type="button"
          onClick={() => onSelectKind(null)}
          aria-pressed={activeKind === null}
          className={[
            'mb-2 flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-body-sm transition-colors',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-subtle',
            activeKind === null ? 'bg-surface-selected text-text-brand' : 'text-text-secondary hover:bg-surface-hover hover:text-text-primary',
          ].join(' ')}
        >
          Everything
        </button>

        {DOMAINS.map((domain) => (
          <div key={domain} className="mb-3">
            <div className="mb-1 px-2 text-overline uppercase text-text-tertiary">{DOMAIN_LABEL[domain]}</div>
            <ul className="space-y-0.5">
              {DOMAIN_KINDS[domain].map((kind) => {
                const Icon = kindIcon(kind);
                const active = activeKind === kind;
                const c = counts[kind];
                return (
                  <li key={kind}>
                    <button
                      type="button"
                      onClick={() => onSelectKind(active ? null : kind)}
                      aria-pressed={active}
                      className={[
                        'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left transition-colors',
                        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-subtle',
                        active ? 'bg-surface-selected' : 'hover:bg-surface-hover',
                      ].join(' ')}
                    >
                      <Icon sx={{ fontSize: 16 }} />
                      <span className={['min-w-0 flex-1 truncate text-body-sm', active ? 'text-text-brand' : 'text-text-primary'].join(' ')}>
                        {KIND_LABEL[kind].many}
                      </span>
                      {c.findings > 0 && (
                        <span
                          title={`${c.findings} governance ${c.findings === 1 ? 'finding' : 'findings'}`}
                          aria-hidden
                          className="h-1.5 w-1.5 shrink-0 rounded-pill"
                          style={{ background: 'var(--ds-color-status-danger-fill)' }}
                        />
                      )}
                      <span className="shrink-0 text-caption tabular-nums text-text-tertiary">{c.total}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>

      <div className="shrink-0 border-t border-border p-2">
        <button
          type="button"
          onClick={onOpenSummary}
          className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-body-sm text-text-secondary transition-colors hover:bg-surface-hover hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-subtle"
        >
          <SummarizeOutlined sx={{ fontSize: 16 }} />
          Model summary
        </button>
      </div>
    </div>
  );
}
