'use client';

import * as React from 'react';
import MuiDialog from '@mui/material/Dialog';
import CloseIcon from '@mui/icons-material/Close';
import PersonOutline from '@mui/icons-material/PersonOutline';
import PaletteOutlined from '@mui/icons-material/PaletteOutlined';
import RestartAltOutlined from '@mui/icons-material/RestartAltOutlined';
import LightModeOutlined from '@mui/icons-material/LightModeOutlined';
import DarkModeOutlined from '@mui/icons-material/DarkModeOutlined';
import SettingsBrightnessOutlined from '@mui/icons-material/SettingsBrightnessOutlined';
import { Avatar, Button, Input, RadioCardGroup, NavList } from '@ds/components';

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

function AppearanceSection({ theme, onTheme }: { theme: 'light' | 'dark' | 'system'; onTheme: (t: 'light' | 'dark' | 'system') => void }) {
  return (
    <>
      <h2 className="mb-1 text-h5 text-text-primary">Appearance</h2>
      <p className="mb-2 text-body-sm text-text-secondary">Personalize how the console looks on this device.</p>

      <SettingsGroup title="Theme" description="Choose a light or dark interface, or match your device setting." divider={false}>
        <RadioCardGroup
          ariaLabel="Theme"
          columns={3}
          value={theme}
          onChange={(v) => onTheme(v as 'light' | 'dark' | 'system')}
          options={[
            { value: 'light', label: 'Light', description: 'Bright interface', icon: <LightModeOutlined sx={{ fontSize: 18 }} /> },
            { value: 'dark', label: 'Dark', description: 'Dim, low-light', icon: <DarkModeOutlined sx={{ fontSize: 18 }} /> },
            { value: 'system', label: 'System', description: 'Match device', icon: <SettingsBrightnessOutlined sx={{ fontSize: 18 }} /> },
          ]}
        />
      </SettingsGroup>
    </>
  );
}

export default AccountSettingsModal;
