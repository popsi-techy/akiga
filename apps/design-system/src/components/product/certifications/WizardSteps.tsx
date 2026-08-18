'use client';

import * as React from 'react';
import AddIcon from '@mui/icons-material/Add';
import AppsOutlined from '@mui/icons-material/AppsOutlined';
// Card headers take filled icons only. `Apps` and `Schedule` look filled in a
// picker but ship the same path as their Outlined twins — `check:icons` blocks
// them, which is how these two got caught.
import Assignment from '@mui/icons-material/Assignment';
import Groups from '@mui/icons-material/Groups';
import WatchLater from '@mui/icons-material/WatchLater';
import EditOutlined from '@mui/icons-material/EditOutlined';
import GroupsOutlined from '@mui/icons-material/GroupsOutlined';
import PersonOutline from '@mui/icons-material/PersonOutline';
import {
  Button,
  Card,
  Checkbox,
  DatePicker,
  Input,
  OverflowChips,
  PickerSlot,
  Select,
  Switch,
  Tooltip,
  type SelectOption,
} from '@ds/components';
import InfoOutlined from '@mui/icons-material/InfoOutlined';
import { listApps } from '@/data/catalog';
import { listUserIdentities, listGovernanceTeamRows } from '@/data/directory';
import { TableSelectDrawer } from '../automation/TableSelectDrawer';
import {
  INTERVAL_LABEL,
  OUTCOME_LABEL,
  type Certification,
  type LaunchType,
  type OutcomeAction,
  type RecurrenceInterval,
} from '@/data/certifications';
import { CERT_STATUS_META, formatDate } from './certification-labels';

type Patch = (next: Partial<Certification>) => void;

/** Shared heading for the left column of every step. */
export function StepHeading({ step, title, description }: { step: number; title: string; description: string }) {
  return (
    <div className="mb-5">
      <p className="text-body-sm-strong text-brand">Step {step} of 5</p>
      <h2 className="mt-1 text-h4 text-text-primary">{title}</h2>
      <p className="mt-1 text-body-sm text-text-secondary">{description}</p>
    </div>
  );
}

// ---- 1. Details --------------------------------------------------------

export function DetailsStep({ draft, patch }: { draft: Certification; patch: Patch }) {
  const [pickerOpen, setPickerOpen] = React.useState(false);
  const apps = listApps();
  const chosen = apps.filter((a) => draft.applicationIds.includes(a.id));

  return (
    <>
      <StepHeading
        step={1}
        title="Certification details"
        description="Name it, and choose which applications the review covers."
      />

      <div className="max-w-2xl space-y-5">
        <Input
          label="Name"
          required
          hint="Reviewers see this in their queue. Name it after what is being reviewed and when."
          placeholder="e.g. Finance access review — Q3"
          size="sm"
          value={draft.name}
          onChange={(e) => patch({ name: e.target.value })}
        />
        <Input
          label="Description"
          hint="Tells a reviewer why they were asked, which is what makes them decide rather than approve everything."
          placeholder="What this review is for, and what reviewers should look for"
          size="sm"
          multiline
          minRows={3}
          value={draft.description}
          onChange={(e) => patch({ description: e.target.value })}
        />

        <div>
          <div className="mb-2 text-body-sm-strong text-text-secondary">
            Applications <span className="text-danger">*</span>
          </div>
          <PickerSlot
            icon={<AppsOutlined />}
            title={
              chosen.length === 0
                ? 'No applications chosen'
                : `${chosen.length} application${chosen.length === 1 ? '' : 's'} selected`
            }
            hint={
              chosen.length === 0
                ? 'The review covers the access people hold in these systems.'
                : 'Edit which systems this review covers.'
            }
            summary={chosen.length > 0 ? <OverflowChips items={chosen} max={1} /> : undefined}
            // A pencil once something is chosen, not "Add applications": the
            // drawer opens with the current picks selected, so it edits the set
            // rather than appending to it. `PickerSlot` owns how that pencil
            // looks, so every filled slot offers editing the same way.
            {...(chosen.length === 0
              ? {
                  action: (
                    <Button variant="secondary" startIcon={<AddIcon />} onClick={() => setPickerOpen(true)}>
                      Add applications
                    </Button>
                  ),
                }
              : { onEdit: () => setPickerOpen(true), editLabel: 'Edit applications' })}
          />
        </div>
      </div>

      <TableSelectDrawer
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        title="Add applications"
        subtitle="The review covers access held in the systems you pick."
        icon={<AppsOutlined sx={{ fontSize: 22, color: 'var(--ds-color-brand-primary)' }} />}
        nameHeader="Application"
        entity="application"
        rows={apps.map((a) => ({ id: a.id, name: a.name, description: a.description }))}
        selectedIds={draft.applicationIds}
        showRisk={false}
        onApply={(ids) => patch({ applicationIds: ids })}
      />
    </>
  );
}

