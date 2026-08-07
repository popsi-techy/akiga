'use client';

import * as React from 'react';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import EditOutlined from '@mui/icons-material/EditOutlined';
import ChevronRight from '@mui/icons-material/ChevronRight';
import RuleOutlined from '@mui/icons-material/RuleOutlined';
import ShieldOutlined from '@mui/icons-material/ShieldOutlined';
import BadgeOutlined from '@mui/icons-material/BadgeOutlined';
import type { AssignEntitiesConfig as AEConfig, EntitySelection, ConditionGroup } from '@/data/automation-types';
import { listTechnicalRoles, listBusinessRoles } from '@/data/catalog';
import { listApprovalPolicies } from '@/data/approval-policies';
import { isConditionGroupValid, emptyConditionGroup } from '@/lib/policy-tree';
import { ConditionPreviewChip } from '@/components/product/ConditionPreviewChip';
import { flattenRules, ruleParts } from './condition-format';
import { EntityCatalogDrawer } from './EntityCatalogDrawer';
import { TableSelectDrawer } from './TableSelectDrawer';
import { SingleSelectDrawer } from './SingleSelectDrawer';
import { ConditionBuilderDrawer } from './ConditionBuilderDrawer';

type DrawerKind = 'entities' | 'tRoles' | 'bRoles' | 'policy' | 'criteria' | null;

/** Quiet uppercase section label (the one heading style across the builders). */
function SectionLabel({ children }: { children: React.ReactNode }) {
  return <div className="mb-3 text-caption font-semibold uppercase tracking-[0.07em] text-text-tertiary">{children}</div>;
}

const chipLabel = (i: EntitySelection) => (i.appName ? `${i.appName}: ${i.name}` : i.name);

/** A "+ add …" card: + tile, medium title, optional count summary, chevron. When
    `items` are present they preview inside the same card (first 2 + "+N"), below a
    hairline — read-only here; editing/removal happens in the drawer. */
function AddRow({ title, summary, items, onClick }: { title: string; summary?: string; items?: EntitySelection[]; onClick: () => void }) {
  const chips = items ?? [];
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); } }}
      className="group cursor-pointer overflow-hidden rounded-lg border border-border bg-canvas transition-colors hover:bg-surface-hover focus-visible:outline-none"
    >
      <div className="flex w-full items-center gap-3 px-3 py-2.5 text-left">
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-md border border-dashed border-border text-icon transition-colors group-hover:border-brand group-hover:text-brand">
          <AddIcon sx={{ fontSize: 18 }} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-body-sm font-medium text-text-primary">{title}</span>
          {summary && <span className="block truncate text-caption text-text-secondary">{summary}</span>}
        </span>
        <ChevronRight sx={{ fontSize: 18 }} className="shrink-0 text-icon" />
      </div>
      {chips.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 border-t border-border px-3 py-2.5">
          {chips.slice(0, 2).map((i) =>
            i.appName ? (
              // Entitlements render as an app-badge chip, matching the SoD resolution
              // "Needs Decision" access chip.
              <span key={i.id} className="inline-flex max-w-[170px] items-center gap-1 rounded-md border border-border bg-subtle py-1 pl-1 pr-2 text-caption">
                <span className="grid h-4 w-4 shrink-0 place-items-center rounded bg-surface text-micro font-semibold text-text-secondary">{i.appName.charAt(0).toUpperCase()}</span>
                <span className="truncate">
                  <span className="text-text-tertiary">{i.appName}</span> <span className="font-medium text-text-primary">{i.name}</span>
                </span>
              </span>
            ) : (
              <span key={i.id} className="inline-flex max-w-[140px] items-center rounded-md border border-border bg-subtle px-2 py-1 text-caption font-medium text-text-primary">
                <span className="truncate">{chipLabel(i)}</span>
              </span>
            ),
          )}
          {chips.length > 2 && (
            <span className="inline-flex shrink-0 items-center rounded-md border border-border bg-subtle px-1.5 py-1 text-caption font-semibold text-text-secondary">+{chips.length - 2}</span>
          )}
        </div>
      )}
    </div>
  );
}

