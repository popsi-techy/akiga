'use client';

import * as React from 'react';
import Link from 'next/link';
import RuleOutlined from '@mui/icons-material/RuleOutlined';
import Person from '@mui/icons-material/Person';
import Info from '@mui/icons-material/Info';
import PersonAddAltOutlined from '@mui/icons-material/PersonAddAltOutlined';
import ArrowDownwardOutlined from '@mui/icons-material/ArrowDownwardOutlined';
import CheckCircleOutlined from '@mui/icons-material/CheckCircleOutlined';
import OpenInNewOutlined from '@mui/icons-material/OpenInNewOutlined';
import { useRouter } from 'next/navigation';
import { Button, Card, Menu, StatusChip, useToast } from '@ds/components';
import { SingleSelectDrawer } from '@/components/product/automation/SingleSelectDrawer';
import { listApprovalPolicies, getApprovalPolicy } from '@/data/approval-policies';
import { getAppApprovalPolicy, setAppApprovalPolicy } from '@/data/app-approval-policy';
import { getApprovalHierarchy, getGovEntity, displayName } from '@/data/governance';
import { allNodes } from '@/lib/policy-tree';
import type { ApprovalLevelConfig } from '@/data/automation-types';
import type { GovApprovalHierarchy } from '@/data/governance-types';
import { InfoRow, InfoRowGroup } from './DetailShell';
import { infoIcon } from './infoIcons';

const POLICIES_HREF = '/iga/automation/approval-policies';

/** "4h", "2d 12h" — an SLA read the way an approver would say it. */
function slaLabel(sla?: ApprovalLevelConfig['sla']): string {
  if (!sla) return '—';
  const parts: string[] = [];
  if (sla.days) parts.push(`${sla.days}d`);
  if (sla.hours) parts.push(`${sla.hours}h`);
  if (sla.minutes) parts.push(`${sla.minutes}m`);
  return parts.join(' ') || '—';
}

/**
 * The route a request actually travels, drawn as a chain.
 *
 * The point of this tab is not "a policy is attached" — it is "here is what
 * happens when someone asks for this application". A level that cannot resolve an
 * approver is where a request dies, so it is called out rather than rendered as
 * one more grey row.
 */
