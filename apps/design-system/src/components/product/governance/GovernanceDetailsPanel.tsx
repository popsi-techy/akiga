'use client';

import * as React from 'react';
import Link from 'next/link';
import CloseIcon from '@mui/icons-material/Close';
import ExpandMoreOutlined from '@mui/icons-material/ExpandMoreOutlined';
import WarningAmberOutlined from '@mui/icons-material/WarningAmberOutlined';
import CheckCircleOutlined from '@mui/icons-material/CheckCircleOutlined';
import CenterFocusStrongOutlined from '@mui/icons-material/CenterFocusStrongOutlined';
import ArrowForwardOutlined from '@mui/icons-material/ArrowForwardOutlined';
import OpenInNewOutlined from '@mui/icons-material/OpenInNewOutlined';
import { Button, SegmentedControl, StatusChip } from '@ds/components';
import { RiskScoreChip } from '@/components/product/directory/RiskScoreChip';
import { GovEntityIcon, GovKindChip, GovStatusChip } from './entity-visuals';
import { entityRoute, entityRouteLabel } from './routes';
import {
  FINDING_LABEL,
  KIND_LABEL,
  RELATION_META,
  type GovApprovalHierarchy,
  type GovDelegation,
  type GovEntity,
  type GovEscalationRule,
  type GovFinding,
  type GovRelationship,
} from '@/data/governance-types';
import {
  displayName,
  findingsFor,
  getApprovalHierarchy,
  getGovEntity,
  listDelegations,
  listEscalationRules,
  relationshipsFrom,
  relationshipsOf,
  traceGovernance,
} from '@/data/governance';

type PanelMode = 'overview' | 'trace' | 'findings';

/* ------------------------------------------------------------------ *
 * Building blocks
 * ------------------------------------------------------------------ */

/** A collapsible section. Sections a user opens the panel *for* start open. */
function Section({
  title,
  count,
  defaultOpen = true,
  children,
}: {
  title: string;
  count?: number | string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = React.useState(defaultOpen);
  return (
    <section className="border-b border-border last:border-b-0">
      <h3>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          className="flex w-full items-center gap-2 px-4 py-2.5 text-left transition-colors hover:bg-surface-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-subtle"
        >
          <ExpandMoreOutlined
            sx={{ fontSize: 18, transform: open ? 'none' : 'rotate(-90deg)', transition: 'transform 120ms' }}
            className="shrink-0 text-icon"
            aria-hidden
          />
          <span className="min-w-0 flex-1 truncate text-body-sm-strong text-text-primary">{title}</span>
          {count != null && <span className="shrink-0 text-caption tabular-nums text-text-tertiary">{count}</span>}
        </button>
      </h3>
      {open && <div className="px-4 pb-4">{children}</div>}
    </section>
  );
}

/** A label above its value. The pair is one unit — 2px apart, never more. */
function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <div className="text-caption text-text-tertiary">{label}</div>
      <div className="mt-0.5 text-body-sm text-text-primary">{value}</div>
    </div>
  );
}

/** A related entity, clickable through to its own governance record. */
function EntityRow({ entity, onSelect, trailing }: { entity: GovEntity; onSelect: (id: string) => void; trailing?: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={() => onSelect(entity.id)}
      className="flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-left transition-colors hover:bg-surface-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-subtle"
    >
      <GovEntityIcon entity={entity} size={24} />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-body-sm text-text-primary">{entity.name}</span>
        <span className="block truncate text-caption text-text-tertiary">{KIND_LABEL[entity.kind].one}</span>
      </span>
      {trailing}
    </button>
  );
}

/**
 * A designed absence. "No data" would be accurate and useless — what an
 * administrator needs is what the absence *means* and what to do about it.
 */
