'use client';

import * as React from 'react';
import AddIcon from '@mui/icons-material/Add';
import CloseOutlined from '@mui/icons-material/Close';
import { Checkbox, Input, Select, Switch } from '@ds/components';
import { ConfigSection, FieldLabel, Hint } from './config-kit';
import { ACCOUNT_ACTION_LABEL } from './workflow-visuals';
import type {
  AccountActionConfig,
  AccountActionKind,
  DelegateAccessConfig,
  ManageLicenseConfig,
  ProvisionAccountConfig,
  RevokeAccessConfig,
  SetAttributesConfig,
  TargetSystem,
  TriggerReviewConfig,
} from '@/data/automation-types';

/**
 * Config panels for the seven lifecycle operations.
 *
 * One file, because they share a shape — a target, a mode, a list — and seven files
 * repeating the same three patterns would drift. They are separate *components*
 * rather than one generic form because the questions differ in kind: "which
 * systems" and "which actions" want different controls, and a schema-driven form
 * that rendered both would end up describing every field in a config object
 * instead of in a component, which is harder to read and no shorter.
 *
 * All of them stay light. The builder's job is assembling the flow; deciding the
 * exact licence SKU or mail-domain expression is a connector-level concern, and a
 * panel that tried to own it would be a worse version of the tool that does.
 */

