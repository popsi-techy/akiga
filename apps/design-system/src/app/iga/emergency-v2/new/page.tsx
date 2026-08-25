'use client';

import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import ArrowBackOutlined from '@mui/icons-material/ArrowBack';
import ArrowForwardOutlined from '@mui/icons-material/ArrowForward';
import CheckCircleOutlined from '@mui/icons-material/CheckCircleOutlined';
import CloseOutlined from '@mui/icons-material/CloseOutlined';
import EditOutlined from '@mui/icons-material/EditOutlined';
import SaveOutlined from '@mui/icons-material/SaveOutlined';
import Shield from '@mui/icons-material/Shield';
import Groups from '@mui/icons-material/Groups';
import ManageAccounts from '@mui/icons-material/ManageAccounts';
import WatchLater from '@mui/icons-material/WatchLater';
import { Button, Card, InfoRow, InfoRowGroup, Input, Menu, OverflowChips, StatusChip, StepTracker, Tooltip, useToast } from '@ds/components';
import {
  activateEmergencyAccess,
  createEmergencyAccess,
  eaBlockingSteps,
  getAdvancedConfig,
  getEAAssignments,
  getEAGovernanceTeams,
  getEAOwners,
  getEmergencyAccess,
  updateEmergencyAccessBasics,
  EA_REQUIRED_STEPS,
  EA_WEEKDAYS,
  type EADetail,
} from '@/data/emergency-access';
import { SetupProgress } from '@/components/product/SetupProgress';
import { EligibilityCriteriaTab } from '@/components/product/emergency/EligibilityCriteriaTab';
import { AdvancedConfigurationTab } from '@/components/product/emergency/AdvancedConfigurationTab';
import { EmergencyAssignmentsPicker } from '@/components/product/emergency/EmergencyAssignmentsTab';
import { EmergencyOwnersPicker } from '@/components/product/emergency/EmergencyAccessDetail';
import { toastEASetupStep } from '@/components/product/emergency/ea-setup-toast';
import { infoIcon } from '@/components/product/directory/infoIcons';
import { AccessChip } from '@/components/product/sod/labels';
import { useSetBreadcrumbs } from '@/lib/breadcrumb';
import { listGovernanceTeamRows } from '@/data/directory';

type StepDef = {
  /** Short name, for the progress rail. */
  label: string;
  /**
   * The step's one heading, in five or six words.
   *
   * It replaced a stack of three — "Step 1 of 6", the short label, then a
   * description — which spent the top of every step restating what the rail beside
   * it already showed. Written as an instruction rather than a noun so it does the
   * description's job too: "Assignments" names a section, "Choose what a session
   * grants" tells the reader what is being asked of them.
   */
  heading: string;
  /** The same line, one rung quieter, under the label in the rail. */
  description: string;
  /**
   * The name `eaBlockingSteps` gives this step's requirement, for the steps that
   * gate activation. Having the wizard name the blocker rather than keep its own
   * list of required steps means the rail's asterisks, the preview's "still
   * needed" and the Activate button can never disagree about what is required —
   * they are three readings of one array in `data/emergency-access`.
   *
   * Use `blockers` when one screen collects more than one of those checks.
   */
  blocker?: string;
  blockers?: string[];
  /**
   * Is there anything here yet? Only for steps activation does not gate — the
   * gated ones answer this through `blocker`.
   */
  filled?: (ea: EADetail) => boolean;
  /**
   * What passing this step is called. Absent means no skip is offered.
   *
   * **Only ever set on a step with no `blocker`.** A step that gates activation
   * wears an asterisk; offering to skip it as well would have the rail and the
   * footer saying opposite things about the same step.
   *
   * Same word on every skippable step — "Skip" — so the footer does not
   * invent a second verb for the same move.
   */
  skipLabel?: string;
};

