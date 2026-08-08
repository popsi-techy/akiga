'use client';

import * as React from 'react';
import AddIcon from '@mui/icons-material/Add';
import EditOutlined from '@mui/icons-material/EditOutlined';
import DeleteOutline from '@mui/icons-material/DeleteOutline';
import { StatusChip } from '@ds/components';
import type { PolicyNode, PolicyBranch, ConditionGroup } from '@/data/automation-types';
import { addElseIf, removeBranch, setBranchCondition, isConditionGroupValid, emptyConditionGroup } from '@/lib/policy-tree';
import { flattenRules } from './condition-format';
import { ConditionPreviewChip } from '@/components/product/ConditionPreviewChip';
import { policyRuleParts } from '@/data/policy-conditions';
import { PolicyConditionDrawer } from './PolicyConditionDrawer';

/** Quiet uppercase section label (the one heading style across the builders). */
function SectionLabel({ children }: { children: React.ReactNode }) {
  return <div className="mb-3 text-caption-strong uppercase tracking-[0.07em] text-text-tertiary">{children}</div>;
}

export function ConditionalBranchConfig({ node, onPatchNode }: { node: PolicyNode; onPatchNode: (patch: Partial<PolicyNode>) => void }) {
  const [editing, setEditing] = React.useState<string | null>(null);
  const branches = node.branches ?? [];
  const editingBranch = branches.find((b) => b.id === editing);

  const setBranches = (next: PolicyBranch[]) => onPatchNode({ branches: next });

  const condBranches = branches.filter((b) => b.kind === 'if' || b.kind === 'elseif');
  const elseBranch = branches.find((b) => b.kind === 'else');
  const configuredCount = condBranches.filter((b) => b.condition && isConditionGroupValid(b.condition)).length;
  const firstIf = condBranches[0];

  /** Append an ELSE IF branch and immediately open its condition builder. */
  const addAndEdit = () => {
    const before = new Set(branches.map((b) => b.id));
    const next = addElseIf(branches);
    setBranches(next);
    const added = next.find((b) => !before.has(b.id));
    if (added) setEditing(added.id);
  };

  return (
    <div className="space-y-6">
      {/* Condition branches */}
      <div>
        <SectionLabel>Condition Branches</SectionLabel>

        {configuredCount === 0 && firstIf ? (
          // First view — a single prompt to build the first (IF) condition.
          <button
            type="button"
            onClick={() => setEditing(firstIf.id)}
            className="flex w-full flex-col items-center gap-2 rounded-xl border-2 border-dashed border-border bg-surface px-6 py-6 text-center transition-colors hover:border-border-strong"
          >
            <span className="grid h-11 w-11 place-items-center rounded-full bg-subtle text-icon">
              <AddIcon sx={{ fontSize: 22 }} />
            </span>
            <span className="text-body-strong text-text-primary">Add Condition</span>
            <span className="text-caption leading-snug text-text-secondary">Build rules from request, user, and relationship attributes.</span>
          </button>
        ) : (
          <div className="space-y-2">
            {condBranches.map((b) => {
              const valid = b.condition ? isConditionGroupValid(b.condition) : false;
              const rules = b.condition ? flattenRules(b.condition) : [];
              return (
                <div key={b.id} className="rounded-lg border border-border bg-surface px-3 py-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="rounded-pill bg-[var(--ds-color-status-info-subtle)] px-2.5 py-0.5 text-caption-strong tracking-wide text-[var(--ds-color-status-info-fg)]">{b.label}</span>
                    <div className="flex items-center gap-0.5">
                      {!valid && <StatusChip intent="warning" label="Not set" />}
                      <button
                        type="button"
                        onClick={() => setEditing(b.id)}
                        aria-label="Edit conditions"
                        title="Edit conditions"
                        className="grid h-7 w-7 place-items-center rounded-md text-icon transition-colors hover:bg-surface-hover hover:text-text-primary"
                      >
                        <EditOutlined sx={{ fontSize: 16 }} />
                      </button>
                      {b.kind === 'elseif' && (
                        <button
                          type="button"
                          onClick={() => setBranches(removeBranch(branches, b.id))}
                          aria-label="Remove branch"
                          title="Remove branch"
                          className="grid h-7 w-7 place-items-center rounded-md text-icon transition-colors hover:bg-surface-hover hover:text-danger"
                        >
                          <DeleteOutline sx={{ fontSize: 16 }} />
                        </button>
                      )}
                    </div>
                  </div>
                  {valid && (
                    <div className="mt-2 flex flex-wrap items-center gap-1.5">
                      <ConditionPreviewChip {...policyRuleParts(rules[0])} />
                      {rules.length > 1 && (
                        <span className="inline-flex shrink-0 items-center rounded-md bg-subtle px-1.5 py-1 text-caption-strong text-text-secondary">+{rules.length - 1}</span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Add another path — shown once the first condition exists. */}
            <button
              type="button"
              onClick={addAndEdit}
              className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-border px-3 py-2.5 text-body-sm-strong text-text-secondary transition-colors hover:border-border-strong hover:bg-surface-hover hover:text-text-primary"
            >
              <AddIcon sx={{ fontSize: 16 }} /> Add ELSE IF
            </button>
          </div>
        )}
      </div>

      {/* Fallback */}
      <div>
        <SectionLabel>Fallback Branch</SectionLabel>
        <div className="flex items-center gap-2.5 rounded-lg border border-border bg-surface px-3 py-2.5">
          <span className="rounded-pill bg-[var(--ds-color-status-info-subtle)] px-2.5 py-0.5 text-caption-strong tracking-wide text-[var(--ds-color-status-info-fg)]">{elseBranch?.label ?? 'ELSE'}</span>
          <span className="text-body-sm text-text-secondary">All other requests</span>
        </div>
      </div>

      {editingBranch && (
        <PolicyConditionDrawer
          open={editing !== null}
          onClose={() => setEditing(null)}
          title={`Conditions — ${editingBranch.label}`}
          subtitle="Requests matching these conditions follow this path."
          group={editingBranch.condition ?? emptyConditionGroup()}
          onApply={(group: ConditionGroup) => setBranches(setBranchCondition(branches, editingBranch.id, group))}
        />
      )}
    </div>
  );
}

export default ConditionalBranchConfig;
