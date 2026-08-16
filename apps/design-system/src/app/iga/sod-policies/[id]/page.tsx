'use client';

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import BalanceOutlined from '@mui/icons-material/BalanceOutlined';
import Policy from '@mui/icons-material/Policy';
import Info from '@mui/icons-material/Info';
import WatchLater from '@mui/icons-material/WatchLater';
import GroupsOutlined from '@mui/icons-material/GroupsOutlined';
import RuleOutlined from '@mui/icons-material/RuleOutlined';
import EditOutlined from '@mui/icons-material/EditOutlined';
import BlockOutlined from '@mui/icons-material/BlockOutlined';
import DeleteOutline from '@mui/icons-material/DeleteOutline';
import HistoryOutlined from '@mui/icons-material/HistoryOutlined';
import CalendarTodayOutlined from '@mui/icons-material/CalendarTodayOutlined';
import CheckCircleOutlined from '@mui/icons-material/CheckCircleOutlined';
import PlayArrowOutlined from '@mui/icons-material/PlayArrow';
import {
  Avatar,
  Button,
  Card,
  Dialog,
  Menu,
  StatusChip,
  Tooltip,
  useToast,
  type TabItem,
} from '@ds/components';
import {
  DetailShell,
  DetailNotFound,
  InfoRow,
  InfoRowGroup,
  EntityOwnersTab,
} from '@/components/product/directory';
import {
  deleteSodPolicy,
  getActiveRuleset,
  getSodPolicy,
  getSodPolicySeedOwners,
  listRulesetVersions,
  saveRuleset,
  setSodPolicyStatus,
  sodBlockingSteps,
  sodPolicyNextSteps,
  type SodPolicyRow,
} from '@/data/sod-policies';
import { countAccess, describeRuleset } from '@/lib/sod-ruleset';
import { NextStepsCard } from '@/components/product/NextStepsCard';
import { SodRulesetPreview } from '@/components/product/sod/SodRulesetPreview';
import { SodRulesetDrawer } from '@/components/product/sod/SodRulesetDrawer';
import { SodPolicyDetailsDrawer } from '@/components/product/sod/SodPolicyDetailsDrawer';
import { SEVERITY_META, STATUS_META, formatDate } from '@/components/product/sod/policy-labels';

const TABS: TabItem[] = [
  { value: 'overview', label: 'Overview' },
  { value: 'owners', label: 'Owners' },
  { value: 'ruleset', label: 'Ruleset' },
];

