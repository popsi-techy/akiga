'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import AppsOutlined from '@mui/icons-material/AppsOutlined';
import AutoAwesomeOutlined from '@mui/icons-material/AutoAwesomeOutlined';
import BadgeOutlined from '@mui/icons-material/BadgeOutlined';
import EditOutlined from '@mui/icons-material/EditOutlined';
import EmailOutlined from '@mui/icons-material/EmailOutlined';
import ShieldOutlined from '@mui/icons-material/ShieldOutlined';
import TuneOutlined from '@mui/icons-material/TuneOutlined';
import VisibilityOutlined from '@mui/icons-material/VisibilityOutlined';
import {
  Button,
  Card,
  Input,
  NavList,
  Select,
  SettingsInfoBanner,
  SettingsNested,
  SettingsNestedRow,
  SettingsRow,
  SettingsSection,
  SettingsStack,
  StatusChip,
  Switch,
  Tabs,
  Tooltip,
  useToast,
} from '@ds/components';
import {
  EMAIL_TEMPLATE_OPTIONS,
  ON_BEHALF_OPTIONS,
  getSystemSettings,
  saveAccessRequestSettings,
  type AccessRequestEntitySettings,
  type AccessRequestSettings,
  type OnBehalfWho,
} from '@/data/system-settings';
import { getSystemSettingsSection } from '@/data/system-settings-catalog';
import {
  SettingsDenied,
  same,
  useAdminSettings,
  useSettingsCrumbs,
} from './SettingsChrome';

const SECTION = getSystemSettingsSection('access-request')!;

const TABS = [
  { id: 'general', label: 'General', icon: <TuneOutlined sx={{ fontSize: 18 }} /> },
  { id: 'application', label: 'Application', icon: <AppsOutlined sx={{ fontSize: 18 }} /> },
  { id: 'entitlement', label: 'Entitlement', icon: <ShieldOutlined sx={{ fontSize: 18 }} /> },
  { id: 'role', label: 'Role', icon: <BadgeOutlined sx={{ fontSize: 18 }} /> },
  { id: 'notification', label: 'Notification', icon: <EmailOutlined sx={{ fontSize: 18 }} /> },
] as const;

type Tab = (typeof TABS)[number]['id'];
type EntityPane = 'request' | 'approval';

const ENTITY_TABS: ReadonlySet<Tab> = new Set(['application', 'entitlement', 'role']);

const ENTITY_PANES: { value: EntityPane; label: string }[] = [
  { value: 'request', label: 'Request Configuration' },
  { value: 'approval', label: 'Approval Configuration' },
];

function sliceOf(settings: AccessRequestSettings, tab: Tab) {
  return settings[tab];
}

export function AccessRequestSettingsPage() {
  useSettingsCrumbs(SECTION.title);
  const allowed = useAdminSettings();
  const toast = useToast();
  const [tab, setTab] = React.useState<Tab>('general');
  const [entityPane, setEntityPane] = React.useState<EntityPane>('request');
  const [value, setValue] = React.useState<AccessRequestSettings | null>(null);
  const [saved, setSaved] = React.useState<AccessRequestSettings | null>(null);

  React.useEffect(() => {
    const next = getSystemSettings().accessRequest;
    setValue(next);
    setSaved(next);
  }, []);

  if (!allowed) return <SettingsDenied />;
  if (!value || !saved) {
    return <p className="text-body-sm text-text-secondary">Loading settings…</p>;
  }

  const pane = TABS.find((item) => item.id === tab)!;
  const isEntity = ENTITY_TABS.has(tab);
  const entityMeta = ENTITY_PANES.find((item) => item.value === entityPane)!;
  const dirty = !same(sliceOf(value, tab), sliceOf(saved, tab));

  const save = () => {
    setSaved(saveAccessRequestSettings({ ...saved, [tab]: value[tab] }));
    toast.success('Access request settings saved');
  };

  const reset = () => setValue({ ...value, [tab]: saved[tab] });

  return (
    <div className="flex min-h-full flex-col">
      <h1 className="sr-only">{SECTION.title}</h1>

      <div className="grid min-h-0 flex-1 grid-cols-[240px_minmax(0,1fr)] items-stretch gap-5">
        <Card padding="2xs" className="h-full min-h-0 w-[240px]">
          <NavList
            ariaLabel="Access request areas"
            value={tab}
            onChange={(id) => setTab(id as Tab)}
            items={[...TABS]}
          />
        </Card>

        <div className="min-w-0 max-w-[900px]">
          {isEntity ? (
            <section aria-labelledby={`access-request-${tab}`}>
              <h2 id={`access-request-${tab}`} className="mb-4 text-h5 text-text-primary">
                {pane.label}
              </h2>
              <div className="mb-4">
                <Tabs
                  items={ENTITY_PANES}
                  value={entityPane}
                  onChange={(id) => setEntityPane(id as EntityPane)}
                  aria-label={`${pane.label} configuration`}
                />
              </div>
              <SettingsSection
                id={`access-request-${tab}-${entityPane}`}
                title={entityMeta.label}
                onReset={reset}
                resetDisabled={!dirty}
                onSave={save}
                saveDisabled={!dirty}
              >
                {tab === 'application' && (
                  <EntityPanel
                    pane={entityPane}
                    noun="application"
                    plural="applications"
                    value={value.application}
                    onChange={(application) => setValue({ ...value, application })}
                    showMax
                  />
                )}
                {tab === 'entitlement' && (
                  <EntityPanel
                    pane={entityPane}
                    noun="entitlement"
                    plural="entitlements"
                    value={value.entitlement}
                    onChange={(entitlement) => setValue({ ...value, entitlement })}
                  />
                )}
                {tab === 'role' && (
                  <EntityPanel
                    pane={entityPane}
                    noun="role"
                    plural="roles"
                    value={value.role}
                    onChange={(role) => setValue({ ...value, role })}
                    showMax
                  />
                )}
              </SettingsSection>
            </section>
          ) : (
            <SettingsSection
              id={`access-request-${tab}`}
              title={pane.label}
              onReset={reset}
              resetDisabled={!dirty}
              onSave={save}
              saveDisabled={!dirty}
            >
              {tab === 'general' && (
                <GeneralPanel
                  value={value.general}
                  onChange={(general) => setValue({ ...value, general })}
                />
              )}
              {tab === 'notification' && (
                <NotificationPanel
                  value={value.notification}
                  onChange={(notification) => setValue({ ...value, notification })}
                />
              )}
            </SettingsSection>
          )}
        </div>
      </div>
    </div>
  );
}

