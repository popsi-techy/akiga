'use client';

import * as React from 'react';
import Bolt from '@mui/icons-material/Bolt';
import CheckCircle from '@mui/icons-material/CheckCircle';
import { Button, Card, StatusChip } from '@ds/components';

export interface NextStep {
  id: string;
  label: string;
  /** Why it exists, in the reader's terms — not a restatement of the label. */
  hint: string;
  /** Required steps block the object going live; the rest can be done later. */
  required: boolean;
  done: boolean;
  /**
   * What the CTA on the recommended step says. An imperative naming the work —
   * "Add eligibility criteria", not "Open" or "Go".
   */
  cta: string;
  /**
   * A qualifier for a step that is done without anyone having decided anything —
   * limits that arrived with working defaults, say.
   *
   * Only set it when the plain tick would overclaim. A step that someone actually
   * finished needs no chip: the tick says so, and a row of "Completed" chips beside
   * a column of ticks is the same fact twice.
   */
  doneLabel?: string;
}

/**
 * A pending step, drawn as a dashed ring.
 *
 * Dashed rather than a solid outline, and matching the tick's box exactly, so the
 * column reads as one mark in two states rather than two different marks. There is
 * no MUI icon for this — `RadioButtonUnchecked` is a solid ring, which reads as a
 * radio the reader is meant to press.
 */
function PendingRing({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" aria-hidden="true" focusable="false">
      <circle
        cx="9"
        cy="9"
        r="7.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeDasharray="2.5 2.5"
      />
    </svg>
  );
}

/**
 * What a draft object still needs before it can be switched on.
 *
 * Shared by Emergency Access and SoD Policies — both have the same shape of
 * problem: a handful of independent pieces of setup, only some of which gate
 * going live, and a reader who needs to see at a glance which is which.
 *
 * Optional steps are listed but never counted against the gate. In both modules
 * the optional work (owners) makes the object *better governed* rather than
 * *functional*, and blocking a security control on a missing owner is the wrong
 * trade — so the card shows them without letting them stop anything.
 *
 * ## One step is open at a time, and opening is not leaving
 *
 * Every row used to carry a 36px icon tile, its own description and a status chip,
 * which gave five equal-weight rows and no answer to "so what do I do now". Now one
 * row is open — it gets the tint, its description, and a CTA naming the work — and
 * the rest collapse to a line and a mark. A checklist's value is telling the reader
 * where to go next, and that only happens if one row looks different from the others.
 *
 * **The first click opens a row; the second leaves the page.** A single click that
 * navigated meant the reader had to leave to find out what a step involved, and the
 * description they needed in order to choose was on the row they had already
 * abandoned. Opening is cheap and reversible; navigating is neither, so they are two
 * gestures. The CTA appearing is what says the next click commits — it names the
 * work, so "Add assignments" is both the label and the promise.
 *
 * Which row starts open is the first unfinished step. After that the reader's choice
 * wins, including on a step already done — revisiting finished setup is a normal
 * thing to want, and nothing should snap the selection back while they are reading.
 *
 * The CTA is a `span` styled as a button, not a button — the whole row is already
 * the target, and a real button inside it would be both invalid HTML and a second
 * place to press for one outcome.
 *
 * The footer is the caller's: it owns the sentence explaining why going live is or
 * is not available.
 */
export function NextStepsCard({
  /**
   * Name the list *and* the goal: "Recommended next steps to activate this access".
   * The old title stopped at the contents and left the reader to work out what the
   * steps were for. "Recommended" is doing real work in it — the required rows carry
   * the asterisk and the footer names what is actually blocking, so the title can
   * point at activation without claiming every row is mandatory.
   */
  title = 'Recommended next steps',
  steps,
  onStep,
  footer,
  /**
   * The open row's CTA is primary while the object cannot go live — that colour is
   * the only live action on the screen. Once a footer Activate is also filled, the
   * row steps down so there is one primary, not two.
   */
  stepCtaVariant = 'primary',
}: {
  title?: string;
  steps: NextStep[];
  onStep: (id: string) => void;
  footer?: React.ReactNode;
  stepCtaVariant?: 'primary' | 'secondary';
}) {
  // The first unfinished step, in the order the caller listed them — which is the
  // order the work actually wants doing. It is the row that starts open.
  const nextId = steps.find((s) => !s.done)?.id;

  /**
   * `null` until the reader picks a row, so the open step tracks the work: finish
   * the recommended one and the next takes its place without anyone clicking. Once
   * they have chosen, the choice sticks — a selection that jumped as data changed
   * underneath them would be the card arguing with the reader.
   */
  const [picked, setPicked] = React.useState<string | null>(null);
  const openId = picked ?? nextId;

  return (
    <Card title={title} icon={<Bolt />} padding="none">
      <ul className="py-1">
        {steps.map((step) => {
          const open = step.id === openId;
          return (
            <li key={step.id}>
              <button
                type="button"
                // Open it, or act on it if it is already open.
                onClick={() => (open ? onStep(step.id) : setPicked(step.id))}
                aria-current={open ? 'step' : undefined}
                aria-expanded={open}
                className={[
                  'flex w-full items-start gap-3 rounded-lg px-3 py-3 text-left transition-colors',
                  // Bounded, not just tinted. `background.subtle` and
                  // `surface.hover` are both #F9FAFB, so a tint alone made any
                  // hovered row look like the recommended one — and the recommended
                  // one indistinguishable while the pointer was over it. The hairline
                  // is what survives hover.
                  open
                    ? 'border border-border bg-subtle'
                    : 'border border-transparent hover:bg-surface-hover',
                ].join(' ')}
              >
                <span
                  className={`mt-px shrink-0 ${step.done ? 'text-success' : 'text-icon-subtle'}`}
                >
                  {step.done ? <CheckCircle sx={{ fontSize: 18 }} /> : <PendingRing />}
                </span>

                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-1">
                    <span className="truncate text-body-sm-medium text-text-primary">{step.label}</span>
                    {/* The same marker a required field carries, so "required" means
                        one thing across forms and checklists. Nothing here has a
                        `required` attribute for assistive tech, so the word is kept
                        rather than dropped with the glyph. */}
                    {step.required && (
                      <>
                        <span aria-hidden className="shrink-0 text-body-sm-medium text-danger">
                          *
                        </span>
                        <span className="sr-only">Required</span>
                      </>
                    )}
                    {step.done && step.doneLabel && (
                      <span className="ml-1">
                        <StatusChip intent="info" label={step.doneLabel} dot={false} />
                      </span>
                    )}
                  </span>
                  {/* Only where it is being acted on. On a finished step the
                      description is history, and on a queued one it is detail the
                      reader has not asked for yet. */}
                  {open && (
                    <span className="mt-1 block text-caption text-text-secondary">{step.hint}</span>
                  )}
                </span>

                {open && (
                  /* Primary while going live is blocked — this is then the only
                     filled action on the screen. Secondary once a footer Activate
                     is also live, so there is one primary, not two. */
                  <Button component="span" size="xs" variant={stepCtaVariant} tabIndex={-1}>
                    {step.cta}
                  </Button>
                )}
              </button>
            </li>
          );
        })}
      </ul>

      {footer && (
        <div className="flex flex-wrap items-center justify-between gap-3 px-3 py-3">
          {footer}
        </div>
      )}
    </Card>
  );
}
