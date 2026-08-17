'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import ArrowBackOutlined from '@mui/icons-material/ArrowBack';
import ArrowForwardOutlined from '@mui/icons-material/ArrowForward';
import CheckCircleOutlined from '@mui/icons-material/CheckCircleOutlined';
import Assignment from '@mui/icons-material/Assignment';
import Groups from '@mui/icons-material/Groups';
import Notes from '@mui/icons-material/Notes';
import SaveOutlined from '@mui/icons-material/SaveOutlined';
import Settings from '@mui/icons-material/Settings';
import TuneOutlined from '@mui/icons-material/TuneOutlined';
import { Button, Card, Input, StepTracker, Tooltip, useToast } from '@ds/components';
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
import { EmergencyOwnersTab } from '@/components/product/emergency/EmergencyAccessDetail';
import { useSetBreadcrumbs } from '@/lib/breadcrumb';

type StepDef = {
  label: string;
  description: string;
  /**
   * The name `eaBlockingSteps` gives this step's requirement, for the steps that
   * gate activation. Having the wizard name the blocker rather than keep its own
   * list of required steps means the rail's asterisks, the preview's "still
   * needed" and the Activate button can never disagree about what is required —
   * they are three readings of one array in `data/emergency-access`.
   */
  blocker?: string;
  /**
   * Is there anything here yet? Only for steps activation does not gate — the
   * gated ones answer this through `blocker`.
   */
  filled?: (ea: EADetail) => boolean;
  /**
   * What passing this step is called. Absent means it cannot be passed.
   *
   * Worth being specific per step: on a step that arrives with working defaults,
   * "Skip" would be a lie — nothing is being left undone.
   */
  skipLabel?: string;
};

const STEPS: StepDef[] = [
  {
    label: 'Basic details',
    description: 'What this access is called, and what it is for',
    blocker: 'basic details',
    // No skip: every editor after this one writes against a profile id, so there
    // is nothing to attach anything to until this step has been through once.
  },
  {
    label: 'Assignments',
    description: 'What a requester is handed for the length of a session',
    blocker: 'assignments',
    skipLabel: 'Skip step',
  },
  {
    label: 'Eligibility criteria',
    description: 'Who is allowed to ask for it',
    blocker: 'eligibility criteria',
    skipLabel: 'Skip step',
  },
  {
    label: 'Owners',
    description: 'Who answers for it at review',
    filled: (ea) => getEAOwners(ea.id).length + getEAGovernanceTeams(ea.id).length > 0,
    skipLabel: 'Skip step',
  },
  {
    label: 'Limits and timing',
    description: 'How long a session lasts, how often, and when',
    // Always satisfied: the defaults are real, working values rather than empty
    // fields, so this step can be passed but never left incomplete.
    filled: () => true,
    skipLabel: 'Keep defaults',
  },
  {
    label: 'Preview',
    description: 'Check it, then switch it on',
    // No `filled`: the finish line is not a task, so it never marks itself done.
  },
];

/** Where the preview sends the reader for each thing `eaBlockingSteps` can name. */
const stepForBlocker = (blocker: string) => STEPS.findIndex((s) => s.blocker === blocker);

/**
 * Emergency Access V2 — create in a stepper.
 *
 * The same five pieces V1 leaves on a checklist, asked in order and finished
 * with a preview. The trade the two versions are exploring: V1 lets you build in
 * any order and live with a half-finished draft on the list; V2 walks you
 * through and ends with something switched on.
 *
 * The profile is created for real at the end of step 1, because every editor
 * after it (assignments, eligibility, owners, limits) is keyed by profile id and
 * writes as you go. That also means leaving halfway leaves a draft behind rather
 * than nothing — the same outcome V1 produces, reached a different way.
 *
 * ## Skipping
 *
 * Any step but the first can be passed, one at a time or all at once, because the
 * common reason for stopping is not knowing something yet — which entitlements to
 * grant, who should own it — and a wizard that will not let you past that point
 * turns "come back to it" into "start again".
 *
 * Skipping a *required* step is allowed. It is a deferral, not a waiver: what it
 * costs is that the flow ends at a draft instead of something switched on, and
 * that price is quoted in three places before it is paid — an asterisk on the
 * rail against every step that gates activation, a `skipped` marker naming the
 * ones passed over, and a count beside the finish that never claims more than the
 * gate allows.
 *
 * "Skip all" leaves the stepper for the profile's tabbed screen rather than
 * running to the preview: a reader skipping everything is asking not to be walked
 * through this, and the tabbed screen is the surface for that — see
 * {@link skipToProfile}.
 *
 * Nothing records the skip. A step is skipped when the reader has been past it
 * and it is still empty, which is derived from the data and the furthest step
 * reached — so filling a skipped step in later clears the mark by itself, and a
 * step left empty by pressing "Save and continue" is treated exactly like one
 * left empty by pressing "Skip". The button is there to say that passing is
 * allowed; it is not the thing that makes it true.
 */
