'use client';

import * as React from 'react';
import HistoryOutlined from '@mui/icons-material/HistoryOutlined';
import { Button, Tooltip, useToast } from '@ds/components';
import { usePersona } from '@/lib/persona';
import { useSetBreadcrumbs } from '@/lib/breadcrumb';

export function same<T>(a: T, b: T): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

export function SettingsDenied() {
  return (
    <div className="mx-auto max-w-lg py-16 text-center">
      <h1 className="text-h4 text-text-primary">You cannot manage system settings</h1>
      <p className="mt-2 text-body-sm text-text-secondary">
        Tenant-wide configuration is limited to administrators. Switch persona if you
        need to review this screen in the prototype.
      </p>
    </div>
  );
}

export function SettingsLoading({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex h-full flex-col">
      <div className="mb-5 shrink-0">
        <h1 className="text-h2 text-text-primary">{title}</h1>
        <p className="mt-1 text-body text-text-secondary">{description}</p>
      </div>
      <p className="text-body-sm text-text-secondary">Loading settings…</p>
    </div>
  );
}

/** History + Save, as on the live admin screens. */
export function SettingsActions({ dirty, onSave }: { dirty: boolean; onSave: () => void }) {
  const toast = useToast();
  return (
    <div className="flex items-center gap-2">
      <Tooltip title="Change history">
        <button
          type="button"
          aria-label="Change history"
          onClick={() => toast.info('Change history is not available in this prototype')}
          className="grid h-8 w-8 place-items-center rounded-md text-icon hover:bg-surface-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-subtle"
        >
          <HistoryOutlined sx={{ fontSize: 18 }} />
        </button>
      </Tooltip>
      <Button size="sm" disabled={!dirty} onClick={onSave}>
        Save
      </Button>
    </div>
  );
}

export function useAdminSettings() {
  return usePersona().persona === 'admin';
}

export function useSettingsCrumbs(
  leaf: string,
  hub: { label: string; href: string } = {
    label: 'System Settings',
    href: '/iga/configurations',
  },
) {
  useSetBreadcrumbs([hub, { label: leaf }]);
}