export default function SodPolicyDetailPage() {
  const id = String(useParams().id);
  const router = useRouter();
  const toast = useToast();
  const [tab, setTab] = React.useState('overview');
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [rulesetOpen, setRulesetOpen] = React.useState(false);
  const [detailsOpen, setDetailsOpen] = React.useState(false);

  // localStorage-backed: undefined until mounted (loading), null when missing.
  const [policy, setPolicy] = React.useState<SodPolicyRow | null | undefined>(undefined);
  const refresh = React.useCallback(() => setPolicy(getSodPolicy(id)), [id]);
  React.useEffect(() => refresh(), [refresh]);

  if (policy === undefined) {
    return <div className="py-16 text-center text-body-sm text-text-secondary">Loading policy…</div>;
  }
  if (!policy) {
    return (
      <DetailNotFound
        title="SoD policy not found"
        backHref="/iga/sod-policies"
        backLabel="Back to SoD Policies"
      />
    );
  }

  const blocking = sodBlockingSteps(policy);
  const versions = listRulesetVersions(policy.id);
  const active = getActiveRuleset(policy.id);
  const isDraft = policy.status === 'draft';

  const activate = () => {
    if (blocking.length > 0) return;
    setSodPolicyStatus(policy.id, 'active');
    refresh();
    toast.success(`“${policy.name}” is active. New conflicts will be detected against it.`);
  };

  const deactivate = () => {
    setSodPolicyStatus(policy.id, 'inactive');
    refresh();
    toast.success(`“${policy.name}” deactivated. Nothing new will be detected.`);
  };

  return (
    <>
      <DetailShell
        avatar={<Avatar name={policy.name} size="md" />}
        title={policy.name}
        description={policy.description}
        chips={
          <>
            <StatusChip intent={SEVERITY_META[policy.severity].intent} dot={false} label={SEVERITY_META[policy.severity].label} />
            <StatusChip intent={STATUS_META[policy.status].intent} label={STATUS_META[policy.status].label} />
          </>
        }
        actions={
          <>
            {/* Out of the overflow menu and onto the bar: renaming a policy or
                changing its severity is ordinary upkeep, not a rare action, and
                it is the same slot Emergency Access puts it in. */}
            <Button variant="secondary" startIcon={<EditOutlined />} onClick={() => setDetailsOpen(true)}>
              Basic Details
            </Button>
            {policy.status === 'active' ? (
              <Button variant="secondary" startIcon={<BlockOutlined />} onClick={deactivate}>
                Deactivate
              </Button>
            ) : (
              // A draft and a switched-off policy are turned on the same way, but
              // only the draft can be incomplete — so only it can be blocked, and
              // the tooltip says by what rather than leaving a dead control.
              <Tooltip
                title={
                  blocking.length > 0
                    ? `${blocking.join(' and ')} before this can be activated.`
                    : 'Start detecting conflicts against this rule'
                }
              >
                <span>
                  <Button
                    startIcon={isDraft ? <CheckCircleOutlined /> : <PlayArrowOutlined />}
                    disabled={blocking.length > 0}
                    onClick={activate}
                  >
                    Activate
                  </Button>
                </span>
              </Tooltip>
            )}
            <Menu
              items={[
                {
                  label: 'Delete policy',
                  icon: <DeleteOutline sx={{ fontSize: 18 }} />,
                  danger: true,
                  onClick: () => setDeleteOpen(true),
                },
              ]}
            />
          </>
        }
        tabs={TABS}
        tab={tab}
        onTab={setTab}
      >
        {tab === 'overview' && (
          <OverviewTab policy={policy} onGoToTab={setTab} onActivate={activate} blocking={blocking} />
        )}

        {tab === 'owners' && (
          <EntityOwnersTab
            entityType="sod-policy"
            entityId={policy.id}
            seedOwnerIds={getSodPolicySeedOwners(policy.id)}
            label="Owner"
            emptyHint="An owner answers for this policy at review, and is who a disputed conflict goes to."
          />
        )}

        {tab === 'ruleset' && (
          <RulesetTab
            policy={policy}
            active={active}
            versionCount={versions.length}
            onEdit={() => setRulesetOpen(true)}
          />
        )}
      </DetailShell>

      {/* Edited where the reader already is. Sending them back to the list to
          change a name means finding the row they just came from. */}
      <SodPolicyDetailsDrawer
        open={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        policy={policy}
        onSaved={() => {
          setDetailsOpen(false);
          refresh();
        }}
      />

      <SodRulesetDrawer
        open={rulesetOpen}
        onClose={() => setRulesetOpen(false)}
        initial={active?.root ?? null}
        // A draft has never enforced anything, so its single version is edited in
        // place; a live rule is superseded, keeping what fired last month readable.
        versioned={!isDraft && active !== null}
        nextVersion={(versions[0]?.version ?? 0) + 1}
        onSave={(root, note) => {
          const saved = saveRuleset(policy.id, root, note);
          setRulesetOpen(false);
          refresh();
          toast.success(
            saved && saved.version > 1 && !isDraft
              ? `Ruleset saved as version ${saved.version}`
              : 'Ruleset saved',
          );
        }}
      />

      <Dialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        tone="danger"
        title={`Delete ${policy.name}?`}
        confirmLabel="Delete"
        onConfirm={() => {
          deleteSodPolicy(policy.id);
          setDeleteOpen(false);
          toast.success(`“${policy.name}” deleted`);
          router.push('/iga/sod-policies');
        }}
      >
        The rule and every saved version of it are removed. Conflicts already raised under this
        policy keep their history, but nothing new will be detected.
      </Dialog>
    </>
  );
}

function OverviewTab({
  policy,
  onGoToTab,
  onActivate,
  blocking,
}: {
  policy: SodPolicyRow;
  onGoToTab: (tab: string) => void;
  onActivate: () => void;
  blocking: string[];
}) {
  const steps = sodPolicyNextSteps(policy).map((s) => ({
    ...s,
    icon: s.id === 'ruleset' ? <RuleOutlined sx={{ fontSize: 18 }} /> : <GroupsOutlined sx={{ fontSize: 18 }} />,
  }));
  const canActivate = blocking.length === 0;

  return (
    <div className="ds-scroll h-full overflow-y-auto pr-0.5">
      <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
        {policy.status === 'draft' ? (
          <NextStepsCard
            steps={steps}
            onStep={(id) => onGoToTab(steps.find((s) => s.id === id)?.tab ?? 'overview')}
            footer={
              <>
                <p className="min-w-0 flex-1 text-body-sm text-text-secondary">
                  {canActivate
                    ? 'Everything required is in place. Activating starts detecting conflicts against this rule.'
                    : `${blocking.join(' and ')} before this can be activated.`}
                </p>
                <Button startIcon={<CheckCircleOutlined />} disabled={!canActivate} onClick={onActivate}>
                  Activate
                </Button>
              </>
            }
          />
        ) : (
          <Card title="What this policy catches" icon={<Policy />} padding="lg">
            <RuleSummary policy={policy} onGoToTab={onGoToTab} />
          </Card>
        )}

        <div className="space-y-5">
          <Card title="Information" icon={<Info />} padding="none">
            <InfoRowGroup>
              <InfoRow
                icon={<BalanceOutlined sx={{ fontSize: 18 }} />}
                label="Severity"
                value={SEVERITY_META[policy.severity].label}
              />
              <InfoRow
                icon={<RuleOutlined sx={{ fontSize: 18 }} />}
                label="Access in rule"
                value={policy.accessCount || '—'}
              />
              <InfoRow
                icon={<GroupsOutlined sx={{ fontSize: 18 }} />}
                label="Owners"
                value={policy.ownerCount || '—'}
              />
            </InfoRowGroup>
          </Card>

          <Card title="Timeline" icon={<WatchLater />} padding="none">
            <InfoRowGroup>
              <InfoRow
                icon={<HistoryOutlined sx={{ fontSize: 18 }} />}
                label="Last Updated"
                value={formatDate(policy.updatedOn)}
              />
              <InfoRow
                icon={<CalendarTodayOutlined sx={{ fontSize: 18 }} />}
                label="Created"
                value={formatDate(policy.createdOn)}
              />
            </InfoRowGroup>
          </Card>
        </div>
      </div>
    </div>
  );
}

/** The live rule as one sentence — the fastest answer to "what does this policy do?". */
function RuleSummary({ policy, onGoToTab }: { policy: SodPolicyRow; onGoToTab: (tab: string) => void }) {
  const active = getActiveRuleset(policy.id);
  if (!active) {
    return (
      <div>
        <p className="text-body-sm text-text-secondary">
          This policy has no ruleset, so it is detecting nothing.
        </p>
        <div className="mt-3">
          <Button variant="secondary" onClick={() => onGoToTab('ruleset')}>
            Create the ruleset
          </Button>
        </div>
      </div>
    );
  }
  return (
    <div>
      <p className="text-body-sm text-text-secondary">
        A user is in violation when they hold:
      </p>
      <p className="mt-2 text-body-strong text-text-primary">{describeRuleset(active.root)}</p>
      <p className="mt-3 text-caption text-text-tertiary">
        Version {active.version} · saved {formatDate(active.savedOn)} by {active.savedBy}
      </p>
    </div>
  );
}

function RulesetTab({
  policy,
  active,
  versionCount,
  onEdit,
}: {
  policy: SodPolicyRow;
  active: ReturnType<typeof getActiveRuleset>;
  versionCount: number;
  onEdit: () => void;
}) {
  const versions = listRulesetVersions(policy.id);
  const superseded = versions.filter((v) => v.state === 'superseded');

  return (
    <div className="ds-scroll h-full overflow-y-auto pr-0.5">
      <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
        <Card
          title={active ? `Active ruleset · version ${active.version}` : 'Ruleset'}
          icon={<Policy />}
          padding="lg"
          // Only once there is something to change: while the card is empty its
          // own empty state owns the call to action, and a header button beside
          // it would be the same action offered twice, four inches apart.
          action={
            active ? (
              <Button variant="secondary" size="sm" startIcon={<EditOutlined />} onClick={onEdit}>
                Change ruleset
              </Button>
            ) : undefined
          }
        >
          {active ? (
            <>
              <p className="mb-4 text-body-sm text-text-secondary">
                A user is in violation when they hold {describeRuleset(active.root)}.
              </p>
              <SodRulesetPreview root={active.root} />
            </>
          ) : (
            // Designed empty state, not a blank panel: the reader arrives here
            // from a checklist item that told them to build this.
            <div className="flex flex-col items-center gap-2 py-12 text-center">
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand-subtle text-icon-brand">
                <RuleOutlined sx={{ fontSize: 22 }} />
              </span>
              <div className="mt-1 text-h5 text-text-primary">No ruleset yet</div>
              <p className="max-w-sm text-body-sm text-text-secondary">
                A ruleset says which access, held together, is a conflict — entitlements and
                technical roles joined with AND and OR.
              </p>
              <div className="mt-2">
                <Button startIcon={<EditOutlined />} onClick={onEdit}>
                  Create ruleset
                </Button>
              </div>
            </div>
          )}
        </Card>

        <div className="space-y-5">
          <Card title="Version history" icon={<WatchLater />} padding="none">
            {versionCount === 0 ? (
              <p className="py-4 text-body-sm text-text-secondary">Nothing saved yet.</p>
            ) : (
              <ul>
                {versions.map((v) => (
                  <li
                    key={v.version}
                    className="flex items-start gap-3 border-b border-border py-3 last:border-0"
                  >
                    <span className="mt-0.5 shrink-0 text-caption-strong tabular-nums text-text-tertiary">
                      v{v.version}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2">
                        <span className="text-body-sm-strong text-text-primary">
                          {formatDate(v.savedOn)}
                        </span>
                        {v.state === 'active' && <StatusChip intent="success" label="Active" />}
                      </span>
                      <span className="mt-0.5 block text-caption text-text-secondary">
                        {v.note ?? `${countAccess(v.root)} pieces of access · ${v.savedBy}`}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          {superseded.length > 0 && (
            <p className="text-caption text-text-tertiary">
              Superseded versions are kept so a conflict raised earlier can still be read against the
              rule that raised it.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
