'use client';

import * as React from 'react';
import PersonOutline from '@mui/icons-material/PersonOutline';
import MailOutline from '@mui/icons-material/MailOutline';
import CallSplit from '@mui/icons-material/CallSplit';
import AccountTreeOutlined from '@mui/icons-material/AccountTreeOutlined';
import SkipNext from '@mui/icons-material/SkipNext';
import Logout from '@mui/icons-material/Logout';
import RuleOutlined from '@mui/icons-material/RuleOutlined';
import { FlowCanvas, type FlowNodeLike } from '@ds/components';
import { APPROVER_TYPE_LABEL, type ApprovalPolicy, type ParallelConfig, type PolicyBranch, type PolicyNode, type ApprovalLevelConfig, type NotificationConfig } from '@/data/automation-types';
import { NODE_META } from '@/lib/policy-tree';
import { getUser, getGovernanceGroup } from '@/data/directory';
import { LaneLabel, ConditionLaneLabel, ParallelLaneLabel, OUTCOME_TONE } from './LaneLabel';

/**
 * Read-only render of an approval policy's flow.
 *
 * Deliberately the *same* canvas the builder uses, in `readOnly` mode, rather than
 * a second bespoke rendering: a preview that draws the flow differently from the
 * editor is a preview you cannot trust. Only the authoring affordances are gone —
 * geometry, cards and lane labels are identical, so pressing Edit changes what you
 * can do, never what you are looking at.
 */

const ICONS: Record<string, React.ComponentType<{ sx?: object }>> = {
  person: PersonOutline,
  mail: MailOutline,
  call_split: CallSplit,
  account_tree: AccountTreeOutlined,
  skip_next: SkipNext,
  logout: Logout,
};

/** Same categorical icon-tile colours as the builder palette sections. */
const SECTION_TILE: Record<string, { bg: string; fg: string }> = {
  Tasks: { bg: '#E8F1FE', fg: '#2E7CF6' },
  Branching: { bg: '#FFF1E3', fg: '#F59E0B' },
  'Flow Control': { bg: '#E4F6EF', fg: '#0EA47A' },
};
const tileFor = (section: string) => SECTION_TILE[section] ?? { bg: 'var(--ds-color-surface-hover)', fg: 'var(--ds-color-icon-default)' };

function slaLabel(sla?: ApprovalLevelConfig['sla']): string {
  if (!sla) return '';
  const parts: string[] = [];
  if (sla.days) parts.push(`${sla.days}d`);
  if (sla.hours) parts.push(`${sla.hours}h`);
  if (sla.minutes) parts.push(`${sla.minutes}m`);
  return parts.join(' ');
}

/** One line describing what a step does — the same summary the builder shows. */
export function nodeSummary(node: PolicyNode): string {
  if (node.type === 'conditionalBranch') {
    const paths = (node.branches ?? []).filter((b) => b.kind === 'if' || b.kind === 'elseif').length;
    return `${paths} condition path${paths === 1 ? '' : 's'} + fallback`;
  }
  if (node.type === 'parallelBranch') {
    const n = (node.config as ParallelConfig | undefined)?.lanes.length ?? 0;
    return `${n} parallel approver${n === 1 ? '' : 's'}`;
  }
  if (node.type === 'approvalLevel') {
    const c = node.config as ApprovalLevelConfig | undefined;
    if (!c?.approverType) return 'No approver selected';
    let who = APPROVER_TYPE_LABEL[c.approverType];
    if (c.approverType === 'governanceGroup') who = getGovernanceGroup(c.governanceGroupId ?? '')?.name ?? who;
    else if (c.approverType === 'user') who = getUser(c.userId ?? '')?.name ?? who;
    const sla = slaLabel(c.sla);
    return sla ? `${who} · SLA ${sla}` : who;
  }
  if (node.type === 'notification') {
    const c = node.config as NotificationConfig | undefined;
    const on = [c?.email.enabled && 'Email', c?.slack.enabled && 'Slack'].filter(Boolean);
    return on.length ? on.join(' + ') : 'No channels enabled';
  }
  return NODE_META[node.type].title;
}

