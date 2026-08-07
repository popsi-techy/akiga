'use client';

import * as React from 'react';
import GroupsOutlined from '@mui/icons-material/GroupsOutlined';
import PersonOutline from '@mui/icons-material/PersonOutline';
import InfoOutlined from '@mui/icons-material/InfoOutlined';
import { Select, Input, Button, SelectableList, Switch, Tooltip } from '@ds/components';
import {
  APPROVER_TYPE_LABEL,
  MULTI_APPROVER_TYPES,
  type ApprovalLevelConfig as ALConfig,
  type ApproverType,
  type FallbackAction,
  type FallbackApproverResolution,
} from '@/data/automation-types';
import { listUsers, listGovernanceGroups, getUser, getGovernanceGroup } from '@/data/directory';
import { SingleSelectDrawer } from './SingleSelectDrawer';
import { ConfigSection, FieldLabel } from './config-kit';

const APPROVER_OPTIONS = (Object.entries(APPROVER_TYPE_LABEL) as [ApproverType, string][]).map(([value, label]) => ({ value, label }));

const FALLBACK_ACTION_OPTIONS: { value: FallbackAction; label: string }[] = [
  { value: 'autoApprove', label: 'Auto Approve' },
  { value: 'autoReject', label: 'Auto Reject' },
  { value: 'notify', label: 'Notify' },
  { value: 'fallbackApprover', label: 'Add Fallback Approver' },
];
const FALLBACK_APPROVER_RESOLUTION_OPTIONS: { value: FallbackApproverResolution; label: string }[] = [
  { value: 'autoApprove', label: 'Auto Approve' },
  { value: 'autoReject', label: 'Auto Reject' },
  { value: 'createBranch', label: 'Create Fallback SLA Breached Branch' },
];

