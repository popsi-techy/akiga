'use client';

import * as React from 'react';
import LaptopOutlined from '@mui/icons-material/LaptopOutlined';
import VpnKeyOutlined from '@mui/icons-material/VpnKeyOutlined';
import type { SodRuleGroup, SodRuleNode } from '@/data/sod-types';

/**
 * Read-only rendering of a saved ruleset.
 *
 * The same shape as the builder minus every control, so moving between them
 * costs no re-reading. The joining word sits on a rule line down the left of
 * each group rather than between rows: with three or more items, a word repeated
 * between every pair invites the reader to check whether they all say the same
 * thing, when by construction they must.
 */
export function SodRulesetPreview({ root }: { root: SodRuleGroup }) {
  return <GroupView group={root} isRoot />;
}

function GroupView({ group, isRoot = false }: { group: SodRuleGroup; isRoot?: boolean }) {
  if (group.children.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-border px-3 py-4 text-center text-body-sm text-text-tertiary">
        Nothing in this group
      </p>
    );
  }

  return (
    <div className={isRoot ? '' : 'rounded-lg border border-border bg-canvas p-3'}>
      <div className="flex gap-3">
        {/* The joining word, stated once for the whole group. */}
        {group.children.length > 1 && (
          <div className="flex shrink-0 flex-col items-center">
            <span className="rounded-pill bg-subtle px-2 py-0.5 text-caption-medium text-text-secondary">
              {group.combinator}
            </span>
            <span className="mt-1 w-px flex-1 bg-border" aria-hidden />
          </div>
        )}
        <div className="min-w-0 flex-1 space-y-2">
          {group.children.map((child) =>
            child.kind === 'access' ? (
              <AccessView key={child.id} node={child} />
            ) : (
              <GroupView key={child.id} group={child} />
            ),
          )}
        </div>
      </div>
    </div>
  );
}

function AccessView({ node }: { node: Extract<SodRuleNode, { kind: 'access' }> }) {
  return (
    <div className="flex items-center gap-2.5 rounded-lg border border-border bg-surface px-3 py-2.5">
      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-md bg-subtle text-icon">
        {node.accessType === 'technicalRole' ? (
          <LaptopOutlined sx={{ fontSize: 16 }} />
        ) : (
          <VpnKeyOutlined sx={{ fontSize: 16 }} />
        )}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-body-sm-strong text-text-primary">{node.name}</span>
        <span className="block truncate text-caption text-text-secondary">
          {node.accessType === 'technicalRole' ? 'Technical role' : node.appName ?? 'Entitlement'}
        </span>
      </span>
    </div>
  );
}
