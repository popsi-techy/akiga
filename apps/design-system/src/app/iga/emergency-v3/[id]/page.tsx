'use client';

import { useParams } from 'next/navigation';
import { EmergencyAccessDetail } from '@/components/product/emergency/EmergencyAccessDetail';

/** V3 detail — same screen as V1/V2; the floating setup bar is the difference. */
export default function EmergencyAccessV3DetailPage() {
  return <EmergencyAccessDetail id={String(useParams().id)} basePath="/iga/emergency-v3" />;
}
