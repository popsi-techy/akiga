'use client';

import * as React from 'react';
import Info from '@mui/icons-material/Info';
import Shield from '@mui/icons-material/Shield';
import Hub from '@mui/icons-material/Hub';
import WatchLater from '@mui/icons-material/WatchLater';
import { Card, StatusChip } from '@ds/components';
import { InfoRow, InfoRowGroup } from './DetailShell';
import { RiskScoreChip } from './RiskScoreChip';
import { Delta } from './ReconciliationTab';
import { infoIcon } from './infoIcons';
import { formatDateTime } from '../sod/labels';
import { appProfileFor } from '@/data/seed';
import { listAuthorizations } from '@/data/provisioning-auth';
import { eventStatus, listConnectionEvents } from '@/data/connection-events';
import { reconciliationSummary } from '@/data/reconciliation';
import { listBaselines } from '@/data/baselines';
import { getGovEntity, explorerRow, displayName } from '@/data/governance';
import type { AppAccountRow, EntitlementRow } from '@/data/directory';

interface CatalogApp {
  id: string;
  name: string;
  ownerIds: string[];
}

/**
 * Application overview.
 *
 * An application is two things at once: a set of access to be governed, and a
 * connector that has to work. Four cards, one per question — how it is wired,
 * what the last run did, what it holds, how it is governed. The connector comes
 * first because a governance number computed from a connector that has never
 * synced is not a fact worth reading.
 *
 * Read-only throughout. Each card's tab is where the corresponding work happens.
 */
