'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import ChevronLeft from '@mui/icons-material/ChevronLeft';
import ChevronRight from '@mui/icons-material/ChevronRight';
import ExpandMore from '@mui/icons-material/ExpandMore';
import { navForPersona, flattenLeaves, isNavParent, type IgaNavLeaf, type IgaNavParent } from '@/lib/iga-navigation';
import { usePersona } from '@/lib/persona';
import { useSidebar } from '@/lib/sidebar';

const RAIL_COLLAPSED_PX = 72;

/**
 * ProductSidebar — the IGA product's dark navigation rail (#1E2C38). White-on-dark
 * is high-contrast (AA); the active item gets a subtle lighter fill. Nav is chosen
 * by persona. Groups are accordions when the rail is expanded; when the rail is
 * collapsed to icons, groups reveal their children in a hover flyout instead.
 */
export default function ProductSidebar() {
  const pathname = usePathname();
  const { persona } = usePersona();
  const { collapsed, toggle } = useSidebar();
  const navigation = navForPersona[persona];

  const activeHref = flattenLeaves(navigation)
    .map((l) => l.href)
    .filter((href) => pathname === href || pathname.startsWith(href + '/'))
    .sort((a, b) => b.length - a.length)[0];

  // Single-open accordion: the group holding the active route is open by default;
  // opening another collapses the previous. Resets to the active group on navigation
  // so deep links / child clicks land with the right group open.
  const activeParentId = React.useMemo(() => {
    for (const section of navigation.sections)
      for (const entry of section.items)
        if (isNavParent(entry) && entry.children.some((c) => c.href === activeHref)) return entry.id;
    return null;
  }, [navigation, activeHref]);
  const [openId, setOpenId] = React.useState<string | null | undefined>(undefined);
  React.useEffect(() => setOpenId(undefined), [activeHref]);
  const resolvedOpenId = openId === undefined ? activeParentId : openId;
  const groupOpen = (p: IgaNavParent) => resolvedOpenId === p.id;
  const toggleGroup = (id: string) => setOpenId((prev) => ((prev === undefined ? activeParentId : prev) === id ? null : id));

  // Collapsed-rail flyout (child submenu), positioned relative to the hovered icon.
  const [flyout, setFlyout] = React.useState<{ id: string; top: number } | null>(null);
  const closeTimer = React.useRef<ReturnType<typeof setTimeout>>();
  const openFlyout = (id: string, top: number) => {
    clearTimeout(closeTimer.current);
    setFlyout({ id, top });
  };
  const scheduleClose = () => {
    clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setFlyout(null), 120);
  };

  const railBase = 'flex items-center gap-3 rounded-md text-body-sm transition-colors';
  const activeCls = 'bg-white/10 font-semibold text-white';
  const inactiveCls = 'font-medium text-white/70 hover:bg-white/5 hover:text-white';

  /** A leaf link on the dark rail. `sub` indents it beneath an expanded group. */
  const LeafLink = ({ leaf, sub = false, compact = false }: { leaf: IgaNavLeaf; sub?: boolean; compact?: boolean }) => {
    const Icon = leaf.icon;
    const active = leaf.href === activeHref;
    const py = collapsed ? 'py-2' : sub ? 'py-2' : compact ? 'py-1.5' : 'py-2';
    return (
      <Link
        href={leaf.href}
        aria-current={active ? 'page' : undefined}
        title={collapsed ? leaf.label : undefined}
        className={[railBase, py, collapsed ? 'justify-center px-0' : sub ? 'pl-11 pr-3' : 'px-3', active ? activeCls : inactiveCls].join(' ')}
      >
        <span className="relative flex shrink-0">
          <Icon sx={{ fontSize: sub && !collapsed ? 18 : 19 }} />
          {collapsed && leaf.badge != null && (
            <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-brand ring-2 ring-[color:var(--ds-color-background-sidebar)]" />
          )}
        </span>
        {!collapsed && (
          <>
            <span className="flex-1 truncate">{leaf.label}</span>
            {leaf.badge != null && (
              <span className="rounded-pill bg-brand px-1.5 py-0.5 text-micro font-semibold text-brand-on">{leaf.badge}</span>
            )}
          </>
        )}
      </Link>
    );
  };

  /** A collapsible group. Accordion when expanded; icon + hover flyout when collapsed. */
  const GroupBlock = ({ parent }: { parent: IgaNavParent }) => {
    const Icon = parent.icon;
    const hasActive = parent.children.some((c) => c.href === activeHref);

    if (collapsed) {
      return (
        <li className="relative" onMouseEnter={(e) => openFlyout(parent.id, e.currentTarget.getBoundingClientRect().top)} onMouseLeave={scheduleClose}>
          <button
            type="button"
            aria-label={parent.label}
            title={parent.label}
            onFocus={(e) => openFlyout(parent.id, e.currentTarget.getBoundingClientRect().top)}
            onBlur={scheduleClose}
            className={[railBase, 'w-full justify-center px-0 py-2', hasActive ? activeCls : inactiveCls].join(' ')}
          >
            <Icon sx={{ fontSize: 19 }} />
          </button>
          {flyout?.id === parent.id && (
            <div
              style={{ top: flyout.top, left: RAIL_COLLAPSED_PX, zIndex: 60 }}
              onMouseEnter={() => openFlyout(parent.id, flyout.top)}
              onMouseLeave={scheduleClose}
              className="fixed ml-1.5 w-[212px] rounded-lg border border-border bg-surface p-1.5 shadow-lg"
            >
              <div className="px-2 py-1 text-caption font-semibold uppercase tracking-wider text-text-tertiary">{parent.label}</div>
              <ul className="flex flex-col">
                {parent.children.map((child) => {
                  const ChildIcon = child.icon;
                  const active = child.href === activeHref;
                  return (
                    <li key={child.id}>
                      <Link
                        href={child.href}
                        onClick={() => setFlyout(null)}
                        className={[
                          'flex items-center gap-2.5 rounded-md px-2 py-1.5 text-body-sm transition-colors',
                          active ? 'bg-brand-subtle font-medium text-text-primary' : 'text-text-secondary hover:bg-surface-hover hover:text-text-primary',
                        ].join(' ')}
                      >
                        <ChildIcon sx={{ fontSize: 17 }} />
                        <span className="truncate">{child.label}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </li>
      );
    }

    const isOpen = groupOpen(parent);
    return (
      <li>
        <button
          type="button"
          onClick={() => toggleGroup(parent.id)}
          aria-expanded={isOpen}
          className={['flex w-full items-center gap-3 rounded-md px-3 py-1.5 text-body-sm transition-colors', hasActive ? 'font-semibold text-white' : inactiveCls].join(' ')}
        >
          <span className="flex shrink-0">
            <Icon sx={{ fontSize: 19 }} />
          </span>
          <span className="flex-1 truncate text-left">{parent.label}</span>
          <ExpandMore sx={{ fontSize: 18 }} className={['shrink-0 transition-transform duration-150', isOpen ? 'rotate-180' : ''].join(' ')} />
        </button>
        {isOpen && (
          <ul className="mt-0.5 flex flex-col gap-0.5">
            {parent.children.map((child) => (
              <li key={child.id}>
                <LeafLink leaf={child} sub />
              </li>
            ))}
          </ul>
        )}
      </li>
    );
  };

  return (
    <aside
      className={['group fixed left-0 top-0 z-raised flex h-screen flex-col transition-[width] duration-200 ease-out', collapsed ? 'w-[72px]' : 'w-[256px]'].join(' ')}
      style={{ background: 'var(--ds-color-background-sidebar)' }}
      aria-label="IGA navigation"
    >
      {/* Brand */}
      <Link href="/" className={['flex h-16 shrink-0 items-center gap-2.5', collapsed ? 'justify-center px-0' : 'px-5'].join(' ')}>
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-brand text-h5 font-bold text-brand-on">I</span>
        {!collapsed && <span className="text-h5 font-bold text-white">IGA</span>}
      </Link>

      {/* Collapse / expand toggle — circular chevron straddling the right edge, just
          below the top bar. Revealed on hover; stays visible while collapsed. */}
      <button
        type="button"
        onClick={toggle}
        aria-label={collapsed ? 'Expand navigation' : 'Collapse navigation'}
        title={collapsed ? 'Expand navigation' : 'Collapse navigation'}
        className={[
          'absolute right-0 top-[68px] z-raised grid h-7 w-7 translate-x-1/2 place-items-center rounded-full',
          'border border-border bg-surface text-icon shadow-md transition-all duration-150',
          'hover:border-border-strong hover:text-text-primary focus-visible:opacity-100 focus-visible:outline-none',
          collapsed ? 'opacity-100' : 'opacity-0 group-hover:opacity-100',
        ].join(' ')}
      >
        {collapsed ? <ChevronRight sx={{ fontSize: 18 }} /> : <ChevronLeft sx={{ fontSize: 18 }} />}
      </button>

      <nav className="ds-scroll flex-1 overflow-y-auto px-2 pb-6">
        {navigation.sections.map((section, si) => (
          <div key={section.title ?? `s${si}`} className={['mb-2', section.title ? 'mt-3' : ''].join(' ')}>
            {section.divider && <div className="mx-3 mb-3 mt-1 border-t border-white/10" />}
            {section.title && (
              <div className={['pb-1 pt-1 text-micro font-semibold uppercase tracking-[0.08em] text-white/50', collapsed ? 'sr-only' : 'px-3'].join(' ')}>
                {section.title}
              </div>
            )}
            <ul className="flex flex-col gap-0.5">
              {section.items.map((entry) =>
                isNavParent(entry) ? <GroupBlock key={entry.id} parent={entry} /> : (
                  <li key={entry.id}>
                    <LeafLink leaf={entry} compact />
                  </li>
                ),
              )}
            </ul>
          </div>
        ))}
      </nav>

      {/* Pinned footer — light divider, always at the bottom of the rail. */}
      {navigation.footer.length > 0 && (
        <div className="shrink-0 border-t border-white/10 px-2 py-3">
          <ul className="flex flex-col gap-0.5">
            {navigation.footer.map((leaf) => (
              <li key={leaf.id}>
                <LeafLink leaf={leaf} compact />
              </li>
            ))}
          </ul>
        </div>
      )}
    </aside>
  );
}
