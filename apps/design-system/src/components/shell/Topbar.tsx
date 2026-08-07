'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { navigation } from '@/lib/navigation';

function useCrumbs(pathname: string) {
  for (const section of navigation) {
    for (const item of section.items) {
      if (item.href === pathname) return [section.title, item.label];
    }
  }
  // Fallback for nested/unlisted routes
  const parts = pathname.split('/').filter(Boolean);
  if (parts.length === 0) return ['Overview', 'Introduction'];
  return [parts[0], parts[parts.length - 1]].map((s) =>
    s.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
  );
}

export default function Topbar() {
  const pathname = usePathname();
  const [group, page] = useCrumbs(pathname);

  return (
    <header className="sticky top-0 z-sticky flex h-16 items-center justify-between border-b border-border bg-canvas/95 px-8 backdrop-blur">
      <div className="flex items-center gap-2 text-body-sm">
        <span className="text-text-tertiary">{group}</span>
        <span className="text-text-disabled">/</span>
        <span className="font-medium text-text-primary">{page}</span>
      </div>
      <div className="flex items-center gap-3">
        <span className="rounded-pill border border-border bg-surface px-2.5 py-1 text-caption font-medium text-text-secondary">
          DM Sans
        </span>
        <Link
          href="/iga/dashboard"
          className="rounded-pill border border-brand-border bg-brand-subtle px-2.5 py-1 text-caption font-medium text-brand-active hover:bg-brand-subtle-hover"
        >
          Open IGA Product →
        </Link>
      </div>
    </header>
  );
}
