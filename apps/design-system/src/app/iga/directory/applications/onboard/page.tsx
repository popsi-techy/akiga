'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import SearchOutlined from '@mui/icons-material/SearchOutlined';
import { AppIcon, Input, NavList, StatusChip, resolveAppIcon } from '@ds/components';
import { AddApplicationDrawer } from '@/components/product/directory';
import { AtmosphericBackground } from '@/components/atmosphere/AtmosphericBackground';
import { useSetBreadcrumbs } from '@/lib/breadcrumb';
import {
  appTypeCategories,
  appTypeMatches,
  getCustomAppType,
  listAppTypes,
  type AppTypeOption,
  type AppTypeCategory,
} from '@/data/app-types';

/** One-line support under the section name — short enough to sit beside it. */
const CATEGORY_LINE: Record<AppTypeCategory, string> = {
  application: 'Onboard a business app directly',
  iam: 'Discover many apps at once',
  pam: 'Privileged and break-glass access',
};

/**
 * Onboard an application — the application-type catalog.
 *
 * Same frame as the workflow template catalog: atmospheric search banner,
 * category rail that jumps, then a grid of type tiles. Clicking a tile opens
 * the onboard drawer; custom lives under the search as the blank-canvas exit.
 */
export default function OnboardApplicationPage() {
  useSetBreadcrumbs([
    { label: 'Applications', href: '/iga/directory/applications' },
    { label: 'Onboard' },
  ]);

  const router = useRouter();
  const [picked, setPicked] = React.useState<AppTypeOption | null>(null);
  const [query, setQuery] = React.useState('');
  const [active, setActive] = React.useState<AppTypeCategory>('application');

  const scroller = React.useRef<HTMLDivElement>(null);
  const sections = React.useRef(new Map<AppTypeCategory, HTMLElement>());

  const all = listAppTypes();
  const custom = getCustomAppType();
  const matched = all.filter((t) => appTypeMatches(t, query));
  const catalog = matched.filter((t) => t.id !== 'at-custom');
  const byCategory = (id: AppTypeCategory) => catalog.filter((t) => t.category === id);
  const visibleCategories = appTypeCategories.filter((cat) => byCategory(cat.id).length > 0);

  const jumpTo = (id: AppTypeCategory) => {
    setActive(id);
    const el = sections.current.get(id);
    const box = scroller.current;
    if (!el || !box) return;
    box.scrollTo({ top: el.offsetTop - box.offsetTop, behavior: 'smooth' });
  };

  /**
   * Whichever section header has passed the top most recently — except at the
   * very bottom, where the last section is selected outright. Without that
   * clamp the trailing sections are unreachable whenever the catalog only just
   * overflows: there is not enough scroll left to push their headers up.
   */
  const onScroll = () => {
    const box = scroller.current;
    if (!box) return;
    const atBottom = box.scrollTop + box.clientHeight >= box.scrollHeight - 2;
    let current = visibleCategories[0]?.id;
    if (atBottom) {
      current = visibleCategories[visibleCategories.length - 1]?.id;
    } else {
      for (const cat of visibleCategories) {
        const el = sections.current.get(cat.id);
        if (el && el.offsetTop - box.offsetTop <= box.scrollTop + 24) current = cat.id;
      }
    }
    if (current && current !== active) setActive(current);
  };

  const pick = (t: AppTypeOption) => {
    if (t.status === 'coming-soon') return;
    setPicked(t);
  };

  const q = query.trim();

  return (
    <div className="-mx-8 -my-6 flex h-[calc(100%+3rem)] flex-col">
      <header className="relative shrink-0 overflow-hidden border-b border-border px-6 py-7">
        <AtmosphericBackground />
        <div className="relative mx-auto flex w-full max-w-2xl flex-col items-center text-center">
          <h1 className="text-balance text-h3 text-text-primary">
            Start onboarding faster with ready-to-use application types
          </h1>
          <div className="mt-3 w-full max-w-xl">
            <Input
              placeholder="Search by name or protocol…"
              aria-label="Search application types"
              size="md"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              startAdornment={<SearchOutlined sx={{ fontSize: 18 }} />}
            />
          </div>
          <p className="mt-2.5 text-body-sm text-text-secondary">
            Have a system we don&apos;t list?{' '}
            <button
              type="button"
              className="text-body-sm-medium text-text-link hover:underline"
              onClick={() => pick(custom)}
            >
              Start with a custom application
            </button>
          </p>
        </div>
      </header>

      <div className="flex min-h-0 min-w-0 flex-1 gap-5 px-6 py-5">
        <aside className="flex w-56 shrink-0 flex-col rounded-xl border border-border bg-surface px-3 py-4">
          <h2 className="mb-3 px-1 text-overline uppercase text-text-tertiary">Categories</h2>
          <NavList
            ariaLabel="Application type"
            value={active}
            onChange={(id) => jumpTo(id as AppTypeCategory)}
            items={appTypeCategories.map((cat) => ({
              id: cat.id,
              label: cat.label,
              count: byCategory(cat.id).length,
            }))}
          />
        </aside>

        <div
          ref={scroller}
          onScroll={onScroll}
          className="ds-scroll min-h-0 min-w-0 flex-1 overflow-y-auto"
        >
          {catalog.length === 0 && q ? (
            <p className="text-body-sm text-text-secondary">
              “{q}” isn’t in the catalog yet. It will be present shortly — until then, use a custom
              application.
            </p>
          ) : (
            <div className="flex flex-col gap-8">
              {visibleCategories.map((cat) => (
                <section
                  key={cat.id}
                  ref={(el) => {
                    if (el) sections.current.set(cat.id, el);
                    else sections.current.delete(cat.id);
                  }}
                >
                  <div className="flex min-w-0 items-baseline gap-2">
                    <h2 className="shrink-0 text-h5 text-text-primary">{cat.label}</h2>
                    <p className="min-w-0 truncate text-caption text-text-tertiary">
                      {CATEGORY_LINE[cat.id]}
                    </p>
                  </div>
                  <div className="mt-4 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                    {byCategory(cat.id).map((t) => (
                      <AppTypeTile key={t.id} appType={t} onSelect={pick} />
                    ))}
                  </div>
                </section>
              ))}
            </div>
          )}
        </div>
      </div>

      <AddApplicationDrawer
        open={picked !== null}
        appType={picked}
        onClose={() => setPicked(null)}
        onCreated={(id) => router.push(`/iga/directory/applications/${id}`)}
      />
    </div>
  );
}

