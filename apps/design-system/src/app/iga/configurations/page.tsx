'use client';

import { SystemSettingsView } from '@/components/product/settings/SystemSettingsView';

/**
 * System Settings hub. Destinations live in the catalog; implemented
 * areas have their own page, the rest open an empty placeholder.
 */
export default function SystemSettingsPage() {
  return <SystemSettingsView />;
}
