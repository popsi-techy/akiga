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
};

/** Icon-tile colors grouped by palette section (decorative — categorical, not text). */
export const SECTION_TILE: Record<string, { bg: string; fg: string }> = {
  Events: { bg: 'var(--ds-color-brand-subtle)', fg: 'var(--ds-color-brand-primary)' },
  Filters: { bg: '#EFEAFE', fg: '#7C4DFF' }, //       violet
  Tasks: { bg: '#E8F1FE', fg: '#2E7CF6' }, //         blue
  Branching: { bg: '#FFF1E3', fg: '#F59E0B' }, //     amber
  'Flow Control': { bg: '#E4F6EF', fg: '#0EA47A' }, // teal
};

export const tileFor = (section: string) =>
  SECTION_TILE[section] ?? { bg: 'var(--ds-color-surface-hover)', fg: 'var(--ds-color-icon-default)' };

/** Section order — shared by the sidebar palette and the canvas quick-insert menu. */
export const PALETTE_SECTIONS = ['Filters', 'Tasks', 'Branching', 'Flow Control'] as const;

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
    default:
      return BLOCK_META[node.type].title;
  }
}