export default function EmergencyAccessV2Wizard() {
  const router = useRouter();
  const toast = useToast();

  useSetBreadcrumbs([
    { label: 'Emergency Access V2', href: '/iga/emergency-v2' },
    { label: 'New emergency access' },
  ]);

  const [step, setStep] = React.useState(0);
  // The furthest step reached, which is what makes a step "skipped" rather than
  // "not yet visited". Jumping back to fix something must not un-skip the steps
  // beyond it, so this only ever climbs.
  const [reached, setReached] = React.useState(0);
  const [id, setId] = React.useState<string | null>(null);
  const [name, setName] = React.useState('');
  const [description, setDescription] = React.useState('');
  // Bumped by each editor so the preview and the tracker re-read session memory.
  const [, bump] = React.useReducer((n: number) => n + 1, 0);

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
    required: Boolean(s.blocker),
    status: ((): 'done' | 'skipped' | undefined => {
      // Nothing can be done before the profile exists. `blocking` only names the
      // basics until then, so asking it about assignments would answer "not
      // blocked" — true, and the opposite of "finished".
      if (!ea) return undefined;
      // A gated step reports real data, so it counts wherever the reader is. An
      // ungated one only reports once they could have seen it: "Limits" arrives
      // already satisfied by its defaults, and marking it done on arrival at step
      // 2 would take credit, in green, for a decision nobody has made yet.
      const done = s.blocker
        ? !blocking.includes(s.blocker)
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
    return created;
  };

  const goTo = (next: number) => {
    if (step === 0 && next > 0 && !commitBasics()) return;
    setStep(next);
    setReached((r) => Math.max(r, next));
  };

  /**
   * Out of the stepper and onto the profile's own tabbed screen.
   *
   * Not to the preview, which is where this used to land. Skipping every
   * remaining step is the reader saying they do not want to be walked through
   * this — which is V1's model, and the tabbed profile is the surface built for
   * it: the same five pieces of setup, reachable in any order, with a checklist
   * that names what is still outstanding and the Activate button beside it.
   *
   * That checklist is also strictly better than the preview's "still needed"
   * card — it lists the optional steps too, and marks the one that arrives
   * satisfied as "Default applied" — so sending them to the preview first meant
   * showing a worse version of the same answer on the way to the real one.
   *
   * The preview keeps the job it is actually for: the last look before
   * activating, for a reader who filled the steps in.
   */
  const skipToProfile = () => {
    // `id` is always set here: the control is only offered on steps that carry a
    // `skipLabel`, and step 1 — the step that creates the profile — has none.
    if (!id) return;
    toast.success('Saved as a draft. Finish the rest from these tabs whenever you like.');
    router.push(`/iga/emergency-v2/${id}`);
  };

  const activate = () => {
    if (!ea || blocking.length > 0) return;
    activateEmergencyAccess(ea.id);
    toast.success(`“${ea.name}” is active. Eligible people can now request it.`);
    // Straight onto the live profile — the tabbed screen it will be managed on.
    router.push(`/iga/emergency-v2/${ea.id}`);
  };

  const stepBody = () => {
    if (step === 0) {
      return (
        <div className="max-w-2xl space-y-4">
          <Input
            label="Name"
            required
            hint="Shown wherever this access is requested or reviewed. Name it after the system it unlocks."
            placeholder="e.g. Bitbucket production"
            size="sm"
            value={name}
            onChange={(e) => setName(e.target.value)}
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
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
      );
    }
    if (!ea) return null;
    // The editors are the same components the tabs use, so what you configure
    // here and what you maintain later can never drift apart.
    //
    // Assignments is the exception, and only in shape: the tab's rail-and-table
    // needs a page's width, so the step asks with the picker slots the
    // access-certification wizard uses. Same store, same drawers.
    if (step === 1) return <EmergencyAssignmentsPicker eaId={ea.id} onChanged={bump} />;
    if (step === 2) return <EligibilityCriteriaTab eaId={ea.id} onChanged={bump} />;
    if (step === 3) return <EmergencyOwnersTab ea={ea} onChanged={bump} />;
    if (step === 4) return <AdvancedConfigurationTab eaId={ea.id} onChanged={bump} />;
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
            <h1 className="mb-5 text-h2 text-text-primary">New emergency access</h1>

            <div className="mb-5">
              <p className="text-body-sm-strong text-brand">
                Step {step + 1} of {STEPS.length}
              </p>
              <h2 className="mt-1 text-h4 text-text-primary">{STEPS[step].label}</h2>
              <p className="mt-1 text-body-sm text-text-secondary">{STEPS[step].description}</p>
            </div>
          </div>

          {/* The only scrolling region on the page. The rail-and-table editors
              size themselves to it, so they get the full remaining height rather
              than an arbitrary minimum. */}
          <div className="ds-scroll min-h-0 flex-1 overflow-y-auto pr-0.5">{stepBody()}</div>

          <div className="mt-6 flex shrink-0 flex-wrap items-center gap-3 border-t border-border pt-5">
            {/* One leave-without-finishing button, not two. Before step 1 commits
                there is nothing saved, so leaving is a cancel; after it, the draft
                exists whatever the button says — and offering both "Cancel" and
                "Save and close" for the same outcome invites the reader to think
                one of them throws the draft away. */}
            {id ? (
              <Button
                variant="secondary"
                onClick={() => {
                  toast.success('Saved as a draft. You can pick it up from the list.');
                  router.push('/iga/emergency-v2');
                }}
              >
                Save and close
              </Button>
            ) : (
              <Button variant="secondary" onClick={() => router.push('/iga/emergency-v2')}>
                Cancel
              </Button>
            )}

            <div className="ml-auto flex items-center gap-2">
              {/* The rail carries this on wide screens; below `lg` the rail is
                  hidden and the count is the only thing left saying how much of
                  the gate is met. On the last step it lands beside Activate,
                  which is where "why is this dead" gets asked. */}
              {id && (
                <div className="mr-1 lg:hidden">
                  <SetupProgress done={EA_REQUIRED_STEPS - blocking.length} total={EA_REQUIRED_STEPS} />
                </div>
              )}
              {/* Skipping is a family of its own — passing this step, or passing
                  all of them — so it sits apart from the back/forward pair rather
                  than becoming a fourth button in it. */}
              {!last && STEPS[step].skipLabel && (
                <>
                  <Button variant="tertiary" className="whitespace-nowrap" onClick={() => goTo(step + 1)}>
                    {STEPS[step].skipLabel}
                  </Button>
                  {/* Only worth offering while more than one step remains: with a
                      single step left, "the rest" and "this step" are the same
                      action under two names. */}
                  {/* Two words each, matching "Skip step", because the pair is
                      read as a pair: the difference between them is the object,
                      and matched lengths put that word where the eye lands. It
                      also keeps all five controls on one row at 1024, the width
                      where the rail first appears and the column is tightest.

                      Offered on every skippable step, including the last one.
                      While this jumped to the preview it had to be hidden there —
                      "the rest" and "this step" collapsed into the same action —
                      but leaving for the profile is its own destination, and it is
                      no less useful on the final step than the first. */}
                  <Button variant="tertiary" className="whitespace-nowrap" onClick={skipToProfile}>
                    Skip all
                  </Button>
                  <span aria-hidden className="mx-1 h-5 w-px bg-border" />
                </>
              )}
              {step > 0 && (
                <Button variant="secondary" startIcon={<ArrowBackOutlined />} onClick={() => setStep(step - 1)}>
                  Back
                </Button>
              )}
              {last ? (
                <Tooltip
                  title={
                    blocking.length > 0
                      ? `Add ${blocking.join(' and ')} before this can be activated.`
                      : 'Let eligible people request this access'
                  }
                >
                  <span>
                    <Button startIcon={<CheckCircleOutlined />} disabled={blocking.length > 0} onClick={activate}>
                      Activate
                    </Button>
                  </span>
                </Tooltip>
              ) : (
                <Button endIcon={<ArrowForwardOutlined />} onClick={() => goTo(step + 1)}>
                  Save and continue
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* No minimum height: it takes the row's height and spreads the steps
            down it. The minimum it used to carry was what pushed it past the
            page and gave the card its own scrollbar. */}
        <aside className="hidden min-h-0 lg:block">
          <div className="ds-scroll h-full overflow-y-auto rounded-xl border border-border bg-subtle p-5">
            <StepTracker title="Your progress" steps={railSteps} current={step} onStepClick={goTo} />

            {/* Under the rail, not above it: the asterisks say which steps are
                required, and this says how many of them are answered. Reading the
                list first and the tally second is the order the reader needs. */}
            {id && (
              <div className="mt-6 border-t border-border pt-4">
                <SetupProgress
                  done={EA_REQUIRED_STEPS - blocking.length}
                  total={EA_REQUIRED_STEPS}
                  align="start"
                />
                <p className="mt-2 text-caption text-text-secondary">
                  {blocking.length === 0
                    ? 'Everything required is in place — this can be switched on.'
                    : 'Skipping is fine. Anything still marked * has to be filled in before this can be switched on.'}
                </p>
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}

function SummaryRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1 border-b border-border py-3 last:border-0">
      <span className="w-40 shrink-0 text-body-sm text-text-secondary">{label}</span>
      <span className="min-w-0 flex-1 text-body-sm text-text-primary">{children}</span>
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
  const teams = getEAGovernanceTeams(ea.id);
  const cfg = getAdvancedConfig(ea.id);
  const days = EA_WEEKDAYS.filter((d) => cfg.days.includes(d.id)).map((d) => d.short);

  const count = (n: number, noun: string) => `${n} ${noun}${n === 1 ? '' : 's'}`;
  const grants = [
    assignments.entitlements.length ? count(assignments.entitlements.length, 'entitlement') : '',
    assignments.technicalRoles.length ? count(assignments.technicalRoles.length, 'technical role') : '',
  ].filter(Boolean);

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

  return (
    <div className="max-w-3xl space-y-5">
      {blocking.length > 0 && (
        // Names what is missing and offers one button per missing thing, derived
        // from the gate itself — a preview that only says "incomplete", or that
        // hardcodes which steps it thinks are missing, leaves the reader hunting
        // back through five steps for something the app already knows.
        //
        // It says the draft is safe before it says what is wrong. Reaching this
        // screen having skipped everything is a legitimate way to use the flow,
        // and the reader who did it needs to know their work is kept, not to be
        // told off for it.
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
                    {/* `first-letter`, not `capitalize`: these are sentence-case
                        phrases, and capitalize would Title Case Every Word. */}
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

      <Card title="What it is" icon={<Notes />} padding="none">
        <div>
          <SummaryRow label="Name">{ea.name || none}</SummaryRow>
          <SummaryRow label="Description">{ea.description || none}</SummaryRow>
        </div>
      </Card>

      <Card title="What it hands over" icon={<Assignment />} padding="none">
        <div>
          <SummaryRow label="Grants">{grants.length ? grants.join(' and ') : none}</SummaryRow>
          <SummaryRow label="Who may request it">
            {ea.eligibilityGroups.length
              ? `${ea.eligibilityGroups.length} rule${ea.eligibilityGroups.length === 1 ? '' : 's'}`
              : none}
          </SummaryRow>
        </div>
      </Card>

      <Card title="Who answers for it" icon={<Groups />} padding="none">
        <div>
          <SummaryRow label="Owners">{owners.length ? `${owners.length} named` : none}</SummaryRow>
          <SummaryRow label="Governance teams">{teams.length ? `${teams.length} chosen` : none}</SummaryRow>
        </div>
      </Card>

      <Card title="Limits" icon={<Settings />} padding="none">
        <div>
          <SummaryRow label="Session length">Up to {cfg.maxDurationHrs} hrs</SummaryRow>
          <SummaryRow label="At the same time">{cfg.maxConcurrent} people</SummaryRow>
          <SummaryRow label="Requestable on">{days.length === 7 ? 'Every day' : days.join(', ') || none}</SummaryRow>
        </div>
      </Card>

      <p className="text-caption text-text-tertiary">
        <TuneOutlined sx={{ fontSize: 14 }} className="mr-1 align-text-bottom" />
        Everything here stays editable on the profile after it is switched on.
      </p>
    </div>
  );
}
