'use client';

import { useRouter } from 'next/navigation';
import { EmergencyAccessListView } from '@/components/product/emergency/EmergencyAccessListView';

/**
 * Emergency Access V2 — create in a stepper, finish on a live profile.
 *
 * Same list as V1. A draft row resumes the stepper at the first unfinished step;
 * an active row opens the tabbed profile the live object is managed on.
 */
export default function EmergencyAccessV2ListPage() {
  const router = useRouter();
  return (
    <EmergencyAccessListView
      basePath="/iga/emergency-v2"
      onCreate={() => router.push('/iga/emergency-v2/new')}
      onOpen={(row) => {
        if (row.status.intent === 'warning') {
          router.push(`/iga/emergency-v2/new?id=${encodeURIComponent(row.id)}`);
        } else {
          router.push(`/iga/emergency-v2/${row.id}`);
        }
      }}
    />
  );
}
