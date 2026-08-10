'use client';

import * as React from 'react';
import WarningAmberOutlined from '@mui/icons-material/WarningAmberOutlined';
import CheckCircleOutlined from '@mui/icons-material/CheckCircleOutlined';
import ArrowDownwardOutlined from '@mui/icons-material/ArrowDownwardOutlined';
import PersonAddAltOutlined from '@mui/icons-material/PersonAddAltOutlined';
import { DataTable, StatusChip, Meter, Tabs, type Column } from '@ds/components';
import { RiskScoreChip } from '@/components/product/directory/RiskScoreChip';
import { GovEntityIcon } from './entity-visuals';
import { FindingCard } from './GovernanceDetailsPanel';
import {
  FINDING_LABEL,
  KIND_LABEL,
  type GovEntityKind,
  type GovFinding,
} from '@/data/governance-types';
import {
  displayName,
  getApprovalHierarchy,
  getGovEntity,
  listApprovalHierarchies,
  listDelegations,
  listEscalationRules,
  ownershipCoverage,
  ownershipRows,
  type GovExplorerRow,
  type GovFilterState,
  type OwnershipRow,
} from '@/data/governance';

export type ExplorerTab = 'relationships' | 'ownership' | 'approvals' | 'delegation' | 'findings';

/* ------------------------------------------------------------------ *
 * Shared cells
 * ------------------------------------------------------------------ */

/**
 * The identity cell. Risk lives here rather than in a trailing column on purpose:
 * a six-column matrix overflows a console pane, and the column that gets scrolled
 * out of sight must never be the one that says how dangerous this is.
 */
function EntityCell({ row }: { row: GovExplorerRow }) {
  return (
    <div className="flex w-[204px] min-w-0 items-center gap-2.5">
      <GovEntityIcon entity={row.entity} size={28} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="min-w-0 truncate text-body-sm-strong text-text-primary">{row.entity.name}</span>
          {row.findings.length > 0 && (
            <WarningAmberOutlined
              sx={{ fontSize: 14, color: 'var(--ds-color-status-danger-fg)' }}
              titleAccess={`${row.findings.length} governance ${row.findings.length === 1 ? 'gap' : 'gaps'}`}
            />
          )}
        </div>
        <div className="mt-0.5 flex items-center gap-1.5">
          <span className="min-w-0 truncate text-caption text-text-tertiary">{KIND_LABEL[row.entity.kind].one}</span>
          {row.entity.risk > 0 && <RiskScoreChip score={row.entity.risk} />}
        </div>
      </div>
    </div>
  );
}

/**
 * The access-controls cell. Counts only, labelled by initial — "4 policies" hides
 * whether the four are birthright or SoD, and those answer different questions.
 */
function ControlsCell({ row }: { row: GovExplorerRow }) {
  const parts = [
    { n: row.controls.birthright, label: 'birthright' },
    { n: row.controls.approval, label: 'approval' },
    { n: row.controls.workflow, label: 'workflow' },
    { n: row.controls.sod, label: 'SoD' },
  ].filter((p) => p.n > 0);

  if (parts.length === 0) {
    return <span className="text-caption text-text-tertiary">No controls</span>;
  }
  return (
    <div className="w-[140px] min-w-0">
      <div className="truncate text-body-sm tabular-nums text-text-primary">
        {parts.reduce((n, p) => n + p.n, 0)} {parts.reduce((n, p) => n + p.n, 0) === 1 ? 'control' : 'controls'}
      </div>
      <div className="truncate text-caption text-text-tertiary">{parts.map((p) => `${p.n} ${p.label}`).join(' · ')}</div>
    </div>
  );
}

