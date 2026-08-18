'use client';

import * as React from 'react';
import PersonAddAlt from '@mui/icons-material/PersonAddAlt';
import SwapHorizOutlined from '@mui/icons-material/SwapHorizOutlined';
import Logout from '@mui/icons-material/Logout';
import FilterAltOutlined from '@mui/icons-material/FilterAltOutlined';
import AssignmentIndOutlined from '@mui/icons-material/AssignmentIndOutlined';
import MailOutline from '@mui/icons-material/MailOutline';
import CallSplit from '@mui/icons-material/CallSplit';
import AccountTreeOutlined from '@mui/icons-material/AccountTreeOutlined';
import SkipNext from '@mui/icons-material/SkipNext';
import ScheduleOutlined from '@mui/icons-material/ScheduleOutlined';
import PersonSearchOutlined from '@mui/icons-material/PersonSearchOutlined';
import BadgeOutlined from '@mui/icons-material/BadgeOutlined';
import TuneOutlined from '@mui/icons-material/TuneOutlined';
import CardMembershipOutlined from '@mui/icons-material/CardMembershipOutlined';
import BlockOutlined from '@mui/icons-material/BlockOutlined';
import ShieldOutlined from '@mui/icons-material/ShieldOutlined';
import MoveDownOutlined from '@mui/icons-material/MoveDownOutlined';
import FactCheckOutlined from '@mui/icons-material/FactCheckOutlined';
import { BLOCK_META } from '@/lib/workflow-tree';
import { countConditionRules } from '@/lib/policy-tree';
import type {
  AssignEntitiesConfig as AEConfig,
  DelayConfig as DlyConfig,
  MultisplitConfig as MSConfig,
  NotificationConfig as NConfig,
  UserFilterConfig as UFConfig,
  WaitForUserConfig as WFUConfig,
  WorkflowEventType,
  WorkflowNode,
  ProvisionAccountConfig,
  SetAttributesConfig,
  ManageLicenseConfig,
  RevokeAccessConfig,
  AccountActionConfig,
  AccountActionKind,
  DelegateAccessConfig,
  TriggerReviewConfig,
} from '@/data/automation-types';

/**
 * Everything needed to *draw* a workflow block, in one place.
 *
 * The builder and the read-only preview must render the same block identically —
 * a preview that disagrees with its editor is worse than no preview. These used
 * to live inside the builder page, which meant the preview could only have them
 * by copying, and copies drift (the approval side already grew three divergent
 * copies of its tile map before this was noticed).
 */

export const EVENT_ICONS: Record<WorkflowEventType, React.ComponentType<{ sx?: object }>> = {
  joiner: PersonAddAlt,
  mover: SwapHorizOutlined,
  leaver: Logout,
};

/** Palette order for the lifecycle events. */
export const EVENT_TYPES: WorkflowEventType[] = ['joiner', 'mover', 'leaver'];

export const ICONS: Record<string, React.ComponentType<{ sx?: object }>> = {
  filter: FilterAltOutlined,
  assignment: AssignmentIndOutlined,
  mail: MailOutline,
  call_split: CallSplit,
  account_tree: AccountTreeOutlined,
  skip_next: SkipNext,
  logout: Logout,
  schedule: ScheduleOutlined,
  person_search: PersonSearchOutlined,
  badge: BadgeOutlined,
  tune: TuneOutlined,
  license: CardMembershipOutlined,
  block: BlockOutlined,
  shield: ShieldOutlined,
  handoff: MoveDownOutlined,
  review: FactCheckOutlined,
};

