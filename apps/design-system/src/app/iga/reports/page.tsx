'use client';

import * as React from 'react';
import { ReportsHubMainScreen } from '@/components/product/reports';

/**
 * `/iga/reports` — the hub.
 *
 * Wrapped in Suspense because the screen reads its active collection from `useSearchParams`,
 * which opts a route into client-side rendering; without a boundary Next fails the build
 * on it rather than at runtime, which is the wrong place to find out.
 */
export default function ReportsPage() {
  return (
    <React.Suspense fallback={null}>
      <ReportsHubMainScreen />
    </React.Suspense>
  );
}