/**
 * One catalog tile. Brand types lead with their logo; everything else gets a
 * small identification mark so a letter tile is not the only fallback. A
 * coming-soon type stays in place — knowing it is on the way is the answer to
 * "can I onboard this?" — but it recedes and stops being a control.
 */
function AppTypeTile({
  appType,
  onSelect,
}: {
  appType: AppTypeOption;
  onSelect: (t: AppTypeOption) => void;
}) {
  const soon = appType.status === 'coming-soon';
  return (
    <button
      type="button"
      disabled={soon}
      onClick={() => onSelect(appType)}
      className={[
        'flex flex-col items-start gap-2.5 rounded-xl border p-4 text-left transition-all',
        soon
          ? 'cursor-default border-border bg-subtle'
          : 'border-border bg-surface hover:border-border-strong hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-subtle',
      ].join(' ')}
    >
      <span className="flex w-full items-start justify-between gap-2">
        <TypeMark name={appType.name} size={40} muted={soon} />
        {soon && (
          <span className="shrink-0 text-caption-strong uppercase tracking-wider text-text-tertiary">
            Soon
          </span>
        )}
      </span>
      <h3 className={`w-full min-w-0 truncate text-body-strong ${soon ? 'text-text-tertiary' : 'text-text-primary'}`}>
        {appType.name}
      </h3>
      <span className="flex flex-wrap gap-1">
        {appType.protocols.map((p) =>
          soon ? (
            <span key={p} className="rounded-pill bg-surface px-2 py-0.5 text-caption text-text-tertiary">
              {p}
            </span>
          ) : (
            <StatusChip key={p} intent="info" label={p} dot={false} />
          ),
        )}
      </span>
    </button>
  );
}

