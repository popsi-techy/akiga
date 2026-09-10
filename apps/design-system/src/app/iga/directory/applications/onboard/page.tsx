'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import SearchOutlined from '@mui/icons-material/SearchOutlined';
import TuneOutlined from '@mui/icons-material/TuneOutlined';
import CheckCircleOutlined from '@mui/icons-material/CheckCircleOutlined';
import CableOutlined from '@mui/icons-material/CableOutlined';
import {
  AppIcon,
  Button,
  FilterDrawer,
  Input,
  Modal,
  NavList,
  StatusChip,
  resolveAppIcon,
  type FilterGroup,
  type FilterSelection,
} from '@ds/components';
import { AddApplicationDrawer } from '@/components/product/directory';
import { AtmosphericBackground } from '@/components/atmosphere/AtmosphericBackground';
import { useSetBreadcrumbs } from '@/lib/breadcrumb';
import {
  appTypeCategories,
  appTypeMatches,
  appTypeMatchesFilters,
  getCustomAppType,
  listAppTypeProtocols,
  listAppTypes,
  type AppTypeOption,
  type AppTypeCategory,
} from '@/data/app-types';

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
  const [preview, setPreview] = React.useState<AppTypeOption | null>(null);
  const [query, setQuery] = React.useState('');
  const [filterOpen, setFilterOpen] = React.useState(false);
  const [filters, setFilters] = React.useState<FilterSelection>({});
  const [active, setActive] = React.useState<AppTypeCategory>('application');

  const scroller = React.useRef<HTMLDivElement>(null);
  const sections = React.useRef(new Map<AppTypeCategory, HTMLElement>());

  const all = listAppTypes();
  const custom = getCustomAppType();
  const filterGroups = React.useMemo<FilterGroup[]>(
    () => [
      {
        id: 'category',
        label: 'Category',
        optionHeader: 'Category',
        searchPlaceholder: 'Search categories',
        options: appTypeCategories.map((c) => ({ id: c.id, label: c.label })),
      },
      {
        id: 'protocol',
        label: 'Protocol',
        optionHeader: 'Protocol',
        searchPlaceholder: 'Search protocols',
        options: listAppTypeProtocols().map((p) => ({ id: p, label: p })),
      },
    ],
    [],
  );
  const activeFilters = Object.values(filters).reduce((n, ids) => n + ids.length, 0);
  const matched = all.filter((t) => appTypeMatches(t, query) && appTypeMatchesFilters(t, filters));
  const catalog = matched.filter((t) => t.id !== 'at-custom');
  const byCategory = (id: AppTypeCategory) => catalog.filter((t) => t.category === id);
  const visibleCategories = appTypeCategories.filter((cat) => byCategory(cat.id).length > 0);
  const firstVisible = visibleCategories[0]?.id;
  const activeVisible = visibleCategories.some((c) => c.id === active);

  React.useEffect(() => {
    if (firstVisible && !activeVisible) setActive(firstVisible);
  }, [activeVisible, firstVisible]);

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
              endAdornment={
                <button
                  type="button"
                  aria-label={
                    activeFilters > 0
                      ? `Filter application types, ${activeFilters} applied`
                      : 'Filter application types'
                  }
                  aria-expanded={filterOpen}
                  onClick={() => setFilterOpen(true)}
                  className={`relative rounded-md p-0.5 hover:bg-surface-hover ${
                    activeFilters > 0 ? 'text-icon-brand' : 'text-icon'
                  }`}
                >
                  <TuneOutlined sx={{ fontSize: 18 }} />
                  {activeFilters > 0 && (
                    <span
                      className="absolute -right-0.5 -top-0.5 h-1.5 w-1.5 rounded-full bg-brand"
                      aria-hidden
                    />
                  )}
                </button>
              }
            />
          </div>
          <p className="mt-2.5 text-body-sm text-text-secondary">
            Have an application we don&apos;t list?{' '}
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
          {catalog.length === 0 && (q || activeFilters > 0) ? (
            <p className="text-body-sm text-text-secondary">
              {q
                ? `“${q}” isn’t in the catalog yet. It will be present shortly — until then, use a custom application.`
                : 'No types match those filters. Clear them to see the full catalog, or start with a custom application.'}
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
                  <h2 className="text-h5 text-text-primary">{cat.label}</h2>
                  <div className="mt-4 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                    {byCategory(cat.id).map((t) => (
                      <AppTypeTile
                        key={t.id}
                        appType={t}
                        onPreview={() => setPreview(t)}
                        onSelect={pick}
                      />
                    ))}
                  </div>
                </section>
              ))}
            </div>
          )}
        </div>
      </div>

      <FilterDrawer
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        groups={filterGroups}
        value={filters}
        onApply={setFilters}
        title="Filter application types"
        subtitle="Narrow the catalog by category or protocol."
        renderStatus={(staged) => {
          const n = all.filter(
            (t) =>
              t.id !== 'at-custom' &&
              appTypeMatches(t, query) &&
              appTypeMatchesFilters(t, staged),
          ).length;
          return `${n} type${n === 1 ? '' : 's'} available`;
        }}
      />

      <Modal
        open={preview !== null}
        onClose={() => setPreview(null)}
        title={preview?.name ?? ''}
        subtitle={preview?.summary}
        leading={preview ? <TypeMark name={preview.name} size={36} /> : undefined}
        // The split owns its own insets so its divider can meet the header and footer
        // rules instead of stopping short of them in the body's gutter.
        disablePadding
        width={880}
        // Fixed, so every type opens the same window and the reader is not re-finding
        // the same headings at a different size each time. `height` hands the scrolling
        // to the body, which is what the content column does with it.
        height="min(560px, 82vh)"
        footer={
          <>
            <Button variant="tertiary" onClick={() => setPreview(null)}>
              Close
            </Button>
            {preview && preview.status !== 'coming-soon' ? (
              <Button
                onClick={() => {
                  setPreview(null);
                  pick(preview);
                }}
              >
                Proceed
              </Button>
            ) : null}
          </>
        }
      >
        {preview ? <AppTypePreview appType={preview} /> : null}
      </Modal>

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
 * Same frame as a workflow template card: mark where the audience chip sits,
 * title and summary, then the protocols where Global sits, Guide + Proceed.
 */
