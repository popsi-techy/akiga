'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import SearchOutlined from '@mui/icons-material/SearchOutlined';
import { AppIcon, Input, NavList } from '@ds/components';
import { AddApplicationDrawer } from '@/components/product/directory';
import { useSetBreadcrumbs } from '@/lib/breadcrumb';
import {
  appTypeCategories,
  appTypeMatches,
  getCustomAppType,
  listAppTypes,
  type AppTypeOption,
  type AppTypeCategory,
} from '@/data/app-types';

/**
 * Onboard an application — the application-type catalog.
 *
 * A full-bleed mode rather than a page inside the list: picking a type is the
 * whole job here, and the topbar breadcrumb is the way back.
 *
 * The rail jumps and tracks rather than filters. A type catalog is browsed as
 * much as it is searched, so hiding two thirds of it behind a category click
 * would cost more than it saves — the rail scrolls you there and then follows
 * you if you keep scrolling.
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
  const matched = all.filter((t) => appTypeMatches(t, query));
  const byCategory = (id: AppTypeCategory) => matched.filter((t) => t.category === id);
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

  return (
    <div className="-mx-8 -my-6 flex h-[calc(100%+3rem)]">
      <aside className="flex w-[264px] shrink-0 flex-col gap-3 border-r border-border bg-surface px-4 py-5">
        <p className="px-1 text-caption-strong uppercase tracking-wider text-text-tertiary">Type</p>
        <NavList
          ariaLabel="Application type"
          value={active}
          onChange={(id) => jumpTo(id as AppTypeCategory)}
          items={appTypeCategories.map((cat) => ({
            id: cat.id,
            label: cat.label,
            // Counts follow the search, so the rail never promises tiles that
            // the current query has already removed from the grid.
            count: byCategory(cat.id).length,
          }))}
        />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="shrink-0 border-b border-border px-6 pb-5 pt-5">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h1 className="text-h4 text-text-primary">Select an application type</h1>
            <p className="text-body-sm text-text-secondary">
              Choose from the catalog or build a custom integration.
            </p>
          </div>
          <div className="mt-4 w-full max-w-sm">
            <Input
              placeholder="Search application types…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              startAdornment={<SearchOutlined sx={{ fontSize: 18 }} />}
            />
          </div>
        </div>

        <div ref={scroller} onScroll={onScroll} className="ds-scroll min-h-0 flex-1 overflow-y-auto px-6 py-6">
          {visibleCategories.length === 0 ? (
            <CatalogSearchMiss query={query.trim()} onSelect={pick} />
          ) : (
            <div className="flex flex-col gap-8">
              {visibleCategories.map((cat, i) => (
                <section
                  key={cat.id}
                  ref={(el) => {
                    if (el) sections.current.set(cat.id, el);
                    else sections.current.delete(cat.id);
                  }}
                  className={i > 0 ? 'border-t border-border pt-8' : undefined}
                >
                  <div className="flex flex-wrap items-baseline gap-3">
                    <h2 className="text-h5 text-text-primary">{cat.label}</h2>
                    <p className="text-body-sm text-text-secondary">{cat.description}</p>
                  </div>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
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
        // Straight to the detail: an application with no accounts or owners is
        // not finished, and its empty tabs are the next thing to act on.
        onCreated={(id) => router.push(`/iga/directory/applications/${id}`)}
      />
    </div>
  );
}

/**
 * Search found nothing in the catalog. The type they asked for is not here yet;
 * the custom application type is the way through until it is.
 *
 * Same tile as the catalog so picking it is the same action as finding Custom
 * Application by browsing — not a second, invented control.
 */
function CatalogSearchMiss({
  query,
  onSelect,
}: {
  query: string;
  onSelect: (t: AppTypeOption) => void;
}) {
  const custom = getCustomAppType();
  return (
    <div className="flex max-w-2xl items-start gap-5 pt-4">
      <div className="w-[200px] shrink-0">
        <AppTypeTile appType={custom} title="Custom application type" onSelect={onSelect} />
      </div>
      <p className="pt-2 text-body-sm text-text-secondary">
        {query
          ? `“${query}” isn’t in the catalog yet. It will be present shortly — until then, use a custom application type.`
          : 'Your requested application type will be present shortly — until then, use a custom application type.'}
      </p>
    </div>
  );
}

/**
 * One catalog tile. A coming-soon type stays in place rather than being hidden
 * — knowing it is on the way is the answer to "can I onboard this?" — but it
 * sinks to the subtle surface and stops being a control.
 */
function AppTypeTile({
  appType,
  onSelect,
  title,
}: {
  appType: AppTypeOption;
  onSelect: (t: AppTypeOption) => void;
  /** Optional label when the catalog name is not the words this surface needs. */
  title?: string;
}) {
  const soon = appType.status === 'coming-soon';
  return (
    <button
      type="button"
      disabled={soon}
      onClick={() => onSelect(appType)}
      className={[
        'flex flex-col items-start gap-6 rounded-xl border p-4 text-left transition-colors',
        soon
          ? 'cursor-default border-border bg-subtle'
          : 'border-border bg-surface hover:border-brand hover:bg-surface-hover',
      ].join(' ')}
    >
      <div className="flex w-full items-start justify-between gap-2">
        <AppIcon app={appType.name} size={36} variant="surface" />
        {soon && (
          <span className="text-caption-strong uppercase tracking-wider text-text-tertiary">Coming soon</span>
        )}
      </div>
      <div className="w-full">
        <p className={`truncate text-body-sm-strong ${soon ? 'text-text-tertiary' : 'text-text-primary'}`}>
          {title ?? appType.name}
        </p>
        <p className={`mt-0.5 truncate text-caption ${soon ? 'text-text-tertiary' : 'text-text-secondary'}`}>
          {appType.protocols.join(' · ')}
        </p>
      </div>
    </button>
  );
}