const STEPS: StepDef[] = [
  {
    label: 'Name and assignments',
    heading: 'Name this access and what it grants',
    description: 'What this access is called, and what a session grants',
    blockers: ['basic details', 'assignments'],
    // No skip: every editor after this one writes against a profile id, so there
    // is nothing to attach anything to until this step has been through once.
  },
  {
    label: 'Eligibility criteria',
    heading: 'Decide who can request it',
    description: 'Who is allowed to ask for it',
    blocker: 'eligibility criteria',
  },
  {
    label: 'Owners',
    heading: 'Choose who answers at review',
    description: 'Who answers for it at review',
    filled: (ea) => getEAOwners(ea.id).length + getEAGovernanceTeams(ea.id).length > 0,
    skipLabel: 'Skip',
  },
  {
    label: 'Limits and timing',
    heading: 'Set how long and how often',
    description: 'How long a session lasts, how often, and when',
    // Always satisfied: the defaults are real, working values rather than empty
    // fields, so this step can be passed but never left incomplete.
    filled: () => true,
    skipLabel: 'Skip',
  },
  {
    label: 'Preview',
    heading: 'Check it, then activate it',
    description: 'Check it, then activate it',
    // No `filled`: the finish line is not a task, so it never marks itself done.
  },
];

/** Where the preview sends the reader for each thing `eaBlockingSteps` can name. */
const stepBlockers = (s: StepDef) => s.blockers ?? (s.blocker ? [s.blocker] : []);
const stepForBlocker = (blocker: string) => STEPS.findIndex((s) => stepBlockers(s).includes(blocker));

/** First unfinished wizard step, or Preview once everything before it is in place. */
function resumeStepIndex(ea: EADetail): number {
  for (let i = 0; i < STEPS.length - 1; i++) {
    const s = STEPS[i];
    const done = stepBlockers(s).length
      ? stepBlockers(s).every((b) => !eaBlockingSteps(ea).includes(b))
      : Boolean(s.filled?.(ea));
    if (!done) return i;
  }
  return STEPS.length - 1;
}

/**
 * Emergency Access V2 — create in a stepper.
 *
 * The same pieces V1 leaves on a checklist, asked in order and finished
 * with a preview. Basic details and assignments share the first screen so
 * naming the access and saying what it grants are one decision, not two
 * stops. The trade the two versions are exploring: V1 lets you build in
 * any order and live with a half-finished draft on the list; V2 walks you
 * through and ends with something switched on.
 *
 * The profile is created as soon as it has a name, because the assignment
 * pickers on the same screen are keyed by profile id and write as you go.
 *
 * ## Skipping
 *
 * **Only steps that gate nothing offer a skip.** Owners and limits do; the first
 * screen (basics + assignments) and eligibility criteria do not, because they
 * carry blockers and the profile cannot be switched on without them. Offering to
 * skip a step and then refusing to activate without it is the app arguing with
 * itself — the asterisk on the rail already says the step is required, and a
 * "Skip" beside it said the opposite.
 *
 * A gated step cannot be passed at all. "Save and continue" is disabled until the
 * step's own `blocker` clears, with the reason on its tooltip, and `goTo` refuses
 * forward movement independently so the rail cannot route around the button.
 * *Backward* movement is never blocked: the reader can always return to anything
 * they have already reached, including from a step they cannot yet leave.
 *
 * One consequence worth knowing: a required step can no longer end up `skipped`.
 * That state is derived from being behind `reached` while empty, and nothing can
 * now get behind `reached` while empty and gated — so the rail's "Skipped — still
 * required" marker is reachable only for the optional steps, which is the only
 * place it was ever true.
 *
 * Nothing records the skip. A step is skipped when the reader has been past it
 * and it is still empty, which is derived from the data and the furthest step
 * reached — so filling a skipped step in later clears the mark by itself, and a
 * step left empty by pressing "Save and continue" is treated exactly like one
 * left empty by pressing "Skip". The button is there to say that passing is
 * allowed; it is not the thing that makes it true.
 */
function WizardLoading() {
  return <div className="py-16 text-center text-body-sm text-text-secondary">Loading…</div>;
}

