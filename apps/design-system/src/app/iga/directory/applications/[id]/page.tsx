'use client';

import * as React from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import EditOutlined from '@mui/icons-material/EditOutlined';
import SchemaOutlined from '@mui/icons-material/SchemaOutlined';
import DeleteOutline from '@mui/icons-material/DeleteOutline';
import WarningAmberOutlined from '@mui/icons-material/WarningAmberOutlined';
import Info from '@mui/icons-material/Info';
import Shield from '@mui/icons-material/Shield';
import VpnKey from '@mui/icons-material/VpnKey';
import { Button, Card, Menu, StatusChip, useToast, type TabItem } from '@ds/components';
import { getApplicationDetail } from '@/data/directory';
import {
  DetailShell,
  DetailNotFound,
  InfoRow,
  InfoRowGroup,
  RelationTable,
  EntityAvatar,
  EntityOwnersTab,
  ApplicationApprovalPolicyTab,
  RiskScoreChip,
  accountColumns,
  entitlementColumns,
  infoIcon,
} from '@/components/product/directory';
import { getGovEntity, findingsFor, explorerRow, displayName } from '@/data/governance';
import type { GovFinding } from '@/data/governance-types';

const LIST_HREF = '/iga/directory/applications';

const TABS: TabItem[] = [
  { value: 'overview', label: 'Overview' },
  { value: 'accounts', label: 'App Accounts' },
  { value: 'entitlements', label: 'Entitlements' },
  { value: 'approval', label: 'Approval Policy' },
  { value: 'owners', label: 'Owners' },
];

type Detail = NonNullable<ReturnType<typeof getApplicationDetail>>;

/**
 * A governance gap on the application, stated as a consequence rather than a
 * label. It sits at the top of Overview because it changes how you read every
 * number below it — an application with no owner has no one to act on any of them.
 */