/** Icon-tile colors grouped by palette section (decorative — categorical, not text). */
export const SECTION_TILE: Record<string, { bg: string; fg: string }> = {
  Events: { bg: 'var(--ds-color-brand-subtle)', fg: 'var(--ds-color-brand-primary)' },
  Filters: { bg: '#EFEAFE', fg: '#7C4DFF' }, //       violet
  Tasks: { bg: '#E8F1FE', fg: '#2E7CF6' }, //         blue
  Branching: { bg: '#FFF1E3', fg: '#F59E0B' }, //     amber
  // Lifecycle operations reach into a connected system and change an account's
  // state, so they get their own hue rather than sharing Tasks' blue — on a
  // leaver canvas the difference between "notify the manager" and "delete the
  // account" should not be a matter of reading the label.
  Lifecycle: { bg: '#FDECEF', fg: '#D4405C' }, //     rose
  'Flow Control': { bg: '#E4F6EF', fg: '#0EA47A' }, // teal
};

export const tileFor = (section: string) =>
  SECTION_TILE[section] ?? { bg: 'var(--ds-color-surface-hover)', fg: 'var(--ds-color-icon-default)' };

/** Section order — shared by the sidebar palette and the canvas quick-insert menu. */
export const PALETTE_SECTIONS = ['Filters', 'Tasks', 'Lifecycle', 'Branching', 'Flow Control'] as const;