export function AssignEntitiesConfig({ config, onChange }: { config: AEConfig; onChange: (next: AEConfig) => void }) {
  const [drawer, setDrawer] = React.useState<DrawerKind>(null);
  const activePolicies = listApprovalPolicies().filter((p) => p.status === 'active');
  const criteriaValid = config.criteria ? isConditionGroupValid(config.criteria) : false;
  const criteriaRules = config.criteria ? flattenRules(config.criteria) : [];

  const plural = (n: number, w: string) => `${n} ${w}${n === 1 ? '' : 's'}`;
  const appCount = new Set(config.entitlements.map((e) => e.appName).filter(Boolean)).size;
  const entSummary = config.entitlements.length ? `${appCount ? `${plural(appCount, 'app')} · ` : ''}${plural(config.entitlements.length, 'entitlement')}` : undefined;
  const tRoleSummary = config.technicalRoles.length ? plural(config.technicalRoles.length, 'technical role') : undefined;
  const bRoleSummary = config.businessRoles.length ? plural(config.businessRoles.length, 'business role') : undefined;

  return (
    <div>
      {/* Entities */}
      <div className="pb-4">
        <SectionLabel>Assign Entities</SectionLabel>
        <div className="space-y-2">
          <AddRow title="Add apps and entitlements" summary={entSummary} items={config.entitlements} onClick={() => setDrawer('entities')} />
          <AddRow title="Add Technical Roles" summary={tRoleSummary} items={config.technicalRoles} onClick={() => setDrawer('tRoles')} />
          <AddRow title="Add Business Roles" summary={bRoleSummary} items={config.businessRoles} onClick={() => setDrawer('bRoles')} />
        </div>
      </div>

      {/* Approval Policy */}
      <div className="border-t border-border py-4">
        <SectionLabel>Approval Policy</SectionLabel>
        {config.approvalPolicyId ? (
          <div className="flex items-center gap-3 rounded-lg border border-border bg-surface px-3 py-2.5">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-brand-subtle text-brand"><RuleOutlined sx={{ fontSize: 18 }} /></span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-body-sm font-semibold text-text-primary">{config.approvalPolicyName}</span>
              <span className="block text-caption text-text-secondary">Approval policy attached</span>
            </span>
            <button type="button" onClick={() => onChange({ ...config, approvalPolicyId: undefined, approvalPolicyName: undefined })} aria-label="Remove policy" className="text-icon hover:text-danger">
              <CloseIcon sx={{ fontSize: 15 }} />
            </button>
          </div>
        ) : (
          <AddRow title="Select approval policy" onClick={() => setDrawer('policy')} />
        )}
      </div>

      {/* Assignment Criteria */}
      <div className="border-t border-border pt-4">
        <SectionLabel>Assignment Criteria</SectionLabel>
        {criteriaValid ? (
          <div className="rounded-lg border border-border bg-surface px-3 py-2.5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex min-w-0 flex-wrap items-center gap-1.5">
                <ConditionPreviewChip {...ruleParts(criteriaRules[0])} />
                {criteriaRules.length > 1 && (
                  <span className="inline-flex shrink-0 items-center rounded-md bg-subtle px-1.5 py-1 text-caption font-semibold text-text-secondary">+{criteriaRules.length - 1}</span>
                )}
              </div>
              <button
                type="button"
                onClick={() => setDrawer('criteria')}
                aria-label="Edit criteria"
                title="Edit criteria"
                className="grid h-7 w-7 shrink-0 place-items-center rounded-md text-icon transition-colors hover:bg-surface-hover hover:text-text-primary"
              >
                <EditOutlined sx={{ fontSize: 16 }} />
              </button>
            </div>
          </div>
        ) : (
          <AddRow title="Add Assignment Criteria" onClick={() => setDrawer('criteria')} />
        )}
      </div>

      {/* Drawers */}
      <EntityCatalogDrawer open={drawer === 'entities'} onClose={() => setDrawer(null)} selected={config.entitlements} onApply={(entitlements) => onChange({ ...config, entitlements })} />
      <TableSelectDrawer
        open={drawer === 'tRoles'}
        onClose={() => setDrawer(null)}
        title="Add Technical Roles"
        subtitle="Select one or more technical roles."
        icon={<ShieldOutlined sx={{ fontSize: 22, color: 'var(--ds-color-brand-primary)' }} />}
        nameHeader="Technical role"
        entity="technical role"
        rows={listTechnicalRoles()}
        selectedIds={config.technicalRoles.map((r) => r.id)}
        onApply={(ids) => onChange({ ...config, technicalRoles: listTechnicalRoles().filter((r) => ids.includes(r.id)).map((r) => ({ id: r.id, name: r.name })) })}
      />
      <TableSelectDrawer
        open={drawer === 'bRoles'}
        onClose={() => setDrawer(null)}
        title="Add Business Roles"
        subtitle="Select one or more business roles."
        icon={<BadgeOutlined sx={{ fontSize: 22, color: 'var(--ds-color-brand-primary)' }} />}
        nameHeader="Business role"
        entity="business role"
        rows={listBusinessRoles()}
        selectedIds={config.businessRoles.map((r) => r.id)}
        onApply={(ids) => onChange({ ...config, businessRoles: listBusinessRoles().filter((r) => ids.includes(r.id)).map((r) => ({ id: r.id, name: r.name })) })}
      />
      <SingleSelectDrawer
        open={drawer === 'policy'}
        onClose={() => setDrawer(null)}
        title="Attach Approval Policy"
        subtitle={activePolicies.length ? 'Only active policies can be attached.' : undefined}
        items={activePolicies.map((p) => ({ id: p.id, primary: p.policyName, secondary: p.description || 'Approval policy' }))}
        selectedId={config.approvalPolicyId}
        onSelect={(id) => {
          const p = activePolicies.find((x) => x.id === id);
          onChange({ ...config, approvalPolicyId: id, approvalPolicyName: p?.policyName });
        }}
      />
      <ConditionBuilderDrawer
        open={drawer === 'criteria'}
        onClose={() => setDrawer(null)}
        title="Assignment Criteria"
        subtitle="Only identities matching these conditions receive the assignment."
        group={config.criteria ?? emptyConditionGroup()}
        onApply={(group: ConditionGroup) => onChange({ ...config, criteria: group })}
      />
    </div>
  );
}

export default AssignEntitiesConfig;