function EmergencyAccessV2WizardInner() {
  const router = useRouter();
  const toast = useToast();
  const resumeId = useSearchParams().get('id');
  const existing = resumeId ? getEmergencyAccess(resumeId) : null;
  const resumable = existing?.isDraft ? existing : null;

  useSetBreadcrumbs([
    { label: 'Emergency Access V2', href: '/iga/emergency-v2' },
    { label: resumable ? 'Continue setup' : 'New emergency access' },
  ]);

  const initialStep = resumable ? resumeStepIndex(resumable) : 0;
  const [step, setStep] = React.useState(initialStep);
  // The furthest step reached, which is what makes a step "skipped" rather than
  // "not yet visited". Jumping back to fix something must not un-skip the steps
  // beyond it, so this only ever climbs.
  const [reached, setReached] = React.useState(initialStep);
  const [id, setId] = React.useState<string | null>(() => {
    if (resumable?.id) return resumable.id;
    if (resumeId) return null;
    return createEmergencyAccess({ name: '', description: '' });
  });
  const [name, setName] = React.useState(resumable?.name ?? '');
  const [description, setDescription] = React.useState(resumable?.description ?? '');
  // Bumped by each editor so the preview and the tracker re-read session memory.
  const [, bump] = React.useReducer((n: number) => n + 1, 0);
  const hydratedId = React.useRef<string | null>(resumable?.id ?? null);

  React.useEffect(() => {
    if (!resumeId) return;
    const found = getEmergencyAccess(resumeId);
    if (found && !found.isDraft) {
      router.replace(`/iga/emergency-v2/${found.id}`);
      return;
    }
    if (!found) {
      toast.error('Emergency access not found.');
      router.replace('/iga/emergency-v2');
      return;
    }
    if (hydratedId.current === found.id) return;
    hydratedId.current = found.id;
    setId(found.id);
    setName(found.name);
    setDescription(found.description);
    const next = resumeStepIndex(found);
    setStep(next);
    setReached(next);
  }, [resumeId, router, toast]);

  if (resumeId && existing && !existing.isDraft) return <WizardLoading />;
  if (resumeId && !existing) return <WizardLoading />;

  const ea = id ? getEmergencyAccess(id) : null;
  const blocking = ea ? eaBlockingSteps(ea) : ['basic details'];

  /**
   * The rail's state per step, read off the data rather than off a list of what
   * the reader clicked. A step behind the reader with nothing in it is skipped,
   * however they got past it.
   */
  const railSteps = STEPS.map((s, i) => ({
    label: s.label,
    description: s.description,
    required: stepBlockers(s).length > 0,
    status: ((): 'done' | 'skipped' | undefined => {
      // Nothing can be done before the profile exists. `blocking` only names the
      // basics until then, so asking it about assignments would answer "not
      // blocked" — true, and the opposite of "finished".
      if (!ea) return undefined;
      // A gated step reports real data, so it counts wherever the reader is. An
      // ungated one only reports once they could have seen it: "Limits" arrives
      // already satisfied by its defaults, and marking it done on arrival at step
      // 1 would take credit, in green, for a decision nobody has made yet.
      const gates = stepBlockers(s);
      const done = gates.length
        ? gates.every((b) => !blocking.includes(b))
        : i <= reached && Boolean(s.filled?.(ea));
      if (done) return 'done';
      return i < reached ? 'skipped' : undefined;
    })(),
  }));

  /**
   * Creates on first pass, renames on later ones — step 1 is re-editable.
   *
   * Both fields, because both are what `EA_REQUIRED_CHECKS` calls "basic details".
   * Letting the reader past on a name alone would hand them a rail that says they
   * skipped the step they just filled in, and the only way out would be a step
   * that cannot be skipped — so this is the one place the flow insists.
   */
  const commitBasics = (): string | null => {
    if (name.trim() === '') {
      toast.error('Give this emergency access a name first.');
      return null;
    }
    if (description.trim() === '') {
      toast.error('Add a description — it is what an approver reads at 3am.');
      return null;
    }
    if (id) {
      updateEmergencyAccessBasics(id, { name, description });
      return id;
    }
    const created = createEmergencyAccess({ name, description });
    setId(created);
    toastEASetupStep(toast, created, 'basic', false);
    return created;
  };

  /**
   * The current step's own requirement, if it has one and it is not met yet.
   *
   * This is the same `blocking` array the rail's asterisks and the Activate button
   * read, so a step cannot be considered passable here while being called required
   * three inches to the right.
   */
  const currentGates = stepBlockers(STEPS[step]);
  const unmet = (() => {
    if (currentGates.length === 0) return null;
    // Name and description can be marked on the fields themselves. Assignments
    // cannot, so once basics are in, the tooltip names that remaining gate.
    if (step === 0) {
      if (!name.trim() || !description.trim()) return 'basic details';
      if (!ea || blocking.includes('assignments')) return 'assignments';
      return null;
    }
    return currentGates.find((g) => blocking.includes(g)) ?? null;
  })();

  /**
   * Forward movement out of a gated step is refused until the gate is met.
   *
   * Going *back* is always allowed, and so is jumping to any step already reached
   * — the reader needs to re-read what they wrote without being held hostage by
   * the step they are standing on.
   */
  const goTo = (next: number) => {
    if (step === 0 && next > 0 && !commitBasics()) return;
    // `next > step` only: this must not block Back, and must not block the rail
    // sending the reader to a step behind them.
    if (next > step && unmet) return;
    setStep(next);
    setReached((r) => Math.max(r, next));
  };

  const activate = () => {
    if (!ea || blocking.length > 0) return;
    activateEmergencyAccess(ea.id);
    toast.success(`“${ea.name}” is active. Eligible people can now request it.`);
    // Straight onto the live profile — the tabbed screen it will be managed on.
    router.push(`/iga/emergency-v2/${ea.id}`);
  };

  const persistBasics = (nextName: string, nextDescription: string) => {
    if (id) updateEmergencyAccessBasics(id, { name: nextName, description: nextDescription });
  };

  const stepBody = () => {
    if (step === 0) {
      return (
        // Full column width, like the footer beneath it. A reading-width cap here
        // held the fields short of the buttons that belong to them, so the step
        // looked like it had a right margin the rest of the frame did not.
        <div className="space-y-6">
          <div className="space-y-4">
          <Input
            label="Name"
            required
            hint="Shown wherever this access is requested or reviewed. Name it after the system it unlocks."
            placeholder="e.g. Bitbucket production"
            size="sm"
            value={name}
            onChange={(e) => {
              const next = e.target.value;
              setName(next);
              persistBasics(next, description);
            }}
          />
          <Input
            label="Description"
            // Required because activation already demands it. The field used to be
            // presented as optional while the gate refused to open without it,
            // which made "basic details" show as unfinished with no clue why.
            required
            hint="Read by whoever approves the request at 3am. Say what it is for, and when it should be used."
            placeholder="What this access is for, and when it should be used"
            size="sm"
            multiline
            minRows={3}
            value={description}
            onChange={(e) => {
              setDescription(e.target.value);
              persistBasics(name, e.target.value);
            }}
          />
          </div>
          <div>
            <h3 className="mb-4 text-h5 text-text-primary">Assignments</h3>
            {id && <EmergencyAssignmentsPicker eaId={id} onChanged={bump} />}
          </div>
        </div>
      );
    }
    if (!ea) return null;
    // The editors are the same components the tabs use, so what you configure
    // here and what you maintain later can never drift apart.
    if (step === 1) return <EligibilityCriteriaTab eaId={ea.id} onChanged={bump} />;
    if (step === 2) return <EmergencyOwnersPicker ea={ea} onChanged={bump} />;
    if (step === 3) return <AdvancedConfigurationTab eaId={ea.id} onChanged={bump} hideChrome />;
    return <Preview ea={ea} blocking={blocking} onGoToStep={goTo} />;
  };

  const last = step === STEPS.length - 1;

  return (
    /* The page is the viewport: it never scrolls, and only the step's own body
       does. A wizard whose footer scrolls off is a wizard where "what do I press
       to continue" becomes a scrolling exercise — and the progress rail beside it
       is reference, so it should never move at all. Same frame the builders use. */
    <div className="flex h-full flex-col">
      <div className="grid min-h-0 flex-1 gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="flex min-h-0 min-w-0 flex-col">
          <div className="shrink-0">
            {last && ea ? (
              /* The preview is a review, not another identity header. Name and
                 description already sit on the first card below; this row names
                 the step, carries the draft/active pill, and keeps Activate
                 where finishing is. Per-step Edit lives on each card — a header
                 Edit only ever opened step 1, which hid the rest. */
              <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
                <div className="flex min-w-0 items-center gap-3">
                  <h2 className="text-h4 text-text-primary">{STEPS[step].label}</h2>
                  <StatusChip intent={ea.status.intent} label={ea.status.label} />
                </div>
                <div className="flex shrink-0 flex-wrap items-center gap-2">
                  <Tooltip
                    describeChild
                    title={
                      blocking.length > 0
                        ? `Add ${blocking.join(' and ')} before this can be activated.`
                        : 'Let eligible people request this access'
                    }
                  >
                    <Button startIcon={<CheckCircleOutlined />} disabled={blocking.length > 0} onClick={activate}>
                      Activate
                    </Button>
                  </Tooltip>
                  <Menu
                    ariaLabel="More actions"
                    items={[
                      {
                        label: 'Cancel',
                        icon: <CloseOutlined sx={{ fontSize: 18 }} />,
                        onClick: () => router.push('/iga/emergency-v2'),
                      },
                    ]}
                  />
                </div>
              </div>
            ) : (
              <div className="mb-5">
                <h2 className="text-h4 text-text-primary">{STEPS[step].heading}</h2>
              </div>
            )}
          </div>

          {/* The only scrolling region on the page. The rail-and-table editors
              size themselves to it, so they get the full remaining height rather
              than an arbitrary minimum. */}
          <div className="ds-scroll min-h-0 flex-1 overflow-y-auto pr-0.5">{stepBody()}</div>

          {!last && (
          <div className="mt-6 flex shrink-0 flex-wrap items-center gap-3 pt-5">
            {/* Cancel holds the left corner on every step — the same escape in the
                same place for the whole flow. It does not delete anything: once
                a draft exists, it survives leaving. Saving is "Save and continue",
                which writes this step and moves on. */}
            <Button variant="tertiary" onClick={() => router.push('/iga/emergency-v2')}>
              Cancel
            </Button>

            <div className="ml-auto flex items-center gap-2">
              {/* The rail carries this on wide screens; below `lg` the rail is
                  hidden and the count is the only thing left saying how much of
                  the gate is met. */}
              {id && (
                <div className="mr-1 lg:hidden">
                  <SetupProgress
                    done={EA_REQUIRED_STEPS - blocking.length}
                    total={EA_REQUIRED_STEPS}
                    pendingDetails={blocking}
                  />
                </div>
              )}
              {step > 0 && (
                <Button variant="secondary" startIcon={<ArrowBackOutlined />} onClick={() => setStep(step - 1)}>
                  Back
                </Button>
              )}
              {/* Directly left of the forward action, as a peer of Back rather than
                  a text link in the heading: passing a step and saving it are the
                  same kind of move — both leave this step for the next one — so they
                  belong in the same group, and `secondary` says it is a real choice
                  rather than an aside. Only ungated steps ever render it. */}
              {STEPS[step].skipLabel && (
                <Button
                  variant="secondary"
                  className="whitespace-nowrap"
                  onClick={() => goTo(step + 1)}
                >
                  {STEPS[step].skipLabel}
                </Button>
              )}
              {/* Disabled rather than silently refusing the click: a button that
                  looks live and does nothing reads as a broken app, where a
                  disabled one with a reason attached reads as a rule. */}
              <Tooltip
                describeChild
                title={unmet ? `Add ${unmet} before moving on.` : 'Save this step and move on'}
              >
                <Button
                  endIcon={<ArrowForwardOutlined />}
                  disabled={Boolean(unmet)}
                  onClick={() => goTo(step + 1)}
                >
                  Save and continue
                </Button>
              </Tooltip>
            </div>
          </div>
          )}
        </div>

        {/* No minimum height: it takes the row's height and spreads the steps
            down it. The minimum it used to carry was what pushed it past the
            page and gave the card its own scrollbar. */}
        <aside className="hidden min-h-0 lg:block">
          <div className="ds-scroll h-full overflow-y-auto rounded-xl border border-border bg-subtle p-5">
            <StepTracker title="Your progress" steps={railSteps} current={step} onStepClick={goTo} />

            {/* No tally under the rail. The asterisks in the list already mark
                which steps are required, and the Preview step names whatever is
                still missing before it will let this be switched on. */}
          </div>
        </aside>
      </div>
    </div>
  );
}

