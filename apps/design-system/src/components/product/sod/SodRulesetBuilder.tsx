'use client';

import * as React from 'react';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutline from '@mui/icons-material/DeleteOutline';
import LaptopOutlined from '@mui/icons-material/LaptopOutlined';
import ShieldOutlined from '@mui/icons-material/ShieldOutlined';
import { Button, Menu } from '@ds/components';
import {
  addNodes,
  newAccessRef,
  newGroup,
  removeNode,
  setCombinator,
} from '@/lib/sod-ruleset';
import { listTechnicalRoles } from '@/data/catalog';
import type { SodCombinator, SodRuleGroup, SodRuleNode } from '@/data/sod-types';
import type { EntitySelection } from '@/data/automation-types';
import { EntityCatalogDrawer } from '../automation/EntityCatalogDrawer';
import { TableSelectDrawer } from '../automation/TableSelectDrawer';

/**
 * The AND/OR editor for a policy's ruleset.
 *
 * Reads as a sentence, not a form: each group states its own joining word once,
 * at the left, and its items sit beneath it. The alternative — a combinator
 * dropdown repeated between every pair of rows — makes a three-item group claim
 * two independent choices when it only has one.
 *
 * Nesting is capped at one level below the root. Deeper trees are expressible
 * but not readable, and every real SoD rule this shape is meant to carry —
 * "any of these initiating permissions together with any of these approving
 * ones" — fits in two.
 */
const MAX_DEPTH = 1;

export function SodRulesetBuilder({
  root,
  onChange,
}: {
  root: SodRuleGroup;
  onChange: (next: SodRuleGroup) => void;
}) {
  const [entitlementTarget, setEntitlementTarget] = React.useState<string | null>(null);
  const [roleTarget, setRoleTarget] = React.useState<string | null>(null);

  const addEntitlements = (groupId: string, picked: EntitySelection[]) => {
    onChange(
      addNodes(
        root,
        groupId,
        picked.map((e) =>
          newAccessRef({ accessId: e.id, accessType: 'entitlement', name: e.name, appName: e.appName }),
        ),
      ),
    );
  };

  const addRoles = (groupId: string, ids: string[]) => {
    const roles = listTechnicalRoles().filter((r) => ids.includes(r.id));
    onChange(
      addNodes(
        root,
        groupId,
        roles.map((r) => newAccessRef({ accessId: r.id, accessType: 'technicalRole', name: r.name })),
      ),
    );
  };

  return (
    <>
      <GroupEditor
        group={root}
        depth={0}
        isRoot
        onCombinator={(id, c) => onChange(setCombinator(root, id, c))}
        onRemove={(id) => onChange(removeNode(root, id))}
        onAddGroup={(id) => onChange(addNodes(root, id, [newGroup('OR')]))}
        onAddEntitlement={setEntitlementTarget}
        onAddRole={setRoleTarget}
      />

      <EntityCatalogDrawer
        open={entitlementTarget !== null}
        onClose={() => setEntitlementTarget(null)}
        selected={[]}
        onApply={(picked) => {
          if (entitlementTarget) addEntitlements(entitlementTarget, picked);
          setEntitlementTarget(null);
        }}
      />

      <TableSelectDrawer
        open={roleTarget !== null}
        onClose={() => setRoleTarget(null)}
        title="Add Technical Roles"
        subtitle="A role brings every entitlement inside it into the conflict."
        icon={<LaptopOutlined sx={{ fontSize: 22, color: 'var(--ds-color-brand-primary)' }} />}
        nameHeader="Technical Role"
        entity="technical role"
        rows={listTechnicalRoles()}
        selectedIds={[]}
        onApply={(ids) => {
          if (roleTarget) addRoles(roleTarget, ids);
          setRoleTarget(null);
        }}
      />
    </>
  );
}

