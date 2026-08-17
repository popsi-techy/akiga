'use client';

import { useParams } from 'next/navigation';
import { EmergencyAccessDetail } from '@/components/product/emergency/EmergencyAccessDetail';

/** V1 detail — the screen itself is shared with V2; only the way back differs. */
export default function EmergencyAccessDetailPage() {
  return <EmergencyAccessDetail id={String(useParams().id)} basePath="/iga/emergency" />;
}
