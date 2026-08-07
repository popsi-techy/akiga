'use client';

import * as React from 'react';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutline from '@mui/icons-material/DeleteOutline';
import GroupsOutlined from '@mui/icons-material/GroupsOutlined';
import PersonOutline from '@mui/icons-material/PersonOutline';
import InfoOutlined from '@mui/icons-material/InfoOutlined';
import { Select, Input, Button, SelectableList, Switch, Tooltip } from '@ds/components';
import {
  APPROVER_TYPE_LABEL,
  MULTI_APPROVER_TYPES,
  type ParallelConfig,
  type ParallelLane,
  type ApproverType,
  type LaneApprover,
  type CompletionRule,
  type FallbackAction,
  type FallbackApproverResolution,
} from '@/data/automation-types';
import { nid } from '@/lib/policy-tree';
import { listUsers, listGovernanceGroups, getUser, getGovernanceGroup } from '@/data/directory';
import { SingleSelectDrawer } from './SingleSelectDrawer';

const APPROVER_OPTS = (Object.entries(APPROVER_TYPE_LABEL) as [ApproverType, string][]).map(([value, label]) => ({ value, label }));

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

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <div className="mb-2.5 text-caption font-semibold uppercase tracking-[0.07em] text-text-tertiary">{children}</div>;
}
function FieldLabelSm({ children }: { children: React.ReactNode }) {
  return <div className="mb-1.5 text-body-sm font-medium text-text-secondary">{children}</div>;
}