// ---- 2. Users ----------------------------------------------------------

export function UsersStep({ draft, patch }: { draft: Certification; patch: Patch }) {
  const [pickerOpen, setPickerOpen] = React.useState(false);
  const users = listUserIdentities();
  const chosen = users.filter((u) => draft.userIds.includes(u.id));

  return (
    <>
      <StepHeading
        step={2}
        title="Who is being reviewed"
        description="Choose the people whose access reviewers will confirm or take away."
      />

      {/* One row in both states, like the applications slot on step 1. This step
          used to grow a card listing every chosen person, each with its own remove
          button — which broke the property the slot exists for: the step changed
          shape and height the moment anything was picked, and a review of forty
          people scrolled past its own footer.

          Removal did not have to move with it. The drawer preselects and replaces
          rather than appending, so taking someone out happens there, in a
          searchable table beside a running selection panel — which is where you
          want to be when the set is large, and the only place the inline list was
          ever better was when it was short. */}
      <div className="max-w-2xl">
        <PickerSlot
          icon={<PersonOutline />}
          title={
            chosen.length === 0
              ? 'No users chosen'
              : `${chosen.length} user${chosen.length === 1 ? '' : 's'} to review`
          }
          hint={
            chosen.length === 0
              ? "Nobody's access will be reviewed until you add people here."
              : 'Edit whose access reviewers will decide on.'
          }
          summary={chosen.length > 0 ? <OverflowChips items={chosen} /> : undefined}
          {...(chosen.length === 0
            ? {
                action: (
                  <Button startIcon={<AddIcon />} onClick={() => setPickerOpen(true)}>
                    Add users
                  </Button>
                ),
              }
            : { onEdit: () => setPickerOpen(true), editLabel: 'Edit users' })}
        />
      </div>

      <TableSelectDrawer
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        title="Add users"
        subtitle="Their access in the chosen applications is what reviewers will decide on."
        icon={<PersonOutline sx={{ fontSize: 22, color: 'var(--ds-color-brand-primary)' }} />}
        nameHeader="User"
        descriptionHeader="Email"
        entity="user"
        rows={users.map((u) => ({ id: u.id, name: u.name, description: u.email, risk: u.riskScore }))}
        selectedIds={draft.userIds}
        onApply={(ids) => patch({ userIds: ids })}
      />
    </>
  );
}

// ---- 3. Review configuration -------------------------------------------

/** A reviewer choice: a checkbox that owns a row, and optional detail beneath. */
function ReviewerOption({
  checked,
  onChange,
  title,
  description,
  children,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  title: string;
  description: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border bg-surface px-5 py-4">
      <Checkbox checked={checked} onChange={onChange} label={
        <span className="block">
          <span className="block text-body-strong text-text-primary">{title}</span>
          <span className="mt-0.5 block text-body-sm text-text-secondary">{description}</span>
        </span>
      } />
      {/* Detail appears only once the option is on — an always-visible picker for
          a reviewer nobody selected is a question that was never asked. */}
      {checked && children && <div className="mt-4 pl-7">{children}</div>}
    </div>
  );
}

function ToggleRow({
  label,
  tip,
  checked,
  onChange,
}: {
  label: string;
  tip: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg bg-subtle px-4 py-3">
      <div className="flex min-w-0 items-center gap-1.5">
        <span className="truncate text-body-sm-strong text-text-primary">{label}</span>
        <Tooltip title={tip} placement="top">
          <span
            tabIndex={0}
            role="img"
            aria-label={`About ${label}`}
            className="grid h-4 w-4 shrink-0 place-items-center rounded-full text-icon-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-subtle"
          >
            <InfoOutlined sx={{ fontSize: 15 }} />
          </span>
        </Tooltip>
      </div>
      <Switch size="sm" checked={checked} onChange={(e) => onChange(e.target.checked)} inputProps={{ 'aria-label': label }} />
    </div>
  );
}

