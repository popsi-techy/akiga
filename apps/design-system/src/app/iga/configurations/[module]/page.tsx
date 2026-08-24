'use client';

import { useParams } from 'next/navigation';
import { SettingsPlaceholderPage } from '@/components/product/settings/SettingsPlaceholderPage';

export default function Page() {
  return <SettingsPlaceholderPage moduleId={String(useParams().module)} />;
}