/**
 * `useSearchParams` — read above for the `?id=` that continues an existing draft
 * — has no value during a static prerender, so Next refuses to prerender the
 * route unless the component reading it sits under a Suspense boundary. Without
 * this the production build fails on this page while `next dev` is perfectly
 * happy, because dev renders every route on demand.
 */
export default function EmergencyAccessV2Wizard() {
  return (
    <React.Suspense fallback={<WizardLoading />}>
      <EmergencyAccessV2WizardInner />
    </React.Suspense>
  );
}

function stepTitle(index: number): React.ReactNode {
  const step = STEPS[index];
  const required = stepBlockers(step).length > 0;
  return (
    <>
      {step.label}
      {required && (
        <>
          <span aria-hidden className="text-danger">
            {' *'}
          </span>
          <span className="sr-only">Required</span>
        </>
      )}
    </>
  );
}

function stepEdit(
  index: number,
  onEdit: (i: number) => void,
  skipped?: boolean,
): React.ReactNode {
  const step = STEPS[index];
  return (
    <div className="flex items-center gap-1">
      {skipped && <StatusChip intent="warning" label="Skipped" dot={false} />}
      <Tooltip title={`Edit ${step.label}`}>
        <Button
          variant="tertiary"
          size="sm"
          aria-label={`Edit ${step.label}`}
          onClick={() => onEdit(index)}
          sx={{ minWidth: 36, px: 0 }}
        >
          <EditOutlined sx={{ fontSize: 18 }} />
        </Button>
      </Tooltip>
    </div>
  );
}