const OUTCOME_OPTIONS: SelectOption[] = (['remove', 'suspend', 'keep'] as OutcomeAction[]).map((v) => ({
  value: v,
  label: OUTCOME_LABEL[v],
}));

export function ReviewConfigStep({ draft, patch }: { draft: Certification; patch: Patch }) {
  const [teamPickerOpen, setTeamPickerOpen] = React.useState(false);
  const teams = listGovernanceTeamRows();
  const chosenTeams = teams.filter((t) => draft.reviewers.governanceTeamIds.includes(t.id));

  const setReviewers = (next: Partial<Certification['reviewers']>) =>
    patch({ reviewers: { ...draft.reviewers, ...next } });
  const setOutcome = (next: Partial<Certification['outcome']>) =>
    patch({ outcome: { ...draft.outcome, ...next } });

  return (
    <>
      <StepHeading
        step={3}
        title="Who reviews, and what happens after"
        description="Pick at least one reviewer. Anything nobody keeps is dealt with by the rules below."
      />

      <div className="max-w-3xl space-y-3">
        <ReviewerOption
          checked={draft.reviewers.manager}
          onChange={(v) => setReviewers({ manager: v })}
          title="Each user's manager"
          description="The person who knows what the user does day to day, and is accountable for them."
        />

        <ReviewerOption
          checked={draft.reviewers.entitlementOwners}
          onChange={(v) => setReviewers({ entitlementOwners: v })}
          title="Entitlement owners"
          description="The person accountable for each permission, who knows what it actually grants."
        />

        <ReviewerOption
          checked={draft.reviewers.governanceTeams}
          onChange={(v) => setReviewers({ governanceTeams: v, governanceTeamIds: v ? draft.reviewers.governanceTeamIds : [] })}
          title="A governance team"
          description="Anyone in the chosen teams can review — use this when accountability sits with a body, not a person."
        >
          {chosenTeams.length > 0 ? (
            <div className="mb-3 flex flex-wrap gap-2">
              {chosenTeams.map((t) => (
                <span key={t.id} className="rounded-pill bg-subtle px-2.5 py-1 text-caption text-text-secondary">
                  {t.name}
                </span>
              ))}
            </div>
          ) : (
            <p className="mb-3 text-body-sm text-text-tertiary">No teams chosen yet — nobody would be asked.</p>
          )}
          <Button variant="secondary" size="sm" startIcon={<GroupsOutlined />} onClick={() => setTeamPickerOpen(true)}>
            {chosenTeams.length > 0 ? 'Change teams' : 'Choose teams'}
          </Button>
        </ReviewerOption>
      </div>

      <div className="mt-8 max-w-3xl">
        <h3 className="text-h5 text-text-primary">What happens to the access</h3>
        <p className="mt-1 text-body-sm text-text-secondary">
          Both default to removing it. A review that keeps access by default is a formality, not a
          control.
        </p>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Select
            label="When a reviewer rejects it"
            required
            options={OUTCOME_OPTIONS}
            value={draft.outcome.rejection}
            onChange={(v) => setOutcome({ rejection: v as OutcomeAction })}
          />
          <Select
            label="When nobody reviews it in time"
            required
            options={OUTCOME_OPTIONS}
            value={draft.outcome.noReview}
            onChange={(v) => setOutcome({ noReview: v as OutcomeAction })}
          />
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <ToggleRow
            label="Allow conditional decisions"
            tip="A reviewer can keep the access on condition — for example until a named date — instead of only keep or remove."
            checked={draft.outcome.conditionalCertification}
            onChange={(v) => setOutcome({ conditionalCertification: v })}
          />
          <ToggleRow
            label="Allow bulk decisions"
            tip="A reviewer can decide many rows at once. Faster, and the most common way a review turns into rubber-stamping."
            checked={draft.outcome.bulkAction}
            onChange={(v) => setOutcome({ bulkAction: v })}
          />
        </div>
      </div>

      <TableSelectDrawer
        open={teamPickerOpen}
        onClose={() => setTeamPickerOpen(false)}
        title="Choose governance teams"
        subtitle="Anyone in these teams can make the decision."
        icon={<GroupsOutlined sx={{ fontSize: 22, color: 'var(--ds-color-brand-primary)' }} />}
        nameHeader="Governance Team"
        entity="governance team"
        rows={teams.map((t) => ({ id: t.id, name: t.name, description: t.description }))}
        selectedIds={draft.reviewers.governanceTeamIds}
        showRisk={false}
        onApply={(ids) => setReviewers({ governanceTeamIds: ids })}
      />
    </>
  );
}

