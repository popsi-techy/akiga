'use client';

import * as React from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { EmergencyAccessDetail } from '@/components/product/emergency/EmergencyAccessDetail';

function V1Detail() {
  const search = useSearchParams();
  return (
    <EmergencyAccessDetail
      id={String(useParams().id)}
      basePath="/iga/emergency"
      openSetup={search.get('from') === 'create'}
    />
  );
}

/** V1 detail — the screen itself is shared with V2; only the way back differs. */
export default function EmergencyAccessDetailPage() {
  return (
    <React.Suspense fallback={null}>
      <V1Detail />
    </React.Suspense>
  );
}
