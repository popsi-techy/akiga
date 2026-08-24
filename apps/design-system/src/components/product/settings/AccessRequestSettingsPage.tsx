'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import AutoAwesomeOutlined from '@mui/icons-material/AutoAwesomeOutlined';
import EditOutlined from '@mui/icons-material/EditOutlined';
import VisibilityOutlined from '@mui/icons-material/VisibilityOutlined';
import { Button, Card, Input, Select, StatusChip, Switch, Tabs, Tooltip, useToast } from '@ds/components';
import {
  EMAIL_TEMPLATE_OPTIONS,
  ON_BEHALF_OPTIONS,
  getSystemSettings,
  saveAccessRequestSettings,
  type AccessRequestEntitySettings,
  type AccessRequestSettings,
  type OnBehalfWho,
} from '@/data/system-settings';
import { SettingsRow } from './SettingsRow';
import {
  SettingsActions,
  SettingsDenied,
  SettingsLoading,
  same,
  useAdminSettings,
  useSettingsCrumbs,
} from './SettingsChrome';

const TABS = [
  { value: 'general', label: 'General' },
  { value: 'application', label: 'Application' },
  { value: 'entitlement', label: 'Entitlement' },
  { value: 'role', label: 'Role' },
  { value: 'notification', label: 'Notification' },
] as const;

type Tab = (typeof TABS)[number]['value'];
type SubTab = 'request' | 'approval';

const ENTITY_TABS: Tab[] = ['application', 'entitlement', 'role'];

const COPY: Record<Tab, { title: string; description: string }> = {
  general: {
    title: 'General',
    description: 'Manage access request configuration tenant wide.',
  },
  application: {
    title: 'Application',
    description: 'Manage application access request configuration throughout the product.',
  },
  entitlement: {
    title: 'Entitlement',
    description: 'Manage entitlement access request configuration tenant wide.',
  },
  role: {
    title: 'Role',
    description: 'Manage role access request configuration tenant wide.',
  },
  notification: {
    title: 'Access Request Notification Settings',
    description:
      'Configure the email template sent to users when their access request is fully approved. Leave blank to use the built-in default template.',
  },
};

export function AccessRequestSettingsPage() {
  useSettingsCrumbs('Access Request Settings');
  const allowed = useAdminSettings();
  const toast = useToast();
  const [tab, setTab] = React.useState<Tab>('general');
  const [subTab, setSubTab] = React.useState<SubTab>('request');
  const [value, setValue] = React.useState<AccessRequestSettings | null>(null);
  const [saved, setSaved] = React.useState<AccessRequestSettings | null>(null);

  React.useEffect(() => {
    const next = getSystemSettings().accessRequest;
    setValue(next);
    setSaved(next);
  }, []);

  if (!allowed) return <SettingsDenied />;
  if (!value || !saved) {
    return (
      <SettingsLoading
        title="Access Request Settings"
        description="General, application, entitlement, role, and notification defaults."
      />
    );
  }

  const meta = COPY[tab];
  const isEntity = ENTITY_TABS.includes(tab);

  return (
    <div>
      <div className="mb-4">
        <h1 className="text-h2 text-text-primary">Access Request Settings</h1>
        <p className="mt-1 text-body text-text-secondary">
          General, application, entitlement, role, and notification defaults — one place,
          not five destinations.
        </p>
      </div>

      <Tabs items={[...TABS]} value={tab} onChange={(v) => { setTab(v as Tab); setSubTab('request'); }} aria-label="Access request areas" />

      <div className="mt-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-h5 text-text-primary">{meta.title}</h2>
          <p className="mt-0.5 text-caption text-text-secondary">{meta.description}</p>
        </div>
        <SettingsActions
          dirty={!same(value, saved)}
          onSave={() => {
            setSaved(saveAccessRequestSettings(value));
            toast.success('Access request settings saved');
          }}
        />
      </div>

      {isEntity && (
        <div className="mt-4">
          <Tabs
            items={[
              { value: 'request', label: 'Request Configuration' },
              { value: 'approval', label: 'Approval Configuration' },
            ]}
            value={subTab}
            onChange={(v) => setSubTab(v as SubTab)}
            aria-label={`${meta.title} configuration`}
          />
        </div>
      )}

      <div className="mt-4">
        {tab === 'general' && (
          <SettingsPanel>
            <SettingsRow
              title="Allow access request on behalf"
              description="Enable users to request access on behalf of other users."
            >
              <Switch
                checked={value.general.onBehalfEnabled}
                onChange={(_, checked) =>
                  setValue({ ...value, general: { ...value.general, onBehalfEnabled: checked } })
                }
                inputProps={{ 'aria-label': 'Allow access request on behalf' }}
              />
            </SettingsRow>
            <SettingsRow
              title="Who can request on behalf"
              description="Specify who is allowed to make requests on behalf of others."
            >
              <div className="w-[220px]">
                <Select
                  size="xs"
                  fullWidth
                  disabled={!value.general.onBehalfEnabled}
                  ariaLabel="Who can request on behalf"
                  options={ON_BEHALF_OPTIONS}
                  value={value.general.onBehalfWho}
                  onChange={(onBehalfWho) =>
                    setValue({
                      ...value,
                      general: { ...value.general, onBehalfWho: onBehalfWho as OnBehalfWho },
                    })
                  }
                />
              </div>
            </SettingsRow>
          </SettingsPanel>
        )}

        {tab === 'application' && (
          <EntityPanel
            noun="application"
            plural="applications"
            value={value.application}
            onChange={(application) => setValue({ ...value, application })}
            subTab={subTab}
            showMax
          />
        )}

        {tab === 'entitlement' && (
          <EntityPanel
            noun="entitlement"
            plural="entitlements"
            value={value.entitlement}
            onChange={(entitlement) => setValue({ ...value, entitlement })}
            subTab={subTab}
          />
        )}

        {tab === 'role' && (
          <EntityPanel
            noun="role"
            plural="roles"
            value={value.role}
            onChange={(role) => setValue({ ...value, role })}
            subTab={subTab}
            showMax
          />
        )}

        {tab === 'notification' && (
          <NotificationPanel
            value={value.notification}
            onChange={(notification) => setValue({ ...value, notification })}
          />
        )}
      </div>
    </div>
  );
}

