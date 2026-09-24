'use client';

import * as React from 'react';
import MuiDialog from '@mui/material/Dialog';
import CloseIcon from '@mui/icons-material/Close';
import PersonOutline from '@mui/icons-material/PersonOutline';
import PaletteOutlined from '@mui/icons-material/PaletteOutlined';
import RestartAltOutlined from '@mui/icons-material/RestartAltOutlined';
import { Avatar, Button, Input, NavList } from '@ds/components';

/** The signed-in user's editable profile. */
export interface AccountUser {
  name: string;
  email: string;
  firstName: string;
  lastName: string;
  username: string;
  jobTitle: string;
  department: string;
  location?: string;
}

export type SettingsSection = 'profile' | 'appearance';

const NAV: { id: SettingsSection; label: string; icon: React.ReactNode }[] = [
  { id: 'profile', label: 'Profile', icon: <PersonOutline sx={{ fontSize: 18 }} /> },
  { id: 'appearance', label: 'Appearance', icon: <PaletteOutlined sx={{ fontSize: 18 }} /> },
];

export function AccountSettingsModal({
  open,
  onClose,
  user,
  initialSection = 'profile',
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  user: AccountUser;
  initialSection?: SettingsSection;
  onSave?: (user: AccountUser) => void;
}) {
  const [section, setSection] = React.useState<SettingsSection>(initialSection);
  const [form, setForm] = React.useState<AccountUser>(user);
  const [theme, setTheme] = React.useState<'light' | 'dark' | 'system'>('system');

  React.useEffect(() => {
    if (open) {
      setSection(initialSection);
      setForm(user);
    }
  }, [open, initialSection, user]);

  const dirty = JSON.stringify(form) !== JSON.stringify(user);
  const set = (k: keyof AccountUser) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <MuiDialog
      open={open}
      onClose={onClose}
      PaperProps={{ sx: { width: 1000, maxWidth: '94vw', height: 640, maxHeight: '90vh', borderRadius: 'var(--ds-radius-xl)', overflow: 'hidden' } }}
    >
      <div className="flex h-full min-h-0">
        {/* nav pane */}
        <aside className="flex w-[224px] shrink-0 flex-col border-r border-border bg-subtle/50 p-3">
          <div className="px-2 pb-2 pt-1 text-caption-strong uppercase tracking-[0.07em] text-text-tertiary">Settings</div>
          <NavList
            ariaLabel="Settings sections"
            items={NAV.map((n) => ({ id: n.id, label: n.label, icon: n.icon }))}
            value={section}
            onChange={(id) => setSection(id as SettingsSection)}
          />
        </aside>

        {/* main pane */}
        <div className="relative flex min-w-0 flex-1 flex-col">
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="absolute right-4 top-4 z-10 grid h-8 w-8 place-items-center rounded-md text-icon hover:bg-surface-hover"
          >
            <CloseIcon sx={{ fontSize: 20 }} />
          </button>

          <div className="ds-scroll min-h-0 flex-1 overflow-y-auto px-8 py-6">
            {section === 'profile' ? (
              <ProfileSection user={user} form={form} set={set} dirty={dirty} onReset={() => setForm(user)} onSave={() => onSave?.(form)} />
            ) : (
              <AppearanceSection theme={theme} onTheme={setTheme} />
            )}
          </div>
        </div>
      </div>
    </MuiDialog>
  );
}

function SettingsGroup({ title, description, children, divider = true }: { title: string; description: string; children: React.ReactNode; divider?: boolean }) {
  return (
    <div className={['grid gap-x-8 gap-y-4 py-6 md:grid-cols-[minmax(0,200px)_minmax(0,1fr)]', divider ? 'border-b border-border' : ''].join(' ')}>
      <div>
        <h3 className="text-body-strong text-text-primary">{title}</h3>
        <p className="mt-1 text-body-sm leading-5 text-text-secondary">{description}</p>
      </div>
      <div className="min-w-0">{children}</div>
    </div>
  );
}

