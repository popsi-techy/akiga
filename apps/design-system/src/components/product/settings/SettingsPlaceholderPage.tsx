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

  return (
    <div>
      <h1 className="text-h2 text-text-primary">{section.title}</h1>
      <p className="mt-1 max-w-2xl text-body text-text-secondary">{section.pageDescription}</p>
    </div>
  );
}
