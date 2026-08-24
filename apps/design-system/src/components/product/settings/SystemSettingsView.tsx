'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import CloseOutlined from '@mui/icons-material/CloseOutlined';
import PublicOutlined from '@mui/icons-material/PublicOutlined';
import ScheduleOutlined from '@mui/icons-material/ScheduleOutlined';
import SearchOutlined from '@mui/icons-material/SearchOutlined';
import SecurityOutlined from '@mui/icons-material/SecurityOutlined';
import AssignmentOutlined from '@mui/icons-material/AssignmentOutlined';
import FactCheckOutlined from '@mui/icons-material/FactCheckOutlined';
import TuneOutlined from '@mui/icons-material/TuneOutlined';
import CategoryOutlined from '@mui/icons-material/CategoryOutlined';
import PersonSearchOutlined from '@mui/icons-material/PersonSearchOutlined';
import InsightsOutlined from '@mui/icons-material/InsightsOutlined';
import TaskAltOutlined from '@mui/icons-material/TaskAltOutlined';
import EmailOutlined from '@mui/icons-material/EmailOutlined';
import AltRouteOutlined from '@mui/icons-material/AltRouteOutlined';
import LoginOutlined from '@mui/icons-material/LoginOutlined';
import LanguageOutlined from '@mui/icons-material/LanguageOutlined';
import { DestinationList, Input } from '@ds/components';
import { getSystemSettings } from '@/data/system-settings';
import {
  SYSTEM_SETTINGS_GROUPS,
  SYSTEM_SETTINGS_SECTIONS,
  type SystemSettingsSection,
} from '@/data/system-settings-catalog';
import { useSetBreadcrumbs } from '@/lib/breadcrumb';
import { SettingsDenied, useAdminSettings } from './SettingsChrome';

const ICONS: Record<string, React.ReactNode> = {
  mfa: <SecurityOutlined />,
  'access-request': <AssignmentOutlined />,
  'micro-certification': <FactCheckOutlined />,
  'custom-attributes': <TuneOutlined />,
  'entitlement-types': <CategoryOutlined />,
  'identity-correlation': <PersonSearchOutlined />,
  'role-mining': <InsightsOutlined />,
  'provisioning-task': <TaskAltOutlined />,
  'email-templates': <EmailOutlined />,
  'notification-routing': <AltRouteOutlined />,
  'sso-oauth': <LoginOutlined />,
  'locale-regional': <LanguageOutlined />,
};

function haystack(parts: string[]): string {
  return parts.join(' ').toLowerCase();
}

function matchesSection(section: SystemSettingsSection, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return haystack([section.title, section.description, ...section.keywords]).includes(q);
}

function matchesGroup(
  group: (typeof SYSTEM_SETTINGS_GROUPS)[number],
  query: string,
): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return haystack([group.title, group.description]).includes(q);
}

/**
 * System Settings hub — search, then destinations grouped by job.
 *
 * The breadcrumb already names the page. A heading here would restate it.
 * Search is the chrome; tenant time zone and region recede as facts.
 * The grouped catalog is the protagonist.
 */
export function SystemSettingsView() {
  const router = useRouter();
  const allowed = useAdminSettings();
  const [query, setQuery] = React.useState('');
  useSetBreadcrumbs([{ label: 'System Settings' }]);

  if (!allowed) return <SettingsDenied />;

  const groups = SYSTEM_SETTINGS_GROUPS.map((group) => {
    const byGroup = SYSTEM_SETTINGS_SECTIONS.filter((s) => s.group === group.id);
    const items = matchesGroup(group, query)
      ? byGroup
      : byGroup.filter((s) => matchesSection(s, query));
    return { group, items };
  }).filter((g) => g.items.length > 0);
  const locale = getSystemSettings().locale;

  return (
    <div>
      <h1 className="sr-only">System Settings</h1>

      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
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
        <p
          className="flex min-w-0 flex-wrap items-center gap-x-4 gap-y-1 text-caption text-text-secondary"
          aria-label="This tenant"
        >
          <span className="inline-flex min-w-0 items-center gap-1.5">
            <ScheduleOutlined sx={{ fontSize: 16 }} className="shrink-0 text-icon" />
            <span className="sr-only">Time zone </span>
            <span className="truncate">{locale.timezoneDisplay}</span>
          </span>
          <span className="inline-flex min-w-0 items-center gap-1.5">
            <PublicOutlined sx={{ fontSize: 16 }} className="shrink-0 text-icon" />
            <span className="sr-only">Region </span>
            <span className="truncate">{locale.region}</span>
          </span>
        </p>
      </div>

      {groups.length === 0 ? (
        <DestinationList
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
            <section key={group.id} aria-labelledby={`settings-${group.id}`}>
              <h2 id={`settings-${group.id}`} className="mb-3 text-h5 text-text-primary">
                {group.title}
              </h2>
              <DestinationList
                aria-label={group.title}
                items={items.map((s) => ({
                  id: s.id,
                  title: s.title,
                  description: s.description,
                  icon: ICONS[s.id],
                  onClick: () => router.push(s.href),
                }))}
              />
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