function ProfileSection({
  user,
  form,
  set,
  dirty,
  onReset,
  onSave,
}: {
  user: AccountUser;
  form: AccountUser;
  set: (k: keyof AccountUser) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  dirty: boolean;
  onReset: () => void;
  onSave: () => void;
}) {
  return (
    <>
      <h2 className="mb-1 text-h5 text-text-primary">Profile</h2>
      <p className="mb-5 text-body-sm text-text-secondary">Manage your identity and how you appear across the console.</p>

      {/* identity banner */}
      <div className="mb-6 flex items-center gap-3 rounded-xl border border-border bg-subtle px-4 py-3">
        <Avatar name={user.name} initials={user.name.trim().charAt(0).toUpperCase()} size="md" kind="person" />
        <div className="min-w-0">
          <div className="truncate text-h5 text-text-primary">{user.name}</div>
          <div className="truncate text-body-sm text-text-secondary">
            {[user.email, user.jobTitle, user.department].filter(Boolean).join(' · ')}
          </div>
        </div>
      </div>

      {/* heading + actions */}
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-h5 text-text-primary">Basic Information</h2>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={onReset}
            disabled={!dirty}
            aria-label="Reset changes"
            title="Reset changes"
            className="grid h-8 w-8 place-items-center rounded-md text-icon transition-colors hover:bg-surface-hover hover:text-text-primary disabled:pointer-events-none disabled:opacity-40"
          >
            <RestartAltOutlined sx={{ fontSize: 18 }} />
          </button>
          <Button disabled={!dirty} onClick={onSave}>Save</Button>
        </div>
      </div>

      <SettingsGroup title="Personal Information" description="Basic identity details visible across the platform.">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input label="First Name" required value={form.firstName} onChange={set('firstName')} />
          <Input label="Last Name" required value={form.lastName} onChange={set('lastName')} />
          <Input label="Username" required value={form.username} onChange={set('username')} />
          <Input label="Email" required type="email" value={form.email} onChange={set('email')} />
        </div>
      </SettingsGroup>

      <SettingsGroup title="Organization" description="Placement within your company's reporting and access hierarchy.">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input label="Job Title" value={form.jobTitle} onChange={set('jobTitle')} />
          <Input label="Department" value={form.department} onChange={set('department')} />
        </div>
      </SettingsGroup>

      <SettingsGroup title="Location" description="Used for regional access policies and localized scheduling." divider={false}>
        <Input label="Location" placeholder="e.g. California, USA" value={form.location ?? ''} onChange={set('location')} />
      </SettingsGroup>
    </>
  );
}

type ThemeChoice = 'light' | 'dark' | 'system';

const THEMES: { id: ThemeChoice; label: string; hint: string }[] = [
  { id: 'light', label: 'Light', hint: 'Bright canvas' },
  { id: 'dark', label: 'Dark', hint: 'Dim, low light' },
  { id: 'system', label: 'System', hint: 'Follow this device' },
];

function AppearanceSection({ theme, onTheme }: { theme: ThemeChoice; onTheme: (t: ThemeChoice) => void }) {
  return (
    <>
      <h2 className="mb-1 text-h5 text-text-primary">Appearance</h2>
      <p className="mb-6 text-body-sm text-text-secondary">
        How the console looks on this device.
      </p>

      <div role="radiogroup" aria-label="Theme" className="grid grid-cols-3 gap-3">
        {THEMES.map((opt) => {
          const selected = theme === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onTheme(opt.id)}
              className={[
                'flex flex-col gap-2.5 rounded-xl border p-2 text-left transition-colors',
                'outline-none focus-visible:ring-2 focus-visible:ring-brand/30',
                selected
                  ? 'border-brand bg-surface'
                  : 'border-border bg-surface hover:border-border-strong hover:bg-subtle',
              ].join(' ')}
            >
              <ThemeSwatch id={opt.id} />
              <span className="px-1 pb-0.5">
                <span className="block text-body-sm-medium text-text-primary">{opt.label}</span>
                <span className="mt-0.5 block text-caption text-text-secondary">{opt.hint}</span>
              </span>
            </button>
          );
        })}
      </div>
    </>
  );
}

/** A postage-stamp of the console — one rail, then the page — so the choice is seen, not read. */
function ThemeSwatch({ id }: { id: ThemeChoice }) {
  return (
    <div className="pointer-events-none flex h-[88px] overflow-hidden rounded-lg border border-border-subtle" aria-hidden>
      <div className="flex w-4 shrink-0 flex-col items-center bg-sidebar pt-2">
        <span className="h-1.5 w-1.5 rounded-pill bg-brand" />
      </div>
      {id === 'system' ? (
        <>
          <ConsolePage tone="light" />
          <ConsolePage tone="dark" />
        </>
      ) : (
        <ConsolePage tone={id} />
      )}
    </div>
  );
}

function ConsolePage({ tone }: { tone: 'light' | 'dark' }) {
  const dark = tone === 'dark';
  return (
    <div className={['flex min-w-0 flex-1 flex-col justify-center gap-1.5 px-2', dark ? 'bg-surface-inverse' : 'bg-canvas'].join(' ')}>
      <span className={['h-1.5 w-7 rounded-pill', dark ? 'bg-text-inverse/50' : 'bg-border-strong'].join(' ')} />
      <span className={['h-2.5 rounded-sm', dark ? 'bg-text-inverse/30' : 'bg-sunken'].join(' ')} />
      <span className={['h-2.5 w-3/5 rounded-sm', dark ? 'bg-text-inverse/20' : 'bg-border-strong'].join(' ')} />
    </div>
  );
}

export default AccountSettingsModal;