export function ApprovalLevelConfig({ config, onChange }: { config: ALConfig; onChange: (next: ALConfig) => void }) {
  const [groupDrawer, setGroupDrawer] = React.useState(false);
  const [userDrawer, setUserDrawer] = React.useState(false);

  const set = (patch: Partial<ALConfig>) => onChange({ ...config, ...patch });
  const setFallback = (patch: Partial<ALConfig['fallback']>) => set({ fallback: { ...config.fallback, ...patch } });
  const changeApprover = (t: ApproverType) =>
    onChange({
      ...config,
      approverType: t,
      governanceGroupId: undefined,
      userId: undefined,
      ...(MULTI_APPROVER_TYPES.includes(t) ? {} : { completionRule: undefined }),
    });

  const showCompletion = !!config.approverType && MULTI_APPROVER_TYPES.includes(config.approverType);
  const group = config.governanceGroupId ? getGovernanceGroup(config.governanceGroupId) : undefined;
  const user = config.userId ? getUser(config.userId) : undefined;

  return (
    <div>
      <ConfigSection label="Approver" first>
        <Select
          options={APPROVER_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
          value={config.approverType ?? ''}
          placeholder="Select approver type"
          onChange={(v) => changeApprover(v as ApproverType)}
        />

        {/* Dependent controls live inside the Approver group — no divider. */}
        {config.approverType === 'governanceGroup' && (
          <div className="mt-4">
            <FieldLabel>Governance group</FieldLabel>
            <PickerRow value={group?.name} selectLabel="Select Governance Group" icon={<GroupsOutlined sx={{ fontSize: 16 }} />} onOpen={() => setGroupDrawer(true)} />
          </div>
        )}
        {config.approverType === 'user' && (
          <div className="mt-4">
            <FieldLabel>User</FieldLabel>
            <PickerRow value={user?.name} selectLabel="Select User" icon={<PersonOutline sx={{ fontSize: 16 }} />} onOpen={() => setUserDrawer(true)} />
          </div>
        )}
        {showCompletion && (
          <div className="mt-4">
            <FieldLabel>Completion rule</FieldLabel>
            <Select
              options={[
                { value: 'all', label: 'All approvers must approve' },
                { value: 'anyOne', label: 'Any one approver' },
                { value: 'majority', label: 'Majority' },
              ]}
              value={config.completionRule ?? ''}
              placeholder="Select a rule"
              onChange={(v) => set({ completionRule: v as ALConfig['completionRule'] })}
            />
          </div>
        )}

        {/* Fallback lives in the Approver group too — no divider before it. */}
        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="text-body-sm font-medium text-text-primary">Add fallback</span>
            <Tooltip title="Used when primary approver is not found." placement="top">
              <span
                tabIndex={0}
                role="img"
                aria-label="About fallback"
                className="grid h-4 w-4 shrink-0 place-items-center rounded-full text-icon-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-subtle"
              >
                <InfoOutlined sx={{ fontSize: 15 }} />
              </span>
            </Tooltip>
          </div>
          <Switch
            size="sm"
            checked={config.fallback.enabled}
            onChange={(e) => setFallback({ enabled: e.target.checked })}
            inputProps={{ 'aria-label': 'Add fallback' }}
          />
        </div>

        {config.fallback.enabled && (
          <div className="mt-4 space-y-4">
            <div>
                  <FieldLabel>If primary approver not found</FieldLabel>
              <Select
                options={FALLBACK_ACTION_OPTIONS}
                value={config.fallback.action ?? ''}
                placeholder="Select action"
                onChange={(v) => {
                  const action = v as FallbackAction;
                  // Custom Email is on by default for Notify; keep an existing choice if set.
                  setFallback(
                    action === 'notify'
                      ? { action, notifyCustomEmail: config.fallback.notifyCustomEmail ?? true }
                      : { action },
                  );
                }}
              />
            </div>

            {config.fallback.action === 'notify' && (
              <div className="space-y-3">
                <SelectableList
                  ariaLabel="Notify"
                  selected={[
                    ...(config.fallback.notifyAdmin ? ['admin'] : []),
                    ...((config.fallback.notifyCustomEmail ?? true) ? ['email'] : []),
                  ]}
                  onToggle={(id) =>
                    setFallback(
                      id === 'admin'
                        ? { notifyAdmin: !config.fallback.notifyAdmin }
                        : { notifyCustomEmail: !(config.fallback.notifyCustomEmail ?? true) },
                    )
                  }
                  items={[
                    { id: 'admin', label: 'Admin' },
                    { id: 'email', label: 'Custom Email' },
                  ]}
                />
                {(config.fallback.notifyCustomEmail ?? true) && (
                  <Input
                    label="Email address"
                    type="email"
                    size="sm"
                    placeholder="name@company.com"
                    value={config.fallback.notifyEmail ?? ''}
                    onChange={(e) => setFallback({ notifyEmail: e.target.value })}
                  />
                )}
              </div>
            )}

            {config.fallback.action === 'fallbackApprover' && (
              <div className="space-y-3 rounded-md bg-subtle p-3">
                <Input
                  label="Fallback approver email"
                  type="email"
                  size="sm"
                  placeholder="name@company.com"
                  value={config.fallback.approverEmail ?? ''}
                  onChange={(e) => setFallback({ approverEmail: e.target.value })}
                />
                <div>
                  <FieldLabel>If fallback approver&apos;s SLA Breached</FieldLabel>
                  <Select
                    options={FALLBACK_APPROVER_RESOLUTION_OPTIONS}
                    value={config.fallback.approverResolution ?? ''}
                    placeholder="Select action"
                    onChange={(v) => setFallback({ approverResolution: v as FallbackApproverResolution })}
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </ConfigSection>

      <ConfigSection label="SLA Configuration">
        <div className="grid grid-cols-3 gap-2.5">
          {(['days', 'hours', 'minutes'] as const).map((unit) => (
            <Input key={unit} label={unit[0].toUpperCase() + unit.slice(1)} type="number" size="sm" value={String(config.sla[unit])} onChange={(e) => set({ sla: { ...config.sla, [unit]: Math.max(0, Number(e.target.value) || 0) } })} />
          ))}
        </div>
        <div className="mt-3">
          <FieldLabel>When the SLA expires</FieldLabel>
          <Select
            options={[
              { value: 'autoApprove', label: 'Auto approve' },
              { value: 'autoReject', label: 'Auto reject' },
              { value: 'createBranch', label: 'Create an SLA-breach branch' },
            ]}
            value={config.sla.afterExpiry}
            onChange={(v) => set({ sla: { ...config.sla, afterExpiry: v as ALConfig['sla']['afterExpiry'] } })}
          />
        </div>
      </ConfigSection>

      <SingleSelectDrawer
        open={groupDrawer}
        onClose={() => setGroupDrawer(false)}
        title="Select Governance Group"
        subtitle="Choose the group that will approve at this level."
        icon={<GroupsOutlined sx={{ fontSize: 22, color: 'var(--ds-color-brand-primary)' }} />}
        items={listGovernanceGroups().map((g) => ({ id: g.id, primary: g.name, secondary: `${g.members} members` }))}
        selectedId={config.governanceGroupId}
        onSelect={(id) => set({ governanceGroupId: id })}
        searchPlaceholder="Search groups"
      />
      <SingleSelectDrawer
        open={userDrawer}
        onClose={() => setUserDrawer(false)}
        title="Select User"
        subtitle="Choose the individual approver for this level."
        icon={<PersonOutline sx={{ fontSize: 22, color: 'var(--ds-color-brand-primary)' }} />}
        items={listUsers().map((u) => ({ id: u.id, primary: u.name, secondary: u.email }))}
        selectedId={config.userId}
        onSelect={(id) => set({ userId: id })}
        searchPlaceholder="Search people"
      />
    </div>
  );
}

function PickerRow({ value, onOpen, icon, selectLabel = 'Select' }: { value?: string; placeholder?: string; onOpen: () => void; icon?: React.ReactNode; selectLabel?: string }) {
  // Empty state: a single outlined "Select …" button (icon + label).
  if (!value) {
    return (
      <button
        type="button"
        onClick={onOpen}
        className="flex w-full items-center gap-2 rounded-md border border-border bg-surface px-3 py-2 text-body-sm font-medium text-text-secondary transition-colors hover:border-border-strong hover:text-text-primary"
      >
        {icon && <span className="flex shrink-0 items-center text-icon">{icon}</span>}
        {selectLabel}
      </button>
    );
  }
  // Selected state: the value (click to change) + an Edit button.
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={onOpen}
        className="flex h-9 flex-1 items-center gap-2 rounded-md bg-subtle px-3 text-left text-body-sm text-text-primary transition-colors hover:bg-surface-hover"
      >
        {icon && <span className="flex shrink-0 items-center text-icon">{icon}</span>}
        <span className="truncate">{value}</span>
      </button>
      <Button variant="secondary" size="sm" onClick={onOpen}>
        Edit
      </Button>
    </div>
  );
}

export default ApprovalLevelConfig;
