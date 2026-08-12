'use client';

import * as React from 'react';
import BoltOutlined from '@mui/icons-material/BoltOutlined';
import FilterAltOutlined from '@mui/icons-material/FilterAltOutlined';
import { FlowCanvas, type FlowBranchLike, type FlowNodeLike } from '@ds/components';
import { BLOCK_META } from '@/lib/workflow-tree';
import { WORKFLOW_EVENT_META } from '@/data/workflows';
import type { AutomationWorkflow, WorkflowBranch, WorkflowNode } from '@/data/automation-types';
import { ICONS, EVENT_ICONS, blockSummary, tileFor } from './workflow-visuals';
import { ConditionLaneLabel, LaneLabel, SplitLaneLabel } from './LaneLabel';

/**
 * Read-only twin of the workflow builder canvas.
 *
 * Unlike an approval policy — whose branch structure is collapsed to a stage list
 * because the question there is linear ("who approves, in what order") — a
 * workflow's branching *is* the content. A Multisplit fans one joiner population
 * into per-department lanes; a Conditional routes by attribute. Flatten that and
 * the workflow stops being describable. So this keeps the graph, and simply
 * removes every authoring affordance.
 *
 * Every block is drawn from the same `workflow-visuals` module the builder uses,
 * so the preview and the editor cannot disagree about what a block looks like.
 */
export function WorkflowFlowPreview({ workflow }: { workflow: AutomationWorkflow }) {
  const renderCard = (n: FlowNodeLike, { dense }: { dense: boolean }) => {
    const node = n as WorkflowNode;
    const meta = BLOCK_META[node.type];
    const Icon = ICONS[meta.icon] ?? FilterAltOutlined;
    const tile = tileFor(meta.section);
    const title = node.name?.trim() || meta.title;
    const summary = blockSummary(node);

    // Branching blocks keep the rhombus, so the shape still reads as a decision.
    if (meta.branching) {
      const paths =
        node.type === 'multisplitBranch'
          ? (node.branches ?? []).filter((b) => (b as WorkflowBranch).kind === 'split').length
          : (node.branches ?? []).filter(
              (b) => (b as WorkflowBranch).kind === 'if' || (b as WorkflowBranch).kind === 'elseif',
            ).length;
      const unit = node.type === 'multisplitBranch' ? 'branch' : 'condition';
      return (
        <div className="relative grid h-[188px] w-[188px] place-items-center">
          <span className="absolute left-1/2 top-1/2 h-[132px] w-[132px] -translate-x-1/2 -translate-y-1/2 rotate-45 rounded-2xl border border-border bg-surface" />
          <span className="relative z-[1] flex w-[130px] flex-col items-center gap-1 px-1 text-center">
            <span className="grid h-9 w-9 place-items-center rounded-full" style={{ backgroundColor: tile.bg, color: tile.fg }}>
              <Icon sx={{ fontSize: 18 }} />
            </span>
            <span className="text-body-sm-medium leading-tight text-text-primary">{title}</span>
            <span className="text-caption leading-tight text-text-secondary">
              {paths} {unit}
              {paths === 1 ? '' : 's'}
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

    return (
      <div className="flex w-[320px] items-center gap-3 rounded-xl border border-border bg-surface px-4 py-3">
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-md" style={{ backgroundColor: tile.bg, color: tile.fg }}>
          <Icon sx={{ fontSize: 18 }} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-body-medium leading-tight text-text-primary">{title}</span>
          {!dense && (
            <span className="mt-1 block truncate text-caption leading-tight text-text-secondary">{summary}</span>
          )}
        </span>
      </div>
    );
  };

  /** The trigger card — what starts this workflow, mirroring the builder's. */
  const eventCard = () => {
    const ev = workflow.event;
    if (!ev) {
      return (
        <div className="flex w-[320px] items-center gap-3 rounded-xl border border-dashed border-border bg-surface px-4 py-3">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-subtle text-icon-subtle">
            <BoltOutlined sx={{ fontSize: 18 }} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-body-medium leading-tight text-text-primary">No trigger yet</span>
            <span className="mt-1 block truncate text-caption leading-tight text-text-secondary">
              Open the editor to choose an event
            </span>
          </span>
        </div>
      );
    }
    const EventIcon = EVENT_ICONS[ev.type];
    return (
      <div className="flex w-[320px] items-center gap-3 rounded-xl border border-border bg-surface px-4 py-3">
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-brand-subtle text-brand">
          <EventIcon sx={{ fontSize: 18 }} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-body-medium leading-tight text-text-primary">{ev.label}</span>
          <span className="mt-0.5 block truncate text-caption leading-tight text-text-secondary">
            {ev.description || WORKFLOW_EVENT_META[ev.type].description}
          </span>
        </span>
      </div>
    );
  };

  return (
    <FlowCanvas
      readOnly
      root={workflow.root}
      renderCard={renderCard}
      headerCard={eventCard}
      palette={[]}
      onInsert={() => {}}
      emptyHint="Open the editor to add filters, tasks and branching."
      isTerminal={(n) => (n as WorkflowNode).type === 'exit'}
      renderBranchLabel={(b: FlowBranchLike) => {
        const br = b as unknown as WorkflowBranch;
        if (br.kind === 'if' || br.kind === 'elseif') {
          return <ConditionLaneLabel label={br.label} group={br.condition} />;
        }
        if (br.kind === 'split') {
          return <SplitLaneLabel label={br.label} matchValues={br.matchValues} />;
        }
        return <LaneLabel text={br.label} />;
      }}
    />
  );
}

export default WorkflowFlowPreview;
