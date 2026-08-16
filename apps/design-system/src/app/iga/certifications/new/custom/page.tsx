'use client';

import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import ArrowBackOutlined from '@mui/icons-material/ArrowBack';
import ArrowForwardOutlined from '@mui/icons-material/ArrowForward';
import RocketLaunchOutlined from '@mui/icons-material/RocketLaunchOutlined';
import SaveOutlined from '@mui/icons-material/SaveOutlined';
import { Button, StepTracker, Tooltip, useToast } from '@ds/components';
import { useSetBreadcrumbs } from '@/lib/breadcrumb';
import {
  certificationGaps,
  emptyCertification,
  getCertification,
  saveCertification,
  type Certification,
} from '@/data/certifications';
import {
  DetailsStep,
  PreviewStep,
  ReviewConfigStep,
  TimelineStep,
  UsersStep,
} from '@/components/product/certifications/WizardSteps';

const STEPS = [
  { label: 'Certification details', description: 'Name it and choose the applications it covers' },
  { label: 'Users', description: 'The people whose access will be reviewed' },
  { label: 'Reviewers and outcomes', description: 'Who decides, and what happens to access nobody keeps' },
  { label: 'Timeline', description: 'When it runs and how long reviewers get' },
  { label: 'Preview', description: 'Check it, then launch or save for later' },
];

/**
 * Create or continue a custom access certification.
 *
 * Five steps, taken in order, because each one narrows the last: you cannot pick
 * users before you know which applications are in scope, and you cannot say who
 * reviews before you know whose access it is. That is what makes a stepper right
 * here where it was wrong for a break-glass profile — these steps genuinely
 * depend on each other.
 *
 * The draft is written to the store on every step change, so leaving halfway
 * leaves a draft on the list rather than nothing.
 */
export default function CustomCertificationWizard() {
  const router = useRouter();
  const toast = useToast();
  const editingId = useSearchParams().get('id');

  const [step, setStep] = React.useState(0);
  const [draft, setDraft] = React.useState<Certification | null>(null);

  useSetBreadcrumbs([
    { label: 'Access Certification', href: '/iga/certifications' },
    { label: editingId ? 'Continue setup' : 'New custom review' },
  ]);

  // localStorage-backed: read after mount. A new certification gets its id on
  // first save, so the wizard holds one working object either way.
  React.useEffect(() => {
    const existing = editingId ? getCertification(editingId) : null;
    setDraft(
      existing ?? {
        ...emptyCertification(),
        id: '',
        createdOn: '',
        updatedOn: '',
      },
    );
  }, [editingId]);

  if (!draft) {
    return <div className="py-16 text-center text-body-sm text-text-secondary">Loading…</div>;
  }

  const patch = (next: Partial<Certification>) => setDraft({ ...draft, ...next });
  const gaps = certificationGaps(draft);

  /** Writes the working copy and keeps its id, so later saves update one record. */
  const persist = (overrides: Partial<Certification> = {}): string => {
    const next = { ...draft, ...overrides };
    // A first save has no id yet; the service mints one and we adopt it, so every
    // later save updates the same record instead of littering the list.
    const id = saveCertification(next);
    setDraft({ ...next, id });
    return id;
  };

  const goTo = (i: number) => {
    persist();
    setStep(i);
  };

  const next = () => {
    // Only the name is enforced step by step; everything else is caught by the
    // Preview, so a reader can build in whatever order suits them and still be
    // told the whole truth once, in one place.
    if (step === 0 && draft.name.trim() === '') {
      toast.error('Give the certification a name first.');
      return;
    }
    goTo(Math.min(step + 1, STEPS.length - 1));
  };

  const saveDraft = () => {
    if (draft.name.trim() === '') {
      toast.error('Give the certification a name first.');
      return;
    }
    persist({ status: gaps.length === 0 ? 'readyToLaunch' : 'draft' });
    toast.success(
      gaps.length === 0
        ? 'Saved. It is ready to launch whenever you are.'
        : 'Saved as a draft. You can pick it up from the list.',
    );
    router.push('/iga/certifications');
  };

  const launch = () => {
    if (gaps.length > 0) return;
    const scheduled = draft.timeline.launchType === 'scheduled';
    persist({ status: scheduled ? 'scheduled' : 'launched' });
    toast.success(
      scheduled
        ? `“${draft.name}” is scheduled. Reviewers will be notified when it starts.`
        : `“${draft.name}” launched. Reviewers have been notified.`,
    );
    router.push('/iga/certifications');
  };

  return (
    <div className="ds-scroll h-full overflow-y-auto pr-0.5">
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
        {/* The step being answered is the protagonist; the rail is context. */}
        <div className="min-w-0">
          <h1 className="mb-5 text-h2 text-text-primary">
            {editingId ? 'Continue setting up' : 'New custom access certification'}
          </h1>

          {step === 0 && <DetailsStep draft={draft} patch={patch} />}
          {step === 1 && <UsersStep draft={draft} patch={patch} />}
          {step === 2 && <ReviewConfigStep draft={draft} patch={patch} />}
          {step === 3 && <TimelineStep draft={draft} patch={patch} />}
          {step === 4 && <PreviewStep draft={draft} gaps={gaps} onGoToStep={goTo} />}

          <div className="mt-8 flex flex-wrap items-center gap-3 border-t border-border pt-5">
            <Button variant="secondary" onClick={() => router.push('/iga/certifications')}>
              Cancel
            </Button>
            <div className="ml-auto flex items-center gap-2">
              {/* Available from step 1: leaving halfway should leave something
                  behind, not nothing. */}
              <Button variant="secondary" startIcon={<SaveOutlined />} onClick={saveDraft}>
                Save and close
              </Button>
              {step > 0 && (
                <Button variant="secondary" startIcon={<ArrowBackOutlined />} onClick={() => goTo(step - 1)}>
                  Back
                </Button>
              )}
              {step < STEPS.length - 1 ? (
                <Button endIcon={<ArrowForwardOutlined />} onClick={next}>
                  Save and continue
                </Button>
              ) : (
                <Tooltip
                  title={gaps.length > 0 ? `Still needed: ${gaps.join(', ')}.` : 'Ask the reviewers now'}
                >
                  <span>
                    <Button startIcon={<RocketLaunchOutlined />} disabled={gaps.length > 0} onClick={launch}>
                      {draft.timeline.launchType === 'scheduled' ? 'Schedule' : 'Launch'}
                    </Button>
                  </span>
                </Tooltip>
              )}
            </div>
          </div>
        </div>

        {/* The rail runs the height of the form beside it rather than stopping
            partway down a panel it is meant to occupy. `items-stretch` is the
            grid default, so the aside already has the row's height — the card
            just has to take it. */}
        <aside className="lg:min-h-[520px]">
          <div className="h-full rounded-xl border border-border bg-subtle p-5">
            <StepTracker title="Your progress" steps={STEPS} current={step} onStepClick={goTo} fill />
          </div>
        </aside>
      </div>
    </div>
  );
}