/** Free-text list of names — systems, services, licences, assets. */
function NameList({
  label,
  hint,
  placeholder,
  values,
  onChange,
}: {
  label: string;
  hint?: string;
  placeholder: string;
  values: string[];
  onChange: (next: string[]) => void;
}) {
  const [draft, setDraft] = React.useState('');
  const add = () => {
    const v = draft.trim();
    if (!v || values.includes(v)) return;
    onChange([...values, v]);
    setDraft('');
  };

  return (
    <div>
      <FieldLabel>{label}</FieldLabel>
      {hint && <Hint>{hint}</Hint>}
      {values.length > 0 && (
        <ul className="mb-2 mt-2 flex flex-wrap gap-1.5">
          {values.map((v) => (
            <li
              key={v}
              className="flex items-center gap-1 rounded-pill border border-border bg-subtle py-0.5 pl-2.5 pr-1 text-caption-medium text-text-primary"
            >
              {v}
              <button
                type="button"
                aria-label={`Remove ${v}`}
                onClick={() => onChange(values.filter((x) => x !== v))}
                className="grid h-5 w-5 place-items-center rounded-full text-icon transition-colors hover:bg-surface-hover hover:text-text-primary"
              >
                <CloseOutlined sx={{ fontSize: 13 }} />
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="mt-2 flex items-center gap-2">
        <div className="min-w-0 flex-1">
          <Input
            size="sm"
            placeholder={placeholder}
            aria-label={label}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                add();
              }
            }}
          />
        </div>
        <button
          type="button"
          onClick={add}
          disabled={!draft.trim()}
          aria-label={`Add to ${label}`}
          className="grid h-9 w-9 shrink-0 place-items-center rounded-md border border-border text-icon transition-colors hover:bg-surface-hover disabled:opacity-40"
        >
          <AddIcon sx={{ fontSize: 18 }} />
        </button>
      </div>
    </div>
  );
}

const toSystems = (names: string[]): TargetSystem[] =>
  names.map((name) => ({ id: name.toLowerCase().replace(/[^a-z0-9]+/g, '-'), name }));

export function ProvisionAccountConfigPanel({
  config,
  onChange,
}: {
  config: ProvisionAccountConfig;
  onChange: (c: ProvisionAccountConfig) => void;
}) {
  return (
    <div className="space-y-5">
      <ConfigSection first label="What happens">
        <Select
          label="Operation"
          value={config.mode}
          onChange={(v) => onChange({ ...config, mode: v as ProvisionAccountConfig['mode'] })}
          options={[
            { value: 'create', label: 'Create a new account' },
            { value: 'reactivate', label: 'Re-enable an existing account' },
          ]}
        />
        {config.mode === 'reactivate' && (
          <label className="flex items-start justify-between gap-3">
            <span className="min-w-0">
              <span className="block text-body-sm text-text-primary">Keep the previous identifiers</span>
              <Hint>
                Username, mail address and employee id are reused where the old record still has them —
                which is what makes a rehire the same person rather than a new one.
              </Hint>
            </span>
            <Switch
              checked={Boolean(config.preserveIdentifiers)}
              onChange={(_, on) => onChange({ ...config, preserveIdentifiers: on })}
            />
          </label>
        )}
      </ConfigSection>

      <ConfigSection label="Where">
        <NameList
          label="Target systems"
          hint="The connected systems the account is created in."
          placeholder="e.g. Microsoft Entra ID"
          values={config.targets.map((t) => t.name)}
          onChange={(names) => onChange({ ...config, targets: toSystems(names) })}
        />
        <NameList
          label="Services provisioned alongside"
          hint="Mailbox, drive and collaboration membership that follow the account."
          placeholder="e.g. Mailbox"
          values={config.services ?? []}
          onChange={(services) => onChange({ ...config, services })}
        />
      </ConfigSection>
    </div>
  );
}

export function SetAttributesConfigPanel({
  config,
  onChange,
}: {
  config: SetAttributesConfig;
  onChange: (c: SetAttributesConfig) => void;
}) {
  const patch = (i: number, next: Partial<SetAttributesConfig['rules'][number]>) =>
    onChange({ ...config, rules: config.rules.map((r, j) => (j === i ? { ...r, ...next } : r)) });

  return (
    <div className="space-y-5">
      <ConfigSection first label="Attributes written">
        <Hint>
          A value can be a literal or an expression over the source record, like{' '}
          <code className="rounded bg-subtle px-1 text-caption">first.last@{'{company.domain}'}</code>. Mark
          a rule conditional when it only applies to some people — the condition itself is authored on the
          filter above it.
        </Hint>
        {config.rules.length === 0 && (
          <p className="text-caption text-text-tertiary">No attributes yet.</p>
        )}
        <ul className="space-y-2">
          {config.rules.map((r, i) => (
            <li key={i} className="rounded-lg border border-border p-3">
              <div className="flex items-start gap-2">
                <div className="min-w-0 flex-1 space-y-2">
                  <Input
                    size="sm"
                    label="Attribute"
                    placeholder="e.g. userPrincipalName"
                    value={r.attribute}
                    onChange={(e) => patch(i, { attribute: e.target.value })}
                  />
                  <Input
                    size="sm"
                    label="Value or expression"
                    placeholder="e.g. {hrms.department}"
                    value={r.value}
                    onChange={(e) => patch(i, { value: e.target.value })}
                  />
                  <Checkbox
                    checked={Boolean(r.conditional)}
                    onChange={(on) => patch(i, { conditional: on })}
                    label="Only apply conditionally"
                  />
                </div>
                <button
                  type="button"
                  aria-label={`Remove ${r.attribute || 'attribute'}`}
                  onClick={() => onChange({ ...config, rules: config.rules.filter((_, j) => j !== i) })}
                  className="grid h-8 w-8 shrink-0 place-items-center rounded-md text-icon transition-colors hover:bg-surface-hover hover:text-danger"
                >
                  <CloseOutlined sx={{ fontSize: 16 }} />
                </button>
              </div>
            </li>
          ))}
        </ul>
        <button
          type="button"
          onClick={() => onChange({ ...config, rules: [...config.rules, { attribute: '', value: '' }] })}
          className="inline-flex items-center gap-1 rounded-sm text-caption-strong text-text-link hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-subtle"
        >
          <AddIcon sx={{ fontSize: 15 }} />
          Add an attribute
        </button>
      </ConfigSection>
    </div>
  );
}

export function ManageLicenseConfigPanel({
  config,
  onChange,
}: {
  config: ManageLicenseConfig;
  onChange: (c: ManageLicenseConfig) => void;
}) {
  return (
    <div className="space-y-5">
      <ConfigSection first label="What happens">
        <Select
          label="Operation"
          value={config.action}
          onChange={(v) => onChange({ ...config, action: v as ManageLicenseConfig['action'] })}
          options={[
            { value: 'assign', label: 'Assign a licence' },
            { value: 'downgrade', label: 'Downgrade to a lower tier' },
            { value: 'reclaim', label: 'Reclaim for reallocation' },
          ]}
        />
        <NameList
          label={config.action === 'downgrade' ? 'Downgrade to' : 'Licences'}
          hint="Your own SKU names, as they appear in the tenant."
          placeholder="e.g. Microsoft 365 E3"
          values={config.licenses}
          onChange={(licenses) => onChange({ ...config, licenses })}
        />
        {config.action === 'assign' && (
          <Checkbox
            checked={Boolean(config.conditional)}
            onChange={(on) => onChange({ ...config, conditional: on })}
            label="Only where an attribute or role calls for it"
          />
        )}
      </ConfigSection>
    </div>
  );
}

export function RevokeAccessConfigPanel({
  config,
  onChange,
}: {
  config: RevokeAccessConfig;
  onChange: (c: RevokeAccessConfig) => void;
}) {
  return (
    <div className="space-y-5">
      <ConfigSection first label="How much is removed">
        <Select
          label="Scope"
          value={config.scope}
          onChange={(v) => onChange({ ...config, scope: v as RevokeAccessConfig['scope'] })}
          options={[
            { value: 'all', label: 'Everything the identity holds' },
            { value: 'roleBased', label: 'Only what the previous role granted' },
            { value: 'selected', label: 'A specific list' },
          ]}
        />
        <Hint>
          {config.scope === 'all'
            ? 'The leaver case — every entitlement, role and group membership, across the systems named below.'
            : config.scope === 'roleBased'
              ? 'The mover case. Removing only the previous role’s grants is what stops privilege accumulating across a career.'
              : 'Pick the exact items in the builder’s entity picker.'}
        </Hint>
        <NameList
          label="Systems reached"
          hint="Leave empty to reach every connected system."
          placeholder="e.g. Office 365"
          values={(config.targets ?? []).map((t) => t.name)}
          onChange={(names) => onChange({ ...config, targets: toSystems(names) })}
        />
      </ConfigSection>
    </div>
  );
}

export function AccountActionConfigPanel({
  config,
  onChange,
}: {
  config: AccountActionConfig;
  onChange: (c: AccountActionConfig) => void;
}) {
  const kinds = Object.keys(ACCOUNT_ACTION_LABEL) as AccountActionKind[];
  const destructive = config.actions.includes('deleteAccount');

  const toggle = (k: AccountActionKind, on: boolean) =>
    onChange({ ...config, actions: on ? [...config.actions, k] : config.actions.filter((x) => x !== k) });

  return (
    <div className="space-y-5">
      <ConfigSection first label="Actions on the account">
        <Hint>
          Runs in the order listed. Containment first — sign-in, sessions, MFA — because access revocation
          takes time to propagate and a live session outlives a removed entitlement.
        </Hint>
        <ul className="space-y-1.5">
          {kinds.map((k) => (
            <li key={k}>
              <Checkbox
                checked={config.actions.includes(k)}
                onChange={(on) => toggle(k, on)}
                label={ACCOUNT_ACTION_LABEL[k]}
                tone={k === 'deleteAccount' ? 'danger' : 'brand'}
              />
            </li>
          ))}
        </ul>
      </ConfigSection>

      {destructive && (
        <ConfigSection label="Retention">
          <Input
            size="sm"
            type="number"
            label="Days before deletion"
            hint="Deletion is not reversible. The window is what lets someone stop it."
            value={String(config.retentionDays ?? 30)}
            onChange={(e) => onChange({ ...config, retentionDays: Number(e.target.value) || 0 })}
          />
        </ConfigSection>
      )}
    </div>
  );
}

export function DelegateAccessConfigPanel({
  config,
  onChange,
}: {
  config: DelegateAccessConfig;
  onChange: (c: DelegateAccessConfig) => void;
}) {
  return (
    <div className="space-y-5">
      <ConfigSection first label="Who inherits">
        <Select
          label="Delegate to"
          value={config.delegateTo}
          onChange={(v) => onChange({ ...config, delegateTo: v as DelegateAccessConfig['delegateTo'] })}
          options={[
            { value: 'manager', label: 'Their manager' },
            { value: 'successor', label: 'Their successor' },
            { value: 'namedUser', label: 'A named person' },
          ]}
        />
        <Hint>
          Manager and successor resolve when the workflow runs, so the delegation stays right as the org
          changes. A named person is fixed and will need revisiting.
        </Hint>
        {config.delegateTo === 'namedUser' && (
          <Input
            size="sm"
            label="Person"
            placeholder="name@company.com"
            value={config.delegateName ?? ''}
            onChange={(e) => onChange({ ...config, delegateName: e.target.value })}
          />
        )}
      </ConfigSection>

      <ConfigSection label="What is handed over">
        <NameList
          label="Assets"
          placeholder="e.g. Mailbox"
          values={config.assets}
          onChange={(assets) => onChange({ ...config, assets })}
        />
      </ConfigSection>
    </div>
  );
}

export function TriggerReviewConfigPanel({
  config,
  onChange,
}: {
  config: TriggerReviewConfig;
  onChange: (c: TriggerReviewConfig) => void;
}) {
  return (
    <div className="space-y-5">
      <ConfigSection first label="What is reviewed">
        <Select
          label="Scope"
          value={config.scope}
          onChange={(v) => onChange({ ...config, scope: v as TriggerReviewConfig['scope'] })}
          options={[
            { value: 'previousRole', label: "The previous role's access" },
            { value: 'allAccess', label: 'Everything the identity holds' },
          ]}
        />
        <Select
          label="Reviewer"
          value={config.reviewer}
          onChange={(v) => onChange({ ...config, reviewer: v as TriggerReviewConfig['reviewer'] })}
          options={[
            { value: 'newManager', label: 'The new manager' },
            { value: 'previousManager', label: 'The previous manager' },
            { value: 'applicationOwner', label: 'The application owner' },
          ]}
        />
        <Hint>
          The new manager is the usual choice on a promotion: they are the one who has to justify the
          access from now on.
        </Hint>
        <Input
          size="sm"
          type="number"
          label="Due in (days)"
          value={String(config.dueInDays)}
          onChange={(e) => onChange({ ...config, dueInDays: Number(e.target.value) || 0 })}
        />
      </ConfigSection>
    </div>
  );
}
