'use client';

import * as React from 'react';
import PersonOutline from '@mui/icons-material/PersonOutline';
import MailOutline from '@mui/icons-material/MailOutline';
import CallSplit from '@mui/icons-material/CallSplit';
import AccountTreeOutlined from '@mui/icons-material/AccountTreeOutlined';
import SkipNext from '@mui/icons-material/SkipNext';
import Logout from '@mui/icons-material/Logout';
import RuleOutlined from '@mui/icons-material/RuleOutlined';
import { FlowCanvas, FlowStem, type FlowBranchLike, type FlowNodeLike } from '@ds/components';
import {
  APPROVER_TYPE_LABEL,
  type ApprovalPolicy,
  type ParallelConfig,
  type PolicyBranch,
  type PolicyNode,
  type ApprovalLevelConfig,
  type NotificationConfig,
} from '@/data/automation-types';
import { NODE_META } from '@/lib/policy-tree';
import { getUser, getGovernanceTeam } from '@/data/directory';
import { LaneLabel, ConditionLaneLabel, ParallelLaneLabel, AutoResolveBody, OUTCOME_TONE } from './LaneLabel';

/**
 * Read-only render of an approval policy's flow.
 *
 * Deliberately the *same* canvas the builder uses, in `readOnly` mode, rather than
 * a second bespoke rendering: a preview that draws the flow differently from the
 * editor is a preview you cannot trust. Only the authoring affordances are gone —
 * geometry, cards, sealed bodies and between-tier chrome are identical, so pressing
 * Edit changes what you can do, never what you are looking at.
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
    if (c.approverType === 'governanceTeam') who = getGovernanceTeam(c.governanceTeamId ?? '')?.name ?? who;
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
              : a.approverType === 'governanceTeam'
                ? getGovernanceTeam(a.governanceTeamId ?? '')?.name ?? APPROVER_TYPE_LABEL[a.approverType]
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
            <span className="text-body-sm-medium leading-tight text-text-primary">{title}</span>
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
          <span className="text-body-medium text-text-primary">{title}</span>
        </div>
      );
    }

    // Approval Level: Fallback chip under the card (outcomes live in `branches`).
    const fb = node.type === 'approvalLevel' ? (node.config as ApprovalLevelConfig | undefined)?.fallback : undefined;
    const showFallbackChip = Boolean(fb?.enabled && fb.action === 'fallbackApprover' && (fb.approverEmail ?? '').trim());
    const fallbackEmail = (fb?.approverEmail ?? '').trim();

    return (
      <div className="flex flex-col items-center">
        <div className="flex w-[320px] items-center gap-3 rounded-xl border border-border bg-surface px-4 py-3">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-md" style={{ backgroundColor: tile.bg, color: tile.fg }}>
            <Icon sx={{ fontSize: 18 }} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-body-medium leading-tight text-text-primary">{title}</span>
            {!dense && <span className="mt-1 block truncate text-caption leading-tight text-text-secondary">{summary}</span>}
          </span>
        </div>
        {showFallbackChip && (
          <>
            <FlowStem height={20} />
            <div className="flex w-[240px] items-center gap-2.5 rounded-xl border border-border bg-surface px-3 py-2.5">
              <span
                className="grid h-7 w-7 shrink-0 place-items-center rounded-md"
                style={{ backgroundColor: tile.bg, color: tile.fg }}
              >
                <PersonOutline sx={{ fontSize: 16 }} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-body-sm-medium leading-tight text-text-primary">Fallback Approver</span>
                <span className="mt-0.5 block truncate text-caption leading-tight text-text-secondary">{fallbackEmail}</span>
              </span>
            </div>
          </>
        )}
      </div>
    );
  };

  /** Parallel only — same between-tier slot as the builder; canvas owns stems. */
  const renderBetweenTiers = (n: FlowNodeLike) => {
    const node = n as PolicyNode;
    if (node.type !== 'parallelBranch') return null;
    const fb = (node.config as ParallelConfig | undefined)?.fallback;
    const email = (fb?.approverEmail ?? '').trim();
    if (!(fb?.enabled && fb.action === 'fallbackApprover' && email)) return null;
    const tile = tileFor(NODE_META[node.type].section);
    return (
      <div className="flex w-[240px] items-center gap-2.5 rounded-xl border border-border bg-surface px-3 py-2.5">
        <span
          className="grid h-7 w-7 shrink-0 place-items-center rounded-md"
          style={{ backgroundColor: tile.bg, color: tile.fg }}
        >
          <PersonOutline sx={{ fontSize: 16 }} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-body-sm-medium leading-tight text-text-primary">Fallback Approver</span>
          <span className="mt-0.5 block truncate text-caption leading-tight text-text-secondary">{email}</span>
        </span>
      </div>
    );
  };

  /** Same sealed/intro outcome bodies as the builder. */
  const renderSealedBody = (b: FlowBranchLike, n: FlowNodeLike) => {
    const br = b as unknown as PolicyBranch;
    if (br.kind !== 'outcome') return null;
    const cfg = (n as PolicyNode).config as ApprovalLevelConfig | ParallelConfig | undefined;

    if (br.label === 'SLA Breached') {
      if (cfg?.sla?.afterExpiry === 'createBranch') return null;
      const approves = cfg?.sla?.afterExpiry === 'autoApprove';
      return (
        <AutoResolveBody
          resolution={approves ? 'Auto Approve' : 'Auto Reject'}
          tone={approves ? 'success' : 'danger'}
        />
      );
    }

    if (br.label === 'Approver Not Found') {
      const action = cfg?.fallback?.action;
      if (action === 'autoApprove') {
        return <AutoResolveBody resolution="Auto Approve" tone="success" />;
      }
      if (action === 'autoReject') {
        return <AutoResolveBody resolution="Auto Reject" tone="danger" />;
      }
      if (action === 'notify') {
        return (
          <AutoResolveBody
            resolution="Notify"
            tone="info"
            icon={<MailOutline sx={{ fontSize: 16 }} />}
          />
        );
      }
      return null;
    }

    if (br.label === 'Fallback SLA Breached') {
      if (cfg?.fallback?.approverResolution === 'createBranch') return null;
      const res = cfg?.fallback?.approverResolution;
      if (res === 'autoApprove') {
        return <AutoResolveBody resolution="Auto Approve" tone="success" />;
      }
      if (res === 'autoReject') {
        return <AutoResolveBody resolution="Auto Reject" tone="danger" />;
      }
      return <AutoResolveBody resolution="Select action" tone="neutral" />;
    }

    return null;
  };

  const policyCard = () => (
    <div className="flex w-[320px] items-center gap-3 rounded-lg border border-border bg-surface px-4 py-3">
      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-brand-subtle text-brand">
        <RuleOutlined sx={{ fontSize: 18 }} />
      </span>
      <span className="min-w-0 flex-1">
        {/* Matches the builder's header card exactly — a preview and its editor are
            the same picture. */}
        <span className="block truncate text-body-medium text-text-primary">{policy.policyName}</span>
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
      renderSealedBody={renderSealedBody}
      renderBetweenTiers={renderBetweenTiers}
    />
  );
}
