'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import GridViewOutlined from '@mui/icons-material/GridViewOutlined';
import NavigateNextOutlined from '@mui/icons-material/NavigateNextOutlined';
import NotificationsOutlined from '@mui/icons-material/NotificationsOutlined';
import AppsOutlined from '@mui/icons-material/AppsOutlined';
import CheckIcon from '@mui/icons-material/Check';
import PersonOutline from '@mui/icons-material/PersonOutline';
import TuneOutlined from '@mui/icons-material/TuneOutlined';
import LogoutOutlined from '@mui/icons-material/LogoutOutlined';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Divider from '@mui/material/Divider';
import { navForPersona, PERSONAS, isNavParent, type IgaPersonaNav, type IgaNavLeaf, type IgaNavParent } from '@/lib/iga-navigation';
import { usePersona } from '@/lib/persona';
import { useBreadcrumbOverride } from '@/lib/breadcrumb';
import { Avatar, useToast } from '@ds/components';
import { AccountSettingsModal, type AccountUser, type SettingsSection } from './AccountSettingsModal';

const titleCase = (s: string) => s.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

/** The signed-in user (single prototype account across personas). */
const ACCOUNT: AccountUser = {
  name: 'Amelia Ford',
  email: 'amelia.ford@acme.com',
  firstName: 'Amelia',
  lastName: 'Ford',
  username: 'amelia.ford',
  jobTitle: 'Access Reviewer',
  department: 'Governance',
  location: '',
};

type Crumb = { label: string; href?: string };

/** Longest-prefix match of the path against every leaf, remembering the owning group. */
function matchNav(pathname: string, navigation: IgaPersonaNav): { parent?: IgaNavParent; item: IgaNavLeaf } | null {
  let best: { parent?: IgaNavParent; item: IgaNavLeaf } | null = null;
  const consider = (item: IgaNavLeaf, parent?: IgaNavParent) => {
    if (pathname === item.href || pathname.startsWith(item.href + '/')) {
      if (!best || item.href.length > best.item.href.length) best = { parent, item };
    }
  };
  for (const section of navigation.sections) {
    for (const entry of section.items) {
      if (isNavParent(entry)) entry.children.forEach((child) => consider(child, entry));
      else consider(entry);
    }
  }
  navigation.footer.forEach((leaf) => consider(leaf));
  return best;
}

function useCrumbs(pathname: string, navigation: IgaPersonaNav): Crumb[] {
  const match = matchNav(pathname, navigation);
  if (!match) {
    const parts = pathname.split('/').filter(Boolean);
    const moduleId = parts[1] ?? 'dashboard';
    const label = titleCase(moduleId);
    const hasDetail = parts.length > 2;
    const crumbs: Crumb[] = [{ label, href: hasDetail ? `/iga/${moduleId}` : undefined }];
    if (hasDetail) crumbs.push({ label: `${label} Details` });
    return crumbs;
  }
  const { parent, item } = match;
  const rest = pathname.slice(item.href.length).split('/').filter(Boolean);
  const hasDetail = rest.length > 0;
  const crumbs: Crumb[] = [];
  if (parent) crumbs.push({ label: parent.label });
  crumbs.push({ label: item.label, href: hasDetail ? item.href : undefined });
  if (hasDetail) crumbs.push({ label: `${item.label} Details` });
  return crumbs;
}

