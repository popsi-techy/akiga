'use client';

import { useSidebar } from '@/lib/sidebar';

/**
 * The content frame to the right of the navigation rail. Its left margin tracks
 * the rail's collapsed width so the two never overlap, animating in step.
 */
export default function AppFrame({ children }: { children: React.ReactNode }) {
  const { collapsed } = useSidebar();
  return (
    <div
      className={[
        'flex h-screen flex-col bg-canvas transition-[margin] duration-200 ease-out',
        collapsed ? 'ml-[72px]' : 'ml-[256px]',
      ].join(' ')}
      // DataTable's bulk bar is `position: fixed`; this inset keeps it in the
      // content column so it never paints over the rail.
      style={{ ['--ds-shell-content-inset' as string]: collapsed ? '72px' : '256px' }}
    >
      {children}
    </div>
  );
}
