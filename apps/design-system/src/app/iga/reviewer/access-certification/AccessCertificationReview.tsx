'use client';

import * as React from 'react';
import Campaign from '@mui/icons-material/Campaign';
import CalendarTodayOutlined from '@mui/icons-material/CalendarTodayOutlined';
import EventAvailableOutlined from '@mui/icons-material/EventAvailableOutlined';
import SearchOutlined from '@mui/icons-material/SearchOutlined';
import FilterListOutlined from '@mui/icons-material/FilterListOutlined';
import InfoOutlined from '@mui/icons-material/InfoOutlined';
import HowToRegOutlined from '@mui/icons-material/HowToRegOutlined';
import PersonOffOutlined from '@mui/icons-material/PersonOffOutlined';
import CheckCircleOutline from '@mui/icons-material/CheckCircleOutline';
import CancelOutlined from '@mui/icons-material/CancelOutlined';
import ChevronRight from '@mui/icons-material/ChevronRight';
import {
  Avatar,
  Button,
  IdentityCell,
  DataTable,
  Dialog,
  FilterDrawer,
  Input,
  Meter,
  Select,
  StatusChip,
  Stepper,
  Tooltip,
  useToast,
  SelectionDock,
  type Column,
  type FilterGroup,
  type FilterSelection,
} from '@ds/components';
import { useSetBreadcrumbs } from '@/lib/breadcrumb';
import {
  ACCOUNT_KIND_LABEL,
  extendReviewTimeline,
  formatReviewDate,
  formatReviewDateTime,
  getReviewCampaign,
  mineAccounts,
  setAccountOwnership,
  setEntitlementDecision,
  setManyAccountOwnership,
  setManyEntitlementDecisions,
  verifiedCount,
  type OwnershipDecision,
  type ReviewAccount,
  type ReviewCampaign,
} from '@/data/reviewer-certification';

const STEPS = [{ label: 'Ownership Verification' }, { label: 'Entitlement Review' }];

const KIND_OPTIONS = [
  { id: 'app', label: ACCOUNT_KIND_LABEL.app },
  { id: 'service', label: ACCOUNT_KIND_LABEL.service },
];
const STATUS_OPTIONS = [
  { id: 'active', label: 'Active' },
  { id: 'inactive', label: 'Inactive' },
];

function iconBtnClass(active: boolean, tone: 'success' | 'danger') {
  const idle =
    'grid h-8 w-8 place-items-center rounded-md border border-border bg-surface transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-subtle';
  if (tone === 'success') {
    return [
      idle,
      active
        ? 'border-[var(--ds-color-status-success-border)] bg-[var(--ds-color-status-success-subtle)] text-[var(--ds-color-status-success-fg)]'
        : 'text-[var(--ds-color-status-success-fg)] hover:bg-[var(--ds-color-status-success-subtle)]',
    ].join(' ');
  }
  return [
    idle,
    active
      ? 'border-[var(--ds-color-status-danger-border)] bg-[var(--ds-color-status-danger-subtle)] text-[var(--ds-color-status-danger-fg)]'
      : 'text-[var(--ds-color-status-danger-fg)] hover:bg-[var(--ds-color-status-danger-subtle)]',
  ].join(' ');
}

/** Quiet icon on the Notion-style header dock — no boxed chrome. */
function HeaderAction({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Tooltip title={label}>
      <span className="inline-flex">
        <button
          type="button"
          aria-label={label}
          onClick={onClick}
          className="grid h-8 w-8 place-items-center rounded-sm text-icon transition-colors hover:bg-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-subtle"
        >
          {children}
        </button>
      </span>
    </Tooltip>
  );
}