function GapBanner({ findings }: { findings: GovFinding[] }) {
  if (findings.length === 0) return null;
  return (
    <div className="rounded-lg border border-border bg-surface p-4">
      <div className="flex items-start gap-2.5">
        <WarningAmberOutlined
          sx={{ fontSize: 18, color: 'var(--ds-color-status-caution-fg)' }}
          className="mt-0.5 shrink-0"
          aria-hidden
        />
        <div className="min-w-0 flex-1">
          <div className="text-body-strong text-text-primary">
            {findings.length} governance {findings.length === 1 ? 'gap' : 'gaps'} on this application
          </div>
          <ul className="mt-1.5 space-y-1">
            {findings.map((f) => (
              <li key={f.id} className="text-body-sm text-text-secondary">
                <span className="text-text-primary">{f.title}</span> — {f.why}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

function OverviewTab({ detail }: { detail: Detail }) {
  const { app, accounts, entitlements } = detail;
  const gov = getGovEntity(app.id);
  const row = gov ? explorerRow(gov) : null;
  const findings = findingsFor(app.id);
  const orphans = accounts.filter((a) => a.orphan).length;
  // Risk is the application's own surface: the entitlements it exposes, worst first.
  const byRisk = [...entitlements].sort((a, b) => b.risk - a.risk).slice(0, 6);

  const scope = (ids: string[]) => ids.map((id) => displayName(id)).join(', ') || '—';
  const people = (list: { name: string }[]) => (list.length ? list.map((p) => p.name).join(', ') : null);

  return (
    <div className="ds-scroll h-full overflow-y-auto pr-0.5">
      <div className="space-y-5">
        <GapBanner findings={findings} />

        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
          <Card title={`Entitlements by risk (${entitlements.length})`} icon={<VpnKey />} padding="none">
            {byRisk.length === 0 ? (
              <div className="px-5 py-8 text-center">
                <div className="text-body-sm-strong text-text-primary">No entitlements</div>
                <p className="mt-1 text-caption text-text-secondary">
                  This application exposes no grantable access yet, so there is nothing to review or request.
                </p>
              </div>
            ) : (
              <ul>
                {byRisk.map((e) => (
                  <li
                    key={e.id}
                    className="flex items-center gap-3 border-b border-border px-5 py-3 last:border-b-0"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-body-strong text-text-primary">{e.name}</div>
                      <div className="truncate text-caption text-text-secondary">{e.description}</div>
                    </div>
                    <RiskScoreChip score={e.risk} />
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <div className="space-y-5">
            <Card title="Information" icon={<Info />} padding="none">
              <InfoRowGroup>
                <InfoRow icon={infoIcon.account} label="App Accounts" value={String(accounts.length)} />
                <InfoRow
                  icon={infoIcon.orphanAccount}
                  label="Orphan Accounts"
                  value={
                    orphans > 0 ? <StatusChip intent="warning" label={`${orphans} orphaned`} /> : <span>0</span>
                  }
                />
                <InfoRow icon={infoIcon.entitlement} label="Entitlements" value={String(entitlements.length)} />
                <InfoRow icon={infoIcon.people} label="Users" value={String(gov?.metrics.find((m) => m.label === 'Users')?.value ?? '—')} />
                <InfoRow icon={infoIcon.owner} label="Owners" value={String(app.ownerIds.length)} />
              </InfoRowGroup>
            </Card>

            <Card title="Governance" icon={<Shield />} padding="none">
              <InfoRowGroup>
                <InfoRow
                  icon={infoIcon.risk}
                  label="Risk Score"
                  value={gov ? <RiskScoreChip score={gov.risk} /> : <span>—</span>}
                />
                <InfoRow icon={infoIcon.department} label="Departments" value={scope(gov?.departmentIds ?? [])} />
                <InfoRow icon={infoIcon.location} label="Locations" value={scope(gov?.locationIds ?? [])} />
                <InfoRow
                  icon={infoIcon.reviewer}
                  label="Access Review Owner"
                  value={
                    people(row?.ownership.reviewers ?? []) ?? (
                      <StatusChip intent="danger" label="Unassigned" />
                    )
                  }
                />
                <InfoRow
                  icon={infoIcon.policy}
                  label="Governing Policies"
                  value={
                    row && row.controls.birthright + row.controls.approval + row.controls.sod > 0
                      ? [
                          row.controls.birthright && `${row.controls.birthright} birthright`,
                          row.controls.approval && `${row.controls.approval} approval`,
                          row.controls.sod && `${row.controls.sod} SoD`,
                        ]
                          .filter(Boolean)
                          .join(' · ')
                      : <StatusChip intent="warning" label="Ungoverned" />
                  }
                />
              </InfoRowGroup>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ApplicationDetailPage() {
  const id = String(useParams().id);
  const router = useRouter();
  const toast = useToast();
  const [tab, setTab] = React.useState('overview');
  const detail = getApplicationDetail(id);

  if (!detail) {
    return <DetailNotFound title="Application not found" backHref={LIST_HREF} backLabel="Back to Applications" />;
  }
  const { app, accounts, entitlements } = detail;
  const gov = getGovEntity(app.id);
  const findings = findingsFor(app.id);

  return (
    <DetailShell
      avatar={<EntityAvatar kind="application" name={app.name} size="md" />}
      title={app.name}
      description={app.description}
      chips={
        <>
          {gov && <RiskScoreChip score={gov.risk} />}
          {findings.length > 0 && (
            <StatusChip intent="caution" label={`${findings.length} governance ${findings.length === 1 ? 'gap' : 'gaps'}`} />
          )}
        </>
      }
      actions={
        <>
          <Button variant="secondary" startIcon={<EditOutlined />} onClick={() => toast.info('Edit basic details')}>
            Basic Details
          </Button>
          <Link href="/iga/governance-explorer">
            <Button variant="secondary" startIcon={<SchemaOutlined />}>
              Governance Model
            </Button>
          </Link>
          {/* No Duplicate: an application is a connector to a real external system,
              not a document. Copying the record would claim a second Okta exists. */}
          <Menu
            items={[
              { label: 'Delete', icon: <DeleteOutline sx={{ fontSize: 18 }} />, danger: true, onClick: () => toast.error('Delete is not available in this prototype') },
            ]}
          />
        </>
      }
      tabs={TABS.map((t) =>
        t.value === 'accounts'
          ? { ...t, count: accounts.length }
          : t.value === 'entitlements'
            ? { ...t, count: entitlements.length }
            : t,
      )}
      tab={tab}
      onTab={setTab}
    >
      {tab === 'overview' && <OverviewTab detail={detail} />}
      {tab === 'accounts' && (
        <RelationTable
          columns={accountColumns}
          rows={accounts}
          onRowClick={(r) => router.push(`/iga/directory/app-accounts/${r.id}`)}
          emptyTitle="No app accounts"
          emptyMessage="No accounts exist in this application yet."
        />
      )}
      {tab === 'entitlements' && (
        <RelationTable
          columns={entitlementColumns}
          rows={entitlements}
          onRowClick={(r) => router.push(`/iga/directory/entitlements/${r.id}`)}
          emptyTitle="No entitlements"
          emptyMessage="This application exposes no entitlements yet."
        />
      )}
      {tab === 'approval' && <ApplicationApprovalPolicyTab applicationId={app.id} />}
      {tab === 'owners' && (
        <EntityOwnersTab
          entityType="application"
          entityId={app.id}
          seedOwnerIds={app.ownerIds}
          label="Owner"
          emptyHint="Nobody is accountable for this application. Add an owner to approve access requests and attest to its risk."
        />
      )}
    </DetailShell>
  );
}