export default function ProductTopbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { persona, setPersona } = usePersona();
  const toast = useToast();
  const override = useBreadcrumbOverride();
  const defaultCrumbs = useCrumbs(pathname, navForPersona[persona]);
  const crumbs = override ?? defaultCrumbs;
  const homeHref = PERSONAS.find((p) => p.id === persona)?.dashboardHref ?? '/iga/dashboard';

  const [appsAnchor, setAppsAnchor] = React.useState<HTMLElement | null>(null);
  const [acctAnchor, setAcctAnchor] = React.useState<HTMLElement | null>(null);
  const [settingsOpen, setSettingsOpen] = React.useState(false);
  const [settingsSection, setSettingsSection] = React.useState<SettingsSection>('profile');

  const openSettings = (section: SettingsSection) => {
    setSettingsSection(section);
    setSettingsOpen(true);
    setAcctAnchor(null);
  };

  return (
    <header className="sticky top-0 z-sticky flex h-16 shrink-0 items-center justify-between border-b border-border bg-canvas px-6">
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-body">
        <Link
          href={homeHref}
          aria-label="Home"
          className="flex h-8 w-8 items-center justify-center rounded-md text-icon hover:bg-surface-hover"
        >
          <GridViewOutlined sx={{ fontSize: 20 }} />
        </Link>
        {crumbs.map((c, i) => (
          <React.Fragment key={i}>
            <NavigateNextOutlined sx={{ fontSize: 18, color: 'var(--ds-color-text-disabled)' }} />
            {c.href ? (
              <Link href={c.href} className="font-medium text-text-link hover:underline">
                {c.label}
              </Link>
            ) : (
              <span className="font-medium text-text-primary">{c.label}</span>
            )}
          </React.Fragment>
        ))}
      </nav>

      <div className="flex items-center gap-2.5">
        <Link
          href="/"
          className="rounded-pill border border-border px-3 py-1 text-caption font-medium text-text-secondary hover:bg-surface-hover"
        >
          Design System
        </Link>
        <button
          type="button"
          aria-label="Notifications"
          className="relative rounded-md p-2 text-icon hover:bg-surface-hover"
        >
          <NotificationsOutlined sx={{ fontSize: 20 }} />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-pill bg-brand ring-2 ring-canvas" />
        </button>

        {/* Apps / persona switcher */}
        <button
          type="button"
          aria-label="Switch console"
          aria-haspopup="menu"
          onClick={(e) => setAppsAnchor(e.currentTarget)}
          className={[
            'grid h-9 w-9 place-items-center rounded-md transition-colors',
            appsAnchor ? 'bg-surface-hover text-text-primary' : 'text-icon hover:bg-surface-hover',
          ].join(' ')}
        >
          <AppsOutlined sx={{ fontSize: 20 }} />
        </button>
        <Menu
          anchorEl={appsAnchor}
          open={Boolean(appsAnchor)}
          onClose={() => setAppsAnchor(null)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          transformOrigin={{ vertical: 'top', horizontal: 'right' }}
          MenuListProps={{ sx: { py: 0.5 } }}
          PaperProps={{ sx: { mt: 1, width: 268, borderRadius: 'var(--ds-radius-lg)', border: '1px solid var(--ds-color-border-default)', boxShadow: 'var(--ds-elevation-lg)' } }}
        >
          <div className="px-3 pb-1.5 pt-1 text-caption font-semibold uppercase tracking-[0.07em] text-text-tertiary">
            Switch console
          </div>
          {PERSONAS.map((p) => {
            const Icon = p.icon;
            const active = p.id === persona;
            return (
              <MenuItem
                key={p.id}
                selected={active}
                onClick={() => {
                  setPersona(p.id);
                  setAppsAnchor(null);
                  router.push(p.dashboardHref);
                }}
                sx={{ borderRadius: 'var(--ds-radius-md)', mx: 0.5, my: 0.25, py: 1, alignItems: 'flex-start', gap: 1.25 }}
              >
                <span className={active ? 'mt-0.5 text-icon-brand' : 'mt-0.5 text-icon'}>
                  <Icon sx={{ fontSize: 20 }} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-1.5">
                    <span className="text-body-sm font-medium text-text-primary">{p.label}</span>
                    {active && <CheckIcon sx={{ fontSize: 15, color: 'var(--ds-color-icon-brand)' }} />}
                  </span>
                  <span className="mt-0.5 block whitespace-normal text-caption leading-4 text-text-secondary">
                    {p.description}
                  </span>
                </span>
              </MenuItem>
            );
          })}
        </Menu>

        {/* Account menu */}
        <button
          type="button"
          aria-label="Account menu"
          aria-haspopup="menu"
          onClick={(e) => setAcctAnchor(e.currentTarget)}
          className={['grid place-items-center rounded-full transition-shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-subtle', acctAnchor ? 'ring-2 ring-brand-subtle' : ''].join(' ')}
        >
          <Avatar name={ACCOUNT.name} initials={ACCOUNT.name.trim().charAt(0).toUpperCase()} size="sm" />
        </button>
        <Menu
          anchorEl={acctAnchor}
          open={Boolean(acctAnchor)}
          onClose={() => setAcctAnchor(null)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          transformOrigin={{ vertical: 'top', horizontal: 'right' }}
          MenuListProps={{ sx: { py: 0.5 } }}
          PaperProps={{ sx: { mt: 1, width: 264, borderRadius: 'var(--ds-radius-lg)', border: '1px solid var(--ds-color-border-default)', boxShadow: 'var(--ds-elevation-lg)' } }}
        >
          {/* identity header */}
          <div className="flex items-center gap-2.5 px-3 pb-2.5 pt-1.5">
            <Avatar name={ACCOUNT.name} initials={ACCOUNT.name.trim().charAt(0).toUpperCase()} size="md" />
            <div className="min-w-0">
              <div className="truncate text-body-sm font-semibold text-text-primary">{ACCOUNT.name}</div>
              <div className="truncate text-caption text-text-secondary">{ACCOUNT.email}</div>
            </div>
          </div>
          <Divider sx={{ borderColor: 'var(--ds-color-border-default)' }} />
          <MenuItem onClick={() => openSettings('profile')} sx={{ borderRadius: 'var(--ds-radius-md)', mx: 0.5, mt: 0.5, my: 0.25, py: 0.9, gap: 1.25 }}>
            <PersonOutline sx={{ fontSize: 19, color: 'var(--ds-color-icon-default)' }} />
            <span className="text-body-sm font-medium text-text-primary">Profile settings</span>
          </MenuItem>
          <MenuItem onClick={() => openSettings('appearance')} sx={{ borderRadius: 'var(--ds-radius-md)', mx: 0.5, my: 0.25, py: 0.9, gap: 1.25 }}>
            <TuneOutlined sx={{ fontSize: 19, color: 'var(--ds-color-icon-default)' }} />
            <span className="text-body-sm font-medium text-text-primary">Preferences</span>
          </MenuItem>
          <Divider sx={{ borderColor: 'var(--ds-color-border-default)', my: 0.5 }} />
          <MenuItem
            onClick={() => {
              setAcctAnchor(null);
              toast.success('Signed out');
            }}
            sx={{ borderRadius: 'var(--ds-radius-md)', mx: 0.5, mb: 0.5, my: 0.25, py: 0.9, gap: 1.25 }}
          >
            <LogoutOutlined sx={{ fontSize: 19, color: 'var(--ds-color-status-danger-fg)' }} />
            <span className="text-body-sm font-medium text-[var(--ds-color-status-danger-fg)]">Log out</span>
          </MenuItem>
        </Menu>
      </div>

      <AccountSettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        user={ACCOUNT}
        initialSection={settingsSection}
        onSave={() => {
          setSettingsOpen(false);
          toast.success('Profile updated');
        }}
      />
    </header>
  );
}