const none = <span className="text-text-tertiary">Not set</span>;

function Preview({
  ea,
  blocking,
  onGoToStep,
}: {
  ea: NonNullable<ReturnType<typeof getEmergencyAccess>>;
  blocking: string[];
  onGoToStep: (i: number) => void;
}) {
  const assignments = getEAAssignments(ea.id);
  const owners = getEAOwners(ea.id);
  const teamIds = getEAGovernanceTeams(ea.id);
  const teams = listGovernanceTeamRows().filter((t) => teamIds.includes(t.id));
  const cfg = getAdvancedConfig(ea.id);
  const days = EA_WEEKDAYS.filter((d) => cfg.days.includes(d.id)).map((d) => d.short);
  const windowLabel =
    cfg.windowStart === cfg.windowEnd
      ? 'All day'
      : `${cfg.windowStart} – ${cfg.windowEnd}`;

  const ownersEmpty = owners.length + teams.length === 0;

  /**
   * What is missing, in the order the reader walked past it.
   *
   * `eaBlockingSteps` returns them in the gate's own order, which has no reason
   * to match the wizard's — and a list that disagrees with the rail beside it
   * makes the reader check whether they are looking at the same five things.
   *
   * A check with no step of its own still gets named, just without a button. It
   * would mean someone added a requirement the wizard cannot collect, and a
   * silently dropped line would leave Activate dead with nothing explaining why.
   */
  const missing = blocking
    .map((label) => ({ label, step: stepForBlocker(label) }))
    .sort((a, b) => (a.step < 0 ? 1 : b.step < 0 ? -1 : a.step - b.step));

  const bodies: React.ReactNode[] = [
    <>
      <InfoRow icon={infoIcon.item} label="Name" value={ea.name.trim() || none} />
      <InfoRow
        icon={infoIcon.type}
        label="Description"
        value={ea.description.trim() || none}
        valueWrap
      />
      <InfoRow
        icon={infoIcon.entitlement}
        label="Entitlements"
        valueWrap
        value={
          assignments.entitlements.length ? (
            <OverflowChips
              items={assignments.entitlements}
              max={2}
              renderItem={(e) =>
                e.appName ? <AccessChip appName={e.appName} name={e.name} /> : e.name
              }
            />
          ) : (
            none
          )
        }
      />
      <InfoRow
        icon={infoIcon.technicalRole}
        label="Technical roles"
        valueWrap
        value={
          assignments.technicalRoles.length ? (
            <OverflowChips items={assignments.technicalRoles} max={2} />
          ) : (
            none
          )
        }
      />
    </>,
    <InfoRow
      icon={infoIcon.group}
      label="Who may request it"
      value={
        ea.eligibilityGroups.length ? ea.eligibilityGroups.map((g) => g.name).join(', ') : none
      }
      valueWrap
    />,
    <>
      <InfoRow
        icon={infoIcon.owner}
        label="Owners"
        value={owners.length ? owners.map((o) => o.name).join(', ') : none}
        valueWrap
      />
      <InfoRow
        icon={infoIcon.people}
        label="Governance teams"
        value={teams.length ? teams.map((t) => t.name).join(', ') : none}
        valueWrap
      />
    </>,
    <>
      <InfoRow icon={infoIcon.duration} label="Session length" value={`Up to ${cfg.maxDurationHrs} hrs`} />
      <InfoRow icon={infoIcon.people} label="At the same time" value={`${cfg.maxConcurrent} people`} />
      <InfoRow icon={infoIcon.location} label="Timezone" value={cfg.timezone.replaceAll('_', ' ')} valueWrap />
      <InfoRow
        icon={infoIcon.created}
        label="Requestable on"
        value={days.length === 7 ? 'Every day' : days.join(', ') || none}
        valueWrap
      />
      <InfoRow icon={infoIcon.started} label="Request window" value={windowLabel} />
    </>,
  ];

  return (
    <div className="space-y-4">
      {blocking.length > 0 && (
        <Card padding="lg">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-subtle text-icon-subtle">
              <SaveOutlined sx={{ fontSize: 20 }} />
            </span>
            <div className="min-w-0">
              <div className="text-body-strong text-text-primary">Saved as a draft, not switched on</div>
              <p className="mt-1 text-body-sm text-text-secondary">
                {blocking.length === 1
                  ? 'One thing is still needed before eligible people can request this:'
                  : `${blocking.length} things are still needed before eligible people can request this:`}
              </p>
              <ul className="mt-2 space-y-1">
                {missing.map(({ label }) => (
                  <li key={label} className="flex items-baseline gap-2 text-body-sm text-text-primary">
                    <span aria-hidden className="text-danger">
                      *
                    </span>
                    <span className="first-letter:uppercase">{label}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-3 flex flex-wrap gap-2">
                {missing
                  .filter(({ step }) => step >= 0)
                  .map(({ label, step }) => (
                    <Button key={label} variant="secondary" size="sm" onClick={() => onGoToStep(step)}>
                      Add {label}
                    </Button>
                  ))}
              </div>
              <p className="mt-3 text-caption text-text-tertiary">
                You can also close this and finish it from the list later — nothing is lost.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* One Card per wizard step — same names as the rail, Edit returns there.
          Icons sit on `Card` itself so check:icons can see they are filled. */}
      <Card
        icon={<Shield />}
        title={stepTitle(0)}
        action={stepEdit(0, onGoToStep)}
        padding="none"
      >
        <InfoRowGroup>{bodies[0]}</InfoRowGroup>
      </Card>
      <Card
        icon={<Groups />}
        title={stepTitle(1)}
        action={stepEdit(1, onGoToStep)}
        padding="none"
      >
        <InfoRowGroup>{bodies[1]}</InfoRowGroup>
      </Card>
      <Card
        icon={<ManageAccounts />}
        title={stepTitle(2)}
        action={stepEdit(2, onGoToStep, ownersEmpty)}
        padding="none"
      >
        <InfoRowGroup>{bodies[2]}</InfoRowGroup>
      </Card>
      <Card
        icon={<WatchLater />}
        title={stepTitle(3)}
        action={stepEdit(3, onGoToStep)}
        padding="none"
      >
        <InfoRowGroup>{bodies[3]}</InfoRowGroup>
      </Card>
    </div>
  );
}
