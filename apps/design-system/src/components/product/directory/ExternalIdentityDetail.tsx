'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import CheckCircleOutline from '@mui/icons-material/CheckCircleOutline';
import CancelOutlined from '@mui/icons-material/CancelOutlined';
import EventRepeatOutlined from '@mui/icons-material/EventRepeatOutlined';
import PauseCircleOutlined from '@mui/icons-material/PauseCircleOutlined';
import PlayCircleOutlined from '@mui/icons-material/PlayCircleOutlined';
import PersonSearchOutlined from '@mui/icons-material/PersonSearchOutlined';
import BlockOutlined from '@mui/icons-material/BlockOutlined';
import HistoryOutlined from '@mui/icons-material/HistoryOutlined';
import { Card, StatusChip, type TabItem } from '@ds/components';
import { DetailShell, DetailNotFound, InfoRow, InfoRowGroup, RelationTable } from './DetailShell';
import { EntityAvatar } from './EntityAvatar';
import { RiskScoreChip } from './RiskScoreChip';
import { infoIcon } from './infoIcons';
import { accountColumns, roleColumns } from './relationColumns';
import { IDENTITY_STATUS } from './identityStatus';
import { ExternalTypeChip, externalTypeLabel } from './ExternalTypeChip';
import { ExternalIdentityActions } from './ExternalIdentityActions';
import {
  accessEndsInDays,
  accessExpired,
  applicationNameFor,
  getExternalIdentityDetail,
  getUser,
} from '@/data/directory';
import { getExternalOverlay, type LifecycleAction } from '@/data/external-lifecycle';
import { formatDate, formatDateTime } from '@/lib/datetime';

const TABS: TabItem[] = [
  { value: 'overview', label: 'Overview' },
  { value: 'accounts', label: 'App Accounts' },
  { value: 'technical-roles', label: 'Technical Roles' },
  { value: 'business-roles', label: 'Business Roles' },
];

const EVENT_LABEL: Record<LifecycleAction, string> = {
  approved: 'Onboarding approved',
  rejected: 'Onboarding rejected',
  extended: 'Contract extended',
  suspended: 'Access suspended',
  resumed: 'Access resumed',
  ended: 'Contract ended',
  'sponsor-assigned': 'Sponsor assigned',
};

/** Onboarding lifecycle status vs. whether access is currently live — the two axes. */
function accessStatusOf(status: string): { label: string; intent: 'success' | 'neutral' | 'warning' | 'danger' } {
  switch (status) {
    case 'active':
      return { label: 'Active', intent: 'success' };
    case 'suspended':
      return { label: 'Suspended', intent: 'neutral' };
    case 'terminated':
    case 'inactive':
      return { label: 'Revoked', intent: 'danger' };
    default:
      return { label: 'No access', intent: 'neutral' };
  }
}

/**
 * One external identity — the sponsor/admin's page for onboarding, contract and
 * access, kept under its own route so the sidebar never flips to Workforce.
 *
 * The same component serves both personas; `role` gates the two admin-only moves.
 * Onboarding status and access status get their own rows here — the list clubs
 * them into one chip, but on the page the reader is deciding, and the difference
 * between "onboarded but suspended" and "still pending" is the decision.
 */
