'use client';

import * as React from 'react';
import { notFound } from 'next/navigation';
import { getSystemSettingsSection } from '@/data/system-settings-catalog';
import { SettingsDenied, useAdminSettings, useSettingsCrumbs } from './SettingsChrome';

/**
 * Inner page for a hub card that has no form yet.
 *
 * The title and lead come from the catalog so the hub and this page cannot drift.
 * The body stays empty on purpose — settings land here when that area is built.
 */
export function SettingsPlaceholderPage({ moduleId }: { moduleId: string }) {
  const section = getSystemSettingsSection(moduleId);
  const allowed = useAdminSettings();
  useSettingsCrumbs(section?.title ?? 'Settings');

  if (!section || section.implemented) {
    notFound();
  }
  if (!allowed) return <SettingsDenied />;

  return <h1 className="sr-only">{section.title}</h1>;
}
