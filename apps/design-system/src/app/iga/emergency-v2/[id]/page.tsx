'use client';

import { useParams } from 'next/navigation';
import { EmergencyAccessDetail } from '@/components/product/emergency/EmergencyAccessDetail';

/** V2 detail — the same screen as V1, reached from the V2 list. */
export default function EmergencyAccessV2DetailPage() {
  return <EmergencyAccessDetail id={String(useParams().id)} basePath="/iga/emergency-v2" />;
}