export function ExternalIdentityDetail({
  id,
  role,
  backHref,
  backLabel,
}: {
  id: string;
  role: 'admin' | 'reviewer';
  backHref: string;
  backLabel: string;
}) {
  const router = useRouter();
  const [tab, setTab] = React.useState('overview');
  // The lifecycle overlay is localStorage-backed, so resolve after mount and
  // re-read when an action changes it.
  const [mounted, setMounted] = React.useState(false);
  const [, bump] = React.useReducer((n: number) => n + 1, 0);
  React.useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  const detail = getExternalIdentityDetail(id);
  if (!detail) return <DetailNotFound title="External identity not found" backHref={backHref} backLabel={backLabel} />;

  const { identity, accounts, technicalRoles, businessRoles } = detail;
  const status = IDENTITY_STATUS[identity.status];
  const access = accessStatusOf(identity.status);
  const overlay = getExternalOverlay(id);
  const events = overlay?.events ?? [];

  const sponsorName = identity.sponsorId ? getUser(identity.sponsorId)?.name ?? identity.sponsorId : null;
  const expired = accessExpired(identity);
  const endsInDays = accessEndsInDays(identity);

  const endNote = !identity.accessEndsOn
    ? undefined
    : expired
      ? `Ended ${formatDate(identity.accessEndsOn)} — access is still enabled.`
      : identity.status === 'active' && endsInDays !== null && endsInDays <= 30 && endsInDays >= 0
        ? `Ends in ${endsInDays} day${endsInDays === 1 ? '' : 's'}.`
        : undefined;

  return (
    <DetailShell
      avatar={<EntityAvatar kind="user" name={identity.name} size="md" />}
      title={identity.name}
      description={`${externalTypeLabel(identity.externalType)}${identity.organization ? ` · ${identity.organization}` : ''}`}
      chips={
        <>
          <ExternalTypeChip type={identity.externalType} />
          <StatusChip intent={status.intent} label={status.label} />
          <RiskScoreChip score={identity.riskScore} />
        </>
      }
      actions={<ExternalIdentityActions row={identity} role={role} variant="header" onChanged={bump} />}
      tabs={TABS}
      tab={tab}
      onTab={setTab}
    >
      {tab === 'overview' && (
        <div className="grid gap-5 lg:grid-cols-2">
          <Card title="Identity" padding="none">
            <InfoRowGroup>
              <InfoRow icon={infoIcon.email} label="Email" value={identity.email} />
              <InfoRow icon={infoIcon.type} label="Type" value={<ExternalTypeChip type={identity.externalType} />} />
              <InfoRow icon={infoIcon.department} label="Organization" value={identity.organization ?? '—'} />
              <InfoRow
                icon={infoIcon.application}
                label="Source application"
                value={identity.sourceApplicationId ? applicationNameFor(identity.sourceApplicationId) : '—'}
              />
              <InfoRow icon={infoIcon.risk} label="Risk score" value={<RiskScoreChip score={identity.riskScore} />} />
            </InfoRowGroup>
          </Card>

          <Card title="Sponsorship & contract" padding="none">
            <InfoRowGroup>
              <InfoRow
                icon={infoIcon.owner}
                label="Sponsor"
                value={sponsorName ?? <StatusChip intent="warning" label="Unsponsored" />}
              />
              <InfoRow icon={infoIcon.status} label="Onboarding status" value={<StatusChip intent={status.intent} label={status.label} />} />
              <InfoRow icon={infoIcon.account} label="Access status" value={<StatusChip intent={access.intent} label={access.label} />} />
              <InfoRow
                icon={infoIcon.jobTitle}
                label="Contract starts"
                value={identity.accessStartsOn ? formatDate(identity.accessStartsOn) : '—'}
              />
              <InfoRow
                icon={infoIcon.updated}
                label="Contract ends"
                value={
                  !identity.accessEndsOn ? (
                    <span className="text-text-tertiary">Not set</span>
                  ) : expired ? (
                    <StatusChip intent="danger" label={`Expired ${formatDate(identity.accessEndsOn)}`} />
                  ) : (
                    <span className="inline-flex items-center gap-2">
                      {formatDate(identity.accessEndsOn)}
                      {endNote && identity.status === 'active' && endsInDays !== null && endsInDays <= 30 && (
                        <StatusChip intent="warning" label={`${endsInDays}d left`} />
                      )}
                    </span>
                  )
                }
              />
            </InfoRowGroup>
          </Card>

          <Card title="Lifecycle history" icon={<HistoryOutlined />} padding="none" className="lg:col-span-2">
            {events.length === 0 ? (
              <p className="px-5 py-6 text-body-sm text-text-secondary">
                Nothing has changed since {identity.name} was imported. Approvals, extensions,
                suspensions and contract changes will appear here.
              </p>
            ) : (
              <ol className="flex flex-col gap-0 px-5 py-4">
                {events.map((e, i) => (
                  <li key={i} className="flex items-start gap-3 py-2">
                    <span className="mt-0.5 shrink-0 text-icon">
                      <LifecycleGlyph action={e.action} />
                    </span>
                    <div className="min-w-0">
                      <p className="text-body-sm-strong text-text-primary">{EVENT_LABEL[e.action]}</p>
                      {e.note && <p className="text-caption text-text-secondary">{e.note}</p>}
                    </div>
                    <span className="ml-auto shrink-0 whitespace-nowrap text-caption text-text-tertiary">
                      {formatDateTime(e.at)}
                    </span>
                  </li>
                ))}
              </ol>
            )}
          </Card>
        </div>
      )}

      {tab === 'accounts' && (
        <RelationTable
          columns={accountColumns}
          rows={accounts}
          onRowClick={(r) => router.push(`/iga/directory/app-accounts/${r.id}`)}
          emptyTitle="No app accounts"
          emptyMessage="This external identity holds no application accounts yet."
        />
      )}
      {tab === 'technical-roles' && (
        <RelationTable
          columns={roleColumns('technical-role', 'Technical Role')}
          rows={technicalRoles}
          onRowClick={(r) => router.push(`/iga/directory/technical-roles/${r.id}`)}
          emptyTitle="No technical roles"
          emptyMessage="This external identity is assigned no technical roles."
        />
      )}
      {tab === 'business-roles' && (
        <RelationTable
          columns={roleColumns('business-role', 'Business Role')}
          rows={businessRoles}
          onRowClick={(r) => router.push(`/iga/directory/business-roles/${r.id}`)}
          emptyTitle="No business roles"
          emptyMessage="This external identity is assigned no business roles."
        />
      )}
    </DetailShell>
  );
}

function LifecycleGlyph({ action }: { action: LifecycleAction }) {
  const sx = { fontSize: 18 } as const;
  switch (action) {
    case 'approved':
      return <CheckCircleOutline sx={sx} />;
    case 'rejected':
      return <CancelOutlined sx={sx} />;
    case 'extended':
      return <EventRepeatOutlined sx={sx} />;
    case 'suspended':
      return <PauseCircleOutlined sx={sx} />;
    case 'resumed':
      return <PlayCircleOutlined sx={sx} />;
    case 'ended':
      return <BlockOutlined sx={sx} />;
    case 'sponsor-assigned':
      return <PersonSearchOutlined sx={sx} />;
  }
}

export default ExternalIdentityDetail;