function OwnershipCell({ row }: { row: GovExplorerRow }) {
  if (!row.ownership.complete) {
    const missing = row.ownership.owners.length === 0 ? 'owner' : 'review owner';
    return (
      <div className="w-[144px] min-w-0">
        <StatusChip intent="danger" label="Gap" />
        <div className="mt-0.5 truncate text-caption text-text-tertiary">No {missing}</div>
      </div>
    );
  }
  return (
    <div className="w-[144px] min-w-0">
      <div className="truncate text-body-sm text-text-primary">{row.ownership.owners.map((o) => o.name).join(', ')}</div>
      <div className="truncate text-caption text-text-tertiary">
        {row.ownership.reviewers.length > 0 ? `Reviewed by ${row.ownership.reviewers.map((o) => o.name).join(', ')}` : 'Complete'}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Relationships
 * ------------------------------------------------------------------ */

/**
 * Column widths are pixels, not percentages, and every text cell is a fixed-width
 * truncating box. A table cell sizes to its longest string otherwise, and
 * "Finance, Compliance · India, Germany, United States" is enough to push the risk
 * column off screen — which is the one column nobody can afford to lose.
 */
function RelationshipsTab({ rows, onSelect }: { rows: GovExplorerRow[]; onSelect: (id: string) => void }) {
  const columns: Column<GovExplorerRow>[] = [
    { id: 'entity', header: 'Entity', sortable: true, width: 236, value: (r) => r.entity.name, render: (r) => <EntityCell row={r} /> },
    {
      id: 'organization',
      header: 'Organization',
      width: 172,
      value: (r) => r.organization,
      render: (r) => {
        const [departments, locations] = r.organization.split(' · ');
        return (
          <div className="w-[140px] min-w-0" title={r.organization}>
            <div className="truncate text-body-sm text-text-primary">{departments}</div>
            {locations && <div className="truncate text-caption text-text-tertiary">{locations}</div>}
          </div>
        );
      },
    },
    { id: 'controls', header: 'Access controls', width: 172, value: (r) => r.controls.approval + r.controls.birthright + r.controls.sod, render: (r) => <ControlsCell row={r} /> },
    { id: 'ownership', header: 'Ownership', width: 176, value: (r) => (r.ownership.complete ? 1 : 0), render: (r) => <OwnershipCell row={r} /> },
    {
      id: 'approval',
      header: 'Approval',
      align: 'right',
      width: 100,
      sortable: true,
      value: (r) => r.approvalLevels,
      render: (r) =>
        r.approvalLevels > 0 ? (
          <span className="whitespace-nowrap text-body-sm tabular-nums text-text-primary">{r.approvalLevels} levels</span>
        ) : (
          <span className="text-caption text-text-tertiary">—</span>
        ),
    },
  ];

  return (
    <DataTable<GovExplorerRow>
      columns={columns}
      rows={rows}
      onRowClick={(r) => onSelect(r.id)}
      fillHeight
      defaultRowsPerPage={25}
      emptyTitle="No entities in this scope"
      emptyMessage="Every entity is filtered out. Clear a filter or choose a different governance domain to see what it governs."
    />
  );
}

/* ------------------------------------------------------------------ *
 * Ownership
 * ------------------------------------------------------------------ */

function OwnershipTab({ filters, onSelect }: { filters: GovFilterState; onSelect: (id: string) => void }) {
  const cov = ownershipCoverage();
  const rows = React.useMemo(() => ownershipRows(filters), [filters]);

  const columns: Column<OwnershipRow>[] = [
    {
      id: 'entity',
      header: 'Governed object',
      width: '34%',
      sortable: true,
      value: (r) => r.entity.name,
      render: (r) => (
        <div className="flex min-w-0 items-center gap-2.5">
          <GovEntityIcon entity={r.entity} size={28} />
          <div className="min-w-0">
            <div className="truncate text-body-sm-strong text-text-primary">{r.entity.name}</div>
            <div className="truncate text-caption text-text-tertiary">{KIND_LABEL[r.entity.kind].one}</div>
          </div>
        </div>
      ),
    },
    {
      id: 'responsibility',
      header: 'Responsibility',
      width: '22%',
      sortable: true,
      value: (r) => r.responsibility,
      render: (r) => <span className="text-body-sm text-text-secondary">{r.responsibility}</span>,
    },
    {
      id: 'person',
      header: 'Accountable',
      width: '30%',
      sortable: true,
      value: (r) => (r.personId ? displayName(r.personId) : 'zzz'),
      render: (r) =>
        r.personId ? (
          <span className="truncate text-body-sm text-text-primary">{displayName(r.personId)}</span>
        ) : (
          <div className="flex items-center gap-2">
            <StatusChip intent="danger" label="Unassigned" />
            <span className="truncate text-caption text-text-tertiary">Nobody is accountable</span>
          </div>
        ),
    },
    { id: 'risk', header: 'Risk', align: 'right', width: '14%', sortable: true, value: (r) => r.entity.risk, render: (r) => (r.entity.risk > 0 ? <RiskScoreChip score={r.entity.risk} /> : <span className="text-caption text-text-tertiary">—</span>) },
  ];

  return (
    <div className="flex h-full flex-col">
      <div className="mb-4 grid shrink-0 grid-cols-4 gap-4 rounded-lg border border-border bg-surface px-5 py-4">
        <div>
          <div className="text-caption text-text-secondary">Ownership coverage</div>
          <div className="mt-0.5 text-stat tabular-nums text-text-primary">{cov.pct}%</div>
          <div className="mt-1.5">
            <Meter value={cov.pct} size="sm" tone={cov.pct >= 90 ? 'success' : 'warning'} />
          </div>
        </div>
        {[
          { label: 'Missing owners', value: cov.missingOwners },
          { label: 'Missing policy owners', value: cov.missingPolicyOwners },
          { label: 'Missing review owners', value: cov.missingReviewOwners },
        ].map((m) => (
          <div key={m.label}>
            <div className="text-caption text-text-secondary">{m.label}</div>
            <div
              className="mt-0.5 text-stat tabular-nums"
              style={{ color: m.value === 0 ? 'var(--ds-color-text-primary)' : 'var(--ds-color-status-danger-fg)' }}
            >
              {m.value}
            </div>
          </div>
        ))}
      </div>
      <div className="min-h-0 flex-1">
        <DataTable<OwnershipRow>
          columns={columns}
          rows={rows}
          onRowClick={(r) => onSelect(r.entity.id)}
          fillHeight
          defaultRowsPerPage={25}
          emptyTitle="No ownership records in this scope"
          emptyMessage="Nothing matches the active filters. Clear one to see who owns what."
        />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Approval hierarchies
 * ------------------------------------------------------------------ */

/**
 * §24 — the approval chain drawn as a chain. A table of levels would be more
 * compact and would lose the one thing an administrator is here to see: whether a
 * request can actually get from the top to the bottom.
 */
function ApprovalsTab({ onSelect }: { onSelect: (id: string) => void }) {
  const hierarchies = listApprovalHierarchies();
  return (
    <div className="ds-scroll h-full overflow-y-auto pb-6">
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {hierarchies.map((h) => {
          const policy = getGovEntity(h.policyId);
          const broken = h.levels.some((l) => l.approverId === null);
          const noEscalation = h.levels.every((l) => l.escalationRuleId === null);
          return (
            <section key={h.id} className="rounded-lg border border-border bg-surface p-5">
              <header className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <button
                    type="button"
                    onClick={() => policy && onSelect(policy.id)}
                    className="block max-w-full truncate text-left text-body-strong text-text-primary transition-colors hover:text-text-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-subtle"
                  >
                    {policy?.name ?? h.name}
                  </button>
                  <p className="mt-0.5 truncate text-caption text-text-tertiary">
                    {h.levels.length} {h.levels.length === 1 ? 'level' : 'levels'} · owned by {displayName(policy?.ownerIds[0])}
                  </p>
                </div>
                {broken ? (
                  <StatusChip intent="danger" label="Chain broken" />
                ) : noEscalation ? (
                  <StatusChip intent="warning" label="No escalation" />
                ) : (
                  <StatusChip intent="success" label="Complete" />
                )}
              </header>

              <ol className="mt-4">
                <li className="flex items-center gap-2.5 pb-1">
                  <span className="grid h-6 w-6 shrink-0 place-items-center rounded-pill bg-subtle text-icon">
                    <PersonAddAltOutlined sx={{ fontSize: 14 }} />
                  </span>
                  <span className="text-body-sm text-text-secondary">Requester</span>
                </li>
                {h.levels.map((level) => {
                  const unresolved = level.approverId === null;
                  return (
                    <li key={level.level}>
                      <div className="ml-3 h-3 w-px bg-border-strong" aria-hidden />
                      <div className="flex items-start gap-2.5 rounded-md border border-border bg-canvas px-3 py-2">
                        <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-pill bg-subtle text-caption-strong tabular-nums text-text-secondary">
                          {level.level}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="min-w-0 truncate text-body-sm-strong text-text-primary">{level.approverLabel}</span>
                            {unresolved && <StatusChip intent="danger" label="Unresolved" />}
                          </div>
                          <div className="mt-0.5 truncate text-caption text-text-tertiary">
                            {unresolved ? 'No approver exists for this level' : displayName(level.approverId)} · SLA {level.slaHours}h
                          </div>
                          <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-caption text-text-tertiary">
                            <span>Fallback: {level.fallbackApproverId ? displayName(level.fallbackApproverId) : 'none'}</span>
                            <span>Delegation: {level.delegationId ? displayName(level.delegationId) : 'none'}</span>
                            <span>Escalation: {level.escalationRuleId ? displayName(level.escalationRuleId) : 'none'}</span>
                          </div>
                        </div>
                        {!unresolved && (
                          <CheckCircleOutlined
                            sx={{ fontSize: 16, color: 'var(--ds-color-status-success-fg)' }}
                            className="mt-0.5 shrink-0"
                            titleAccess="Resolvable"
                          />
                        )}
                      </div>
                    </li>
                  );
                })}
                <li>
                  <div className="ml-3 h-3 w-px bg-border-strong" aria-hidden />
                  <div className="flex items-center gap-2.5">
                    <span className="grid h-6 w-6 shrink-0 place-items-center rounded-pill bg-subtle text-icon">
                      <ArrowDownwardOutlined sx={{ fontSize: 14 }} />
                    </span>
                    <span className="text-body-sm text-text-secondary">
                      {broken ? 'Request cannot complete' : 'Access provisioned'}
                    </span>
                  </div>
                </li>
              </ol>
            </section>
          );
        })}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Delegation and escalation
 * ------------------------------------------------------------------ */

function DelegationTab({ onSelect }: { onSelect: (id: string) => void }) {
  const delegations = listDelegations();
  const rules = listEscalationRules();

  return (
    <div className="ds-scroll h-full overflow-y-auto pb-6">
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <section>
          <h3 className="text-h5 text-text-primary">Delegation</h3>
          <p className="mt-1 text-body-sm text-text-secondary">Who is currently deciding on someone else’s behalf, and until when.</p>
          <ul className="mt-3 space-y-2">
            {delegations.map((d) => {
              const usedBy = listApprovalHierarchies().filter((h) => h.levels.some((l) => l.delegationId === d.id));
              return (
                <li key={d.id}>
                  <button
                    type="button"
                    onClick={() => onSelect(d.id)}
                    className="w-full rounded-lg border border-border bg-surface p-4 text-left transition-shadow hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-subtle"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="truncate text-body-strong text-text-primary">
                          {displayName(d.fromId)} → {displayName(d.toId)}
                        </div>
                        <p className="mt-0.5 truncate text-caption text-text-secondary">
                          delegates approval authority for {d.scope.toLowerCase()}
                        </p>
                      </div>
                      {d.status === 'expired' ? (
                        <StatusChip intent="danger" label="Expired" />
                      ) : d.validUntil === null ? (
                        <StatusChip intent="warning" label="No expiry" />
                      ) : (
                        <StatusChip intent="success" label="Active" />
                      )}
                    </div>
                    <dl className="mt-3 grid grid-cols-3 gap-3 rounded-md bg-sunken px-3 py-2.5">
                      <div className="min-w-0">
                        <dt className="text-caption text-text-tertiary">Valid until</dt>
                        <dd className="mt-0.5 truncate text-body-sm-strong tabular-nums text-text-primary">{d.validUntil ?? 'No end date'}</dd>
                      </div>
                      <div className="min-w-0">
                        <dt className="text-caption text-text-tertiary">Scope</dt>
                        <dd className="mt-0.5 truncate text-body-sm-strong text-text-primary">{d.scope}</dd>
                      </div>
                      <div className="min-w-0">
                        <dt className="text-caption text-text-tertiary">Used by</dt>
                        <dd className="mt-0.5 truncate text-body-sm-strong text-text-primary">
                          {usedBy.length > 0 ? `${usedBy.length} approval ${usedBy.length === 1 ? 'chain' : 'chains'}` : 'No chain'}
                        </dd>
                      </div>
                    </dl>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>

        <section>
          <h3 className="text-h5 text-text-primary">Escalation</h3>
          <p className="mt-1 text-body-sm text-text-secondary">What happens when a decision is not made in time.</p>
          <ul className="mt-3 space-y-2">
            {rules.map((r) => {
              const unassigned = r.levels.some((l) => l.approverId === null);
              return (
                <li key={r.id}>
                  <button
                    type="button"
                    onClick={() => onSelect(r.id)}
                    className="w-full rounded-lg border border-border bg-surface p-4 text-left transition-shadow hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-subtle"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 truncate text-body-strong text-text-primary">{r.name}</div>
                      {unassigned ? (
                        <StatusChip intent="danger" label="Unassigned level" />
                      ) : r.terminalAction === 'none' ? (
                        <StatusChip intent="warning" label="No terminal action" />
                      ) : (
                        <StatusChip intent="success" label="Complete" />
                      )}
                    </div>
                    <ol className="mt-3">
                      {r.levels.map((l, i) => (
                        <li key={l.level}>
                          {i > 0 && (
                            <div className="ml-3 flex items-center gap-2 py-1">
                              <span className="h-3 w-px bg-border-strong" aria-hidden />
                              <span className="text-caption text-text-tertiary">after {l.afterHours} hours</span>
                            </div>
                          )}
                          <div className="flex items-center gap-2.5 rounded-md border border-border bg-canvas px-3 py-2">
                            <span className="grid h-6 w-6 shrink-0 place-items-center rounded-pill bg-subtle text-caption-strong tabular-nums text-text-secondary">
                              {l.level}
                            </span>
                            <span className="min-w-0 flex-1 truncate text-body-sm text-text-primary">{l.approverLabel}</span>
                            {l.approverId === null && <StatusChip intent="danger" label="Unassigned" />}
                          </div>
                        </li>
                      ))}
                    </ol>
                    <p className="mt-3 border-t border-border pt-2.5 text-caption text-text-secondary">
                      {r.terminalAction === 'auto-reject'
                        ? 'If the last level does not act, the request is automatically rejected.'
                        : r.terminalAction === 'hold'
                          ? 'If the last level does not act, the request is held for manual triage.'
                          : 'If the last level does not act, nothing happens — the request stalls with no disposition.'}
                    </p>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Findings
 * ------------------------------------------------------------------ */

function FindingsTab({ findings, onSelect }: { findings: GovFinding[]; onSelect: (id: string) => void }) {
  if (findings.length === 0) {
    return (
      <div className="grid h-full place-items-center">
        <div className="max-w-[360px] text-center">
          <CheckCircleOutlined sx={{ fontSize: 28, color: 'var(--ds-color-status-success-fg)' }} aria-hidden />
          <div className="mt-2 text-body-strong text-text-primary">No governance gaps in this scope</div>
          <p className="mt-1 text-body-sm text-text-secondary">
            Every entity here has an accountable owner, a governing control, and a resolvable approval path. Widen the
            scope or clear a filter to check the rest of the model.
          </p>
        </div>
      </div>
    );
  }
  const grouped = findings.reduce<Record<string, GovFinding[]>>((acc, f) => {
    (acc[f.kind] ??= []).push(f);
    return acc;
  }, {});

  return (
    <div className="ds-scroll h-full overflow-y-auto pb-6">
      <div className="space-y-5">
        {Object.entries(grouped).map(([kind, list]) => (
          <section key={kind}>
            <h3 className="text-overline uppercase text-text-tertiary">
              {FINDING_LABEL[kind as GovFinding['kind']]} · {list.length}
            </h3>
            <div className="mt-2 grid grid-cols-1 gap-3 xl:grid-cols-2">
              {list.map((f) => (
                <FindingCard key={f.id} finding={f} onSelect={onSelect} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * The Explorer
 * ------------------------------------------------------------------ */

export interface GovernanceExplorerProps {
  tab: ExplorerTab;
  onTabChange: (tab: ExplorerTab) => void;
  rows: GovExplorerRow[];
  findings: GovFinding[];
  filters: GovFilterState;
  scopeKind: GovEntityKind | null;
  onSelect: (id: string) => void;
}

/**
 * View B — the Governance Explorer.
 *
 * Same model as the map, read as structure instead of shape. The tabs are not
 * arbitrary sections: each is one of the questions the brief says an administrator
 * arrives with — what governs this, who owns it, who approves it, what happens when
 * nobody does, and where it is broken.
 */
export function GovernanceExplorer({ tab, onTabChange, rows, findings, filters, scopeKind, onSelect }: GovernanceExplorerProps) {
  const gapCount = rows.filter((r) => r.findings.length > 0).length;

  return (
    <div className="flex h-full min-w-0 flex-col px-5 pt-4">
      <div className="shrink-0">
        <Tabs
          aria-label="Governance explorer views"
          value={tab}
          onChange={(v) => onTabChange(v as ExplorerTab)}
          items={[
            { value: 'relationships', label: 'Relationships', count: rows.length },
            { value: 'ownership', label: 'Ownership' },
            { value: 'approvals', label: 'Approval hierarchy' },
            { value: 'delegation', label: 'Delegation & escalation' },
            { value: 'findings', label: 'Findings', count: findings.length },
          ]}
        />
      </div>

      <div className="min-h-0 flex-1 pt-4">
        {tab === 'relationships' && (
          <div className="flex h-full flex-col">
            <p className="mb-3 shrink-0 text-body-sm text-text-secondary">
              {scopeKind ? KIND_LABEL[scopeKind].many : 'Every governed entity'} in scope · {gapCount}{' '}
              {gapCount === 1 ? 'entity has' : 'entities have'} a governance gap.
            </p>
            <div className="min-h-0 flex-1">
              <RelationshipsTab rows={rows} onSelect={onSelect} />
            </div>
          </div>
        )}
        {tab === 'ownership' && <OwnershipTab filters={filters} onSelect={onSelect} />}
        {tab === 'approvals' && <ApprovalsTab onSelect={onSelect} />}
        {tab === 'delegation' && <DelegationTab onSelect={onSelect} />}
        {tab === 'findings' && <FindingsTab findings={findings} onSelect={onSelect} />}
      </div>
    </div>
  );
}

export { getApprovalHierarchy };