// ---- 4. Timeline -------------------------------------------------------

const DURATION_OPTIONS: SelectOption[] = [
  { value: '7', label: '7 days' },
  { value: '10', label: '10 days' },
  { value: '14', label: '14 days' },
  { value: '21', label: '21 days' },
  { value: '30', label: '30 days' },
];

export function TimelineStep({ draft, patch }: { draft: Certification; patch: Patch }) {
  const setTimeline = (next: Partial<Certification['timeline']>) =>
    patch({ timeline: { ...draft.timeline, ...next } });

  return (
    <>
      <StepHeading
        step={4}
        title="When it runs"
        description="Decide when reviewers are asked, and how long they get to answer."
      />

      <div className="max-w-3xl space-y-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <Select
            label="Launch"
            required
            helperText="Manual waits for you to press Launch."
            options={[
              { value: 'manual', label: 'When I launch it' },
              { value: 'scheduled', label: 'On a date' },
            ]}
            value={draft.timeline.launchType}
            onChange={(v) => setTimeline({ launchType: v as LaunchType })}
          />
          {draft.timeline.launchType === 'scheduled' && (
            <div>
              <div className="mb-2 text-body-sm-strong text-text-secondary">
                Launch date <span className="text-danger">*</span>
              </div>
              <DatePicker
                ariaLabel="Launch date"
                value={draft.timeline.launchOn?.slice(0, 10) ?? ''}
                onChange={(v) => setTimeline({ launchOn: v ? `${v}T09:00:00.000Z` : undefined })}
              />
            </div>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Select
            label="Repeat"
            required
            helperText="A recurring review re-asks the same question on this rhythm."
            options={(Object.keys(INTERVAL_LABEL) as RecurrenceInterval[]).map((v) => ({
              value: v,
              label: INTERVAL_LABEL[v],
            }))}
            value={draft.timeline.interval}
            onChange={(v) => setTimeline({ interval: v as RecurrenceInterval })}
          />
          <Select
            label="Reviewers get"
            required
            placeholder="Choose how long"
            helperText="After this, the “nobody reviewed it” rule takes over."
            options={DURATION_OPTIONS}
            value={draft.timeline.reviewDurationDays ? String(draft.timeline.reviewDurationDays) : ''}
            onChange={(v) => setTimeline({ reviewDurationDays: Number(v) })}
          />
        </div>

        {draft.timeline.interval !== 'one-time' && (
          <div className="max-w-sm">
            <div className="mb-2 text-body-sm-strong text-text-secondary">Stop repeating after</div>
            <DatePicker
              ariaLabel="Recurrence end date"
              value={draft.timeline.recurrenceEndOn?.slice(0, 10) ?? ''}
              onChange={(v) => setTimeline({ recurrenceEndOn: v ? `${v}T23:59:00.000Z` : undefined })}
            />
            <p className="mt-1.5 text-caption text-text-secondary">
              Leave empty to keep repeating until someone stops it.
            </p>
          </div>
        )}

        <div className="max-w-sm">
          <ToggleRow
            label="Let reviewers ask for more time"
            tip="A reviewer can extend their own deadline once. Useful for large reviews; it also makes the end date a soft one."
            checked={draft.timeline.allowReviewersToExtend}
            onChange={(v) => setTimeline({ allowReviewersToExtend: v })}
          />
        </div>
      </div>
    </>
  );
}

// ---- 5. Preview --------------------------------------------------------

function SummaryRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1 border-b border-border py-3 last:border-0">
      <span className="w-44 shrink-0 text-body-sm text-text-secondary">{label}</span>
      <span className="min-w-0 flex-1 text-body-sm text-text-primary">{children}</span>
    </div>
  );
}

