'use client';

import * as React from 'react';
import CheckCircle from '@mui/icons-material/CheckCircle';
import CloseOutlined from '@mui/icons-material/CloseOutlined';
import { Button, StatusChip } from '@ds/components';
import type { EmergencySetupStep } from '@/components/product/emergency/setupSteps';

/**
 * V1 draft setup, docked to the right of the profile.
 *
 * Grey frame, white step cards. The page header stays visible; this column starts
 * under the app top bar and runs to the bottom of the viewport. Close it from
 * here or from the setup-guide icon next to More. It is not a second navigator —
 * the tab strip still is — it is the remaining work, grouped by what Activate
 * waits for.
 *
 * The CTA is a prompt that appears only after someone actually finishes a
 * step — any step. Switching tabs is not finishing: open Eligibility with
 * Assignments still empty and the dock stays quiet. Finish Owners first and
 * it asks for Assignments; finish Assignments and it asks for Eligibility.
 * Advanced arriving with “Default applied” does not count — nobody did that.
 *
 * It also does not restate the tab you are on. Follow the prompt and it
 * drops: you are there, and the page owns the work again.
 */
export function SetupChecklistDock({
  steps,
  currentTab,
  onClose,
  onGoTo,
}: {
  steps: EmergencySetupStep[];
  currentTab: string;
  onClose: () => void;
  onGoTo: (step: EmergencySetupStep) => void;
}) {
  const required = steps.filter((s) => s.required && s.id !== 'basic');
  const additional = steps.filter((s) => !s.required);
  const listed = [...required, ...additional];
  // A qualifier chip means the step is satisfied without anyone deciding —
  // Advanced's factory defaults. That is not a completion, so it must not
  // unlock the "what's next" prompt on a brand-new draft.
  const someoneFinished = listed.some((s) => s.done && !s.doneLabel);
  const nextId = someoneFinished ? listed.find((s) => !s.done)?.id : undefined;
  // Primary while Activate is still blocked — this is then the only filled
  // action in the dock. Secondary once required work is done, so the header
  // Activate stays the one primary.
  const ctaVariant = required.some((s) => !s.done) ? 'primary' : 'secondary';

  return (
    <aside
      className="flex w-72 shrink-0 flex-col border-l border-border bg-subtle"
      aria-label="Setup checklist"
    >
      <header className="flex shrink-0 items-start justify-between gap-3 px-4 py-4">
        <div className="min-w-0">
          <h2 className="text-h5 text-text-primary">Setup checklist</h2>
          <p className="mt-0.5 text-caption text-text-secondary">
            Finish the required steps, then activate. You can hide this and open it
            again from Setup guide.
          </p>
        </div>
        <button
          type="button"
          aria-label="Hide setup checklist"
          onClick={onClose}
          className="grid h-8 w-8 shrink-0 place-items-center rounded-md text-icon hover:bg-surface-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-subtle"
        >
          <CloseOutlined sx={{ fontSize: 18 }} />
        </button>
      </header>

      <div className="ds-scroll min-h-0 flex-1 space-y-3 overflow-y-auto px-3 pb-4">
        <StepGroup heading="Required to activate" hint="these steps gate activation">
          {required.map((step) => (
            <StepRow
              key={step.id}
              step={step}
              current={step.tab === currentTab}
              recommended={step.id === nextId}
              ctaVariant={ctaVariant}
              onGoTo={onGoTo}
            />
          ))}
        </StepGroup>
        {additional.length > 0 && (
          <StepGroup heading="Additional" hint="optional, and does not block activation">
            {additional.map((step) => (
              <StepRow
                key={step.id}
                step={step}
                current={step.tab === currentTab}
                recommended={step.id === nextId}
                ctaVariant={ctaVariant}
                onGoTo={onGoTo}
              />
            ))}
          </StepGroup>
        )}
      </div>
    </aside>
  );
}

function StepGroup({
  heading,
  hint,
  children,
}: {
  heading: string;
  hint: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl bg-surface p-3">
      <h3 className="px-1 text-overline uppercase text-text-tertiary">
        {heading}
        <span className="sr-only"> — {hint}</span>
      </h3>
      <ul className="mt-1.5 space-y-0.5">{children}</ul>
    </section>
  );
}

function StepRow({
  step,
  current,
  recommended,
  ctaVariant,
  onGoTo,
}: {
  step: EmergencySetupStep;
  current: boolean;
  recommended: boolean;
  ctaVariant: 'primary' | 'secondary';
  onGoTo: (step: EmergencySetupStep) => void;
}) {
  // Prompt only when the next unfinished step is somewhere else. The row you
  // are already on does not need a CTA — the page is the place to do the work.
  // Finish it, stay put, and the hint + button appear on the following row.
  const showNext = recommended && !step.done && !current;

  return (
    <li>
      <button
        type="button"
        onClick={() => onGoTo(step)}
        aria-current={current ? 'step' : undefined}
        className={[
          'flex w-full items-start gap-2.5 rounded-md px-2 py-2 text-left transition-colors',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-subtle',
          current ? 'border border-brand bg-surface' : 'border border-transparent hover:bg-subtle',
        ].join(' ')}
      >
        <span
          className={`mt-px grid h-4 w-4 shrink-0 place-items-center ${
            step.done ? 'text-success' : 'text-border-strong'
          }`}
        >
          <CheckCircle sx={{ fontSize: 16, color: 'inherit' }} />
        </span>
        <span className="min-w-0 flex-1">
          <span
            className={`block truncate ${
              current || showNext ? 'text-body-sm-medium text-text-primary' : 'text-body-sm text-text-primary'
            }`}
          >
            {step.label}
          </span>
          {showNext && (
            <span className="mt-1 block text-caption text-text-secondary">{step.hint}</span>
          )}
          {step.done && step.doneLabel && (
            <span className="mt-1 block">
              <StatusChip intent="info" label={step.doneLabel} dot={false} />
            </span>
          )}
          {showNext && (
            <span className="mt-2 block">
              <Button component="span" size="xs" variant={ctaVariant} tabIndex={-1}>
                {step.cta}
              </Button>
            </span>
          )}
        </span>
      </button>
    </li>
  );
}

export default SetupChecklistDock;