function GroupEditor({
  group,
  depth,
  isRoot = false,
  onCombinator,
  onRemove,
  onAddGroup,
  onAddEntitlement,
  onAddRole,
}: {
  group: SodRuleGroup;
  depth: number;
  isRoot?: boolean;
  onCombinator: (groupId: string, c: SodCombinator) => void;
  onRemove: (nodeId: string) => void;
  onAddGroup: (groupId: string) => void;
  onAddEntitlement: (groupId: string) => void;
  onAddRole: (groupId: string) => void;
}) {
  return (
    <div
      className={
        isRoot
          ? ''
          : 'rounded-lg border border-border bg-canvas p-3'
      }
    >
      <div className="mb-2.5 flex items-center gap-2">
        <CombinatorToggle value={group.combinator} onChange={(c) => onCombinator(group.id, c)} />
        <span className="min-w-0 flex-1 truncate text-caption text-text-tertiary">
          {group.combinator === 'AND'
            ? 'A conflict needs every item below'
            : 'Any one item below counts'}
        </span>
        {!isRoot && (
          <button
            type="button"
            onClick={() => onRemove(group.id)}
            aria-label="Remove group"
            className="grid h-7 w-7 shrink-0 place-items-center rounded-md text-icon transition-colors hover:bg-surface-hover hover:text-danger focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-subtle"
          >
            <DeleteOutline sx={{ fontSize: 17 }} />
          </button>
        )}
      </div>

      <div className="space-y-2">
        {group.children.map((child) =>
          child.kind === 'access' ? (
            <AccessRow key={child.id} node={child} onRemove={() => onRemove(child.id)} />
          ) : (
            <GroupEditor
              key={child.id}
              group={child}
              depth={depth + 1}
              onCombinator={onCombinator}
              onRemove={onRemove}
              onAddGroup={onAddGroup}
              onAddEntitlement={onAddEntitlement}
              onAddRole={onAddRole}
            />
          ),
        )}

        {group.children.length === 0 && (
          <p className="rounded-lg border border-dashed border-border px-3 py-4 text-center text-body-sm text-text-tertiary">
            Nothing in this group yet
          </p>
        )}
      </div>

      <div className="mt-2.5 flex flex-wrap gap-2">
        <Menu
          trigger={
            <Button variant="secondary" size="sm" startIcon={<AddIcon />}>
              Add access
            </Button>
          }
          items={[
            {
              label: 'Entitlement',
              icon: <ShieldOutlined sx={{ fontSize: 18 }} />,
              onClick: () => onAddEntitlement(group.id),
            },
            {
              label: 'Technical role',
              icon: <LaptopOutlined sx={{ fontSize: 18 }} />,
              onClick: () => onAddRole(group.id),
            },
          ]}
        />
        {depth < MAX_DEPTH && (
          <Button variant="secondary" size="sm" startIcon={<AddIcon />} onClick={() => onAddGroup(group.id)}>
            Add group
          </Button>
        )}
      </div>
    </div>
  );
}

/** The connected AND/OR switch. One choice per group, stated once. */
function CombinatorToggle({
  value,
  onChange,
}: {
  value: SodCombinator;
  onChange: (v: SodCombinator) => void;
}) {
  return (
    <div className="inline-flex shrink-0 rounded-md bg-subtle p-0.5" role="group" aria-label="Join items with">
      {(['AND', 'OR'] as const).map((c) => (
        <button
          key={c}
          type="button"
          aria-pressed={value === c}
          onClick={() => onChange(c)}
          className={[
            'rounded-[5px] px-2.5 py-1 text-caption-strong transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-subtle',
            value === c ? 'bg-surface text-text-primary shadow-xs' : 'text-text-secondary hover:text-text-primary',
          ].join(' ')}
        >
          {c}
        </button>
      ))}
    </div>
  );
}

function AccessRow({ node, onRemove }: { node: Extract<SodRuleNode, { kind: 'access' }>; onRemove: () => void }) {
  return (
    <div className="flex items-center gap-2.5 rounded-lg border border-border bg-surface px-3 py-2.5">
      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-md bg-subtle text-icon">
        {node.accessType === 'technicalRole' ? (
          <LaptopOutlined sx={{ fontSize: 16 }} />
        ) : (
          <ShieldOutlined sx={{ fontSize: 16 }} />
        )}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-body-sm-strong text-text-primary">{node.name}</span>
        <span className="block truncate text-caption text-text-secondary">
          {node.accessType === 'technicalRole' ? 'Technical role' : node.appName ?? 'Entitlement'}
        </span>
      </span>
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove ${node.name}`}
        className="grid h-7 w-7 shrink-0 place-items-center rounded-md text-icon transition-colors hover:bg-surface-hover hover:text-danger focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-subtle"
      >
        <DeleteOutline sx={{ fontSize: 17 }} />
      </button>
    </div>
  );
}