function GovernanceGap({ title, implication, action }: { title: string; implication: string; action?: React.ReactNode }) {
  return (
    <div className="rounded-md border border-border bg-subtle p-3">
      <div className="flex items-start gap-2">
        <WarningAmberOutlined sx={{ fontSize: 16, color: 'var(--ds-color-status-warning-fg)' }} className="mt-0.5 shrink-0" aria-hidden />
        <div className="min-w-0">
          <div className="text-body-sm-strong text-text-primary">{title}</div>
          <p className="mt-1 text-caption text-text-secondary">{implication}</p>
          {action && <div className="mt-2">{action}</div>}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Finding card — the risk drill-down
 * ------------------------------------------------------------------ */

const SEVERITY_INTENT = { critical: 'danger', high: 'caution', medium: 'warning', low: 'info' } as const;
const SEVERITY_LABEL = { critical: 'Critical', high: 'High', medium: 'Medium', low: 'Low' } as const;

export function FindingCard({ finding, onSelect }: { finding: GovFinding; onSelect?: (id: string) => void }) {
  const entity = getGovEntity(finding.entityId);
  const route = entity ? entityRoute(entity) : null;
  return (
    <article className="rounded-lg border border-border bg-surface p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <StatusChip intent={SEVERITY_INTENT[finding.severity]} label={SEVERITY_LABEL[finding.severity]} />
            <span className="truncate text-caption text-text-tertiary">{FINDING_LABEL[finding.kind]}</span>
          </div>
          <h4 className="mt-1.5 text-body-strong text-text-primary">{finding.title}</h4>
        </div>
      </div>

      <p className="mt-2 text-body-sm text-text-secondary">{finding.what}</p>
      <p className="mt-2 text-body-sm text-text-secondary">{finding.why}</p>

      <dl className="mt-3 grid grid-cols-3 gap-3 rounded-md bg-sunken px-3 py-2.5">
        {finding.impact.map((m) => (
          <div key={m.label} className="min-w-0">
            <dt className="truncate text-caption text-text-tertiary">{m.label}</dt>
            <dd className="mt-0.5 truncate text-body-sm-strong tabular-nums text-text-primary" title={String(m.value)}>
              {m.value}
            </dd>
          </div>
        ))}
      </dl>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0">
          <div className="text-caption text-text-tertiary">Accountable</div>
          <div className="mt-0.5 truncate text-body-sm text-text-primary">
            {finding.ownerId ? displayName(finding.ownerId) : 'Nobody — this is the gap'}
          </div>
        </div>
        {route && (
          <Link href={route}>
            <Button variant="secondary" size="sm" endIcon={<OpenInNewOutlined sx={{ fontSize: 16 }} />}>
              {entity ? entityRouteLabel(entity) : 'Open'}
            </Button>
          </Link>
        )}
      </div>

      <div className="mt-3 border-t border-border pt-3">
        <div className="text-caption text-text-tertiary">Recommended action</div>
        <p className="mt-0.5 text-body-sm text-text-primary">{finding.action}</p>
      </div>

      {onSelect && entity && (
        <button
          type="button"
          onClick={() => onSelect(entity.id)}
          className="mt-2 text-caption-strong text-text-link transition-colors hover:text-text-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-subtle"
        >
          Show {entity.name} on the map
        </button>
      )}
    </article>
  );
}

/* ------------------------------------------------------------------ *
 * Relationship card — what a line on the canvas means
 * ------------------------------------------------------------------ */

export function RelationshipCard({
  relationship,
  onSelectEntity,
  onClose,
}: {
  relationship: GovRelationship;
  onSelectEntity: (id: string) => void;
  onClose: () => void;
}) {
  const source = getGovEntity(relationship.source);
  const target = getGovEntity(relationship.target);
  const meta = RELATION_META[relationship.type];
  if (!source || !target) return null;

  return (
    <aside className="flex h-full w-[340px] shrink-0 flex-col border-l border-border bg-surface" aria-label="Relationship details">
      <header className="flex shrink-0 items-start gap-3 border-b border-border px-4 py-3">
        <div className="min-w-0 flex-1">
          <div className="text-overline uppercase text-text-tertiary">Relationship</div>
          <h2 className="mt-1 text-h5 text-text-primary">{meta.label}</h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close relationship details"
          className="grid h-7 w-7 shrink-0 place-items-center rounded text-icon transition-colors hover:bg-surface-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-subtle"
        >
          <CloseIcon sx={{ fontSize: 18 }} />
        </button>
      </header>

      <div className="ds-scroll min-h-0 flex-1 overflow-y-auto">
        <div className="border-b border-border px-4 py-3">
          <EntityRow entity={source} onSelect={onSelectEntity} />
          <div className="flex items-center gap-2 py-1 pl-4 text-caption text-text-brand">
            <ArrowForwardOutlined sx={{ fontSize: 14 }} aria-hidden />
            {meta.label}
          </div>
          <EntityRow entity={target} onSelect={onSelectEntity} />
        </div>

        <div className="space-y-3 px-4 py-3">
          <Field label="What this means" value={<span className="text-text-secondary">{meta.description}</span>} />
          <Field label="Scope" value={relationship.scope} />
          <Field
            label="Effective status"
            value={
              <StatusChip
                intent={relationship.effective === 'active' ? 'success' : relationship.effective === 'pending' ? 'warning' : 'neutral'}
                label={relationship.effective === 'active' ? 'In force' : relationship.effective === 'pending' ? 'Pending' : 'Not in force'}
              />
            }
          />
          {relationship.riskNote && (
            <div className="rounded-md border border-border bg-subtle p-3">
              <div className="flex items-start gap-2">
                <WarningAmberOutlined sx={{ fontSize: 16, color: 'var(--ds-color-status-caution-fg)' }} className="mt-0.5 shrink-0" aria-hidden />
                <div className="min-w-0">
                  <div className="text-body-sm-strong text-text-primary">Risk implication</div>
                  <p className="mt-0.5 text-caption text-text-secondary">{relationship.riskNote}</p>
                </div>
              </div>
            </div>
          )}
          <Field label="Owner" value={displayName(relationship.ownerId)} />
          <Field label="Last modified" value={relationship.updatedAt} />
        </div>
      </div>

      <footer className="shrink-0 border-t border-border px-4 py-3">
        <Button variant="secondary" fullWidth onClick={() => onSelectEntity(target.id)}>
          View details
        </Button>
      </footer>
    </aside>
  );
}

/* ------------------------------------------------------------------ *
 * Entity panel
 * ------------------------------------------------------------------ */

function ApprovalChain({
  hierarchy,
  onSelect,
}: {
  hierarchy: GovApprovalHierarchy;
  onSelect: (id: string) => void;
}) {
  return (
    <ol className="space-y-1.5">
      {hierarchy.levels.map((level) => {
        const broken = level.approverId === null;
        return (
          <li
            key={level.level}
            className="flex items-start gap-2.5 rounded-md border border-border bg-surface px-2.5 py-2"
          >
            <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-pill bg-subtle text-micro tabular-nums text-text-secondary">
              {level.level}
            </span>
            <span className="min-w-0 flex-1">
              <span className="flex items-center gap-1.5">
                <span className="min-w-0 truncate text-body-sm text-text-primary">{level.approverLabel}</span>
                {broken ? (
                  <StatusChip intent="danger" label="Unresolved" />
                ) : (
                  <CheckCircleOutlined sx={{ fontSize: 14, color: 'var(--ds-color-status-success-fg)' }} titleAccess="Resolvable" />
                )}
              </span>
              <span className="mt-0.5 block truncate text-caption text-text-tertiary">
                {broken ? 'No approver can be resolved' : displayName(level.approverId)} · SLA {level.slaHours}h
                {level.delegationId ? ' · delegated' : ''}
                {level.escalationRuleId ? '' : ' · no escalation'}
              </span>
            </span>
            {!broken && level.approverId && (
              <button
                type="button"
                onClick={() => onSelect(level.approverId!)}
                aria-label={`View ${displayName(level.approverId)}`}
                className="shrink-0 rounded text-icon transition-colors hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-subtle"
              >
                <ArrowForwardOutlined sx={{ fontSize: 16 }} />
              </button>
            )}
          </li>
        );
      })}
    </ol>
  );
}

export interface GovernanceDetailsPanelProps {
  entity: GovEntity;
  onSelectEntity: (id: string) => void;
  onFocus: (id: string) => void;
  onClose: () => void;
  /** Whether the entity is already the map's root, so Focus reads honestly. */
  isRoot: boolean;
}

/**
 * View-agnostic inspection surface, ordered the way an investigation runs:
 * identity, then health, then who is responsible, then what it touches, then the
 * machinery, then metadata. Three modes rather than one long scroll — the trace
 * and the findings are each a whole answer and deserve the full panel.
 */
export function GovernanceDetailsPanel({ entity, onSelectEntity, onFocus, onClose, isRoot }: GovernanceDetailsPanelProps) {
  const [mode, setMode] = React.useState<PanelMode>('overview');
  React.useEffect(() => setMode('overview'), [entity.id]);

  const findings = findingsFor(entity.id);
  const related = React.useMemo(() => relationshipsOf(entity.id), [entity.id]);

  const kindsOf = (kinds: GovEntity['kind'][]) => {
    const out: GovEntity[] = [];
    for (const r of related) {
      const otherId = r.source === entity.id ? r.target : r.source;
      const e = getGovEntity(otherId);
      if (e && kinds.includes(e.kind) && !out.some((x) => x.id === e.id)) out.push(e);
    }
    return out.sort((a, b) => b.risk - a.risk);
  };

  const owners = relationshipsFrom(entity.id).filter((r) => r.type === 'owned-by').map((r) => getGovEntity(r.target)!).filter(Boolean);
  const reviewers = relationshipsFrom(entity.id).filter((r) => r.type === 'reviewed-by').map((r) => getGovEntity(r.target)!).filter(Boolean);
  const approvers = relationshipsFrom(entity.id).filter((r) => r.type === 'approved-by').map((r) => getGovEntity(r.target)!).filter(Boolean);

  // Organizational scope comes from the entity's own `departmentIds` / `locationIds`,
  // not from its edges: a department has no relationship *to itself*, so deriving
  // this from the graph would leave every department's own scope blank.
  const resolveAll = (ids: string[]) => ids.map((id) => getGovEntity(id)).filter((e): e is GovEntity => Boolean(e));
  const departments = resolveAll(entity.departmentIds);
  const locations = resolveAll(entity.locationIds);
  const roles = kindsOf(['business-role', 'technical-role']);
  const access = kindsOf(['application', 'entitlement']);
  const policies = kindsOf(['birthright-policy', 'approval-policy', 'approval-workflow', 'sod-policy']);
  const governanceRoles = kindsOf(['governance-role']);

  const approvalPolicies = policies.filter((p) => p.kind === 'approval-policy');
  const hierarchies = approvalPolicies.map((p) => getApprovalHierarchy(p.id)).filter((h): h is GovApprovalHierarchy => Boolean(h));
  const ownHierarchy = getApprovalHierarchy(entity.id);
  const chains = ownHierarchy ? [ownHierarchy] : hierarchies;

  const chainDelegationIds = new Set(chains.flatMap((h) => h.levels.map((l) => l.delegationId)).filter(Boolean) as string[]);
  const chainEscalationIds = new Set(chains.flatMap((h) => h.levels.map((l) => l.escalationRuleId)).filter(Boolean) as string[]);
  const delegations: GovDelegation[] = listDelegations().filter(
    (d) => chainDelegationIds.has(d.id) || d.fromId === entity.id || d.toId === entity.id || d.id === entity.id,
  );
  const escalations: GovEscalationRule[] = listEscalationRules().filter((r) => chainEscalationIds.has(r.id) || r.id === entity.id);

  const trace = React.useMemo(() => (mode === 'trace' ? traceGovernance(entity.id) : []), [mode, entity.id]);
  const route = entityRoute(entity);
  const needsReviewer = entity.kind === 'application' || entity.kind === 'entitlement';

  return (
    <aside className="flex h-full w-[340px] shrink-0 flex-col border-l border-border bg-surface" aria-label={`${entity.name} governance details`}>
      <header className="shrink-0 border-b border-border px-4 pb-3 pt-3">
        <div className="flex items-start gap-3">
          <GovEntityIcon entity={entity} size={36} accent />
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-h5 text-text-primary" title={entity.name}>
              {entity.name}
            </h2>
            <p className="mt-0.5 line-clamp-2 text-caption text-text-secondary">{entity.description}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close details"
            className="grid h-7 w-7 shrink-0 place-items-center rounded text-icon transition-colors hover:bg-surface-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-subtle"
          >
            <CloseIcon sx={{ fontSize: 18 }} />
          </button>
        </div>

        <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
          <GovKindChip kind={entity.kind} />
          {entity.risk > 0 && <RiskScoreChip score={entity.risk} />}
          <GovStatusChip entity={entity} />
          {findings.length > 0 && <StatusChip intent="danger" label={`${findings.length} ${findings.length === 1 ? 'gap' : 'gaps'}`} />}
        </div>

        <div className="mt-3">
          <SegmentedControl<PanelMode>
            size="sm"
            fullWidth
            ariaLabel="Details view"
            value={mode}
            onChange={setMode}
            options={[
              { value: 'overview', label: 'Overview' },
              { value: 'trace', label: 'Trace' },
              { value: 'findings', label: `Findings${findings.length ? ` (${findings.length})` : ''}` },
            ]}
          />
        </div>
      </header>

      <div className="ds-scroll min-h-0 flex-1 overflow-y-auto">
        {mode === 'overview' && (
          <>
            <Section title="Ownership" count={owners.length + reviewers.length + approvers.length}>
              <div className="space-y-3">
                <div>
                  <div className="mb-1 text-caption text-text-tertiary">Owner</div>
                  {owners.length > 0 ? (
                    owners.map((o) => <EntityRow key={o.id} entity={o} onSelect={onSelectEntity} />)
                  ) : (
                    <GovernanceGap
                      title="No owner"
                      implication={`Nobody is accountable for ${entity.name}. Changes to its access model are unreviewed and requests that route to its owner cannot be resolved.`}
                      action={
                        route ? (
                          <Link href={route}>
                            <Button variant="secondary" size="sm">
                              Assign owner
                            </Button>
                          </Link>
                        ) : undefined
                      }
                    />
                  )}
                </div>

                {needsReviewer && (
                  <div>
                    <div className="mb-1 text-caption text-text-tertiary">Access review owner</div>
                    {reviewers.length > 0 ? (
                      reviewers.map((o) => <EntityRow key={o.id} entity={o} onSelect={onSelectEntity} />)
                    ) : (
                      <GovernanceGap
                        title="No access review owner"
                        implication="This application is not assigned to an access review owner. Access certifications may not have a responsible reviewer, so entitlements are never re-confirmed."
                        action={
                          route ? (
                            <Link href={route}>
                              <Button variant="secondary" size="sm">
                                Assign owner
                              </Button>
                            </Link>
                          ) : undefined
                        }
                      />
                    )}
                  </div>
                )}

                {approvers.length > 0 && (
                  <div>
                    <div className="mb-1 text-caption text-text-tertiary">Approval owner</div>
                    {approvers.map((o) => (
                      <EntityRow key={o.id} entity={o} onSelect={onSelectEntity} />
                    ))}
                  </div>
                )}

                {governanceRoles.length > 0 && (
                  <div>
                    <div className="mb-1 text-caption text-text-tertiary">Governance roles</div>
                    {governanceRoles.map((o) => (
                      <EntityRow key={o.id} entity={o} onSelect={onSelectEntity} />
                    ))}
                  </div>
                )}
              </div>
            </Section>

            <Section title="Organization" count={departments.length + locations.length} defaultOpen={departments.length + locations.length > 0}>
              {departments.length + locations.length === 0 ? (
                <p className="text-caption text-text-secondary">Not scoped to a department or location — this applies organization-wide.</p>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Departments" value={departments.map((d) => d.name).join(', ') || '—'} />
                  <Field label="Locations" value={locations.map((l) => l.name).join(', ') || '—'} />
                </div>
              )}
            </Section>

            {(roles.length > 0 || access.length > 0) && (
              <Section title="Access" count={roles.length + access.length} defaultOpen={false}>
                <div className="space-y-3">
                  {roles.length > 0 && (
                    <div>
                      <div className="mb-1 text-caption text-text-tertiary">Roles</div>
                      {roles.slice(0, 6).map((r) => (
                        <EntityRow key={r.id} entity={r} onSelect={onSelectEntity} trailing={<RiskScoreChip score={r.risk} showLabel={false} />} />
                      ))}
                    </div>
                  )}
                  {access.length > 0 && (
                    <div>
                      <div className="mb-1 text-caption text-text-tertiary">Applications and entitlements</div>
                      {access.slice(0, 8).map((a) => (
                        <EntityRow key={a.id} entity={a} onSelect={onSelectEntity} trailing={<RiskScoreChip score={a.risk} showLabel={false} />} />
                      ))}
                    </div>
                  )}
                </div>
              </Section>
            )}

            <Section title="Policies" count={policies.length} defaultOpen={policies.length > 0}>
              {policies.length === 0 ? (
                <GovernanceGap
                  title="No governing policy"
                  implication={`${entity.name} is not referenced by any birthright or approval policy. Access to it is granted outside the governance model, with no recorded rule for who should have it.`}
                />
              ) : (
                policies.map((p) => (
                  <EntityRow key={p.id} entity={p} onSelect={onSelectEntity} trailing={<RiskScoreChip score={p.risk} showLabel={false} />} />
                ))
              )}
            </Section>

            <Section title="Approval hierarchy" count={chains.reduce((n, h) => Math.max(n, h.levels.length), 0)} defaultOpen={chains.length > 0}>
              {chains.length === 0 ? (
                <p className="text-caption text-text-secondary">
                  No approval chain governs this entity. Requests for it are not routed through an approver.
                </p>
              ) : (
                <div className="space-y-3">
                  {chains.map((h) => (
                    <div key={h.id}>
                      <div className="mb-1 text-caption text-text-tertiary">{h.name}</div>
                      <ApprovalChain hierarchy={h} onSelect={onSelectEntity} />
                    </div>
                  ))}
                </div>
              )}
            </Section>

            <Section title="Delegation and escalation" count={delegations.length + escalations.length} defaultOpen={false}>
              <div className="space-y-3">
                <div>
                  <div className="mb-1 text-caption text-text-tertiary">Delegations</div>
                  {delegations.length === 0 ? (
                    <p className="text-caption text-text-secondary">No approval authority is delegated on this path.</p>
                  ) : (
                    <ul className="space-y-1.5">
                      {delegations.map((d) => (
                        <li key={d.id} className="rounded-md border border-border px-2.5 py-2">
                          <div className="flex items-center gap-1.5">
                            <span className="min-w-0 truncate text-body-sm text-text-primary">
                              {displayName(d.fromId)} → {displayName(d.toId)}
                            </span>
                            {d.status === 'expired' && <StatusChip intent="danger" label="Expired" />}
                            {d.validUntil === null && <StatusChip intent="warning" label="No expiry" />}
                          </div>
                          <div className="mt-0.5 truncate text-caption text-text-tertiary">
                            {d.scope} · valid until {d.validUntil ?? 'no end date'}
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <div>
                  <div className="mb-1 text-caption text-text-tertiary">Escalation rules</div>
                  {escalations.length === 0 ? (
                    <GovernanceGap
                      title="No escalation rule"
                      implication="Nothing happens when an approver does not act. The request waits indefinitely and nobody is told a decision is overdue."
                    />
                  ) : (
                    <ul className="space-y-1.5">
                      {escalations.map((r) => (
                        <li key={r.id} className="rounded-md border border-border px-2.5 py-2">
                          <div className="truncate text-body-sm text-text-primary">{r.name}</div>
                          <ol className="mt-1 space-y-0.5">
                            {r.levels.map((l) => (
                              <li key={l.level} className="flex items-center gap-1.5 text-caption text-text-secondary">
                                <span className="tabular-nums">L{l.level}</span>
                                <span className="min-w-0 truncate">{l.approverLabel}</span>
                                <span className="ml-auto shrink-0 tabular-nums text-text-tertiary">after {l.afterHours}h</span>
                              </li>
                            ))}
                          </ol>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </Section>

            <Section title="Audit" defaultOpen={false}>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Last modified" value={entity.updatedAt} />
                <Field label="Modified by" value={displayName(entity.updatedBy)} />
                <Field label="Relationships" value={related.length} />
                <Field label="Identifier" value={<span className="break-all text-text-secondary">{entity.id}</span>} />
              </div>
            </Section>
          </>
        )}

        {mode === 'trace' && (
          <div className="px-4 py-3">
            <p className="text-caption text-text-secondary">
              Everything reachable from {entity.name}, in the order governance is read: what grants the access, what it
              reaches, what governs it, and who is accountable.
            </p>
            <ol className="mt-3">
              {trace.map((step, i) => (
                <li key={step.kind} className="relative pb-3 pl-5">
                  {i < trace.length - 1 && <span aria-hidden className="absolute bottom-0 left-[5px] top-4 w-px bg-border" />}
                  <span aria-hidden className="absolute left-0 top-1.5 h-2.5 w-2.5 rounded-pill border-2 border-brand bg-surface" />
                  <div className="flex items-baseline gap-2">
                    <span className="text-body-sm-strong text-text-primary">{step.title}</span>
                    <span className="truncate text-caption text-text-tertiary">{RELATION_META[step.via].label}</span>
                  </div>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {step.entities.map((e) => (
                      <button
                        key={e.id}
                        type="button"
                        onClick={() => onSelectEntity(e.id)}
                        className="max-w-full truncate rounded-pill border border-border bg-surface px-2 py-0.5 text-caption text-text-secondary transition-colors hover:border-border-strong hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-subtle"
                      >
                        {e.name}
                      </button>
                    ))}
                  </div>
                </li>
              ))}
            </ol>
            {trace.length === 0 && (
              <p className="mt-3 text-body-sm text-text-secondary">
                Nothing flows onward from {entity.name} — it sits at the end of the governance chain.
              </p>
            )}
          </div>
        )}

        {mode === 'findings' && (
          <div className="space-y-3 px-4 py-3">
            {findings.length === 0 ? (
              <div className="rounded-lg border border-border bg-surface p-4 text-center">
                <CheckCircleOutlined sx={{ fontSize: 22, color: 'var(--ds-color-status-success-fg)' }} aria-hidden />
                <div className="mt-1.5 text-body-strong text-text-primary">No governance gaps</div>
                <p className="mt-1 text-caption text-text-secondary">
                  {entity.name} has an accountable owner, a governing control, and a resolvable approval path.
                </p>
              </div>
            ) : (
              findings.map((f) => <FindingCard key={f.id} finding={f} />)
            )}
          </div>
        )}
      </div>

      <footer className="flex shrink-0 items-center gap-2 border-t border-border px-4 py-3">
        <Button
          variant="secondary"
          fullWidth
          startIcon={<CenterFocusStrongOutlined sx={{ fontSize: 16 }} />}
          onClick={() => onFocus(entity.id)}
          disabled={isRoot}
          title={isRoot ? `${entity.name} is already the centre of the map` : undefined}
        >
          Focus on this entity
        </Button>
        {route && (
          <Link href={route} className="shrink-0">
            <Button variant="secondary" aria-label={entityRouteLabel(entity)} title={entityRouteLabel(entity)}>
              <OpenInNewOutlined sx={{ fontSize: 18 }} />
            </Button>
          </Link>
        )}
      </footer>
    </aside>
  );
}
