'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import ArrowBackOutlined from '@mui/icons-material/ArrowBack';
import ArrowForwardOutlined from '@mui/icons-material/ArrowForward';
import CheckCircleOutlined from '@mui/icons-material/CheckCircleOutlined';
import SaveOutlined from '@mui/icons-material/SaveOutlined';
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
import { EmergencyOwnersPicker } from '@/components/product/emergency/EmergencyAccessDetail';
import { useSetBreadcrumbs } from '@/lib/breadcrumb';

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
   */
  blocker?: string;
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
   * Worth being specific per step: on a step that arrives with working defaults,
   * "Skip" would be a lie — nothing is being left undone.
   */
  skipLabel?: string;
};

const STEPS: StepDef[] = [
  {
    label: 'Basic details',
    heading: 'Name and describe this access',
    description: 'What this access is called, and what it is for',
    blocker: 'basic details',
    // No skip: every editor after this one writes against a profile id, so there
    // is nothing to attach anything to until this step has been through once.
  },
  {
    label: 'Assignments',
    heading: 'Choose what a session grants',
    description: 'What a requester is handed for the length of a session',
    blocker: 'assignments',
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
    skipLabel: 'Skip step',
  },
  {
    label: 'Limits and timing',
    heading: 'Set how long and how often',
    description: 'How long a session lasts, how often, and when',
    // Always satisfied: the defaults are real, working values rather than empty
    // fields, so this step can be passed but never left incomplete.
    filled: () => true,
    skipLabel: 'Keep defaults',
  },
  {
    label: 'Preview',
    heading: 'Check it, then switch it on',
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
 * **Only steps that gate nothing offer a skip.** Owners and limits do; assignments
 * and eligibility criteria do not, because both carry a `blocker` and the profile
 * cannot be switched on without them. Offering to skip a step and then refusing to
 * activate without it is the app arguing with itself — the asterisk on the rail
 * already says the step is required, and a "Skip" beside it said the opposite.
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

  /**
   * The current step's own requirement, if it has one and it is not met yet.
   *
   * This is the same `blocking` array the rail's asterisks and the Activate button
   * read, so a step cannot be considered passable here while being called required
   * three inches to the right.
   */
  const unmet =
    // Step 1 is excluded, and not as a convenience: before it commits there is no
    // profile, so `blocking` names `basic details` by definition and the button
    // would be dead with no way to ever revive it. Its gate is `commitBasics`,
    // which can do better than a tooltip anyway — it marks the offending field.
    // A picker step has no field to mark, which is why the others need the tooltip.
    step > 0 && STEPS[step].blocker && blocking.includes(STEPS[step].blocker!)
      ? STEPS[step].blocker!
      : null;

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

  const stepBody = () => {
    if (step === 0) {
      return (
        // Full column width, like the footer beneath it. A reading-width cap here
        // held the fields short of the buttons that belong to them, so the step
        // looked like it had a right margin the rest of the frame did not.
        <div className="space-y-4">
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
    if (step === 3) return <EmergencyOwnersPicker ea={ea} onChanged={bump} />;
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
            {/* No page title: the breadcrumb already names this screen, and the
                step heading below is the wizard's real subject — the question being
                asked right now. Two titles stacked made the constant one loudest. */}
            {/* One heading. The count went because the rail numbers the steps and
                marks the current one, and the description went because the heading
                is now written to say the same thing. */}
            <div className="mb-5">
              <h2 className="text-h4 text-text-primary">{STEPS[step].heading}</h2>
            </div>
          </div>

          {/* The only scrolling region on the page. The rail-and-table editors
              size themselves to it, so they get the full remaining height rather
              than an arbitrary minimum. */}
          <div className="ds-scroll min-h-0 flex-1 overflow-y-auto pr-0.5">{stepBody()}</div>

          <div className="mt-6 flex shrink-0 flex-wrap items-center gap-3 pt-5">
            {/* Cancel holds the left corner on every step — the same escape in the
                same place for the whole flow. It does not delete anything: once
                step 1 has committed, the draft survives leaving, whatever door the
                reader leaves through. Naming that action is "Save as draft"'s job,
                on the other side, next to the buttons that also save. */}
            <Button variant="secondary" onClick={() => router.push('/iga/emergency-v2')}>
              Cancel
            </Button>

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
              {!last && STEPS[step].skipLabel && (
                <Button
                  variant="secondary"
                  className="whitespace-nowrap"
                  onClick={() => goTo(step + 1)}
                >
                  {STEPS[step].skipLabel}
                </Button>
              )}
              {/* Saving-and-leaving sits with the other saving buttons, not in the
                  far corner with Cancel. Both exits keep the draft; what differs is
                  whether leaving is the point, and grouping this one with "Save and
                  continue" puts the two save verbs side by side where they can be
                  compared. Only rendered once there is a draft to keep. */}
              {id && !last && (
                <Button
                  variant="secondary"
                  className="whitespace-nowrap"
                  onClick={() => {
                    toast.success('Saved as a draft. You can pick it up from the list.');
                    router.push('/iga/emergency-v2');
                  }}
                >
                  Save as draft
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
                // Disabled rather than silently refusing the click: a button that
                // looks live and does nothing reads as a broken app, where a
                // disabled one with a reason attached reads as a rule.
                <Tooltip
                  title={unmet ? `Add ${unmet} before moving on.` : 'Save this step and move on'}
                >
                  <span>
                    <Button
                      endIcon={<ArrowForwardOutlined />}
                      disabled={Boolean(unmet)}
                      onClick={() => goTo(step + 1)}
                    >
                      Save and continue
                    </Button>
                  </span>
                </Tooltip>
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
 * One section of the preview: a taxonomy label over a single panel.
 *
 * The same shape the SoD resolution preview uses. A `Card` per section gave each
 * one an icon, a tinted shell and a framed inner panel — three pieces of chrome
 * around two rows of text — and five of them stacked made the page read as five
 * objects rather than one thing being checked. `overline` is exactly this job:
 * it names what kind of thing follows and carries no meaning you would lose by
 * deleting it, which is true of "What it is" and false of a card title.
 */
function PreviewSection({
  label,
  count,
  children,
}: {
  label: string;
  count?: number;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h3 className="mb-3 text-overline uppercase text-text-tertiary">
        {label}
        {count != null && <span className="tabular-nums"> ({count})</span>}
      </h3>
      <div className="rounded-xl border border-border bg-surface px-4">{children}</div>
    </section>
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
    // Full width of whatever holds it. A reading-width cap here held the content
    // short of the buttons that act on it, so the surface looked like it had a
    // right margin its own footer did not — and these rows are icon-and-control,
    // not prose, so there is no line length to protect.
    <div className="space-y-6">
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

      <PreviewSection label="What it is">
        <SummaryRow label="Name">{ea.name || none}</SummaryRow>
        <SummaryRow label="Description">{ea.description || none}</SummaryRow>
      </PreviewSection>

      <PreviewSection label="What it hands over">
        <SummaryRow label="Grants">{grants.length ? grants.join(' and ') : none}</SummaryRow>
        <SummaryRow label="Who may request it">
          {ea.eligibilityGroups.length
            ? `${ea.eligibilityGroups.length} rule${ea.eligibilityGroups.length === 1 ? '' : 's'}`
            : none}
        </SummaryRow>
      </PreviewSection>

      <PreviewSection label="Who answers for it">
        <SummaryRow label="Owners">{owners.length ? `${owners.length} named` : none}</SummaryRow>
        <SummaryRow label="Governance teams">{teams.length ? `${teams.length} chosen` : none}</SummaryRow>
      </PreviewSection>

      <PreviewSection label="Limits">
        <SummaryRow label="Session length">Up to {cfg.maxDurationHrs} hrs</SummaryRow>
        <SummaryRow label="At the same time">{cfg.maxConcurrent} people</SummaryRow>
        <SummaryRow label="Requestable on">{days.length === 7 ? 'Every day' : days.join(', ') || none}</SummaryRow>
      </PreviewSection>

      <p className="text-caption text-text-tertiary">
        <TuneOutlined sx={{ fontSize: 14 }} className="mr-1 align-text-bottom" />
        Everything here stays editable on the profile after it is switched on.
      </p>
    </div>
  );
}
