'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import CloseOutlined from '@mui/icons-material/CloseOutlined';
import InfoOutlined from '@mui/icons-material/InfoOutlined';
import SearchOutlined from '@mui/icons-material/SearchOutlined';
import { DestinationList, Input } from '@ds/components';
import type { DestinationListIconTone } from '@ds/components';
import { filterSystemSettingsGroups } from '@/data/system-settings-catalog';
import { useSetBreadcrumbs } from '@/lib/breadcrumb';
import { SYSTEM_SETTINGS_ICONS } from './settingsIcons';
import { SettingsDenied, useAdminSettings } from './SettingsChrome';

/** One token hue per job — blue, orange, yellow, green. */
const GROUP_ICON_TONE: Record<string, DestinationListIconTone> = {
  'sign-in': 'info',
  access: 'brand',
  identities: 'warning',
  notifications: 'success',
};

/**
 * System Settings v2 hub — search, then destinations grouped by job.
 * Each group is a heading plus a three-column catalog: outlined icon,
 * title, and a two-line description.
 *
 * Search stays put. The catalog is the only thing that scrolls, same as
 * the list pages whose toolbar must remain reachable.
 */
export function SystemSettingsV2View() {
  const router = useRouter();
  const allowed = useAdminSettings();
  const [query, setQuery] = React.useState('');
  useSetBreadcrumbs([{ label: 'System Settings v2' }]);

  if (!allowed) return <SettingsDenied />;

  const groups = filterSystemSettingsGroups(query);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <h1 className="sr-only">System Settings v2</h1>

      <div className="mb-6 flex shrink-0 flex-wrap items-center justify-between gap-4">
        <div role="search" className="w-full max-w-sm min-w-0">
          <Input
            size="sm"
            fullWidth
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search settings"
            aria-label="Search settings"
            startAdornment={<SearchOutlined sx={{ fontSize: 18 }} />}
            endAdornment={
              query ? (
                <button
                  type="button"
                  aria-label="Clear search"
                  onClick={() => setQuery('')}
                  className="grid h-6 w-6 place-items-center rounded-md text-icon hover:bg-surface-hover hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-subtle"
                >
                  <CloseOutlined sx={{ fontSize: 16 }} />
                </button>
              ) : null
            }
          />
        </div>
        <p className="flex min-w-0 items-center gap-1.5 text-body-sm text-text-secondary">
          <InfoOutlined sx={{ fontSize: 16 }} className="shrink-0 text-icon" aria-hidden />
          Changes you apply here are system-wide.
        </p>
      </div>

      <div className="ds-scroll min-h-0 flex-1 overflow-y-auto">
      {groups.length === 0 ? (
        <DestinationList
          appearance="plain"
          columns={3}
          aria-label="System settings"
          items={[]}
          empty={
            <div>
              <p className="text-body-sm-strong text-text-primary">No settings match</p>
              <p className="mt-1 text-caption text-text-secondary">
                Nothing named “{query.trim()}”. Try sign-in, access, or notifications.
              </p>
            </div>
          }
        />
      ) : (
        <div className="flex flex-col gap-8">
          {groups.map(({ group, items }) => (
            <section key={group.id} aria-labelledby={`settings-v2-${group.id}`}>
              <h2 id={`settings-v2-${group.id}`} className="mb-3 text-h5 text-text-primary">
                {group.title}
              </h2>
              <DestinationList
                appearance="plain"
                columns={3}
                aria-label={group.title}
                items={items.map((s) => ({
                  id: s.id,
                  title: s.title,
                  description: s.description,
                  icon: SYSTEM_SETTINGS_ICONS[s.id],
                  tone: GROUP_ICON_TONE[group.id],
                  onClick: () =>
                    router.push(s.id === 'mfa' ? '/iga/configurations-v2/mfa' : s.href),
                }))}
              />
            </section>
          ))}
        </div>
      )}
      </div>
    </div>
  );
}