/** Brand logo when we have one; identification mark when we don't. Same footprint. */
function TypeMark({ name, size, muted }: { name: string; size: number; muted?: boolean }) {
  if (resolveAppIcon(name)) {
    return (
      <span className={muted ? 'opacity-50' : undefined}>
        <AppIcon app={name} size={size} />
      </span>
    );
  }
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-lg ${
        muted ? 'bg-surface text-icon-subtle' : 'bg-subtle text-icon'
      }`}
      style={{ width: size, height: size }}
      title={name}
    >
      <TypeGlyph name={name} size={Math.round(size * 0.58)} />
    </span>
  );
}

/**
 * Tiny identification marks for types without a brand logo. These are wayfinding,
 * not decoration — they replace the letter tile so Custom, SCIM, a directory, and
 * a vault can be told apart at a glance.
 */
function TypeGlyph({ name, size }: { name: string; size: number }) {
  const kind = glyphKind(name);
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      {kind === 'custom' && (
        <>
          <rect x="2" y="2" width="9" height="9" rx="2" fill="currentColor" opacity="0.35" />
          <rect x="13" y="2" width="9" height="9" rx="2" fill="currentColor" opacity="0.18" />
          <rect x="2" y="13" width="9" height="9" rx="2" fill="currentColor" opacity="0.18" />
          <rect x="13" y="13" width="9" height="9" rx="2" stroke="currentColor" strokeWidth="1.5" strokeDasharray="2 2" />
          <path d="M17.5 15.5v5M15 18h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </>
      )}
      {kind === 'scim' && (
        <>
          <rect x="2" y="5" width="8" height="14" rx="2" stroke="currentColor" strokeWidth="1.5" />
          <rect x="14" y="5" width="8" height="14" rx="2" stroke="currentColor" strokeWidth="1.5" />
          <path
            d="M11 9h2.5M13.5 9l-1.5-1.5M13.5 9 12 10.5M13 15H10.5M10.5 15l1.5 1.5M10.5 15 12 13.5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </>
      )}
      {kind === 'directory' && (
        <>
          <circle cx="12" cy="5.5" r="2.5" stroke="currentColor" strokeWidth="1.5" />
          <circle cx="5.5" cy="18" r="2.5" stroke="currentColor" strokeWidth="1.5" />
          <circle cx="18.5" cy="18" r="2.5" stroke="currentColor" strokeWidth="1.5" />
          <path d="M12 8v3.5M12 11.5H5.5V15.5M12 11.5h6.5V15.5" stroke="currentColor" strokeWidth="1.5" />
        </>
      )}
      {kind === 'vault' && (
        <>
          <rect x="5" y="10" width="14" height="11" rx="2" stroke="currentColor" strokeWidth="1.5" />
          <path d="M8 10V8a4 4 0 0 1 8 0v2" stroke="currentColor" strokeWidth="1.5" />
          <circle cx="12" cy="15.5" r="1.25" fill="currentColor" />
        </>
      )}
      {kind === 'generic' && (
        <rect x="4" y="4" width="16" height="16" rx="3" stroke="currentColor" strokeWidth="1.5" />
      )}
    </svg>
  );
}

function glyphKind(name: string): 'custom' | 'scim' | 'directory' | 'vault' | 'generic' {
  const n = name.toLowerCase();
  if (n.includes('custom')) return 'custom';
  if (n.includes('scim')) return 'scim';
  if (n.includes('directory') || n.includes('entra')) return 'directory';
  if (n.includes('cyberark') || n.includes('vault')) return 'vault';
  return 'generic';
}