export function PreviewStep({ draft, gaps, onGoToStep }: { draft: Certification; gaps: string[]; onGoToStep: (i: number) => void }) {
  const apps = listApps().filter((a) => draft.applicationIds.includes(a.id));
  const users = listUserIdentities().filter((u) => draft.userIds.includes(u.id));
  const teams = listGovernanceTeamRows().filter((t) => draft.reviewers.governanceTeamIds.includes(t.id));

  const reviewers = [
    draft.reviewers.manager && 'each user’s manager',
    draft.reviewers.entitlementOwners && 'entitlement owners',
    draft.reviewers.governanceTeams && (teams.length ? teams.map((t) => t.name).join(', ') : 'a governance team'),
  ].filter(Boolean) as string[];

  return (
    <>
      <StepHeading
        step={5}
        title="Check it before it goes out"
        description="This is what reviewers will be asked, and what happens to anything they do not keep."
      />

      <div className="max-w-3xl space-y-5">
        {gaps.length > 0 && (
          // Names what is missing and takes you there — a preview that only says
          // "incomplete" leaves the reader hunting through four steps.
          <Card padding="lg">
            <div className="text-body-strong text-text-primary">Not ready to launch</div>
            <p className="mt-1 text-body-sm text-text-secondary">
              Still needed: {gaps.join(', ')}.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button variant="secondary" size="sm" onClick={() => onGoToStep(0)}>
                Back to the start
              </Button>
            </div>
          </Card>
        )}

        <Card title="What is being reviewed" icon={<Assignment />} padding="none">
          <div>
            <SummaryRow label="Name">{draft.name || <span className="text-text-tertiary">Not named yet</span>}</SummaryRow>
            <SummaryRow label="Applications">
              {apps.length ? apps.map((a) => a.name).join(', ') : <span className="text-text-tertiary">None chosen</span>}
            </SummaryRow>
            <SummaryRow label="Users">
              {users.length ? `${users.length} user${users.length === 1 ? '' : 's'}` : <span className="text-text-tertiary">None chosen</span>}
            </SummaryRow>
          </div>
        </Card>

        <Card title="Who decides" icon={<Groups />} padding="none">
          <div>
            <SummaryRow label="Reviewers">
              {reviewers.length ? reviewers.join(' and ') : <span className="text-text-tertiary">Nobody chosen</span>}
            </SummaryRow>
            <SummaryRow label="If rejected">{OUTCOME_LABEL[draft.outcome.rejection]}</SummaryRow>
            <SummaryRow label="If not reviewed">{OUTCOME_LABEL[draft.outcome.noReview]}</SummaryRow>
            <SummaryRow label="Reviewer options">
              {[
                draft.outcome.conditionalCertification && 'conditional decisions',
                draft.outcome.bulkAction && 'bulk decisions',
              ].filter(Boolean).join(', ') || <span className="text-text-tertiary">Keep or remove only</span>}
            </SummaryRow>
          </div>
        </Card>

        <Card title="When" icon={<WatchLater />} padding="none">
          <div>
            <SummaryRow label="Launches">
              {draft.timeline.launchType === 'manual'
                ? 'When you launch it'
                : draft.timeline.launchOn
                  ? formatDate(draft.timeline.launchOn)
                  : <span className="text-text-tertiary">No date chosen</span>}
            </SummaryRow>
            <SummaryRow label="Repeats">{INTERVAL_LABEL[draft.timeline.interval]}</SummaryRow>
            <SummaryRow label="Reviewers get">
              {draft.timeline.reviewDurationDays
                ? `${draft.timeline.reviewDurationDays} days`
                : <span className="text-text-tertiary">Not chosen</span>}
            </SummaryRow>
            {draft.timeline.recurrenceEndOn && (
              <SummaryRow label="Stops repeating">{formatDate(draft.timeline.recurrenceEndOn)}</SummaryRow>
            )}
            <SummaryRow label="Status">
              {CERT_STATUS_META[draft.status].label}
            </SummaryRow>
          </div>
        </Card>
      </div>
    </>
  );
}
