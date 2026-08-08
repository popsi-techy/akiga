'use client';

import * as React from 'react';
import AddIcon from '@mui/icons-material/Add';
import EditOutlined from '@mui/icons-material/EditOutlined';
import type { UserFilterConfig as UFConfig, ConditionGroup } from '@/data/automation-types';
import { isConditionGroupValid, emptyConditionGroup } from '@/lib/policy-tree';
import { ConditionPreviewChip } from '@/components/product/ConditionPreviewChip';
import { flattenRules, ruleParts } from './condition-format';
import { ConditionBuilderDrawer } from './ConditionBuilderDrawer';

export function UserFilterConfig({ config, onChange }: { config: UFConfig; onChange: (next: UFConfig) => void }) {
  const [open, setOpen] = React.useState(false);
  const valid = config.condition ? isConditionGroupValid(config.condition) : false;
  const rules = config.condition ? flattenRules(config.condition) : [];

  return (
    <div className="space-y-3">
      <p className="text-caption leading-5 text-text-secondary">Only identities matching these conditions continue past this step.</p>

      {!valid ? (
        // First view — a single prompt to build the filter condition.
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex w-full flex-col items-center gap-2 rounded-xl border-2 border-dashed border-border bg-surface px-6 py-6 text-center transition-colors hover:border-border-strong"
        >
          <span className="grid h-11 w-11 place-items-center rounded-full bg-subtle text-icon">
            <AddIcon sx={{ fontSize: 22 }} />
          </span>
          <span className="text-body-strong text-text-primary">Add Condition</span>
          <span className="text-caption leading-snug text-text-secondary">Build rules from identity, request, and relationship attributes.</span>
        </button>
      ) : (
        <div className="rounded-lg border border-border bg-surface px-3 py-2.5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex min-w-0 flex-wrap items-center gap-1.5">
              <ConditionPreviewChip {...ruleParts(rules[0])} />
              {rules.length > 1 && (
                <span className="inline-flex shrink-0 items-center rounded-md bg-subtle px-1.5 py-1 text-caption-strong text-text-secondary">+{rules.length - 1}</span>
              )}
            </div>
            <button
              type="button"
              onClick={() => setOpen(true)}
              aria-label="Edit conditions"
              title="Edit conditions"
              className="grid h-7 w-7 shrink-0 place-items-center rounded-md text-icon transition-colors hover:bg-surface-hover hover:text-text-primary"
            >
              <EditOutlined sx={{ fontSize: 16 }} />
            </button>
          </div>
        </div>
      )}

      <ConditionBuilderDrawer
        open={open}
        onClose={() => setOpen(false)}
        title="User Filter"
        subtitle="Restrict which identities continue."
        group={config.condition ?? emptyConditionGroup()}
        onApply={(group: ConditionGroup) => onChange({ ...config, condition: group })}
      />
    </div>
  );
}

export default UserFilterConfig;