/** One line describing what a block does — the same summary the builder shows. */
export function blockSummary(node: WorkflowNode): string {
  const c = node.config as Record<string, unknown> | undefined;
  switch (node.type) {
    case 'userFilter': {
      const cond = (c as UFConfig | undefined)?.condition;
      const n = cond ? countConditionRules(cond) : 0;
      return n ? `${n} condition${n > 1 ? 's' : ''}` : 'No conditions';
    }
    case 'assignEntities': {
      const a = c as AEConfig | undefined;
      const n = (a?.entitlements.length ?? 0) + (a?.technicalRoles.length ?? 0) + (a?.businessRoles.length ?? 0);
      const br = a?.birthrightPolicies?.length ?? 0;
      if (!n && !br) return 'Nothing selected yet';
      // Birthright policies are counted separately: "3 entities" would be a lie
      // when one of them is a bundle standing in for a dozen grants.
      const parts = [
        n ? `${n} entit${n > 1 ? 'ies' : 'y'}` : null,
        br ? `${br} birthright polic${br > 1 ? 'ies' : 'y'}` : null,
      ].filter(Boolean);
      return `${parts.join(' · ')}${a?.approvalPolicyId ? ' · policy attached' : ''}`;
    }
    case 'notification': {
      const nc = c as NConfig | undefined;
      const on = [nc?.email.enabled && 'Email', nc?.slack.enabled && 'Slack'].filter(Boolean);
      return on.length ? on.join(' + ') : 'No channels enabled';
    }
    case 'multisplitBranch': {
      const lanes = (node.branches ?? []).filter((b) => b.kind === 'split').length;
      const attrs = (c as MSConfig | undefined)?.splitAttributes.length ?? 0;
      return `${lanes} branches · ${attrs} attribute${attrs === 1 ? '' : 's'}`;
    }
    case 'wfConditionalBranch': {
      const paths = (node.branches ?? []).filter((b) => b.kind === 'if' || b.kind === 'elseif').length;
      return `${paths} condition path${paths === 1 ? '' : 's'} + fallback`;
    }
    case 'delay': {
      const d = c as DlyConfig | undefined;
      const parts = [d?.days && `${d.days}d`, d?.hours && `${d.hours}h`, d?.minutes && `${d.minutes}m`].filter(Boolean);
      return parts.length ? `Wait ${parts.join(' ')}` : 'No delay set';
    }
    case 'waitForUser': {
      const w = c as WFUConfig | undefined;
      const parts = [w?.days && `${w.days}d`, w?.hours && `${w.hours}h`, w?.minutes && `${w.minutes}m`].filter(Boolean);
      if (!w || !parts.length || w.connectionIds.length < 1) return 'Not configured';
      const tries = w.unlimitedRetries ? '∞' : `${w.maxRetries} tries`;
      const apps = `${w.connectionIds.length} app${w.connectionIds.length === 1 ? '' : 's'}`;
      return `Every ${parts.join(' ')} · ${tries} · ${apps}`;
    }
    // ---- lifecycle operations ----
    // Each summary names the SYSTEMS and the OPERATION, because that is what a
    // reviewer scanning a leaver flow needs: "3 actions" tells them nothing about
    // whether the account gets deleted.
    case 'provisionAccount': {
      const p = c as ProvisionAccountConfig | undefined;
      if (!p?.targets.length) return 'No target system';
      const verb = p.mode === 'reactivate' ? 'Re-enable in' : 'Create in';
      const svc = p.services?.length ? ` · ${p.services.length} service${p.services.length === 1 ? '' : 's'}` : '';
      return `${verb} ${namesOf(p.targets)}${svc}`;
    }
    case 'setAttributes': {
      const a = c as SetAttributesConfig | undefined;
      if (!a?.rules.length) return 'No attributes set';
      const cond = a.rules.some((r) => r.conditional) ? ' · conditional' : '';
      return `${a.rules.map((r) => r.attribute).slice(0, 2).join(', ')}${a.rules.length > 2 ? ` +${a.rules.length - 2}` : ''}${cond}`;
    }
    case 'manageLicense': {
      const l = c as ManageLicenseConfig | undefined;
      if (!l?.licenses.length) return 'No licence selected';
      const verb = l.action === 'assign' ? 'Assign' : l.action === 'downgrade' ? 'Downgrade to' : 'Reclaim';
      return `${verb} ${l.licenses[0]}${l.licenses.length > 1 ? ` +${l.licenses.length - 1}` : ''}`;
    }
    case 'revokeAccess': {
      const r = c as RevokeAccessConfig | undefined;
      if (!r) return 'Not configured';
      if (r.scope === 'all') return `Remove all access${r.targets?.length ? ` · ${namesOf(r.targets)}` : ''}`;
      if (r.scope === 'roleBased') return 'Remove access from the previous role';
      const n = (r.entitlements?.length ?? 0) + (r.technicalRoles?.length ?? 0);
      return n ? `Remove ${n} item${n === 1 ? '' : 's'}` : 'Nothing selected yet';
    }
    case 'accountAction': {
      const a = c as AccountActionConfig | undefined;
      if (!a?.actions.length) return 'No actions selected';
      const first = ACCOUNT_ACTION_LABEL[a.actions[0]];
      const more = a.actions.length > 1 ? ` +${a.actions.length - 1}` : '';
      const hold = a.retentionDays ? ` · after ${a.retentionDays}d` : '';
      return `${first}${more}${hold}`;
    }
    case 'delegateAccess': {
      const d = c as DelegateAccessConfig | undefined;
      if (!d?.assets.length) return 'Nothing to hand over';
      const who = d.delegateTo === 'manager' ? 'manager' : d.delegateTo === 'successor' ? 'successor' : d.delegateName || 'named user';
      return `${d.assets.join(' + ')} → ${who}`;
    }
    case 'triggerReview': {
      const t = c as TriggerReviewConfig | undefined;
      if (!t) return 'Not configured';
      const what = t.scope === 'previousRole' ? "previous role's access" : 'all access';
      return `Review ${what} · due in ${t.dueInDays}d`;
    }
    default:
      return BLOCK_META[node.type].title;
  }
}

const namesOf = (xs: { name: string }[]) =>
  xs.length === 1 ? xs[0].name : `${xs[0].name} +${xs.length - 1}`;

/** Short labels for account operations — used in summaries and the config panel. */
export const ACCOUNT_ACTION_LABEL: Record<AccountActionKind, string> = {
  disableSignIn: 'Disable sign-in',
  revokeSessions: 'Revoke sessions & tokens',
  blockMfa: 'Block MFA devices',
  convertMailbox: 'Convert mailbox to shared',
  reEnable: 'Re-enable account',
  archiveData: 'Archive mailbox & files',
  deleteAccount: 'Delete account',
};
