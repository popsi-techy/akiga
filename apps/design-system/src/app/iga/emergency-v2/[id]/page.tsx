'use client';

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { EmergencyAccessDetail } from '@/components/product/emergency/EmergencyAccessDetail';
import { getEmergencyAccess } from '@/data/emergency-access';

/**
 * V2 detail — the same screen as V1, for a profile that is already live.
 *
 * A draft has no business here: V2's unfinished object lives in the stepper, so
 * a leftover `/[id]` (bookmark, typed URL) is sent back to continue setup rather
 * than the tabbed checklist V1 uses for the same state.
 */
export default function EmergencyAccessV2DetailPage() {
  const id = String(useParams().id);
  const router = useRouter();
  const ea = getEmergencyAccess(id);

  React.useEffect(() => {
    if (ea?.isDraft) {
      router.replace(`/iga/emergency-v2/new?id=${encodeURIComponent(id)}`);
    }
  }, [ea?.isDraft, id, router]);

  if (ea?.isDraft) return null;

  return <EmergencyAccessDetail id={id} basePath="/iga/emergency-v2" />;
}