function ApprovalChain({ hierarchy }: { hierarchy: GovApprovalHierarchy }) {
  const broken = hierarchy.levels.some((l) => l.approverId === null);
  return (
    <ol className="px-5 py-4">
      <li className="flex items-center gap-2.5 pb-1">
        <span className="grid h-6 w-6 shrink-0 place-items-center rounded-pill bg-subtle text-icon">
          <PersonAddAltOutlined sx={{ fontSize: 14 }} />
        </span>
        <span className="text-body-sm text-text-secondary">Requester</span>
      </li>
      {hierarchy.levels.map((level) => {
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
                  {unresolved ? 'No approver exists for this level' : displayName(level.approverId)} · SLA{' '}
                  {level.slaHours}h
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
  );
}

/**
 * Which approval policy governs requests for this application — exactly one, or
 * none. Selection is a drawer rather than an inline dropdown because choosing a
 * route is a decision you make by comparing routes, and a dropdown shows one line
 * per option with nothing to compare.
 */
export function ApplicationApprovalPolicyTab({ applicationId }: { applicationId: string }) {
  const toast = useToast();
  const router = useRouter();
  // Seed on the server, then read the store after mount (no hydration mismatch).
  const [policyId, setPolicyId] = React.useState<string | null>(null);
  const [ready, setReady] = React.useState(false);
  const [pickerOpen, setPickerOpen] = React.useState(false);

  React.useEffect(() => {
    setPolicyId(getAppApprovalPolicy(applicationId));
    setReady(true);
  }, [applicationId]);

  const assign = (id: string | null) => {
    setPolicyId(id);
    setAppApprovalPolicy(applicationId, id);
  };

  const policies = React.useMemo(() => listApprovalPolicies(), []);
  const policy = policyId ? getApprovalPolicy(policyId) : null;
  const hierarchy = policyId ? getApprovalHierarchy(policyId) : undefined;
  const gov = policyId ? getGovEntity(policyId) : undefined;
  const metric = (label: string) => gov?.metrics.find((m) => m.label === label)?.value;

  const picker = (
    <SingleSelectDrawer
      open={pickerOpen}
      onClose={() => setPickerOpen(false)}
      title="Select approval policy"
      subtitle="One policy decides every access request for this application."
      icon={<RuleOutlined sx={{ fontSize: 22, color: 'var(--ds-color-brand-primary)' }} />}
      items={policies.map((p) => {
        const h = getApprovalHierarchy(p.id);
        const levels = h?.levels.length ?? 0;
        return {
          id: p.id,
          primary: p.policyName,
          // What you compare routes on: is it live, and how far does a request go?
          secondary: [
            p.status === 'active' ? 'Active' : 'Draft',
            `${levels} approval ${levels === 1 ? 'level' : 'levels'}`,
            p.description,
          ]
            .filter(Boolean)
            .join(' · '),
        };
      })}
      selectedId={policyId ?? undefined}
      onSelect={(id) => {
        assign(id);
        toast.success(`“${getApprovalPolicy(id)?.policyName ?? 'Policy'}” now governs this application`);
      }}
      searchPlaceholder="Search approval policies"
      confirmLabel="Assign policy"
    />
  );

  // Nothing to render until the store has been read — a flash of "none assigned"
  // followed by a policy is worse than a beat of nothing.
  if (!ready) return null;

  if (!policy) {
    return (
      <>
        <Card className="h-full">
          <div className="flex h-full flex-col items-center justify-center gap-1 py-16 text-center">
            <span className="mb-1 grid h-11 w-11 place-items-center rounded-full bg-subtle text-icon">
              <RuleOutlined sx={{ fontSize: 22 }} />
            </span>
            <div className="text-h5 text-text-primary">No approval policy assigned</div>
            <p className="max-w-md text-body-sm text-text-secondary">
              Requests for this application are not routed to anyone. Nobody is asked to approve or
              deny them, so access is either granted outside the governance model or not at all.
            </p>
            <div className="mt-4">
              <Button onClick={() => setPickerOpen(true)}>Select approval policy</Button>
            </div>
          </div>
        </Card>
        {picker}
      </>
    );
  }

  const levels = hierarchy?.levels.length ?? 0;
  const longestSla = policy
    ? allNodes(policy.root).reduce((best, n) => {
        const sla = (n.config as ApprovalLevelConfig | undefined)?.sla;
        if (!sla) return best;
        const mins = (sla.days ?? 0) * 1440 + (sla.hours ?? 0) * 60 + (sla.minutes ?? 0);
        return mins > best.mins ? { mins, label: slaLabel(sla) } : best;
      }, { mins: 0, label: '—' }).label
    : '—';

  return (
    <div className="ds-scroll h-full overflow-y-auto pr-0.5">
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
        <Card
          title="Approval path"
          icon={<Person />}
          padding="none"
          action={
            <div className="flex items-center gap-2">
              <Button variant="secondary" size="sm" onClick={() => setPickerOpen(true)}>
                Change
              </Button>
              <Menu
                items={[
                  {
                    label: 'Open in builder',
                    icon: <OpenInNewOutlined sx={{ fontSize: 18 }} />,
                    onClick: () => router.push(`${POLICIES_HREF}/${policy.id}/builder`),
                    divider: true,
                  },
                  {
                    label: 'Remove approval policy',
                    danger: true,
                    onClick: () => {
                      assign(null);
                      toast.success('Approval policy removed — requests are no longer routed');
                    },
                  },
                ]}
              />
            </div>
          }
        >
          {/* Which policy — identity first, so you can tell at a glance it is the right one. */}
          <div className="flex items-start gap-3 border-b border-border px-5 py-4">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-brand-subtle text-brand">
              <RuleOutlined sx={{ fontSize: 20 }} />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <Link
                  href={`${POLICIES_HREF}/${policy.id}`}
                  className="truncate text-body-strong text-text-primary transition-colors hover:text-text-brand"
                >
                  {policy.policyName}
                </Link>
                <StatusChip
                  intent={policy.status === 'active' ? 'success' : 'neutral'}
                  label={policy.status === 'active' ? 'Active' : 'Draft'}
                />
              </div>
              <p className="mt-0.5 text-body-sm text-text-secondary">
                {policy.description || 'No description.'}
              </p>
            </div>
          </div>

          {hierarchy ? (
            <ApprovalChain hierarchy={hierarchy} />
          ) : (
            <div className="px-5 py-8 text-center">
              <div className="text-body-sm-strong text-text-primary">No approval chain defined</div>
              <p className="mt-1 text-caption text-text-secondary">
                This policy has no approval levels yet, so a request would pass straight through.
                Open it in the builder to add them.
              </p>
            </div>
          )}
        </Card>

        <Card title="Policy details" icon={<Info />} padding="none">
          <InfoRowGroup>
            <InfoRow
              icon={infoIcon.status}
              label="Status"
              value={
                <StatusChip
                  intent={policy.status === 'active' ? 'success' : 'neutral'}
                  label={policy.status === 'active' ? 'Active' : 'Draft'}
                />
              }
            />
            <InfoRow icon={infoIcon.steps} label="Approval levels" value={String(levels)} />
            <InfoRow icon={infoIcon.duration} label="Longest SLA" value={longestSla} />
            <InfoRow
              icon={infoIcon.trigger}
              label="Requests / quarter"
              value={String(metric('Requests / quarter') ?? '—')}
            />
            <InfoRow icon={infoIcon.owner} label="Policy owner" value={displayName(gov?.ownerIds[0])} />
            <InfoRow icon={infoIcon.submitted} label="Last updated" value={policy.updatedAt.slice(0, 10)} />
          </InfoRowGroup>
        </Card>
      </div>
      {picker}
    </div>
  );
}

export default ApplicationApprovalPolicyTab;