function GeneralPanel({
  value,
  onChange,
}: {
  value: AccessRequestSettings['general'];
  onChange: (next: AccessRequestSettings['general']) => void;
}) {
  return (
    <>
      <SettingsStack>
        <SettingsRow
          surface="subtle"
          title="Allow access request on behalf"
          description="Enable users to request access on behalf of other users."
          nested={
            value.onBehalfEnabled ? (
              <SettingsNested>
                <SettingsNestedRow
                  title="Who can request on behalf"
                  description="Specify who is allowed to make requests on behalf of others."
                >
                  <div className="w-[220px]">
                    <Select
                      size="sm"
                      fullWidth
                      ariaLabel="Who can request on behalf"
                      options={ON_BEHALF_OPTIONS}
                      value={value.onBehalfWho}
                      onChange={(onBehalfWho) =>
                        onChange({ ...value, onBehalfWho: onBehalfWho as OnBehalfWho })
                      }
                    />
                  </div>
                </SettingsNestedRow>
              </SettingsNested>
            ) : null
          }
        >
          <Switch
            checked={value.onBehalfEnabled}
            onChange={(_, checked) => onChange({ ...value, onBehalfEnabled: checked })}
            inputProps={{ 'aria-label': 'Allow access request on behalf' }}
          />
        </SettingsRow>
      </SettingsStack>
      <div className="mt-4">
        {value.onBehalfEnabled ? (
          <SettingsInfoBanner>
            Users can submit access requests for other people, limited to the group you chose.
          </SettingsInfoBanner>
        ) : (
          <SettingsInfoBanner>
            Users can only request access for themselves.
          </SettingsInfoBanner>
        )}
      </div>
    </>
  );
}

function EntityPanel({
  pane,
  noun,
  plural,
  value,
  onChange,
  showMax,
}: {
  pane: EntityPane;
  noun: 'application' | 'entitlement' | 'role';
  plural: string;
  value: AccessRequestEntitySettings;
  onChange: (next: AccessRequestEntitySettings) => void;
  showMax?: boolean;
}) {
  const router = useRouter();

  if (pane === 'approval') {
    return (
      <SettingsStack>
        <SettingsRow
          surface="subtle"
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
      </SettingsStack>
    );
  }

  return (
    <SettingsStack>
      <SettingsRow
        surface="subtle"
        title="Requestable"
        description={`Specify whether users can request ${noun} access for themselves or other users.`}
        nested={
          showMax && value.requestable && value.maxItemsPerRequest != null ? (
            <SettingsNested>
              <SettingsNestedRow
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
                      onChange({
                        ...value,
                        maxItemsPerRequest: Math.min(200, Math.max(1, n)),
                      });
                    }}
                  />
                </div>
              </SettingsNestedRow>
            </SettingsNested>
          ) : null
        }
      >
        <Switch
          checked={value.requestable}
          onChange={(_, checked) => onChange({ ...value, requestable: checked })}
          inputProps={{ 'aria-label': `${noun} requestable` }}
        />
      </SettingsRow>
    </SettingsStack>
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
    <>
      <SettingsStack>
        <SettingsRow
          surface="subtle"
          align="start"
          title="Approval Completion Email Template"
          description="The email sent when every approver has signed off."
        >
          <div className="w-[280px]">
            <Select
              size="sm"
              fullWidth
              ariaLabel="Approval completion email template"
              options={[...EMAIL_TEMPLATE_OPTIONS]}
              value={value.emailTemplateId}
              onChange={(emailTemplateId) => onChange({ emailTemplateId })}
            />
          </div>
        </SettingsRow>
      </SettingsStack>
      <div className="mt-3 flex flex-wrap justify-end gap-1">
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
    </>
  );
}