export function ParallelBranchConfig({ config, onChange }: { config: ParallelConfig; onChange: (next: ParallelConfig) => void }) {
  const [picker, setPicker] = React.useState<{ laneId: string; kind: 'governanceGroup' | 'user' } | null>(null);
  const fallback = config.fallback ?? { enabled: false };

  const setLane = (id: string, patch: Partial<ParallelLane>) =>
    onChange({ ...config, lanes: config.lanes.map((l) => (l.id === id ? { ...l, ...patch } : l)) });
  const setApprover = (id: string, patch: Partial<LaneApprover>) => {
    const lane = config.lanes.find((l) => l.id === id);
    if (lane) setLane(id, { approver: { ...lane.approver, ...patch } });
  };
  const setFallback = (patch: Partial<ParallelConfig['fallback']>) =>
    onChange({ ...config, fallback: { ...fallback, ...patch } });
  const addLane = () =>
    onChange({ ...config, lanes: [...config.lanes, { id: nid('lane'), name: `Branch ${config.lanes.length + 1}`, approver: {} }] });
  const removeLane = (id: string) => {
    const lanes = config.lanes.filter((l) => l.id !== id);
    onChange({ ...config, lanes, requiredApprovals: Math.min(config.requiredApprovals, lanes.length) });
  };

  const pickerLane = picker ? config.lanes.find((l) => l.id === picker.laneId) : undefined;

  return (
    <div>
      {/* lanes */}
      <div className="pb-5">
        <FieldLabel>Parallel Approvers</FieldLabel>
        <div className="space-y-2">
          {config.lanes.map((lane) => {
            const a = lane.approver;
            const showCompletion = !!a.approverType && MULTI_APPROVER_TYPES.includes(a.approverType);
            const selName =
              a.approverType === 'governanceGroup'
                ? getGovernanceGroup(a.governanceGroupId ?? '')?.name
                : a.approverType === 'user'
                  ? getUser(a.userId ?? '')?.name
                  : undefined;
            return (
              <div key={lane.id} className="space-y-2 rounded-md bg-subtle p-3">
                <div className="flex items-center gap-2">
                  <Input aria-label="Branch name" size="sm" value={lane.name} onChange={(e) => setLane(lane.id, { name: e.target.value })} />
                  {config.lanes.length > 2 && (
                    <button
                      type="button"
                      onClick={() => removeLane(lane.id)}
                      aria-label="Remove branch"
                      className="grid h-8 w-8 shrink-0 place-items-center rounded-md text-icon hover:bg-surface-hover hover:text-danger"
                    >
                      <DeleteOutline sx={{ fontSize: 18 }} />
                    </button>
                  )}
                </div>
                <Select
                  options={APPROVER_OPTS}
                  value={a.approverType ?? ''}
                  placeholder="Approver type"
                  onChange={(v) => {
                    const t = v as ApproverType;
                    setApprover(lane.id, {
                      approverType: t,
                      governanceGroupId: undefined,
                      userId: undefined,
                      ...(MULTI_APPROVER_TYPES.includes(t) ? {} : { completionRule: undefined }),
                    });
                  }}
                />
                {(a.approverType === 'governanceGroup' || a.approverType === 'user') && (
                  <Button
                    variant="secondary"
                    size="sm"
                    startIcon={a.approverType === 'governanceGroup' ? <GroupsOutlined /> : <PersonOutline />}
                    onClick={() => setPicker({ laneId: lane.id, kind: a.approverType as 'governanceGroup' | 'user' })}
                  >
                    {selName ?? (a.approverType === 'governanceGroup' ? 'Select group' : 'Select user')}
                  </Button>
                )}
                {showCompletion && (
                  <Select
                    options={[
                      { value: 'all', label: 'All approvers' },
                      { value: 'anyOne', label: 'Any one' },
                      { value: 'majority', label: 'Majority' },
                    ]}
                    value={a.completionRule ?? ''}
                    placeholder="Completion rule"
                    onChange={(v) => setApprover(lane.id, { completionRule: v as CompletionRule })}
                  />
                )}
              </div>
            );
          })}
        </div>
        <Button variant="secondary" size="sm" startIcon={<AddIcon />} onClick={addLane} className="mt-2 w-full">
          Add branch
        </Button>

        {/* Fallback — same model as Approval Level; applies to all parallel approvers. */}
        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="text-body-sm font-medium text-text-primary">Add fallback</span>
            <Tooltip title="If any approver does not approve, the request is sent to this approver." placement="top">
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
            checked={fallback.enabled}
            onChange={(e) => setFallback({ enabled: e.target.checked })}
            inputProps={{ 'aria-label': 'Add fallback' }}
          />
        </div>

        {fallback.enabled && (
          <div className="mt-4 space-y-4">
            <div>
              <FieldLabelSm>If any approver does not approve</FieldLabelSm>
              <Select
                options={FALLBACK_ACTION_OPTIONS}
                value={fallback.action ?? ''}
                placeholder="Select action"
                onChange={(v) => {
                  const action = v as FallbackAction;
                  setFallback(
                    action === 'notify'
                      ? { action, notifyCustomEmail: fallback.notifyCustomEmail ?? true }
                      : { action },
                  );
                }}
              />
            </div>

            {fallback.action === 'notify' && (
              <div className="space-y-3">
                <SelectableList
                  ariaLabel="Notify"
                  selected={[
                    ...(fallback.notifyAdmin ? ['admin'] : []),
                    ...((fallback.notifyCustomEmail ?? true) ? ['email'] : []),
                  ]}
                  onToggle={(id) =>
                    setFallback(
                      id === 'admin'
                        ? { notifyAdmin: !fallback.notifyAdmin }
                        : { notifyCustomEmail: !(fallback.notifyCustomEmail ?? true) },
                    )
                  }
                  items={[
                    { id: 'admin', label: 'Admin' },
                    { id: 'email', label: 'Custom Email' },
                  ]}
                />
                {(fallback.notifyCustomEmail ?? true) && (
                  <Input
                    label="Email address"
                    type="email"
                    size="sm"
                    placeholder="name@company.com"
                    value={fallback.notifyEmail ?? ''}
                    onChange={(e) => setFallback({ notifyEmail: e.target.value })}
                  />
                )}
              </div>
            )}

            {fallback.action === 'fallbackApprover' && (
              <div className="space-y-3">
                <Input
                  label="Fallback approver email"
                  type="email"
                  size="sm"
                  placeholder="name@company.com"
                  value={fallback.approverEmail ?? ''}
                  onChange={(e) => setFallback({ approverEmail: e.target.value })}
                />
                <div>
                  <FieldLabelSm>If fallback approver&apos;s SLA Breached</FieldLabelSm>
                  <Select
                    options={FALLBACK_APPROVER_RESOLUTION_OPTIONS}
                    value={fallback.approverResolution ?? ''}
                    placeholder="Select action"
                    onChange={(v) => setFallback({ approverResolution: v as FallbackApproverResolution })}
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* overall rule */}
      <div className="border-t border-border py-5">
        <FieldLabel>Overall Completion Rule</FieldLabel>
        <Select
          options={[
            { value: 'all', label: 'All branches must approve' },
            { value: 'anyOne', label: 'Any one branch' },
            { value: 'majority', label: 'Majority of branches' },
            { value: 'threshold', label: 'At least N branches' },
          ]}
          value={config.overallRule}
          onChange={(v) => onChange({ ...config, overallRule: v as ParallelConfig['overallRule'] })}
        />
        {config.overallRule === 'threshold' && (
          <div className="mt-2">
            <Input
              label={`Required branches (1–${config.lanes.length})`}
              type="number"
              size="sm"
              value={String(config.requiredApprovals)}
              onChange={(e) => {
                const n = Math.max(1, Math.min(config.lanes.length, Number(e.target.value) || 1));
                onChange({ ...config, requiredApprovals: n });
              }}
            />
          </div>
        )}
      </div>

      {/* SLA */}
      <div className="border-t border-border pt-5">
        <FieldLabel>SLA Configuration</FieldLabel>
        <div className="grid grid-cols-3 gap-2">
          {(['days', 'hours', 'minutes'] as const).map((unit) => (
            <Input
              key={unit}
              label={unit[0].toUpperCase() + unit.slice(1)}
              type="number"
              size="sm"
              value={String(config.sla[unit])}
              onChange={(e) => onChange({ ...config, sla: { ...config.sla, [unit]: Math.max(0, Number(e.target.value) || 0) } })}
            />
          ))}
        </div>
        <div className="mt-2">
          <Select
            label="After SLA expires"
            options={[
              { value: 'autoApprove', label: 'Auto approve' },
              { value: 'autoReject', label: 'Auto reject' },
              { value: 'createBranch', label: 'Create an SLA-breach branch' },
            ]}
            value={config.sla.afterExpiry}
            onChange={(v) => onChange({ ...config, sla: { ...config.sla, afterExpiry: v as ParallelConfig['sla']['afterExpiry'] } })}
          />
        </div>
      </div>

      {picker && pickerLane && (
        <SingleSelectDrawer
          open
          onClose={() => setPicker(null)}
          title={picker.kind === 'governanceGroup' ? 'Select Governance Group' : 'Select User'}
          items={
            picker.kind === 'governanceGroup'
              ? listGovernanceGroups().map((g) => ({ id: g.id, primary: g.name, secondary: `${g.members} members` }))
              : listUsers().map((u) => ({ id: u.id, primary: u.name, secondary: u.email }))
          }
          selectedId={picker.kind === 'governanceGroup' ? pickerLane.approver.governanceGroupId : pickerLane.approver.userId}
          onSelect={(id) => setApprover(picker.laneId, picker.kind === 'governanceGroup' ? { governanceGroupId: id } : { userId: id })}
        />
      )}
    </div>
  );
}

export default ParallelBranchConfig;