function AppTypeTile({
  appType,
  onPreview,
  onSelect,
}: {
  appType: AppTypeOption;
  onPreview: () => void;
  onSelect: (t: AppTypeOption) => void;
}) {
  const soon = appType.status === 'coming-soon';
  return (
    <article
      className={[
        'flex h-full flex-col rounded-xl border border-border p-4 transition-all duration-200',
        soon ? 'bg-subtle' : 'bg-surface hover:border-border-strong hover:shadow-sm',
      ].join(' ')}
    >
      <div className="flex flex-wrap items-center gap-1.5 self-start">
        <TypeMark name={appType.name} size={40} muted={soon} />
        {soon && <StatusChip intent="neutral" label="Coming soon" />}
      </div>
      <h3 className={`mt-2 truncate text-body-strong ${soon ? 'text-text-tertiary' : 'text-text-primary'}`}>
        {appType.name}
      </h3>
      <p className={`mt-0.5 line-clamp-2 text-body-sm ${soon ? 'text-text-tertiary' : 'text-text-secondary'}`}>
        {appType.summary}
      </p>
      <div className="mt-auto flex flex-wrap items-center justify-between gap-2 pt-3">
        {/* An icon and a line, the way the workflow template card carries its scope —
            not chips. A chip is for something with a state; a protocol list is a
            property, and two blue pills read as two things the reader can act on. The
            icon carries the category so the line does not have to start with the word
            "Protocols". */}
        <div
          aria-label={`Protocols: ${appType.protocols.join(', ')}`}
          className={`flex min-w-0 items-center gap-1 text-caption ${
            soon ? 'text-text-tertiary' : 'text-text-secondary'
          }`}
        >
          <CableOutlined sx={{ fontSize: 16 }} className="shrink-0 text-icon-subtle" aria-hidden />
          <span className="truncate">{appType.protocols.join(' · ')}</span>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <button
            type="button"
            className={`text-caption-medium hover:underline ${
              soon
                ? 'text-text-tertiary hover:text-text-secondary'
                : 'text-text-secondary hover:text-text-primary'
            }`}
            onClick={onPreview}
          >
            Guide
          </button>
          {!soon && (
            <button
              type="button"
              className="rounded-sm bg-surface-inverse px-2.5 py-1 text-caption-medium text-text-inverse hover:bg-sidebar focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-subtle"
              onClick={() => onSelect(appType)}
            >
              Proceed
            </button>
          )}
        </div>
      </div>
    </article>
  );
}