export function AccessCertificationReview({
  bulkSurface = 'row',
}: {
  bulkSurface?: 'row' | 'dock';
}) {
  const toast = useToast();
  const [campaign, setCampaign] = React.useState<ReviewCampaign | null>(null);
  const [loaded, setLoaded] = React.useState(false);
  const [step, setStep] = React.useState(0);
  const [search, setSearch] = React.useState('');
  const [filterOpen, setFilterOpen] = React.useState(false);
  const [filters, setFilters] = React.useState<FilterSelection>({});
  const [extendOpen, setExtendOpen] = React.useState(false);
  const [extendDays, setExtendDays] = React.useState('7');
  const [selectedIds, setSelectedIds] = React.useState<string[]>([]);
  const [bulkPending, setBulkPending] = React.useState<
    { kind: 'not-mine' | 'revoke'; ids: string[] } | null
  >(null);

  React.useEffect(() => {
    setCampaign(getReviewCampaign());
    setLoaded(true);
  }, []);

  useSetBreadcrumbs(
    campaign
      ? [
          { label: 'Access Certification' },
          { label: campaign.name },
        ]
      : [{ label: 'Access Certification' }],
  );

  if (loaded && !campaign) {
    return (
      <div className="grid h-full place-items-center text-center">
        <div>
          <h1 className="text-h4 text-text-primary">Certification not found</h1>
          <p className="mt-2 text-body text-text-secondary">This review is no longer assigned to you.</p>
        </div>
      </div>
    );
  }
  if (!campaign) {
    return (
      <div className="flex h-full flex-col">
        <div className="h-10 w-64 animate-pulse rounded-md bg-subtle" />
        <div className="mt-6 min-h-0 flex-1 animate-pulse rounded-lg bg-subtle" />
      </div>
    );
  }

  const verified = verifiedCount(campaign);
  const total = campaign.accounts.length;
  const allVerified = verified === total && total > 0;
  const claimed = mineAccounts(campaign);
  const filterCount = Object.values(filters).reduce((n, ids) => n + ids.length, 0);

  const apps = Array.from(new Set(campaign.accounts.map((a) => a.applicationName))).sort();
  const filterGroups: FilterGroup[] = [
    { id: 'kind', label: 'Type', options: KIND_OPTIONS },
    { id: 'status', label: 'Status', options: STATUS_OPTIONS },
    { id: 'application', label: 'Application', options: apps.map((name) => ({ id: name, label: name })) },
  ];

  const matchesFilters = (a: ReviewAccount) => {
    const kinds = filters.kind ?? [];
    const statuses = filters.status ?? [];
    const applications = filters.application ?? [];
    if (kinds.length && !kinds.includes(a.kind)) return false;
    if (statuses.length && !statuses.includes(a.status)) return false;
    if (applications.length && !applications.includes(a.applicationName)) return false;
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      a.name.toLowerCase().includes(q) ||
      a.applicationName.toLowerCase().includes(q) ||
      ACCOUNT_KIND_LABEL[a.kind].toLowerCase().includes(q) ||
      a.entitlementName.toLowerCase().includes(q)
    );
  };

  const ownershipRows = campaign.accounts.filter(matchesFilters);
  const reviewRows = claimed.filter(matchesFilters);
  const visibleRows = step === 0 ? ownershipRows : reviewRows;
  const visibleIds = visibleRows.map((r) => r.id);
  const visibleSet = new Set(visibleIds);
  const actionableIds = selectedIds.filter((id) => visibleSet.has(id));
  const allMatchingSelected =
    visibleIds.length > 0 && visibleIds.every((id) => selectedIds.includes(id));

  const applyOwnershipBulk = (ids: string[], ownership: OwnershipDecision) => {
    setCampaign(setManyAccountOwnership(ids, ownership));
    setSelectedIds([]);
    toast.success(
      ownership === 'mine'
        ? `${ids.length} account${ids.length === 1 ? '' : 's'} marked as yours`
        : `${ids.length} account${ids.length === 1 ? '' : 's'} marked as not yours`,
    );
  };

  const applyEntitlementBulk = (ids: string[], decision: 'certify' | 'revoke') => {
    setCampaign(setManyEntitlementDecisions(ids, decision));
    setSelectedIds([]);
    toast.success(
      decision === 'certify'
        ? `${ids.length} entitlement${ids.length === 1 ? '' : 's'} certified`
        : `${ids.length} entitlement${ids.length === 1 ? '' : 's'} will be revoked`,
    );
  };

  const confirmBulk = () => {
    if (!bulkPending) return;
    if (bulkPending.kind === 'not-mine') applyOwnershipBulk(bulkPending.ids, 'not-mine');
    else applyEntitlementBulk(bulkPending.ids, 'revoke');
    setBulkPending(null);
  };

  const decideOwnership = (row: ReviewAccount, ownership: OwnershipDecision) => {
    setCampaign(setAccountOwnership(row.id, ownership));
    toast.success(
      ownership === 'mine' ? `“${row.name}” marked as yours` : `“${row.name}” marked as not yours`,
    );
  };

  const decideEntitlement = (row: ReviewAccount, decision: 'certify' | 'revoke') => {
    setCampaign(setEntitlementDecision(row.id, decision));
    toast.success(decision === 'certify' ? `“${row.entitlementName}” certified` : `“${row.entitlementName}” will be revoked`);
  };

  const confirmExtend = () => {
    const days = Number(extendDays);
    setCampaign(extendReviewTimeline(days));
    setExtendOpen(false);
    toast.success(`Timeline extended by ${days} day${days === 1 ? '' : 's'}`);
  };

  const goReview = () => {
    if (!allVerified) return;
    setSelectedIds([]);
    setStep(1);
  };

  const ownershipColumns: Column<ReviewAccount>[] = [
    {
      id: 'account',
      header: 'Accounts',
      sortable: true,
      wrap: true,
      value: (r) => r.name,
      render: (r) => <IdentityCell name={r.name} kind="person" />,
    },
    {
      id: 'kind',
      header: 'Type',
      sortable: true,
      value: (r) => r.kind,
      render: (r) => <StatusChip intent="neutral" label={ACCOUNT_KIND_LABEL[r.kind]} />,
    },
    {
      id: 'status',
      header: 'Status',
      sortable: true,
      value: (r) => r.status,
      render: (r) => (
        <StatusChip intent={r.status === 'active' ? 'success' : 'neutral'} label={r.status === 'active' ? 'Active' : 'Inactive'} />
      ),
    },
    {
      id: 'application',
      header: 'Application',
      sortable: true,
      value: (r) => r.applicationName,
      render: (r) => <span className="text-text-primary">{r.applicationName}</span>,
    },
    {
      id: 'modified',
      header: 'Last Modified',
      sortable: true,
      value: (r) => r.lastModified,
      render: (r) => <span className="whitespace-nowrap text-text-secondary">{formatReviewDateTime(r.lastModified)}</span>,
    },
    {
      id: 'actions',
      header: 'Actions',
      align: 'right',
      width: 96,
      render: (r) => (
        <div className="flex items-center justify-end gap-1">
          <Tooltip title="Belongs to me">
            <button
              type="button"
              aria-label={`Mark ${r.name} as belongs to me`}
              aria-pressed={r.ownership === 'mine'}
              onClick={(e) => {
                e.stopPropagation();
                decideOwnership(r, 'mine');
              }}
              className={iconBtnClass(r.ownership === 'mine', 'success')}
            >
              <HowToRegOutlined sx={{ fontSize: 18 }} />
            </button>
          </Tooltip>
          <Tooltip title="Does not belong to me">
            <button
              type="button"
              aria-label={`Mark ${r.name} as does not belong to me`}
              aria-pressed={r.ownership === 'not-mine'}
              onClick={(e) => {
                e.stopPropagation();
                decideOwnership(r, 'not-mine');
              }}
              className={iconBtnClass(r.ownership === 'not-mine', 'danger')}
            >
              <PersonOffOutlined sx={{ fontSize: 18 }} />
            </button>
          </Tooltip>
        </div>
      ),
    },
  ];

  const reviewColumns: Column<ReviewAccount>[] = [
    {
      id: 'account',
      header: 'Account',
      sortable: true,
      wrap: true,
      value: (r) => r.name,
      render: (r) => <IdentityCell name={r.name} kind="person" />,
    },
    {
      id: 'entitlement',
      header: 'Entitlement',
      sortable: true,
      value: (r) => r.entitlementName,
      render: (r) => <span className="text-text-primary">{r.entitlementName}</span>,
    },
    {
      id: 'application',
      header: 'Application',
      sortable: true,
      value: (r) => r.applicationName,
      render: (r) => <span className="text-text-primary">{r.applicationName}</span>,
    },
    {
      id: 'decision',
      header: 'Decision',
      render: (r) =>
        r.entitlementDecision ? (
          <StatusChip
            intent={r.entitlementDecision === 'certify' ? 'success' : 'danger'}
            label={r.entitlementDecision === 'certify' ? 'Certified' : 'Revoke'}
          />
        ) : (
          <span className="text-caption text-text-tertiary">Pending</span>
        ),
    },
    {
      id: 'actions',
      header: 'Actions',
      align: 'right',
      width: 96,
      render: (r) => (
        <div className="flex items-center justify-end gap-1">
          <Tooltip title="Certify">
            <button
              type="button"
              aria-label={`Certify ${r.entitlementName} on ${r.name}`}
              aria-pressed={r.entitlementDecision === 'certify'}
              onClick={(e) => {
                e.stopPropagation();
                decideEntitlement(r, 'certify');
              }}
              className={iconBtnClass(r.entitlementDecision === 'certify', 'success')}
            >
              <CheckCircleOutline sx={{ fontSize: 18 }} />
            </button>
          </Tooltip>
          <Tooltip title="Revoke">
            <button
              type="button"
              aria-label={`Revoke ${r.entitlementName} on ${r.name}`}
              aria-pressed={r.entitlementDecision === 'revoke'}
              onClick={(e) => {
                e.stopPropagation();
                decideEntitlement(r, 'revoke');
              }}
              className={iconBtnClass(r.entitlementDecision === 'revoke', 'danger')}
            >
              <CancelOutlined sx={{ fontSize: 18 }} />
            </button>
          </Tooltip>
        </div>
      ),
    },
  ];

  const noun = step === 0 ? 'account' : 'entitlement';
  const headerActions =
    step === 0 ? (
      <>
        <HeaderAction label="Belongs to me" onClick={() => applyOwnershipBulk(actionableIds, 'mine')}>
          <HowToRegOutlined sx={{ fontSize: 18 }} />
        </HeaderAction>
        <HeaderAction
          label="Does not belong to me"
          onClick={() => setBulkPending({ kind: 'not-mine', ids: actionableIds })}
        >
          <PersonOffOutlined sx={{ fontSize: 18 }} />
        </HeaderAction>
      </>
    ) : (
      <>
        <HeaderAction label="Certify" onClick={() => applyEntitlementBulk(actionableIds, 'certify')}>
          <CheckCircleOutline sx={{ fontSize: 18 }} />
        </HeaderAction>
        <HeaderAction
          label="Revoke"
          onClick={() => setBulkPending({ kind: 'revoke', ids: actionableIds })}
        >
          <CancelOutlined sx={{ fontSize: 18 }} />
        </HeaderAction>
      </>
    );

  return (
    <div className="-mx-8 -my-6 flex h-[calc(100%+3rem)] flex-col bg-canvas">
      {/* Header — same chrome as emergency-access / SoD resolution: full-bleed,
          then the stepper docks on the rule below it. */}
      <div className="shrink-0 border-b border-border bg-canvas px-5 py-2.5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <Avatar name={campaign.name} size="md" icon={<Campaign sx={{ fontSize: 20 }} />} />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-h4 text-text-primary">{campaign.name}</h1>
                <StatusChip intent="neutral" label={campaign.reviewerRole} />
              </div>
              <p className="mt-px flex items-center gap-1.5 text-body-sm text-text-secondary">
                <CalendarTodayOutlined sx={{ fontSize: 14 }} className="shrink-0 text-icon" aria-hidden />
                {formatReviewDate(campaign.startsOn)} – {formatReviewDate(campaign.dueOn)}
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <div className="w-[168px]">
              <Meter
                size="sm"
                tone="success"
                value={Math.max(campaign.remainingDays, 0)}
                max={14}
                label={`${campaign.remainingDays} day${campaign.remainingDays === 1 ? '' : 's'} remaining`}
              />
            </div>
            <Button
              variant="secondary"
              startIcon={<EventAvailableOutlined />}
              onClick={() => setExtendOpen(true)}
            >
              Extend Timeline
            </Button>
          </div>
        </div>
      </div>

      {/* Stepper bar — SoD resolution workspace: steps left, progress + advance right. */}
      <div className="flex shrink-0 items-center gap-4 border-b border-border bg-subtle px-5 py-3">
        <div className="min-w-0 flex-1 overflow-hidden">
          <Stepper
            steps={STEPS}
            current={step}
            showBack={step > 0}
            onStepClick={(i) => {
              if (i === 1 && !allVerified) {
                toast.error('Verify every account before reviewing entitlements');
                return;
              }
              setSelectedIds([]);
              setStep(i);
            }}
          />
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <div className="w-[200px]">
            <Meter
              size="sm"
              tone="brand"
              value={step === 0 ? verified : claimed.filter((a) => a.entitlementDecision).length}
              max={step === 0 ? total : Math.max(claimed.length, 1)}
              label={
                step === 0
                  ? `${verified} of ${total} accounts verified`
                  : `${claimed.filter((a) => a.entitlementDecision).length} of ${claimed.length} reviewed`
              }
            />
          </div>
          {step === 0 && (
            <Tooltip title={!allVerified ? 'Verify every account first' : ''} placement="bottom">
              <span className="inline-flex">
                <Button endIcon={<ChevronRight />} disabled={!allVerified} onClick={goReview}>
                  Proceed to review
                </Button>
              </span>
            </Tooltip>
          )}
        </div>
      </div>

      <div className="relative flex min-h-0 flex-1 flex-col px-5 pt-4">
        {step === 0 && (
          <div
            role="note"
            className="mb-4 flex shrink-0 items-start gap-2.5 rounded-lg border border-[var(--ds-color-status-info-border)] bg-[var(--ds-color-status-info-subtle)] px-4 py-3"
          >
            <InfoOutlined sx={{ fontSize: 18 }} className="mt-0.5 shrink-0 text-[var(--ds-color-status-info-fg)]" aria-hidden />
            <p className="text-body-sm text-[var(--ds-color-status-info-fg)]">
              Confirm each account with <strong className="font-emphasis">Belongs to me</strong> or{' '}
              <strong className="font-emphasis">Does not belong to me</strong>. You can review entitlements
              only on the accounts that are yours.
            </p>
          </div>
        )}

        <div className="mb-4 flex shrink-0 flex-wrap items-center gap-3">
          <div className="min-w-[220px] max-w-md flex-1">
            <Input
              placeholder={
                step === 0
                  ? 'Search by account name, type, or application'
                  : 'Search by account, entitlement, or application'
              }
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              startAdornment={<SearchOutlined sx={{ fontSize: 18 }} />}
              aria-label="Search accounts"
            />
          </div>
          <Button
            variant="secondary"
            startIcon={<FilterListOutlined />}
            onClick={() => setFilterOpen(true)}
          >
            Filter{filterCount > 0 ? ` (${filterCount})` : ''}
          </Button>
        </div>

        <div className="relative min-h-0 flex-1 pb-4">
          {step === 0 ? (
            <DataTable<ReviewAccount>
              columns={ownershipColumns}
              rows={ownershipRows}
              selectable
              selectedIds={selectedIds}
              onSelectionChange={setSelectedIds}
              highlightSelectedRows={bulkSurface === 'row'}
              fillHeight
              defaultRowsPerPage={12}
              rowsPerPageOptions={[12, 24]}
              emptyTitle={campaign.accounts.length === 0 ? 'No accounts to verify' : 'No matching accounts'}
              emptyMessage={
                campaign.accounts.length === 0
                  ? 'Accounts in this certification will appear here.'
                  : 'Try a different search or clear filters.'
              }
            />
          ) : (
            <DataTable<ReviewAccount>
              columns={reviewColumns}
              rows={reviewRows}
              selectable
              selectedIds={selectedIds}
              onSelectionChange={setSelectedIds}
              highlightSelectedRows={bulkSurface === 'row'}
              fillHeight
              defaultRowsPerPage={12}
              rowsPerPageOptions={[12, 24]}
              emptyTitle={claimed.length === 0 ? 'Nothing to review' : 'No matching entitlements'}
              emptyMessage={
                claimed.length === 0
                  ? 'None of these accounts belong to you, so there is nothing to certify.'
                  : 'Try a different search or clear filters.'
              }
            />
          )}
          {bulkSurface === 'row' && (
            <SelectionDock
              open={actionableIds.length > 0}
              placement="header"
              count={actionableIds.length}
              total={visibleIds.length}
              noun={noun}
              allSelected={allMatchingSelected}
              onSelectAll={() => setSelectedIds(visibleIds)}
              onClear={() => setSelectedIds([])}
            >
              {headerActions}
            </SelectionDock>
          )}
          {bulkSurface === 'dock' && (
            <SelectionDock
              open={actionableIds.length > 0}
              count={actionableIds.length}
              total={visibleIds.length}
              noun={noun}
              allSelected={allMatchingSelected}
              onSelectAll={() => setSelectedIds(visibleIds)}
              onClear={() => setSelectedIds([])}
            >
              {step === 0 ? (
                <>
                  <Button
                    variant="tertiary"
                    size="xs"
                    startIcon={<HowToRegOutlined />}
                    onClick={() => applyOwnershipBulk(actionableIds, 'mine')}
                  >
                    Belongs to me
                  </Button>
                  <Button
                    variant="tertiary"
                    size="xs"
                    startIcon={<PersonOffOutlined />}
                    onClick={() => setBulkPending({ kind: 'not-mine', ids: actionableIds })}
                  >
                    Does not belong
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="tertiary"
                    size="xs"
                    startIcon={<CheckCircleOutline />}
                    onClick={() => applyEntitlementBulk(actionableIds, 'certify')}
                  >
                    Certify
                  </Button>
                  <Button
                    variant="tertiary"
                    size="xs"
                    startIcon={<CancelOutlined />}
                    onClick={() => setBulkPending({ kind: 'revoke', ids: actionableIds })}
                  >
                    Revoke
                  </Button>
                </>
              )}
            </SelectionDock>
          )}
        </div>
      </div>

      <FilterDrawer
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        groups={filterGroups}
        value={filters}
        onApply={setFilters}
        subtitle="Narrow the accounts in this certification."
        renderStatus={(staged) => {
          const count = Object.values(staged).reduce((n, ids) => n + ids.length, 0);
          return count ? `${count} selected` : 'No filters';
        }}
      />

      <Dialog
        open={Boolean(bulkPending)}
        onClose={() => setBulkPending(null)}
        tone="danger"
        title={
          bulkPending?.kind === 'revoke'
            ? `Revoke ${bulkPending.ids.length} entitlement${bulkPending.ids.length === 1 ? '' : 's'}?`
            : `Mark ${bulkPending?.ids.length ?? 0} account${(bulkPending?.ids.length ?? 0) === 1 ? '' : 's'} as not yours?`
        }
        confirmLabel={bulkPending?.kind === 'revoke' ? 'Revoke' : 'Mark as not mine'}
        cancelLabel="Cancel"
        onConfirm={confirmBulk}
      >
        {bulkPending?.kind === 'revoke'
          ? 'Those entitlements will be queued for removal. You can still change a row before the campaign closes.'
          : 'They leave this review and will not appear in entitlement review. You can still change a row afterwards.'}
      </Dialog>

      <Dialog
        open={extendOpen}
        onClose={() => setExtendOpen(false)}
        title="Extend this timeline?"
        confirmLabel="Extend"
        cancelLabel="Keep dates"
        onConfirm={confirmExtend}
      >
        <p className="mb-4 text-body-sm text-text-secondary">
          Reviewers get extra time. Identities already decided stay decided.
        </p>
        <Select
          label="Add"
          size="sm"
          value={extendDays}
          onChange={setExtendDays}
          options={[
            { value: '7', label: '7 days' },
            { value: '14', label: '14 days' },
            { value: '30', label: '30 days' },
          ]}
        />
      </Dialog>
    </div>
  );
}