export function PolicyFlowPreview({ policy }: { policy: ApprovalPolicy }) {
  const laneApprover = React.useMemo(() => {
    const map: Record<string, string> = {};
    const walk = (seq: PolicyNode[]) => {
      for (const n of seq) {
        if (n.type === 'parallelBranch') {
          for (const l of (n.config as ParallelConfig | undefined)?.lanes ?? []) {
            const a = l.approver;
            map[l.id] = !a.approverType
              ? 'Not configured'
              : a.approverType === 'governanceGroup'
                ? getGovernanceGroup(a.governanceGroupId ?? '')?.name ?? APPROVER_TYPE_LABEL[a.approverType]
                : a.approverType === 'user'
                  ? getUser(a.userId ?? '')?.name ?? APPROVER_TYPE_LABEL[a.approverType]
                  : APPROVER_TYPE_LABEL[a.approverType];
          }
        }
        [...(n.branches ?? []), ...(n.outcomeBranches ?? [])].forEach((b) => walk(b.seq));
      }
    };
    walk(policy.root);
    return map;
  }, [policy.root]);

  const renderCard = (n: FlowNodeLike, { dense }: { dense: boolean }) => {
    const node = n as PolicyNode;
    const meta = NODE_META[node.type];
    const Icon = ICONS[meta.icon] ?? PersonOutline;
    const tile = tileFor(meta.section);
    const title = node.name?.trim() || meta.title;
    const summary = nodeSummary(node);

    // Conditional keeps its rhombus so the shape still reads as a decision.
    if (node.type === 'conditionalBranch') {
      const paths = (node.branches ?? []).filter((b) => (b as PolicyBranch).kind === 'if' || (b as PolicyBranch).kind === 'elseif').length;
      return (
        <div className="relative grid h-[188px] w-[188px] place-items-center">
          <span className="absolute left-1/2 top-1/2 h-[132px] w-[132px] -translate-x-1/2 -translate-y-1/2 rotate-45 rounded-2xl border border-border bg-surface" />
          <span className="relative z-[1] flex w-[130px] flex-col items-center gap-1 px-1 text-center">
            <span className="grid h-9 w-9 place-items-center rounded-full" style={{ backgroundColor: tile.bg, color: tile.fg }}>
              <Icon sx={{ fontSize: 18 }} />
            </span>
            <span className="text-body-sm-strong leading-tight text-text-primary">{title}</span>
            <span className="text-caption leading-tight text-text-secondary">
              {paths} condition{paths !== 1 ? 's' : ''}
            </span>
          </span>
        </div>
      );
    }

    if (node.type === 'skip' || node.type === 'exit') {
      return (
        <div className="inline-flex items-center gap-2.5 rounded-pill border border-border bg-surface px-4 py-2">
          <span className="grid h-7 w-7 shrink-0 place-items-center rounded-md" style={{ backgroundColor: tile.bg, color: tile.fg }}>
            <Icon sx={{ fontSize: 16 }} />
          </span>
          <span className="text-body-strong text-text-primary">{title}</span>
        </div>
      );
    }

    return (
      <div className="flex w-[320px] items-center gap-3 rounded-xl border border-border bg-surface px-4 py-3">
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-md" style={{ backgroundColor: tile.bg, color: tile.fg }}>
          <Icon sx={{ fontSize: 18 }} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-body-strong leading-tight text-text-primary">{title}</span>
          {!dense && <span className="mt-1 block truncate text-caption leading-tight text-text-secondary">{summary}</span>}
        </span>
      </div>
    );
  };

  const policyCard = () => (
    <div className="flex w-[320px] items-center gap-3 rounded-lg border border-border bg-surface px-4 py-3">
      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-brand-subtle text-brand">
        <RuleOutlined sx={{ fontSize: 18 }} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-body-strong text-text-primary">{policy.policyName}</span>
        <span className="mt-0.5 block truncate text-caption text-text-secondary">
          {policy.description || 'No description'}
        </span>
      </span>
    </div>
  );

  return (
    <FlowCanvas
      readOnly
      root={policy.root}
      renderCard={renderCard}
      headerCard={policyCard}
      palette={[]}
      onInsert={() => {}}
      emptyHint="Open the builder to add approval levels, notifications and branching."
      isTerminal={(n) => (n as PolicyNode).type === 'exit'}
      renderBranchLabel={(b) => {
        const br = b as unknown as PolicyBranch;
        if (br.kind === 'if' || br.kind === 'elseif') return <ConditionLaneLabel label={br.label} group={br.condition} />;
        if (br.kind === 'outcome') return <LaneLabel text={br.label} tone={OUTCOME_TONE[br.label] ?? 'neutral'} upper />;
        if (br.kind === 'parallelLane') return <ParallelLaneLabel label={br.label} approver={laneApprover[br.id]} />;
        return <LaneLabel text={br.label} />;
      }}
    />
  );
}