/** One labelled property in the preview's meta rail. */
function MetaFact({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-overline uppercase text-text-tertiary">{label}</p>
      <div className="mt-1 text-body-sm text-text-primary">{children}</div>
    </div>
  );
}

/**
 * What a type is, before you commit to it.
 *
 * A fixed-height panel split the way a connector page is: the identity and the
 * properties down a narrow rail, the content beside it, and the content — not the
 * panel — is what scrolls. A modal that grows with its content is fine for a form;
 * it is wrong for a catalogue entry, because every type then opens a differently
 * shaped window and the reader re-finds the same three headings each time.
 *
 * The rail carries only what this model actually knows. The reference this borrows
 * its shape from lists languages, a developer and a privacy policy; inventing those
 * would make the panel look authoritative about facts nobody has entered.
 *
 * The logo is in the modal header, not at the top of the rail: the header already names
 * the type, and a mark repeated four pixels below its own title is the same identity
 * stated twice.
 */
function AppTypePreview({ appType }: { appType: AppTypeOption }) {
  const category = appTypeCategories.find((c) => c.id === appType.category);
  return (
    <div className="flex h-full min-h-0">
      {/* Below `sm` the rail would leave the content about 200px; it stacks into the
          scrolling column instead of squeezing it. */}
      <aside className="hidden w-[208px] shrink-0 flex-col gap-5 border-r border-border px-5 py-4 sm:flex">
        {category && <MetaFact label="Category">{category.label}</MetaFact>}
        <MetaFact label="Protocols">
          <div className="flex flex-col gap-1">
            {appType.protocols.map((p) => (
              <span key={p} className="flex items-center gap-1.5">
                <CableOutlined sx={{ fontSize: 15 }} className="shrink-0 text-icon-subtle" aria-hidden />
                {p}
              </span>
            ))}
          </div>
        </MetaFact>
        <MetaFact label="Inbound SCIM">
          {appType.inboundScim ? 'Supported' : 'Not supported'}
        </MetaFact>
        <MetaFact label="Availability">
          {appType.status === 'coming-soon' ? (
            <StatusChip intent="neutral" label="Coming soon" />
          ) : (
            <StatusChip intent="success" label="Available" />
          )}
        </MetaFact>
      </aside>

      <div className="ds-scroll flex min-h-0 min-w-0 flex-1 flex-col gap-6 overflow-y-auto px-5 py-4">
        <section>
          <h3 className="text-body-sm-strong text-text-primary">Capabilities supported</h3>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {appType.capabilities.map((item) => (
              <li key={item} className="flex items-start gap-2 text-body-sm text-text-primary">
                <CheckCircleOutlined sx={{ fontSize: 18 }} className="mt-0.5 shrink-0 text-success" aria-hidden />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>
        <section>
          <h3 className="text-body-sm-strong text-text-primary">Prerequisites required</h3>
          <ul className="mt-3 flex flex-col gap-2">
            {appType.prerequisites.map((item) => (
              <li key={item} className="flex items-start gap-2 text-body-sm text-text-primary">
                <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-text-secondary" aria-hidden />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}

/** Single-tone wash, no outline. Logo sits inset so the tile has air. */
function TypeMark({ name, size, muted }: { name: string; size: number; muted?: boolean }) {
  if (resolveAppIcon(name)) {
    return (
      <span className={muted ? 'opacity-50' : undefined}>
        <AppIcon app={name} size={size} variant="wash" />
      </span>
    );
  }
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-sm bg-subtle ${
        muted ? 'text-icon-subtle opacity-50' : 'text-icon'
      }`}
      style={{ width: size, height: size }}
      title={name}
    >
      <TypeGlyph name={name} size={Math.round(size * 0.5)} />
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