function SettingsPanel({ children }: { children: React.ReactNode }) {
  return (
    <Card padding="md">
      <div className="divide-y divide-border">{children}</div>
    </Card>
  );
}

function EntityPanel({
  noun,
  plural,
  value,
  onChange,
  subTab,
  showMax,
}: {
  noun: 'application' | 'entitlement' | 'role';
  plural: string;
  value: AccessRequestEntitySettings;
  onChange: (next: AccessRequestEntitySettings) => void;
  subTab: SubTab;
  showMax?: boolean;
}) {
  const router = useRouter();

  if (subTab === 'approval') {
    return (
      <SettingsPanel>
        <SettingsRow
          title="Approval Workflow Policy"
          description={`Configure workflow approval policies for ${plural}.`}
        >
          <StatusChip intent="info" label={value.approvalPolicyName} dot={false} />
          <Tooltip title="Open approval policies">
            <button
              type="button"
              aria-label="Edit approval workflow policy"
              onClick={() => router.push('/iga/automation/approval-policies')}
              className="grid h-8 w-8 place-items-center rounded-md text-icon hover:bg-surface-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-subtle"
            >
              <EditOutlined sx={{ fontSize: 18 }} />
            </button>
          </Tooltip>
        </SettingsRow>
      </SettingsPanel>
    );
  }

  return (
    <SettingsPanel>
      <SettingsRow
        title="Requestable"
        description={`Specify whether users can request ${noun} access for themselves or other users.`}
      >
        <Switch
          checked={value.requestable}
          onChange={(_, checked) => onChange({ ...value, requestable: checked })}
          inputProps={{ 'aria-label': `${noun} requestable` }}
        />
      </SettingsRow>
      {showMax && value.maxItemsPerRequest != null && (
        <SettingsRow
          title="Maximum items allowed per request"
          description={`Specify number of ${plural} users can request access for.`}
          hint="A smaller number keeps each request reviewable. An owner can still set a lower cap on one object."
        >
          <div className="w-[72px]">
            <Input
              type="number"
              size="xs"
              fullWidth
              inputProps={{ min: 1, max: 200, 'aria-label': 'Maximum items allowed per request' }}
              value={String(value.maxItemsPerRequest)}
              onChange={(e) => {
                const n = Number(e.target.value);
                if (Number.isNaN(n)) return;
                onChange({ ...value, maxItemsPerRequest: Math.min(200, Math.max(1, n)) });
              }}
            />
          </div>
        </SettingsRow>
      )}
    </SettingsPanel>
  );
}

function NotificationPanel({
  value,
  onChange,
}: {
  value: AccessRequestSettings['notification'];
  onChange: (next: AccessRequestSettings['notification']) => void;
}) {
  const toast = useToast();
  return (
    <Card padding="md">
      <div className="mb-1.5 flex flex-wrap items-center justify-between gap-3">
        <p className="text-body-sm-strong text-text-primary">Approval Completion Email Template</p>
        <div className="flex flex-wrap items-center gap-1">
          <Button
            variant="tertiary"
            size="xs"
            startIcon={<VisibilityOutlined sx={{ fontSize: 16 }} />}
            onClick={() => toast.info('Template preview is not available in this prototype')}
          >
            Review
          </Button>
          <Button
            variant="tertiary"
            size="xs"
            startIcon={<AutoAwesomeOutlined sx={{ fontSize: 16 }} />}
            onClick={() => {
              onChange({ emailTemplateId: 'approval-complete-default' });
              toast.success('Default template loaded');
            }}
          >
            Load Default Template
          </Button>
        </div>
      </div>
      <div className="max-w-xl">
        <Select
          size="sm"
          fullWidth
          ariaLabel="Approval completion email template"
          options={[...EMAIL_TEMPLATE_OPTIONS]}
          value={value.emailTemplateId}
          onChange={(emailTemplateId) => onChange({ emailTemplateId })}
        />
      </div>
    </Card>
  );
}
