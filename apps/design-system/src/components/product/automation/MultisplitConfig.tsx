'use client';

import * as React from 'react';
import { typography } from '@/design-system/tokens/tokens';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutline from '@mui/icons-material/DeleteOutline';
import ExpandMoreOutlined from '@mui/icons-material/ExpandMoreOutlined';
import MuiSelect from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import ListItemText from '@mui/material/ListItemText';
import { Button, Checkbox, Input, Select } from '@ds/components';
import type { WorkflowNode, WorkflowBranch, MultisplitConfig as MSConfig } from '@/data/automation-types';
import { addSplitLane, removeBranch, patchBranch } from '@/lib/workflow-tree';
import { getAttribute } from '@/data/attributes';

/** Attributes offered as split keys (kept to Department + Employment Type for now). */
const SPLIT_ATTR_IDS = ['department', 'employmentType'];

export function MultisplitConfig({ node, onPatchNode }: { node: WorkflowNode; onPatchNode: (patch: Partial<WorkflowNode>) => void }) {
  const config = (node.config as unknown as MSConfig) ?? { splitAttributes: [] };
  const branches = node.branches ?? [];
  const splitLanes = branches.filter((b) => b.kind === 'split');
  const splitAttrs = SPLIT_ATTR_IDS.map((id) => getAttribute(id)).filter((a): a is NonNullable<typeof a> => Boolean(a));

  const setBranches = (next: WorkflowBranch[]) => onPatchNode({ branches: next });
  const setSplitAttrs = (ids: string[]) => onPatchNode({ config: { ...config, splitAttributes: ids } as unknown as Record<string, unknown> });
  const setValue = (lane: WorkflowBranch, attrId: string, value: string) =>
    setBranches(patchBranch(branches, lane.id, { matchValues: { ...lane.matchValues, [attrId]: value ? [value] : [] } }));

  return (
    <div className="space-y-5">
      {/* split attributes — multiselect dropdown */}
      <div>
        <div className="mb-2 text-caption-strong uppercase tracking-[0.07em] text-text-tertiary">Split Attributes</div>
        <MuiSelect
          multiple
          displayEmpty
          fullWidth
          size="small"
          value={config.splitAttributes}
          onChange={(e) => setSplitAttrs(typeof e.target.value === 'string' ? e.target.value.split(',') : (e.target.value as string[]))}
          IconComponent={ExpandMoreOutlined}
          renderValue={(sel) => {
            const ids = sel as string[];
            if (ids.length === 0) return <span className="text-text-tertiary">Select attributes</span>;
            return ids.map((id) => getAttribute(id)?.label ?? id).join(', ');
          }}
          sx={{ fontSize: typography.bodySm.fontSize, borderRadius: 'var(--ds-radius-md)' }}
          MenuProps={{ PaperProps: { sx: { borderRadius: 'var(--ds-radius-md)' } } }}
        >
          {splitAttrs.map((a) => (
            <MenuItem key={a.id} value={a.id} dense>
              {/* MenuItem is the control — box only, no nested input. */}
              <span className="mr-2 inline-flex">
                <Checkbox checked={config.splitAttributes.includes(a.id)} presentational />
              </span>
              <ListItemText primary={a.label} primaryTypographyProps={{ fontSize: typography.bodySm.fontSize }} />
            </MenuItem>
          ))}
        </MuiSelect>
      </div>

      {/* branches */}
      <div>
        <div className="mb-1.5 text-caption-strong uppercase tracking-[0.07em] text-text-tertiary">Branches</div>
        <div className="space-y-2">
          {splitLanes.map((lane) => (
            <div key={lane.id} className="space-y-3 rounded-md bg-subtle p-3">
              <div className="flex items-center gap-2">
                <Input aria-label="Branch name" size="sm" value={lane.label} onChange={(e) => setBranches(patchBranch(branches, lane.id, { label: e.target.value }))} />
                {splitLanes.length > 2 && (
                  <button
                    type="button"
                    onClick={() => setBranches(removeBranch(branches, lane.id))}
                    aria-label="Remove branch"
                    className="grid h-8 w-8 shrink-0 place-items-center rounded-md text-icon hover:bg-surface-hover hover:text-danger"
                  >
                    <DeleteOutline sx={{ fontSize: 18 }} />
                  </button>
                )}
              </div>
              {config.splitAttributes.length === 0 ? (
                <p className="text-caption text-text-tertiary">Select split attributes above to set matching values.</p>
              ) : (
                config.splitAttributes.map((attrId) => {
                  const attr = getAttribute(attrId);
                  if (!attr) return null;
                  return (
                    <div key={attrId}>
                      <div className="mb-1 text-caption-strong text-text-secondary">{attr.label}</div>
                      <Select
                        options={(attr.options ?? []).map((o) => ({ value: o, label: o }))}
                        value={lane.matchValues?.[attrId]?.[0] ?? ''}
                        placeholder={`Select ${attr.label.toLowerCase()}`}
                        onChange={(v) => setValue(lane, attrId, v)}
                      />
                    </div>
                  );
                })
              )}
            </div>
          ))}
        </div>
        <Button variant="secondary" size="sm" startIcon={<AddIcon />} onClick={() => setBranches(addSplitLane(branches))} className="mt-2 w-full">
          Add branch
        </Button>
      </div>

      {/* fallback */}
      <div>
        <div className="mb-1.5 text-caption-strong uppercase tracking-[0.07em] text-text-tertiary">Fallback Branch</div>
        <div className="flex items-center gap-2.5 rounded-lg border border-border bg-surface px-3 py-2.5">
          <span className="rounded-pill bg-[var(--ds-color-status-info-subtle)] px-2.5 py-0.5 text-caption-medium tracking-wide text-[var(--ds-color-status-info-fg)]">ELSE</span>
          <span className="text-body-sm text-text-secondary">All identities that match no branch</span>
        </div>
      </div>
    </div>
  );
}

export default MultisplitConfig;
