'use client';

import { useRouter } from 'next/navigation';
import { EmergencyAccessListView } from '@/components/product/emergency/EmergencyAccessListView';

/**
 * Emergency Access V2 — create in a stepper, finish on a live profile.
 *
 * Same list, same detail screen as V1. The difference is what happens after the
 * button: V1 asks for a name and leaves you on a draft with a checklist of what
 * is still missing; V2 walks the same five pieces in order and ends on a preview
 * you activate from.
 */
export default function EmergencyAccessV2ListPage() {
  const router = useRouter();
  return (
    <EmergencyAccessListView
      basePath="/iga/emergency-v2"
      onCreate={() => router.push('/iga/emergency-v2/new')}
    />
  );
}