export function ApplicationOverviewTab({
  app,
  accounts,
  entitlements,
}: {
  app: CatalogApp;
  accounts: AppAccountRow[];
  entitlements: EntitlementRow[];
}) {
  // Authorization, events, sync and baselines are all localStorage-backed, so
  // they can only be read after mount — during render the server would answer
  // with the seed and the client with the store.
  const [setup, setSetup] = React.useState<{
    hasAuth: boolean;
    connected: boolean;
    events: { total: number; needingSetup: number };
    lastSync: { at: string; ok: boolean } | null;
    changed: {
      accounts: { added: number; removed: number };
      entitlements: { added: number; removed: number };
    };
    baseline: { name: string; size: number } | null;
  } | null>(null);

  React.useEffect(() => {
    const auths = listAuthorizations(app.id);
    const events = listConnectionEvents(app.id);
    const summary = reconciliationSummary(app.id);
    const baselines = listBaselines(app.id);
    const primary = baselines.find((b) => b.isDefault) ?? baselines[0] ?? null;
    setSetup({
      hasAuth: auths.length > 0,
      connected: auths.some((a) => a.authorized),
      events: { total: events.length, needingSetup: events.filter((e) => eventStatus(e) === 'partial').length },
      lastSync: summary.lastSync ? { at: summary.lastSync.at, ok: summary.lastSync.outcome === 'success' } : null,
      changed: {
        accounts: { added: summary.accounts.added, removed: summary.accounts.removed },
        entitlements: { added: summary.entitlements.added, removed: summary.entitlements.removed },
      },
      baseline: primary ? { name: primary.name, size: primary.entitlementIds.length } : null,
    });
  }, [app.id]);

  const profile = appProfileFor(app.id);
  const gov = getGovEntity(app.id);
  const row = gov ? explorerRow(gov) : null;

  return (
    <div className="ds-scroll h-full overflow-y-auto pr-0.5">
      <div className="space-y-5">
        {/* Four peers, no rail. Two up rather than four across: an InfoRow needs
            room for a label and a value on one line, and a quarter-width card
            starts truncating both. */}
        <div className="grid items-start gap-5 md:grid-cols-2">
          <Card title="Integration" icon={<Hub />} padding="none">
              <InfoRowGroup>
                <InfoRow icon={infoIcon.type} label="Application type" value={profile.appType} />
                <InfoRow
                  icon={infoIcon.discovery}
                  label="Discovered via"
                  value={profile.discoverySource === 'IAM' ? 'An IAM integration' : 'Added directly'}
                />
                <InfoRow
                  icon={infoIcon.authorization}
                  label="Authorization"
                  value={
                    !setup ? (
                      <span>—</span>
                    ) : !setup.hasAuth ? (
                      <StatusChip intent="warning" label="None" />
                    ) : setup.connected ? (
                      <StatusChip intent="success" label="Connected" />
                    ) : (
                      <StatusChip intent="warning" label="Not connected" />
                    )
                  }
                />
                <InfoRow
                  icon={infoIcon.sync}
                  label="Provisioning"
                  value={
                    profile.externalProvisioning === 'enabled'
                      ? `On · ${profile.provisioningType === 'auto' ? 'Automatic' : 'Manual'}`
                      : 'Off'
                  }
                />
                <InfoRow
                  icon={infoIcon.item}
                  label="Events"
                  value={
                    !setup ? (
                      <span>—</span>
                    ) : setup.events.total === 0 ? (
                      <StatusChip intent="warning" label="None" />
                    ) : setup.events.needingSetup > 0 ? (
                      <span>
                        {setup.events.total} · {setup.events.needingSetup} need setup
                      </span>
                    ) : (
                      <span>{setup.events.total} configured</span>
                    )
                  }
                />
              </InfoRowGroup>
            </Card>

            {/* Its own card rather than a row in Integration: the last run is not
                a setting, it is the most recent thing that happened — and what it
                moved is the part worth reading. */}
            <Card title="Reconciliation" icon={<WatchLater />} padding="none">
              <InfoRowGroup>
                <InfoRow
                  icon={infoIcon.completed}
                  label="Last sync"
                  value={
                    !setup ? (
                      <span>—</span>
                    ) : setup.lastSync ? (
                      <span>{formatDateTime(setup.lastSync.at)}</span>
                    ) : (
                      <span className="text-text-tertiary">Never</span>
                    )
                  }
                />
                <InfoRow
                  icon={infoIcon.status}
                  label="Result"
                  value={
                    !setup?.lastSync ? (
                      <span className="text-text-tertiary">—</span>
                    ) : setup.lastSync.ok ? (
                      <StatusChip intent="success" label="Success" />
                    ) : (
                      <StatusChip intent="danger" label="Failed" />
                    )
                  }
                />
                <InfoRow
                  icon={infoIcon.account}
                  label="Accounts changed"
                  value={
                    setup?.lastSync ? (
                      <Delta added={setup.changed.accounts.added} removed={setup.changed.accounts.removed} />
                    ) : (
                      <span className="text-text-tertiary">—</span>
                    )
                  }
                />
                <InfoRow
                  icon={infoIcon.entitlement}
                  label="Entitlements changed"
                  value={
                    setup?.lastSync ? (
                      <Delta added={setup.changed.entitlements.added} removed={setup.changed.entitlements.removed} />
                    ) : (
                      <span className="text-text-tertiary">—</span>
                    )
                  }
                />
              </InfoRowGroup>
            </Card>

            <Card title="Contents" icon={<Info />} padding="none">
              <InfoRowGroup>
                <InfoRow icon={infoIcon.account} label="App Accounts" value={String(accounts.length)} />
                <InfoRow icon={infoIcon.entitlement} label="Entitlements" value={String(entitlements.length)} />
                <InfoRow
                  icon={infoIcon.people}
                  label="Users"
                  value={String(gov?.metrics.find((m) => m.label === 'Users')?.value ?? '—')}
                />
              </InfoRowGroup>
            </Card>

            <Card title="Governance" icon={<Shield />} padding="none">
              <InfoRowGroup>
                <InfoRow
                  icon={infoIcon.risk}
                  label="Risk Score"
                  value={gov ? <RiskScoreChip score={gov.risk} /> : <span>—</span>}
                />
                <InfoRow icon={infoIcon.owner} label="Owners" value={String(app.ownerIds.length)} />
                <InfoRow
                  icon={infoIcon.baseline}
                  label="Default baseline"
                  value={
                    !setup ? (
                      <span>—</span>
                    ) : setup.baseline ? (
                      <span>
                        {setup.baseline.name} · {setup.baseline.size}
                      </span>
                    ) : (
                      <StatusChip intent="warning" label="None" />
                    )
                  }
                />
                <InfoRow
                  icon={infoIcon.reviewer}
                  label="Access Review Owner"
                  value={
                    row?.ownership.reviewers?.length
                      ? row.ownership.reviewers.map((p) => p.name).join(', ')
                      : <StatusChip intent="danger" label="Unassigned" />
                  }
                />
                <InfoRow
                  icon={infoIcon.department}
                  label="Departments"
                  value={(gov?.departmentIds ?? []).map((id) => displayName(id)).join(', ') || '—'}
                />
                <InfoRow
                  icon={infoIcon.policy}
                  label="Governing Policies"
                  value={
                    row && row.controls.birthright + row.controls.approval + row.controls.sod > 0 ? (
                      [
                        row.controls.birthright && `${row.controls.birthright} birthright`,
                        row.controls.approval && `${row.controls.approval} approval`,
                        row.controls.sod && `${row.controls.sod} SoD`,
                      ]
                        .filter(Boolean)
                        .join(' · ')
                    ) : (
                      <StatusChip intent="warning" label="Ungoverned" />
                    )
                  }
                />
              </InfoRowGroup>
          </Card>
        </div>
      </div>
    </div>
  );
}
