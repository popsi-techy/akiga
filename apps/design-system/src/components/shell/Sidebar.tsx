'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { navigation } from '@/lib/navigation';

function StatusDot({ status }: { status?: string }) {
  if (status === 'planned')
    return <span className="ml-auto text-caption text-text-disabled">soon</span>;
  if (status === 'wip')
    return <span className="ml-auto rounded-pill bg-brand-subtle px-2 py-0.5 text-caption font-medium text-brand-active">WIP</span>;
  return null;
}

export default function Sidebar() {
  const pathname = usePathname();

  // Active = the single most-specific (longest) nav href that matches the path,
  // so "/components" doesn't stay highlighted on "/components/button".
  const activeHref = navigation
    .flatMap((s) => s.items)
    .map((i) => i.href)
    .filter((href) => pathname === href || (href !== '/' && pathname.startsWith(href + '/')))
    .sort((a, b) => b.length - a.length)[0];

  return (
    <aside
      className="ds-scroll fixed left-0 top-0 z-raised flex h-screen w-[260px] flex-col overflow-y-auto border-r border-border bg-surface"
      aria-label="Design System navigation"
    >
      {/* Brand */}
      <Link
        href="/"
        className="flex h-16 shrink-0 items-center gap-2 border-b border-border px-6"
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-md bg-brand text-h5 font-bold text-brand-on">
          a
        </span>
        <span className="flex flex-col leading-tight">
          <span className="text-h5 font-bold text-text-primary">akiga</span>
          <span className="text-caption text-text-secondary">Design System</span>
        </span>
      </Link>

      {/* Sections */}
      <nav className="flex-1 px-3 py-4">
        {navigation.map((section) => (
          <div key={section.title} className="mb-5">
            <div className="px-3 pb-1.5 text-caption font-semibold uppercase tracking-wider text-text-tertiary">
              {section.title}
            </div>
            <ul className="flex flex-col gap-0.5">
              {section.items.map((item) => {
                const active = item.href === activeHref;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      aria-current={active ? 'page' : undefined}
                      className={[
                        'flex items-center rounded-md px-3 py-1.5 text-body-sm transition-colors',
                        active
                          ? 'bg-brand-subtle font-semibold text-brand-active'
                          : 'font-medium text-text-secondary hover:bg-surface-hover hover:text-text-primary',
                      ].join(' ')}
                    >
                      {item.label}
                      <StatusDot status={item.status} />
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="shrink-0 border-t border-border px-6 py-3 text-caption text-text-tertiary">
        v0.1 · Light theme
      </div>
    </aside>
  );
}
